"""AskGamblers complaint and casino rating connector.

Monitors AskGamblers for casino ratings, complaint volumes, and
reputation changes. Complaint spikes in payments, software, or
KYC categories indicate operators with platform pain — high intent
signals for B2B outreach.
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

ASKGAMBLERS_BASE = "https://www.askgamblers.com"
CASINOS_URL = f"{ASKGAMBLERS_BASE}/online-casinos"
COMPLAINTS_URL = f"{ASKGAMBLERS_BASE}/complaints"


class AskGamblersConnector(BaseConnector):
    source_name = "AskGamblers"
    source_type = SourceType.COMPANY
    crawl_frequency = timedelta(hours=24)
    rate_limit_rpm = 10

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
            resp = await client.get(CASINOS_URL)
            resp.raise_for_status()
            docs.append(RawDocument(
                url=CASINOS_URL,
                content=resp.text,
                content_type="text/html",
                metadata={"page": "casino_list"},
            ))
            logger.info("Fetched AskGamblers casino list: %d bytes", len(resp.text))
        except httpx.HTTPError as e:
            logger.warning("AskGamblers casino list fetch failed: %s", e)

        try:
            resp = await client.get(COMPLAINTS_URL)
            resp.raise_for_status()
            docs.append(RawDocument(
                url=COMPLAINTS_URL,
                content=resp.text,
                content_type="text/html",
                metadata={"page": "complaints"},
            ))
            logger.info("Fetched AskGamblers complaints: %d bytes", len(resp.text))
        except httpx.HTTPError as e:
            logger.warning("AskGamblers complaints fetch failed: %s", e)

        return docs

    async def parse(self, doc: RawDocument) -> list[NormalizedRecord]:
        try:
            from bs4 import BeautifulSoup
        except ImportError:
            logger.error("beautifulsoup4 not installed — required for AskGamblers")
            return []

        soup = BeautifulSoup(doc.content, "html.parser")
        page_type = doc.metadata.get("page", "")
        records: list[NormalizedRecord] = []

        if page_type == "casino_list":
            records.extend(self._parse_casinos(soup))
        elif page_type == "complaints":
            records.extend(self._parse_complaints(soup))

        return records

    def _parse_casinos(self, soup: Any) -> list[NormalizedRecord]:
        records: list[NormalizedRecord] = []

        for card in soup.select(".casino-card, .casino-item, [data-casino], .casino-row"):
            name_el = card.select_one(".casino-name, h3, h2, .name")
            name = name_el.get_text(strip=True) if name_el else ""
            if not name:
                continue

            rating_el = card.select_one(".rating, .score, .casino-rating, [data-rating]")
            rating = ""
            if rating_el:
                rating_text = rating_el.get_text(strip=True)
                match = re.search(r"([\d.]+)", rating_text)
                if match:
                    rating = match.group(1)

            complaints_el = card.select_one(".complaints, [data-complaints]")
            complaints = "0"
            if complaints_el:
                match = re.search(r"(\d+)", complaints_el.get_text(strip=True))
                if match:
                    complaints = match.group(1)

            link_el = card.select_one("a[href]")
            url = ""
            if link_el:
                href = link_el.get("href", "")
                url = href if href.startswith("http") else f"{ASKGAMBLERS_BASE}{href}"

            data = {
                "casino_name": name,
                "rating": rating,
                "complaints_count": complaints,
                "url": url,
                "source": "askgamblers",
            }

            records.append(NormalizedRecord(
                source_name=self.source_name,
                record_type="casino_reputation",
                data=data,
                source_url=url or CASINOS_URL,
                content_hash=content_hash({"name": name, "rating": rating, "complaints": complaints}),
            ))

        logger.info("Parsed %d casinos from AskGamblers", len(records))
        return records

    def _parse_complaints(self, soup: Any) -> list[NormalizedRecord]:
        records: list[NormalizedRecord] = []

        for item in soup.select(".complaint, .complaint-item, .complaint-card, article"):
            casino_el = item.select_one(".casino-name, [data-casino], a[href*='casino']")
            casino_name = casino_el.get_text(strip=True) if casino_el else ""
            if not casino_name:
                continue

            status_el = item.select_one(".status, .complaint-status, .badge")
            status = status_el.get_text(strip=True).lower() if status_el else "open"

            category_el = item.select_one(".category, .type, .tag")
            category = category_el.get_text(strip=True) if category_el else "general"

            amount_el = item.select_one(".amount, .value")
            amount = amount_el.get_text(strip=True) if amount_el else ""

            title_el = item.select_one("h3, h2, .title, .subject")
            title = title_el.get_text(strip=True) if title_el else ""

            data = {
                "casino_name": casino_name,
                "status": status,
                "category": category,
                "disputed_amount": amount,
                "title": title,
                "source": "askgamblers",
            }

            records.append(NormalizedRecord(
                source_name=self.source_name,
                record_type="casino_complaint",
                data=data,
                source_url=COMPLAINTS_URL,
                content_hash=content_hash({"casino": casino_name, "title": title, "status": status}),
            ))

        logger.info("Parsed %d complaints from AskGamblers", len(records))
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
                            field_name="rating",
                            old_value=prev_rec.data.get("rating"),
                            new_value=r.data.get("rating"),
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
            resp = await client.head(ASKGAMBLERS_BASE)
            if resp.status_code < 400:
                return ConnectorStatus.HEALTHY
            return ConnectorStatus.DEGRADED
        except httpx.HTTPError:
            return ConnectorStatus.DOWN
