import logging
import re
import uuid
from difflib import SequenceMatcher
from typing import Any
from urllib.parse import urlparse

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

COMPANY_SUFFIXES = re.compile(
    r"\b(ltd|limited|llc|inc|incorporated|corp|corporation|plc|gmbh|"
    r"ag|sa|bv|nv|pty)\b\.?",
    re.IGNORECASE,
)


def normalize_company_name(name: str) -> str:
    name = name.strip().lower()
    name = COMPANY_SUFFIXES.sub("", name)
    name = re.sub(r"[^a-z0-9\s]", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def extract_domain(url_or_domain: str) -> str:
    if not url_or_domain:
        return ""
    if "://" not in url_or_domain:
        url_or_domain = f"https://{url_or_domain}"
    try:
        parsed = urlparse(url_or_domain)
        domain = parsed.hostname or ""
        if domain.startswith("www."):
            domain = domain[4:]
        return domain.lower()
    except Exception:
        return url_or_domain.lower().replace("www.", "")


def fuzzy_match(name1: str, name2: str) -> float:
    n1 = normalize_company_name(name1)
    n2 = normalize_company_name(name2)
    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 1.0
    return SequenceMatcher(None, n1, n2).ratio()


class EntityResolver:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.match_threshold = 0.85

    async def resolve(
        self,
        name: str,
        domains: list[str] | None = None,
        aliases: list[str] | None = None,
        source_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Resolve a company name to an existing entity or create a new one.

        Returns {"company_id": str, "match_type": str, "confidence": float}
        """
        if domains:
            for domain in domains:
                d = extract_domain(domain)
                if d:
                    match = await self._match_by_domain(d)
                    if match:
                        return {
                            "company_id": match,
                            "match_type": "domain",
                            "confidence": 0.95,
                        }

        match = await self._match_by_alias(name)
        if match:
            return {
                "company_id": match,
                "match_type": "alias",
                "confidence": 0.9,
            }

        match, score = await self._match_by_fuzzy_name(name)
        if match and score >= self.match_threshold:
            return {
                "company_id": match,
                "match_type": "fuzzy_name",
                "confidence": score,
            }

        company_id = await self._create_company(name, domains, aliases, source_data)
        return {
            "company_id": company_id,
            "match_type": "new",
            "confidence": 1.0,
        }

    async def _match_by_domain(self, domain: str) -> str | None:
        result = await self.db.execute(
            text("SELECT company_id FROM domains WHERE domain = :domain LIMIT 1"),
            {"domain": domain},
        )
        row = result.fetchone()
        return str(row[0]) if row else None

    async def _match_by_alias(self, name: str) -> str | None:
        normalized = normalize_company_name(name)
        result = await self.db.execute(
            text("""
                SELECT company_id FROM company_aliases
                WHERE lower(alias_name) = :name
                LIMIT 1
            """),
            {"name": normalized},
        )
        row = result.fetchone()
        if row:
            return str(row[0])

        result = await self.db.execute(
            text("SELECT id FROM companies WHERE lower(name) = :name LIMIT 1"),
            {"name": name.strip().lower()},
        )
        row = result.fetchone()
        return str(row[0]) if row else None

    async def _match_by_fuzzy_name(self, name: str) -> tuple[str | None, float]:
        result = await self.db.execute(
            text("SELECT id, name FROM companies LIMIT 1000"),
        )
        rows = result.fetchall()

        best_match: str | None = None
        best_score = 0.0

        for row in rows:
            score = fuzzy_match(name, row[1])
            if score > best_score:
                best_score = score
                best_match = str(row[0])

        return best_match, best_score

    async def _create_company(
        self,
        name: str,
        domains: list[str] | None,
        aliases: list[str] | None,
        source_data: dict[str, Any] | None,
    ) -> str:
        company_id = str(uuid.uuid4())
        await self.db.execute(
            text("""
                INSERT INTO companies (id, name, status)
                VALUES (:id, :name, 'discovered')
            """),
            {"id": company_id, "name": name.strip()},
        )

        if domains:
            for domain in domains:
                d = extract_domain(domain)
                if d:
                    await self.db.execute(
                        text("""
                            INSERT INTO domains (id, company_id, domain, is_primary)
                            VALUES (:id, :company_id, :domain, :is_primary)
                            ON CONFLICT (domain) DO NOTHING
                        """),
                        {
                            "id": str(uuid.uuid4()),
                            "company_id": company_id,
                            "domain": d,
                            "is_primary": domains.index(domain) == 0,
                        },
                    )

        if aliases:
            for alias in aliases:
                await self.db.execute(
                    text("""
                        INSERT INTO company_aliases (id, company_id, alias_name, alias_type)
                        VALUES (:id, :company_id, :alias_name, 'trading_name')
                        ON CONFLICT DO NOTHING
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "company_id": company_id,
                        "alias_name": alias.strip(),
                    },
                )

        await self.db.commit()
        logger.info("Created new company: %s (%s)", name, company_id)
        return company_id
