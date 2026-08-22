"""arq worker — scheduled crawl jobs."""

import logging
from arq import cron
from arq.connections import RedisSettings

from app.config import settings
from app.tasks.crawl import run_crawl, run_all_crawls

logger = logging.getLogger(__name__)


async def crawl_regulators(ctx: dict) -> list[dict]:
    """Run regulator connectors (UKGC, GCGRA) — every 24h."""
    results = []
    for name in ("ukgc", "gcgra"):
        results.append(await run_crawl(name))
    return results


async def crawl_news(ctx: dict) -> list[dict]:
    """Run news connectors — every 6h."""
    results = []
    for name in ("igb", "gaming_intelligence", "sbc"):
        results.append(await run_crawl(name))
    return results


async def crawl_ct_logs(ctx: dict) -> dict:
    """Run crt.sh connector — every 12h."""
    return await run_crawl("crtsh")


async def crawl_complaints(ctx: dict) -> list[dict]:
    """Run complaint aggregator connectors — every 24h."""
    results = []
    for name in ("casino_guru", "askgamblers"):
        results.append(await run_crawl(name))
    return results


async def crawl_all(ctx: dict) -> list[dict]:
    """Run all connectors — used for initial seed and manual triggers."""
    return await run_all_crawls()


class WorkerSettings:
    functions = [crawl_regulators, crawl_news, crawl_ct_logs, crawl_complaints, crawl_all]

    cron_jobs = [
        cron(crawl_regulators, hour={0}, minute=0),
        cron(crawl_news, hour={0, 6, 12, 18}, minute=15),
        cron(crawl_ct_logs, hour={3, 15}, minute=30),
        cron(crawl_complaints, hour={2}, minute=0),
    ]

    redis_settings = RedisSettings.from_dsn(settings.redis_url)

    max_jobs = 3
    job_timeout = 600
