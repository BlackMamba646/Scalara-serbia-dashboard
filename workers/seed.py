#!/usr/bin/env python3
"""Seed the database by running all connectors once.

Usage:
    python seed.py              # Run all connectors
    python seed.py crtsh        # Run just crt.sh
    python seed.py --tables     # Only create tables, no crawl
"""

import asyncio
import logging
import sys

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("seed")


async def create_tables():
    from app.models.database import engine
    from app.models.tables import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("All database tables created/verified")


async def seed(connector_names: list[str] | None = None):
    await create_tables()

    from app.tasks.crawl import run_crawl, run_all_crawls, ensure_sources_exist
    from app.models.database import async_session

    async with async_session() as session:
        source_map = await ensure_sources_exist(session)
    logger.info("Registered %d sources in database", len(source_map))

    if connector_names:
        results = []
        for name in connector_names:
            logger.info("Running connector: %s", name)
            results.append(await run_crawl(name))
    else:
        logger.info("Running all connectors...")
        results = await run_all_crawls()

    print("\n" + "=" * 60)
    print("SEED RESULTS")
    print("=" * 60)
    for r in results:
        status = r.get("status", "unknown")
        emoji = "OK" if status == "completed" else "FAIL"
        records = r.get("records", 0)
        new = r.get("new", 0)
        print(f"  [{emoji}] {r['connector']:25s} records={records:5d}  new={new:5d}")

    total = sum(r.get("records", 0) for r in results)
    failed = [r["connector"] for r in results if r.get("status") != "completed"]
    print(f"\nTotal records: {total}")
    if failed:
        print(f"Failed: {', '.join(failed)}")
    print("=" * 60)


if __name__ == "__main__":
    args = sys.argv[1:]

    if "--tables" in args:
        asyncio.run(create_tables())
    else:
        connector_names = [a for a in args if not a.startswith("-")] or None
        asyncio.run(seed(connector_names))
