from __future__ import annotations
import logging
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.base import BaseConnector, NormalizedRecord
from app.connectors.registry import get_connector, CONNECTOR_REGISTRY
from app.pipeline.change_detector import content_hash

logger = logging.getLogger(__name__)


class CrawlOrchestrator:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def run_connector(self, connector_name: str) -> dict[str, Any]:
        connector = get_connector(connector_name)
        crawl_run_id = str(uuid.uuid4())
        started_at = datetime.utcnow()

        await self._create_crawl_run(crawl_run_id, connector_name, started_at)

        try:
            docs = await connector.fetch()
            all_records: list[NormalizedRecord] = []
            for doc in docs:
                doc_id = await self._store_document(crawl_run_id, doc.url, doc.content_type, len(doc.content))
                records = await connector.parse(doc)
                all_records.extend(records)

            previous_records = await self._load_previous_records(connector_name)
            changes = await connector.detect_changes(all_records, previous_records)

            await self._store_records(crawl_run_id, connector_name, all_records)

            finished_at = datetime.utcnow()
            await self._complete_crawl_run(
                crawl_run_id,
                finished_at,
                status="completed",
                records_found=len(all_records),
                changes_detected=len(changes),
            )

            if hasattr(connector, "close"):
                await connector.close()

            logger.info(
                "Crawl %s completed: %d records, %d changes",
                connector_name, len(all_records), len(changes),
            )

            return {
                "crawl_run_id": crawl_run_id,
                "connector": connector_name,
                "status": "completed",
                "records_found": len(all_records),
                "changes_detected": len(changes),
                "changes": [
                    {
                        "type": c.event_type,
                        "entity": c.entity_id,
                        "field": c.field_name,
                        "old": str(c.old_value)[:100] if c.old_value else None,
                        "new": str(c.new_value)[:100] if c.new_value else None,
                    }
                    for c in changes[:20]
                ],
                "duration_seconds": (finished_at - started_at).total_seconds(),
            }

        except Exception as e:
            logger.error("Crawl %s failed: %s", connector_name, e)
            await self._complete_crawl_run(
                crawl_run_id,
                datetime.utcnow(),
                status="failed",
                error=str(e),
            )
            if hasattr(connector, "close"):
                await connector.close()
            raise

    async def run_all(self) -> list[dict[str, Any]]:
        results = []
        for name in CONNECTOR_REGISTRY:
            try:
                result = await self.run_connector(name)
                results.append(result)
            except Exception as e:
                results.append({
                    "connector": name,
                    "status": "failed",
                    "error": str(e),
                })
        return results

    async def _create_crawl_run(
        self, crawl_run_id: str, connector_name: str, started_at: datetime,
    ) -> None:
        source_id = await self._get_or_create_source(connector_name)
        await self.db.execute(
            text("""
                INSERT INTO crawl_runs (id, source_id, status, started_at)
                VALUES (:id, :source_id, 'running', :started_at)
            """),
            {"id": crawl_run_id, "source_id": source_id, "started_at": started_at},
        )
        await self.db.commit()

    async def _complete_crawl_run(
        self,
        crawl_run_id: str,
        finished_at: datetime,
        status: str,
        records_found: int = 0,
        changes_detected: int = 0,
        error: str | None = None,
    ) -> None:
        await self.db.execute(
            text("""
                UPDATE crawl_runs
                SET status = :status,
                    finished_at = :finished_at,
                    records_found = :records_found,
                    changes_detected = :changes_detected,
                    error_message = :error
                WHERE id = :id
            """),
            {
                "id": crawl_run_id,
                "status": status,
                "finished_at": finished_at,
                "records_found": records_found,
                "changes_detected": changes_detected,
                "error": error,
            },
        )
        await self.db.commit()

    async def _store_document(
        self, crawl_run_id: str, url: str, content_type: str, size: int,
    ) -> str:
        doc_id = str(uuid.uuid4())
        await self.db.execute(
            text("""
                INSERT INTO source_documents (id, crawl_run_id, url, content_type, size_bytes, content_hash)
                VALUES (:id, :crawl_run_id, :url, :content_type, :size, :hash)
                ON CONFLICT (url) DO UPDATE SET
                    crawl_run_id = :crawl_run_id,
                    content_type = :content_type,
                    size_bytes = :size,
                    content_hash = :hash,
                    updated_at = now()
            """),
            {
                "id": doc_id,
                "crawl_run_id": crawl_run_id,
                "url": url,
                "content_type": content_type,
                "size": size,
                "hash": content_hash({"url": url, "size": size}),
            },
        )
        await self.db.commit()
        return doc_id

    async def _store_records(
        self, crawl_run_id: str, connector_name: str, records: list[NormalizedRecord],
    ) -> None:
        source_id = await self._get_or_create_source(connector_name)
        for record in records:
            await self.db.execute(
                text("""
                    INSERT INTO crawl_jobs (id, crawl_run_id, url, status, records_found)
                    VALUES (:id, :crawl_run_id, :url, 'completed', 1)
                    ON CONFLICT DO NOTHING
                """),
                {
                    "id": str(uuid.uuid4()),
                    "crawl_run_id": crawl_run_id,
                    "url": record.source_url,
                },
            )
        await self.db.commit()

    async def _load_previous_records(self, connector_name: str) -> list[NormalizedRecord]:
        # In a full implementation, this loads from the DB.
        # For now, returns empty list (first run treats everything as new).
        return []

    async def _get_or_create_source(self, connector_name: str) -> str:
        result = await self.db.execute(
            text("SELECT id FROM sources WHERE slug = :slug"),
            {"slug": connector_name},
        )
        row = result.fetchone()
        if row:
            return str(row[0])

        connector_cls = CONNECTOR_REGISTRY.get(connector_name)
        source_id = str(uuid.uuid4())
        await self.db.execute(
            text("""
                INSERT INTO sources (id, name, slug, source_type, base_url, is_active)
                VALUES (:id, :name, :slug, :source_type, '', true)
            """),
            {
                "id": source_id,
                "name": connector_name.upper(),
                "slug": connector_name,
                "source_type": connector_cls.source_type.value if connector_cls else "unknown",
            },
        )
        await self.db.commit()
        return source_id
