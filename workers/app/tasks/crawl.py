"""Crawl task — runs a connector, persists results, extracts signals."""

from __future__ import annotations


import logging
import uuid
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.base import BaseConnector, ChangeEvent, NormalizedRecord
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

EXTRACTOR_TO_DB_TYPE = {
    "new_license": "new_license",
    "license_revoked": "license_change",
    "license_suspended": "license_suspension",
    "license_renewed": "license_change",
    "license_condition_change": "license_change",
    "new_market_entry": "market_expansion",
    "market_exit": "market_expansion",
    "provider_change": "provider_change",
    "new_product_launch": "new_product",
    "partnership": "new_tech_partner",
    "acquisition": "acquisition",
    "funding": "funding",
    "ipo": "funding",
    "hiring_surge": "hiring_surge",
    "key_hire": "hiring_surge",
    "layoffs": "hiring_surge",
    "executive_change": "hiring_surge",
    "rfp_issued": "rfp",
    "technology_migration": "platform_migration",
    "regulatory_action": "regulatory_change",
    "compliance_issue": "regulatory_change",
    "expansion": "market_expansion",
    "soft_launch": "soft_launch",
    "platform_pain": "platform_pain",
    "platform_migration": "platform_migration",
    "payments_need": "payments_need",
}


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
        select(Company).where(Company.canonical_name == name).limit(1)
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
            ).limit(1)
        )
        doc = existing_doc.scalar_one_or_none()

        if doc:
            if doc.content_hash != record.content_hash:
                doc.content_hash = record.content_hash
                doc.metadata_ = record.data
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
            publisher_map = {
                "igb": "iGaming Business",
                "sbc": "SBC News",
                "gaming_intelligence": "Gaming Intelligence",
            }
            raw_pub = data.get("published") or data.get("published_at") or ""
            pub_dt = None
            if raw_pub:
                try:
                    pub_dt = datetime.fromisoformat(raw_pub)
                except ValueError:
                    from email.utils import parsedate_to_datetime
                    try:
                        pub_dt = parsedate_to_datetime(raw_pub)
                    except Exception:
                        pass
            if pub_dt and pub_dt.tzinfo is not None:
                pub_dt = pub_dt.replace(tzinfo=None)
            source_key = data.get("source", record.source_name)
            publisher = data.get("publisher") or publisher_map.get(source_key, source_key)
            session.add(NewsArticle(
                source_id=source_id,
                title=data.get("title", ""),
                url=url,
                publisher=publisher,
                published_at=pub_dt,
                excerpt=data.get("summary", data.get("excerpt", "")),
                content_hash=record.content_hash,
            ))

            change = ChangeEvent(
                event_type="new",
                entity_type="news_article",
                entity_id=url,
                field_name=None,
                old_value=None,
                new_value=data,
                source_url=url,
            )
            extracted = extract_signals_from_change(change)
            for sig in extracted:
                db_type = EXTRACTOR_TO_DB_TYPE.get(sig["signal_type"])
                if not db_type:
                    continue
                sig_pub_dt = None
                if sig.get("published_at"):
                    try:
                        sig_pub_dt = datetime.fromisoformat(str(sig["published_at"]))
                    except ValueError:
                        pass
                if sig_pub_dt and sig_pub_dt.tzinfo is not None:
                    sig_pub_dt = sig_pub_dt.replace(tzinfo=None)
                if not sig_pub_dt:
                    sig_pub_dt = pub_dt
                sig_hash = record.content_hash + ":" + sig["signal_type"]
                existing_sig = await session.execute(
                    select(Signal).where(Signal.content_hash == sig_hash).limit(1)
                )
                if existing_sig.scalar_one_or_none():
                    continue
                company_id = None
                entity_name = sig.get("entity_name", "")
                if entity_name:
                    company_id = await get_or_create_company(session, entity_name)
                session.add(Signal(
                    company_id=company_id or await get_or_create_company(session, publisher or record.source_name),
                    signal_type=db_type,
                    title=sig["title"],
                    summary=sig["description"],
                    evidence_confidence=int(sig["confidence"] * 100),
                    sales_intent=int(sig["weight"] * 100),
                    published_at=sig_pub_dt,
                    content_hash=sig_hash,
                ))

    elif record.record_type in ("ukgc_business", "ukgc_businesses", "gcgra_licensee"):
        entity_name = data.get("licence_account_name", data.get("name", data.get("licensee_name", "Unknown")))
        company_id = await get_or_create_company(
            session, entity_name, company_type="operator"
        )

        license_number = data.get("account_number", data.get("license_number", ""))
        jurisdiction = "United Kingdom" if "ukgc" in record.source_name.lower() else "UAE"
        regulator = "UKGC" if "ukgc" in record.source_name.lower() else "GCGRA"

        existing_lic = await session.execute(
            select(License).where(License.license_number == license_number).limit(1)
        )
        if not existing_lic.scalar_one_or_none() and license_number:
            status_raw = data.get("status", "active").lower().strip()
            valid_statuses = {"active", "pending", "conditional", "approved", "suspended", "revoked", "expired", "surrendered", "lapsed", "forfeited"}
            license_status = status_raw if status_raw in valid_statuses else "active"
            session.add(License(
                company_id=company_id,
                license_number=license_number,
                jurisdiction=jurisdiction,
                regulator=regulator,
                license_type=data.get("licence_type", data.get("type", "")),
                license_status=license_status,
                legal_entity_name=entity_name,
                last_checked_at=datetime.utcnow(),
                raw_data=data,
            ))
            await session.flush()

    elif record.record_type == "ukgc_licences":
        acct = data.get("account_number", "")
        if acct:
            result = await session.execute(
                select(Company).where(Company.canonical_name.ilike(f"%{acct}%")).limit(1)
            )
            company = result.scalar_one_or_none()
            if not company:
                result = await session.execute(
                    select(License).where(License.license_number == acct).limit(1)
                )
                existing_lic = result.scalar_one_or_none()
                if existing_lic:
                    company_id = existing_lic.company_id
                else:
                    return

            else:
                company_id = company.id

            lic_number = data.get("licence_number", data.get("license_number", ""))
            if lic_number:
                existing = await session.execute(
                    select(License).where(License.license_number == lic_number).limit(1)
                )
                if not existing.scalar_one_or_none():
                    status_raw = data.get("status", "active").lower().strip()
                    valid_statuses = {"active", "pending", "conditional", "approved", "suspended", "revoked", "expired", "surrendered", "lapsed", "forfeited"}
                    license_status = status_raw if status_raw in valid_statuses else "active"
                    session.add(License(
                        company_id=company_id,
                        license_number=lic_number,
                        jurisdiction="United Kingdom",
                        regulator="UKGC",
                        license_type=data.get("type", data.get("licence_type", "")),
                        license_status=license_status,
                        last_checked_at=datetime.utcnow(),
                        raw_data=data,
                    ))
                    await session.flush()

    elif record.record_type == "ukgc_domains":
        acct = data.get("account_number", "")
        domain_name = data.get("url", data.get("domain_name", data.get("domain", ""))).strip()
        if acct and domain_name:
            result = await session.execute(
                select(License).where(License.license_number == acct).limit(1)
            )
            lic = result.scalar_one_or_none()
            if lic:
                existing = await session.execute(
                    select(Domain).where(Domain.domain_name == domain_name).limit(1)
                )
                if not existing.scalar_one_or_none():
                    session.add(Domain(
                        company_id=lic.company_id,
                        domain_name=domain_name,
                        domain_type="brand",
                    ))


async def _detect_regulator_changes(
    session: AsyncSession,
    current_records: list[NormalizedRecord],
    connector_name: str,
) -> list[ChangeEvent]:
    """Compare current regulator CSV against licenses table in DB."""
    from app.connectors.base import ChangeEvent as BaseChangeEvent

    business_records = [r for r in current_records if r.record_type in ("ukgc_businesses", "ukgc_business")]
    if not business_records:
        return []

    result = await session.execute(
        select(License).where(
            License.regulator == "UKGC",
            ~License.license_number.contains("-"),
        )
    )
    db_licenses = result.scalars().all()
    db_map: dict[str, License] = {}
    for lic in db_licenses:
        if lic.license_number:
            db_map[lic.license_number] = lic

    current_accts: dict[str, dict] = {}
    for r in business_records:
        acct = r.data.get("account_number", "")
        if acct:
            current_accts[acct] = r.data

    events: list[BaseChangeEvent] = []

    for acct, data in current_accts.items():
        company_name = data.get("licence_account_name", acct)
        if acct not in db_map:
            events.append(BaseChangeEvent(
                event_type="new",
                entity_type="ukgc_business",
                entity_id=company_name,
                field_name=None,
                old_value=None,
                new_value=data,
                source_url="https://www.gamblingcommission.gov.uk",
            ))
        else:
            lic = db_map[acct]
            csv_status = data.get("status", "").lower().strip()
            db_status = (lic.license_status or "").lower().strip()
            if csv_status and db_status and csv_status != db_status:
                events.append(BaseChangeEvent(
                    event_type="modified",
                    entity_type="ukgc_business",
                    entity_id=company_name,
                    field_name="status",
                    old_value=db_status,
                    new_value=csv_status,
                    source_url="https://www.gamblingcommission.gov.uk",
                ))

    for acct, lic in db_map.items():
        if acct not in current_accts:
            company_result = await session.execute(
                select(Company).where(Company.id == lic.company_id)
            )
            company = company_result.scalar_one_or_none()
            company_name = (company.canonical_name if company else None) or lic.legal_entity_name or acct
            events.append(BaseChangeEvent(
                event_type="removed",
                entity_type="ukgc_business",
                entity_id=company_name,
                field_name=None,
                old_value={"licence_account_name": company_name, "status": lic.license_status},
                new_value=None,
                source_url="https://www.gamblingcommission.gov.uk",
            ))

    return events


async def _detect_and_signal(
    session: AsyncSession,
    connector: BaseConnector,
    current_records: list[NormalizedRecord],
    source_id: uuid.UUID,
    connector_name: str,
) -> int:
    """Run change detection and extract signals."""
    if connector_name == "ukgc":
        change_events = await _detect_regulator_changes(session, current_records, connector_name)
    else:
        prev_docs = await session.execute(
            select(SourceDocument).where(SourceDocument.source_id == source_id)
        )
        previous_records: list[NormalizedRecord] = []
        for doc in prev_docs.scalars().all():
            if doc.metadata_:
                previous_records.append(NormalizedRecord(
                    source_name=connector_name,
                    record_type=doc.document_type or "",
                    data=doc.metadata_,
                    source_url=doc.url,
                    content_hash=doc.content_hash or "",
                ))

        if not previous_records:
            logger.info("No previous snapshot for %s — skipping change detection", connector_name)
            return 0

        try:
            change_events = await connector.detect_changes(current_records, previous_records)
        except Exception as e:
            logger.warning("Change detection failed for %s: %s", connector_name, e)
            return 0

    if not change_events:
        logger.info("No changes detected for %s", connector_name)
        return 0

    logger.info("Detected %d changes for %s", len(change_events), connector_name)

    signal_count = 0
    for event in change_events:
        extracted = extract_signals_from_change(event)
        for sig in extracted:
            db_type = EXTRACTOR_TO_DB_TYPE.get(sig["signal_type"])
            if not db_type:
                continue

            today = datetime.utcnow().strftime("%Y-%m-%d")
            sig_hash = f"change:{connector_name}:{event.entity_id}:{sig['signal_type']}:{today}"
            existing_sig = await session.execute(
                select(Signal).where(Signal.content_hash == sig_hash).limit(1)
            )
            if existing_sig.scalar_one_or_none():
                continue

            meta = event.new_value if isinstance(event.new_value, dict) else (
                event.old_value if isinstance(event.old_value, dict) else {}
            )
            entity_name = (
                sig.get("entity_name")
                or meta.get("licence_account_name")
                or meta.get("name")
                or meta.get("licensee_name")
                or meta.get("casino_name")
                or event.entity_id
                or connector_name
            )
            company_id = await get_or_create_company(session, entity_name)

            pub_dt = None
            if sig.get("published_at"):
                try:
                    pub_dt = datetime.fromisoformat(str(sig["published_at"]))
                except ValueError:
                    pass
            if pub_dt and pub_dt.tzinfo is not None:
                pub_dt = pub_dt.replace(tzinfo=None)

            title = sig["title"]
            if entity_name and event.entity_id and event.entity_id in title:
                title = title.replace(event.entity_id, entity_name)
            session.add(Signal(
                company_id=company_id,
                signal_type=db_type,
                title=title,
                summary=sig["description"],
                evidence_confidence=int(sig["confidence"] * 100),
                sales_intent=int(sig["weight"] * 100),
                published_at=pub_dt,
                content_hash=sig_hash,
            ))
            signal_count += 1

    if signal_count:
        await session.flush()
        logger.info("Created %d signals from change detection for %s", signal_count, connector_name)

    return signal_count


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

            # --- Change detection: compare current vs previous snapshot ---
            signal_count = await _detect_and_signal(
                session, connector, all_records, source_id, connector_name
            )

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
                "Crawl %s complete: %d docs, %d new, %d changed, %d signals",
                connector_name, len(docs), new_count, changed_count, signal_count,
            )

            result = {
                "connector": connector_name,
                "status": "completed",
                "documents": len(docs),
                "records": len(all_records),
                "new": new_count,
                "changed": changed_count,
                "signals": signal_count,
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
