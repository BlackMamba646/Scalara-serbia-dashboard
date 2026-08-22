"""Certificate Transparency log connector via crt.sh.

Monitors public CT logs for new TLS certificates matching gambling-related
keywords. New certificates for casino/bet/slots/poker domains surface
soft launches and new brand variants days or weeks before press coverage.
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

GAMBLING_PATTERNS = re.compile(
    r"casino|\.bet|slots?|poker|gaming|jackpot|spin|wager|sportsbook|"
    r"bingo|lottery|blackjack|roulette|\.casino",
    re.IGNORECASE,
)

EXCLUDE_PATTERNS = re.compile(
    r"test\.|example\.|localhost|staging\.|dev\.|internal\.",
    re.IGNORECASE,
)

CRT_SH_API = "https://crt.sh/"


class CrtShConnector(BaseConnector):
    source_name = "crt.sh CT Logs"
    source_type = SourceType.SEARCH
    crawl_frequency = timedelta(hours=12)
    rate_limit_rpm = 10

    SEARCH_TERMS = [
        "%.casino",
        "%.bet",
        "%slots%",
        "%poker%online%",
        "%sportsbook%",
    ]

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                headers={"User-Agent": "ScalaraRadar/1.0 (certificate-monitoring)"},
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def fetch(self) -> list[RawDocument]:
        client = await self._get_client()
        docs: list[RawDocument] = []

        for term in self.SEARCH_TERMS:
            try:
                resp = await client.get(
                    CRT_SH_API,
                    params={"q": term, "output": "json"},
                )
                if resp.status_code == 200 and resp.text.strip():
                    docs.append(RawDocument(
                        url=f"{CRT_SH_API}?q={term}&output=json",
                        content=resp.text,
                        content_type="application/json",
                        metadata={"search_term": term},
                    ))
                    logger.info("crt.sh query '%s': %d bytes", term, len(resp.text))
                else:
                    logger.warning("crt.sh query '%s' returned %d", term, resp.status_code)
            except httpx.HTTPError as e:
                logger.warning("crt.sh query '%s' failed: %s", term, e)

        return docs

    async def parse(self, doc: RawDocument) -> list[NormalizedRecord]:
        import json as json_mod

        try:
            entries = json_mod.loads(doc.content)
        except (json_mod.JSONDecodeError, ValueError):
            logger.error("Failed to parse crt.sh JSON response")
            return []

        if not isinstance(entries, list):
            return []

        records: list[NormalizedRecord] = []
        seen_domains: set[str] = set()

        for entry in entries[:200]:
            common_name = entry.get("common_name", "")
            name_value = entry.get("name_value", "")
            issuer = entry.get("issuer_name", "")
            not_before = entry.get("not_before", "")
            cert_id = entry.get("id", "")

            domains = set()
            for val in [common_name, name_value]:
                for d in val.split("\n"):
                    d = d.strip().lstrip("*.")
                    if d and "." in d:
                        domains.add(d.lower())

            for domain in domains:
                if domain in seen_domains:
                    continue
                if EXCLUDE_PATTERNS.search(domain):
                    continue
                if not GAMBLING_PATTERNS.search(domain):
                    continue

                seen_domains.add(domain)

                data = {
                    "domain": domain,
                    "common_name": common_name,
                    "issuer": issuer,
                    "not_before": not_before,
                    "cert_id": str(cert_id),
                    "all_names": name_value,
                }

                records.append(NormalizedRecord(
                    source_name=self.source_name,
                    record_type="ct_certificate",
                    data=data,
                    source_url=f"https://crt.sh/?id={cert_id}",
                    content_hash=content_hash({"domain": domain, "not_before": not_before}),
                ))

        logger.info("Parsed %d unique gambling-related domains from CT logs", len(records))
        return records

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
                    entity_type="ct_certificate",
                    entity_id=r.data.get("domain"),
                    field_name=None,
                    old_value=None,
                    new_value=r.data,
                    source_url=r.source_url,
                ))
        return events

    async def health_check(self) -> ConnectorStatus:
        client = await self._get_client()
        try:
            resp = await client.get(CRT_SH_API, params={"q": "%.casino", "output": "json"})
            if resp.status_code == 200:
                return ConnectorStatus.HEALTHY
            return ConnectorStatus.DEGRADED
        except httpx.HTTPError:
            return ConnectorStatus.DOWN
