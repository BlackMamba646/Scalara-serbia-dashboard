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
from app.pipeline.change_detector import (
    content_hash,
    detect_changes,
)

logger = logging.getLogger(__name__)

GCGRA_URL = "https://www.gcgra.gov.ae/en/licensees"


class GCGRAConnector(BaseConnector):
    """Scrape GCGRA (UAE) licensee page.

    The page lists ~26 licensees in a simple HTML table/card layout.
    Uses httpx first; falls back to Playwright if Cloudflare blocks.
    """

    source_name = "gcgra"
    source_type = SourceType.REGULATOR
    crawl_frequency = timedelta(hours=72)
    rate_limit_rpm = 5

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    ),
                    "Accept": "text/html,application/xhtml+xml",
                },
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _fetch_with_httpx(self) -> str | None:
        client = await self._get_client()
        try:
            resp = await client.get(GCGRA_URL)
            resp.raise_for_status()
            if "challenge" in resp.text.lower() and len(resp.text) < 5000:
                logger.warning("GCGRA returned Cloudflare challenge page")
                return None
            return resp.text
        except httpx.HTTPError as e:
            logger.error("GCGRA httpx fetch failed: %s", e)
            return None

    async def _fetch_with_playwright(self) -> str | None:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            logger.error("Playwright not installed — cannot bypass Cloudflare for GCGRA")
            return None

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(GCGRA_URL, wait_until="networkidle", timeout=30000)
                html = await page.content()
                await browser.close()
                return html
        except Exception as e:
            logger.error("GCGRA Playwright fetch failed: %s", e)
            return None

    async def fetch(self) -> list[RawDocument]:
        html = await self._fetch_with_httpx()
        if html is None:
            html = await self._fetch_with_playwright()

        if html is None:
            logger.error("GCGRA: all fetch methods failed")
            return []

        return [RawDocument(
            url=GCGRA_URL,
            content=html,
            content_type="text/html",
            metadata={"page": "licensees"},
        )]

    async def parse(self, doc: RawDocument) -> list[NormalizedRecord]:
        try:
            from bs4 import BeautifulSoup
        except ImportError:
            logger.error("beautifulsoup4 not installed")
            return []

        soup = BeautifulSoup(doc.content, "html.parser")
        records: list[NormalizedRecord] = []

        cards = soup.select(".licensee-card, .card, [class*='licensee']")
        if not cards:
            rows = soup.select("table tr")
            cards = rows[1:] if rows else []

        if not cards:
            cards = _extract_from_text(soup)

        for card in cards:
            data = _parse_licensee_element(card)
            if data and data.get("name"):
                records.append(NormalizedRecord(
                    source_name=self.source_name,
                    record_type="gcgra_licensee",
                    data=data,
                    source_url=GCGRA_URL,
                    content_hash=content_hash(data),
                ))

        logger.info("Parsed %d GCGRA licensees", len(records))
        return records

    async def detect_changes(
        self,
        current: list[NormalizedRecord],
        previous: list[NormalizedRecord],
    ) -> list[ChangeEvent]:
        def _key(r: NormalizedRecord) -> str:
            return r.data.get("name", r.content_hash).lower().strip()

        current_map = {_key(r): r.data for r in current}
        previous_map = {_key(r): r.data for r in previous}

        raw_changes = detect_changes(
            current_records=current_map,
            previous_records=previous_map,
            entity_type="gcgra_licensee",
        )

        events: list[ChangeEvent] = []
        for change in raw_changes:
            events.append(ChangeEvent(
                event_type=change.event_type,
                entity_type="gcgra_licensee",
                entity_id=change.entity_key,
                field_name=change.changes[0].field_name if change.changes else None,
                old_value=change.changes[0].old_value if change.changes else None,
                new_value=change.changes[0].new_value if change.changes else change.metadata,
                source_url=GCGRA_URL,
            ))
        return events

    async def health_check(self) -> ConnectorStatus:
        client = await self._get_client()
        try:
            resp = await client.head(GCGRA_URL)
            if resp.status_code < 400:
                return ConnectorStatus.HEALTHY
            return ConnectorStatus.DEGRADED
        except httpx.HTTPError:
            return ConnectorStatus.DOWN


def _parse_licensee_element(element: Any) -> dict[str, str]:
    text = element.get_text(separator=" ", strip=True) if hasattr(element, "get_text") else str(element)
    cells = element.find_all("td") if hasattr(element, "find_all") else []

    if cells and len(cells) >= 2:
        return {
            "name": cells[0].get_text(strip=True),
            "license_type": cells[1].get_text(strip=True) if len(cells) > 1 else "",
            "status": cells[2].get_text(strip=True) if len(cells) > 2 else "",
        }

    name_el = element.find(class_=re.compile(r"name|title", re.I)) if hasattr(element, "find") else None
    name = name_el.get_text(strip=True) if name_el else text.split("\n")[0].strip()

    return {"name": name, "raw_text": text[:500]}


def _extract_from_text(soup: Any) -> list[Any]:
    from bs4 import Tag

    candidates: list[Tag] = []
    for el in soup.find_all(["div", "li", "article", "section"]):
        text = el.get_text(strip=True)
        if 20 < len(text) < 500 and not el.find(["div", "article", "section"]):
            candidates.append(el)
    return candidates[:50]
