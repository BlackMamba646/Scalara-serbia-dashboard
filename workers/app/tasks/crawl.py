"""Crawl task — runs a connector, persists results, extracts signals."""

from __future__ import annotations


import logging
import uuid
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.base import BaseConnector, NormalizedRecord
from app.connectors.registry import get_connector, CONNECTOR_REGISTRY
from app.models.database import async_session
from app.models.tables import (
    Company,
    CrawlRun,
    Domain,
    License,
    NewsArticle,
    Signal,
    Source,
    SourceDocument,
)
from app.pipeline.signal_extractor import extract_signals_from_change, SIGNAL_WEIGHTS

logger = logging.getLogger(__name__)


async def ensure_sources_exist(session: AsyncSession) -> dict[str, uuid.UUID]:
    """Create source rows from sources.yaml if they don't exist. Returns name->id map."""
    import yaml
    from pathlib import Path

    sources_path = Path(__file__).parent.parent / "connectors" / "sources.yaml"
    with open(sources_path) as f:
        config = yaml.safe_load(f)

    source_map: dict[str, uuid.UUID] = {}

    for src in config.get("sources", []):
        result = await session.execute(
            select(Source).where(Source.name == src["name"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            source_map[src["name"]] = existing.id
        else:
            source_id = uuid.uuid4()
            freq_hours = src.get("crawl_frequency_hours", 24)
            session.add(Source(
                id=source_id,
                name=src["name"],
                source_type=src["source_type"],
                base_url=src.get("config", {}).get("base_url") or src.get("config", {}).get("url"),
                is_active=src.get("enabled", True),
                crawl_frequency_minutes=freq_hours * 60,
                config=src.get("config"),
            ))
            source_map[src["name"]] = source_id

    await session.commit()
    return source_map


async def get_or_create_company(
    session: AsyncSession,
    name: str,
    country: str | None = None,
    company_type: str = "other",
    website: str | None = None,
) -> uuid.UUID:
    """Find a company by canonical name or create one."""
    result = await session.execute(
        select(Company).where(Company.canonical_name == name)
    )
    existing = result.scalar_one_or_none()

    if existing:
        return existing.id

    company_id = uuid.uuid4()
    session.add(Company(
        id=company_id,
        canonical_name=name,
        country=country,
        company_type=company_type,
        website_url=website,
    ))
    await session.flush()
    return company_id


async def persist_records(
    session: AsyncSession,
    records: list[NormalizedRecord],
    source_id: uuid.UUID,
    connector_name: str,
) -> tuple[int, int]:
    """Persist normalized records. Returns (new_count, changed_count)."""
    new_count = 0
    changed_count = 0

    for record in records:
        existing_doc = await session.execute(
            select(SourceDocument).where(
                SourceDocument.source_id == source_id,
                SourceDocument.url == record.source_url,
            )
        )
        doc = existing_doc.scalar_one_or_none()

        if doc:
            if doc.content_hash != record.content_hash:
                doc.content_hash = record.content_hash
                doc.last_changed_at = datetime.utcnow()
                changed_count += 1
        else:
            session.add(SourceDocument(
                source_id=source_id,
                url=record.source_url,
                content_hash=record.content_hash,
                document_type=record.record_type,
                metadata_=record.data,
            ))
            new_count += 1

        await _persist_entity(session, record, source_id)

    return new_count, changed_count


async def _persist_entity(
    session: AsyncSession,
    record: NormalizedRecord,
    source_id: uuid.UUID,
) -> None:
    """Route record to the right table based on record_type."""
    data = record.data

    if record.record_type == "ct_certificate":
        domain = data.get("domain", "")
        company_name = domain.split(".")[0].replace("-", " ").title() if domain else "Unknown"
        company_id = await get_or_create_company(session, company_name, website=domain)

        existing = await session.execute(
            select(Domain).where(Domain.domain_name == domain)
        )
        if not existing.scalar_one_or_none() and domain:
            session.add(Domain(
                company_id=company_id,
                domain_name=domain,
                domain_type="brand",
            ))

    elif record.record_type in ("casino_reputation", "casino_complaint"):
        casino_name = data.get("casino_name", "Unknown")
        company_id = await get_or_create_company(
            session, casino_name, company_type="operator"
        )

        if record.record_type == "casino_complaint":
            category = data.get("category", "").lower()
            title = data.get("title", "")
            signal_type = "platform_pain"
            if any(kw in category for kw in ("payment", "withdrawal", "deposit")):
                signal_type = "payments_need"
            elif any(kw in category for kw in ("software", "technical", "bug")):
                signal_type = "platform_migration"

            existing_signal = await session.execute(
                select(Signal).where(Signal.content_hash == record.content_hash)
            )
            if not existing_signal.scalar_one_or_none():
                session.add(Signal(
                    company_id=company_id,
                    signal_type=signal_type,
                    title=f"Complaint: {casino_name} — {title[:80]}",
                    summary=f"Source: {record.source_name}. Category: {category}. {title}",
                    evidence_confidence=int(SIGNAL_WEIGHTS.get(signal_type, 0.5) * 100),
                    sales_intent=int(SIGNAL_WEIGHTS.get(signal_type, 0.5) * 100),
                    content_hash=record.content_hash,
                ))

    elif record.record_type == "news_article":
        url = data.get("url", record.source_url)
        existing_article = await session.execute(
            select(NewsArticle).where(NewsArticle.url == url)
        )
        if not existing_article.scalar_one_or_none():
            session.add(NewsArticle(
                source_id=source_id,
                title=data.get("title", ""),
                url=url,
                publisher=data.get("publisher"),
                published_at=datetime.fromisoformat(data["published_at"]) if data.get("published_at") else None,
                excerpt=data.get("summary", data.get("excerpt", "")),
                content_hash=record.content_hash,
            ))

    elif record.record_type in ("ukgc_business", "gcgra_licensee"):
        entity_name = data.get("name", data.get("licensee_name", "Unknown"))
        company_id = await get_or_create_company(
            session, entity_name, company_type="operator"
        )

        license_number = data.get("account_number", data.get("license_number", ""))
        jurisdiction = "United Kingdom" if "ukgc" in record.source_name.lower() else "UAE"
        regulator = "UKGC" if "ukgc" in record.source_name.lower() else "GCGRA"

        existing_lic = await session.execute(
            select(License).where(License.license_number == license_number)
        )
        if not existing_lic.scalar_one_or_none() and license_number:
            session.add(License(
                company_id=company_id,
                license_number=license_number,
                jurisdiction=jurisdiction,
                regulator=regulator,
                license_type=data.get("licence_type", ""),
                license_status=data.get("status", "active").lower(),
                legal_entity_name=entity_name,
                last_checked_at=datetime.utcnow(),
                raw_data=data,
            ))


async def run_crawl(connector_name: str) -> dict:
    """Execute a full crawl cycle for one connector."""
    logger.info("Starting crawl: %s", connector_name)

    async with async_session() as session:
        source_map = await ensure_sources_exist(session)

        connector = get_connector(connector_name)
        source_id = source_map.get(connector_name)

        if not source_id:
            for name, sid in source_map.items():
                if connector_name in name.lower() or name.lower() in connector_name:
                    source_id = sid
                    break

        if not source_id:
            source_id = uuid.uuid4()
            session.add(Source(
                id=source_id,
                name=connector_name,
                source_type=connector.source_type.value,
                is_active=True,
            ))
            await session.flush()

        crawl_run = CrawlRun(
            source_id=source_id,
            status="running",
            started_at=datetime.utcnow(),
        )
        session.add(crawl_run)
        await session.flush()

        try:
            docs = await connector.fetch()
            all_records: list[NormalizedRecord] = []
            for doc in docs:
                records = await connector.parse(doc)
                all_records.extend(records)

            new_count, changed_count = await persist_records(
                session, all_records, source_id, connector_name
            )

            crawl_run.status = "completed"
            crawl_run.completed_at = datetime.utcnow()
            crawl_run.documents_processed = len(docs)
            crawl_run.new_records = new_count
            crawl_run.changed_records = changed_count

            await session.execute(
                update(Source)
                .where(Source.id == source_id)
                .values(
                    last_crawled_at=datetime.utcnow(),
                    last_success_at=datetime.utcnow(),
                    error_count=0,
                )
            )

            await session.commit()
            logger.info(
                "Crawl %s complete: %d docs, %d new, %d changed",
                connector_name, len(docs), new_count, changed_count,
            )

            result = {
                "connector": connector_name,
                "status": "completed",
                "documents": len(docs),
                "records": len(all_records),
                "new": new_count,
                "changed": changed_count,
            }

        except Exception as e:
            logger.error("Crawl %s failed: %s", connector_name, e)
            crawl_run.status = "failed"
            crawl_run.completed_at = datetime.utcnow()
            crawl_run.errors = 1
            crawl_run.log = str(e)

            await session.execute(
                update(Source)
                .where(Source.id == source_id)
                .values(error_count=Source.error_count + 1)
            )

            await session.commit()
            result = {"connector": connector_name, "status": "failed", "error": str(e)}

        finally:
            if hasattr(connector, "close"):
                await connector.close()

        return result


async def run_all_crawls() -> list[dict]:
    """Run all enabled connectors sequentially."""
    results = []
    for name in CONNECTOR_REGISTRY:
        try:
            result = await run_crawl(name)
            results.append(result)
        except Exception as e:
            logger.error("Crawl %s crashed: %s", name, e)
            results.append({"connector": name, "status": "crashed", "error": str(e)})
    return results
