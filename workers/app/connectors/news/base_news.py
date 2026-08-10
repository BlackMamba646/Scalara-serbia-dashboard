import logging
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
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

IGAMING_KEYWORDS = re.compile(
    r"licen[sc]e|regulat|gaming|casino|betting|sportsbook|igaming|"
    r"gambling|operator|supplier|provider|B2B|launch|expand|partner|"
    r"acquisition|funding|hire|appoint|compliance",
    re.IGNORECASE,
)


@dataclass
class NewsArticle:
    title: str
    url: str
    published: str
    summary: str
    source: str
    categories: list[str]


class BaseNewsConnector(BaseConnector):
    source_type = SourceType.NEWS
    crawl_frequency = timedelta(hours=6)
    rate_limit_rpm = 20

    rss_url: str = ""
    web_url: str = ""

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                headers={"User-Agent": "ScalaraRadar/1.0 (sales-intelligence)"},
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def fetch(self) -> list[RawDocument]:
        client = await self._get_client()
        docs: list[RawDocument] = []

        if self.rss_url:
            try:
                resp = await client.get(self.rss_url)
                resp.raise_for_status()
                docs.append(RawDocument(
                    url=self.rss_url,
                    content=resp.text,
                    content_type="application/rss+xml",
                    metadata={"format": "rss"},
                ))
                logger.info("Fetched RSS from %s: %d bytes", self.source_name, len(resp.text))
            except httpx.HTTPError as e:
                logger.warning("RSS fetch failed for %s: %s", self.source_name, e)

        if not docs and self.web_url:
            try:
                resp = await client.get(self.web_url)
                resp.raise_for_status()
                docs.append(RawDocument(
                    url=self.web_url,
                    content=resp.text,
                    content_type="text/html",
                    metadata={"format": "html"},
                ))
                logger.info("Fetched HTML from %s: %d bytes", self.source_name, len(resp.text))
            except httpx.HTTPError as e:
                logger.error("HTML fetch failed for %s: %s", self.source_name, e)

        return docs

    async def parse(self, doc: RawDocument) -> list[NormalizedRecord]:
        fmt = doc.metadata.get("format", "")
        if fmt == "rss":
            articles = self._parse_rss(doc.content)
        else:
            articles = await self._parse_html(doc.content)

        records: list[NormalizedRecord] = []
        for article in articles:
            data = {
                "title": article.title,
                "url": article.url,
                "published": article.published,
                "summary": article.summary,
                "source": article.source,
                "categories": article.categories,
            }
            records.append(NormalizedRecord(
                source_name=self.source_name,
                record_type="news_article",
                data=data,
                source_url=article.url,
                content_hash=content_hash({"title": article.title, "url": article.url}),
            ))
        return records

    def _parse_rss(self, xml_text: str) -> list[NewsArticle]:
        articles: list[NewsArticle] = []
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError as e:
            logger.error("RSS parse error for %s: %s", self.source_name, e)
            return articles

        ns = {"atom": "http://www.w3.org/2005/Atom"}

        items = root.findall(".//item")
        if not items:
            items = root.findall(".//atom:entry", ns)

        for item in items:
            title = _xml_text(item, "title") or _xml_text(item, "atom:title", ns)
            link = _xml_text(item, "link") or _xml_attr(item, "atom:link", "href", ns) or ""
            pub = _xml_text(item, "pubDate") or _xml_text(item, "atom:published", ns) or ""
            desc = _xml_text(item, "description") or _xml_text(item, "atom:summary", ns) or ""
            categories = [c.text or "" for c in item.findall("category")] or \
                         [c.text or "" for c in item.findall("atom:category", ns)]

            summary = re.sub(r"<[^>]+>", "", desc)[:500]

            if title and IGAMING_KEYWORDS.search(f"{title} {summary}"):
                articles.append(NewsArticle(
                    title=title,
                    url=link,
                    published=pub,
                    summary=summary,
                    source=self.source_name,
                    categories=categories,
                ))

        logger.info("Parsed %d relevant articles from %s RSS", len(articles), self.source_name)
        return articles

    async def _parse_html(self, html: str) -> list[NewsArticle]:
        try:
            from bs4 import BeautifulSoup
        except ImportError:
            logger.error("beautifulsoup4 not installed")
            return []

        soup = BeautifulSoup(html, "html.parser")
        articles: list[NewsArticle] = []

        for a in soup.select("article a[href], .post a[href], .article-card a[href], h2 a[href], h3 a[href]"):
            title = a.get_text(strip=True)
            href = a.get("href", "")
            if not title or len(title) < 10:
                continue
            if not IGAMING_KEYWORDS.search(title):
                continue

            if href and not href.startswith("http"):
                href = f"{self.web_url.rstrip('/')}/{href.lstrip('/')}"

            articles.append(NewsArticle(
                title=title,
                url=href,
                published="",
                summary="",
                source=self.source_name,
                categories=[],
            ))

        seen_urls: set[str] = set()
        deduped: list[NewsArticle] = []
        for a in articles:
            if a.url not in seen_urls:
                seen_urls.add(a.url)
                deduped.append(a)

        logger.info("Parsed %d relevant articles from %s HTML", len(deduped), self.source_name)
        return deduped[:50]

    async def detect_changes(
        self,
        current: list[NormalizedRecord],
        previous: list[NormalizedRecord],
    ) -> list[ChangeEvent]:
        prev_hashes = {r.content_hash for r in previous}
        events: list[ChangeEvent] = []
        for r in current:
            if r.content_hash not in prev_hashes:
                events.append(ChangeEvent(
                    event_type="new",
                    entity_type="news_article",
                    entity_id=r.data.get("url"),
                    field_name=None,
                    old_value=None,
                    new_value=r.data,
                    source_url=r.source_url,
                ))
        return events

    async def health_check(self) -> ConnectorStatus:
        client = await self._get_client()
        url = self.rss_url or self.web_url
        try:
            resp = await client.head(url)
            if resp.status_code < 400:
                return ConnectorStatus.HEALTHY
            return ConnectorStatus.DEGRADED
        except httpx.HTTPError:
            return ConnectorStatus.DOWN


def _xml_text(el: ET.Element, tag: str, ns: dict[str, str] | None = None) -> str | None:
    child = el.find(tag, ns) if ns else el.find(tag)
    return child.text.strip() if child is not None and child.text else None


def _xml_attr(el: ET.Element, tag: str, attr: str, ns: dict[str, str] | None = None) -> str | None:
    child = el.find(tag, ns) if ns else el.find(tag)
    return child.get(attr) if child is not None else None
