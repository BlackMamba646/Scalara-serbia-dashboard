"""Cron-triggered crawl groups — called via HTTP by Render cron jobs."""

from __future__ import annotations

import logging

from app.tasks.crawl import run_crawl, run_all_crawls

logger = logging.getLogger(__name__)


async def crawl_regulators() -> list[dict]:
    results = []
    for name in ("ukgc", "gcgra"):
        results.append(await run_crawl(name))
    return results


async def crawl_news() -> list[dict]:
    results = []
    for name in ("igb", "gaming_intelligence", "sbc"):
        results.append(await run_crawl(name))
    return results


async def crawl_ct_logs() -> dict:
    return await run_crawl("crtsh")


async def crawl_complaints() -> list[dict]:
    results = []
    for name in ("casino_guru", "askgamblers"):
        results.append(await run_crawl(name))
    return results
