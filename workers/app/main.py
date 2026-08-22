import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.connectors.registry import get_connector, list_connectors, CONNECTOR_REGISTRY
from app.models.database import engine
from app.models.tables import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")
    yield
    await engine.dispose()


app = FastAPI(
    title="Scalara Radar Workers",
    description="Data pipeline workers for iGaming sales intelligence",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        settings.frontend_url,
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "scalara-radar-workers"}


@app.get("/connectors")
async def get_connectors() -> list[dict[str, str]]:
    return list_connectors()


@app.get("/connectors/{name}/health")
async def connector_health(name: str) -> dict[str, str]:
    try:
        connector = get_connector(name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    status = await connector.health_check()
    if hasattr(connector, "close"):
        await connector.close()
    return {"connector": name, "status": status.value}


@app.post("/connectors/{name}/crawl")
async def trigger_crawl(name: str) -> dict[str, Any]:
    from app.tasks.crawl import run_crawl
    return await run_crawl(name)


@app.post("/crawl/all")
async def trigger_all_crawls() -> list[dict]:
    from app.tasks.crawl import run_all_crawls
    return await run_all_crawls()


@app.post("/crawl/seed")
async def seed_database() -> dict[str, Any]:
    """Run all connectors and populate the database with initial data."""
    from app.tasks.crawl import run_all_crawls, ensure_sources_exist
    from app.models.database import async_session

    async with async_session() as session:
        source_map = await ensure_sources_exist(session)

    results = await run_all_crawls()

    total_new = sum(r.get("new", 0) for r in results)
    total_records = sum(r.get("records", 0) for r in results)
    failed = [r["connector"] for r in results if r.get("status") != "completed"]

    return {
        "status": "completed",
        "sources_registered": len(source_map),
        "total_records": total_records,
        "total_new": total_new,
        "failed_connectors": failed,
        "details": results,
    }


@app.post("/cron/regulators")
async def cron_regulators() -> list[dict]:
    """Render cron — crawl UKGC + GCGRA daily."""
    from app.tasks.scheduler import crawl_regulators
    return await crawl_regulators()


@app.post("/cron/news")
async def cron_news() -> list[dict]:
    """Render cron — crawl news sources every 6h."""
    from app.tasks.scheduler import crawl_news
    return await crawl_news()


@app.post("/cron/ct")
async def cron_ct() -> dict:
    """Render cron — crawl crt.sh every 12h."""
    from app.tasks.scheduler import crawl_ct_logs
    return await crawl_ct_logs()


@app.post("/cron/complaints")
async def cron_complaints() -> list[dict]:
    """Render cron — crawl Casino Guru + AskGamblers daily."""
    from app.tasks.scheduler import crawl_complaints
    return await crawl_complaints()
