import csv
import io
import logging
from datetime import datetime, timedelta
from typing import Any

import httpx

from app.connectors.base import (
    BaseConnector,
    ChangeEvent,
    ConnectorStatus,
    NormalizedRecord,
    RawDocument,
    SourceType,
)
from app.pipeline.change_detector import (
    content_hash,
    detect_changes,
    detect_field_changes,
)

logger = logging.getLogger(__name__)

UKGC_BASE = "https://www.gamblingcommission.gov.uk/downloads"
UKGC_CSVS = {
    "businesses": f"{UKGC_BASE}/business-licence-register-businesses.csv",
    "licences": f"{UKGC_BASE}/business-licence-register-licences.csv",
    "trading_names": f"{UKGC_BASE}/business-licence-register-trading-names.csv",
    "domains": f"{UKGC_BASE}/business-licence-register-domain-names.csv",
}


def _parse_csv(text: str) -> list[dict[str, str]]:
    reader = csv.DictReader(io.StringIO(text))
    return [row for row in reader]


def _normalize_key(key: str) -> str:
    return key.strip().lower().replace(" ", "_").replace("-", "_")


def _normalize_row(row: dict[str, str]) -> dict[str, str]:
    return {_normalize_key(k): v.strip() for k, v in row.items()}


class UKGCConnector(BaseConnector):
    source_name = "ukgc"
    source_type = SourceType.REGULATOR
    crawl_frequency = timedelta(hours=24)
    rate_limit_rpm = 10

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=60.0,
                headers={"User-Agent": "ScalaraRadar/1.0 (sales-intelligence; contact@scalaralabs.com)"},
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def fetch(self) -> list[RawDocument]:
        client = await self._get_client()
        docs: list[RawDocument] = []

        for name, url in UKGC_CSVS.items():
            try:
                resp = await client.get(url)
                resp.raise_for_status()
                docs.append(RawDocument(
                    url=url,
                    content=resp.text,
                    content_type="text/csv",
                    metadata={"csv_type": name},
                ))
                logger.info("Fetched UKGC %s: %d bytes", name, len(resp.text))
            except httpx.HTTPError as e:
                logger.error("Failed to fetch UKGC %s: %s", name, e)

        return docs

    async def parse(self, doc: RawDocument) -> list[NormalizedRecord]:
        csv_type = doc.metadata.get("csv_type", "unknown")
        rows = _parse_csv(doc.content)
        normalized_rows = [_normalize_row(r) for r in rows]

        records: list[NormalizedRecord] = []
        for row in normalized_rows:
            records.append(NormalizedRecord(
                source_name=self.source_name,
                record_type=f"ukgc_{csv_type}",
                data=row,
                source_url=doc.url,
                content_hash=content_hash(row),
            ))
        logger.info("Parsed %d records from UKGC %s", len(records), csv_type)
        return records

    def join_datasets(
        self,
        businesses: list[dict[str, str]],
        licences: list[dict[str, str]],
        trading_names: list[dict[str, str]],
        domains: list[dict[str, str]],
    ) -> dict[str, dict[str, Any]]:
        """Join all 4 UKGC CSVs by account_number into unified company records."""
        companies: dict[str, dict[str, Any]] = {}

        for biz in businesses:
            acct = biz.get("account_number", "").strip()
            if not acct:
                continue
            companies[acct] = {
                "account_number": acct,
                "name": biz.get("name", ""),
                "address": biz.get("registered_address", biz.get("address", "")),
                "status": biz.get("status", ""),
                "licences": [],
                "trading_names": [],
                "domains": [],
            }

        for lic in licences:
            acct = lic.get("account_number", "").strip()
            if acct in companies:
                companies[acct]["licences"].append({
                    "licence_number": lic.get("licence_number", ""),
                    "licence_type": lic.get("type", lic.get("licence_type", "")),
                    "status": lic.get("status", ""),
                    "start_date": lic.get("start_date", ""),
                    "end_date": lic.get("end_date", ""),
                })

        for tn in trading_names:
            acct = tn.get("account_number", "").strip()
            if acct in companies:
                name = tn.get("trading_name", tn.get("name", "")).strip()
                if name:
                    companies[acct]["trading_names"].append(name)

        for dom in domains:
            acct = dom.get("account_number", "").strip()
            if acct in companies:
                domain = dom.get("url", dom.get("domain_name", dom.get("domain", ""))).strip()
                if domain:
                    companies[acct]["domains"].append(domain)

        return companies

    async def fetch_and_join(self) -> dict[str, dict[str, Any]]:
        """Full pipeline: fetch all CSVs, parse, join into company records."""
        docs = await self.fetch()
        if not docs:
            return {}

        datasets: dict[str, list[dict[str, str]]] = {}
        for doc in docs:
            csv_type = doc.metadata["csv_type"]
            rows = _parse_csv(doc.content)
            datasets[csv_type] = [_normalize_row(r) for r in rows]

        return self.join_datasets(
            businesses=datasets.get("businesses", []),
            licences=datasets.get("licences", []),
            trading_names=datasets.get("trading_names", []),
            domains=datasets.get("domains", []),
        )

    async def detect_changes(
        self,
        current: list[NormalizedRecord],
        previous: list[NormalizedRecord],
    ) -> list[ChangeEvent]:
        current_map = {r.data.get("account_number", r.content_hash): r.data for r in current}
        previous_map = {r.data.get("account_number", r.content_hash): r.data for r in previous}

        raw_changes = detect_changes(
            current_records=current_map,
            previous_records=previous_map,
            entity_type="ukgc_business",
        )

        events: list[ChangeEvent] = []
        for change in raw_changes:
            if change.event_type == "new":
                events.append(ChangeEvent(
                    event_type="new",
                    entity_type="ukgc_business",
                    entity_id=change.entity_key,
                    field_name=None,
                    old_value=None,
                    new_value=change.metadata,
                    source_url=UKGC_CSVS["businesses"],
                ))
            elif change.event_type == "removed":
                events.append(ChangeEvent(
                    event_type="removed",
                    entity_type="ukgc_business",
                    entity_id=change.entity_key,
                    field_name=None,
                    old_value=change.metadata,
                    new_value=None,
                    source_url=UKGC_CSVS["businesses"],
                ))
            elif change.event_type == "modified":
                for fc in change.changes:
                    events.append(ChangeEvent(
                        event_type="modified",
                        entity_type="ukgc_business",
                        entity_id=change.entity_key,
                        field_name=fc.field_name,
                        old_value=fc.old_value,
                        new_value=fc.new_value,
                        source_url=UKGC_CSVS["businesses"],
                    ))

        return events

    async def health_check(self) -> ConnectorStatus:
        client = await self._get_client()
        try:
            resp = await client.head(UKGC_CSVS["businesses"])
            if resp.status_code == 200:
                return ConnectorStatus.HEALTHY
            return ConnectorStatus.DEGRADED
        except httpx.HTTPError:
            return ConnectorStatus.DOWN
