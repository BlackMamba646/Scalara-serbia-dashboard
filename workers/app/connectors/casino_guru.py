"""Casino Guru complaint and reputation connector.

Monitors Casino Guru's public casino database for Safety Index scores,
complaint volumes, and reputation changes. Clusters of unresolved
complaints about platform, payment, or software issues indicate operators
actively looking for new technology partners.
"""

from __future__ import annotations


import logging
import re
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
from app.pipeline.change_detector import content_hash

logger = logging.getLogger(__name__)

CASINO_GURU_BASE = "https://www.casino.guru"
COMPLAINTS_URL = f"{CASINO_GURU_BASE}/complaints"
CASINOS_API = f"{CASINO_GURU_BASE}/api/casinos"


class CasinoGuruConnector(BaseConnector):
    source_name = "Casino Guru"
    source_type = SourceType.COMPANY
    crawl_frequency = timedelta(hours=24)
    rate_limit_rpm = 15

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                headers={
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                },
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def fetch(self) -> list[RawDocument]:
        client = await self._get_client()
        docs: list[RawDocument] = []

        try:
            resp = await client.get(f"{CASINO_GURU_BASE}/online-casinos/complaints-resolved")
            resp.raise_for_status()
            docs.append(RawDocument(
                url=resp.url.path if hasattr(resp.url, "path") else str(resp.url),
                content=resp.text,
                content_type="text/html",
                metadata={"page": "recently_resolved"},
            ))
            logger.info("Fetched Casino Guru resolved complaints: %d bytes", len(resp.text))
        except httpx.HTTPError as e:
            logger.warning("Casino Guru resolved complaints fetch failed: %s", e)

        try:
            resp = await client.get(f"{CASINO_GURU_BASE}/online-casinos/complaints-unresolved")
            resp.raise_for_status()
            docs.append(RawDocument(
                url=str(resp.url),
                content=resp.text,
                content_type="text/html",
                metadata={"page": "recently_unresolved"},
            ))
            logger.info("Fetched Casino Guru unresolved complaints: %d bytes", len(resp.text))
        except httpx.HTTPError as e:
            logger.warning("Casino Guru unresolved complaints fetch failed: %s", e)

        try:
            resp = await client.get(f"{CASINO_GURU_BASE}/online-casinos")
            resp.raise_for_status()
            docs.append(RawDocument(
                url=str(resp.url),
                content=resp.text,
                content_type="text/html",
                metadata={"page": "casino_list"},
            ))
            logger.info("Fetched Casino Guru casino list: %d bytes", len(resp.text))
        except httpx.HTTPError as e:
            logger.warning("Casino Guru casino list fetch failed: %s", e)

        return docs

    async def parse(self, doc: RawDocument) -> list[NormalizedRecord]:
        try:
            from bs4 import BeautifulSoup
        except ImportError:
            logger.error("beautifulsoup4 not installed — required for Casino Guru")
            return []

        soup = BeautifulSoup(doc.content, "html.parser")
        page_type = doc.metadata.get("page", "")
        records: list[NormalizedRecord] = []

        if page_type == "casino_list":
            records.extend(self._parse_casino_list(soup))
        elif page_type in ("recently_resolved", "recently_unresolved"):
            records.extend(self._parse_complaints(soup, page_type))

        return records

    def _parse_casino_list(self, soup: Any) -> list[NormalizedRecord]:
        records: list[NormalizedRecord] = []

        for card in soup.select("[data-casino-name], .casino-card, .casino-item"):
            name = card.get("data-casino-name", "")
            if not name:
                name_el = card.select_one(".casino-name, h3, h2")
                name = name_el.get_text(strip=True) if name_el else ""

            if not name:
                continue

            safety_el = card.select_one("[data-safety-index], .safety-index, .rating-value")
            safety_index = ""
            if safety_el:
                safety_text = safety_el.get_text(strip=True)
                match = re.search(r"([\d.]+)", safety_text)
                if match:
                    safety_index = match.group(1)

            complaints_el = card.select_one(".complaints-count, [data-complaints]")
            complaints = complaints_el.get_text(strip=True) if complaints_el else "0"

            link_el = card.select_one("a[href*='/online-casinos/']")
            url = ""
            if link_el:
                href = link_el.get("href", "")
                url = href if href.startswith("http") else f"{CASINO_GURU_BASE}{href}"

            data = {
                "casino_name": name,
                "safety_index": safety_index,
                "complaints_count": complaints,
                "url": url,
                "source": "casino_guru",
            }

            records.append(NormalizedRecord(
                source_name=self.source_name,
                record_type="casino_reputation",
                data=data,
                source_url=url or CASINO_GURU_BASE,
                content_hash=content_hash({"name": name, "safety": safety_index, "complaints": complaints}),
            ))

        logger.info("Parsed %d casinos from Casino Guru listing", len(records))
        return records

    def _parse_complaints(self, soup: Any, page_type: str) -> list[NormalizedRecord]:
        records: list[NormalizedRecord] = []
        is_unresolved = "unresolved" in page_type

        for item in soup.select(".complaint-item, .complaint-card, article"):
            casino_el = item.select_one(".casino-name, [data-casino], a[href*='online-casinos']")
            casino_name = casino_el.get_text(strip=True) if casino_el else ""
            if not casino_name:
                continue

            category_el = item.select_one(".complaint-type, .category, .tag")
            category = category_el.get_text(strip=True) if category_el else "general"

            amount_el = item.select_one(".amount, .disputed-amount")
            amount = amount_el.get_text(strip=True) if amount_el else ""

            title_el = item.select_one("h3, h2, .title")
            title = title_el.get_text(strip=True) if title_el else ""

            data = {
                "casino_name": casino_name,
                "category": category,
                "disputed_amount": amount,
                "title": title,
                "is_unresolved": is_unresolved,
                "source": "casino_guru",
            }

            records.append(NormalizedRecord(
                source_name=self.source_name,
                record_type="casino_complaint",
                data=data,
                source_url=COMPLAINTS_URL,
                content_hash=content_hash({"casino": casino_name, "title": title, "resolved": not is_unresolved}),
            ))

        logger.info("Parsed %d %s complaints from Casino Guru", len(records), page_type)
        return records

    async def detect_changes(
        self,
        current: list[NormalizedRecord],
        previous: list[NormalizedRecord],
    ) -> list[ChangeEvent]:
        prev_hashes = {r.content_hash for r in previous}
        prev_by_name: dict[str, NormalizedRecord] = {}
        for r in previous:
            if r.record_type == "casino_reputation":
                prev_by_name[r.data.get("casino_name", "")] = r

        events: list[ChangeEvent] = []
        for r in current:
            if r.content_hash not in prev_hashes:
                if r.record_type == "casino_reputation":
                    name = r.data.get("casino_name", "")
                    prev_rec = prev_by_name.get(name)
                    if prev_rec:
                        events.append(ChangeEvent(
                            event_type="modified",
                            entity_type="casino_reputation",
                            entity_id=name,
                            field_name="safety_index",
                            old_value=prev_rec.data.get("safety_index"),
                            new_value=r.data.get("safety_index"),
                            source_url=r.source_url,
                        ))
                    else:
                        events.append(ChangeEvent(
                            event_type="new",
                            entity_type="casino_reputation",
                            entity_id=name,
                            field_name=None,
                            old_value=None,
                            new_value=r.data,
                            source_url=r.source_url,
                        ))
                else:
                    events.append(ChangeEvent(
                        event_type="new",
                        entity_type="casino_complaint",
                        entity_id=r.data.get("casino_name"),
                        field_name=None,
                        old_value=None,
                        new_value=r.data,
                        source_url=r.source_url,
                    ))

        return events

    async def health_check(self) -> ConnectorStatus:
        client = await self._get_client()
        try:
            resp = await client.head(CASINO_GURU_BASE)
            if resp.status_code < 400:
                return ConnectorStatus.HEALTHY
            return ConnectorStatus.DEGRADED
        except httpx.HTTPError:
            return ConnectorStatus.DOWN
