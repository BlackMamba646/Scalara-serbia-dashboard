import logging
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.connectors.registry import get_connector, list_connectors, CONNECTOR_REGISTRY

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Scalara Radar Workers",
    description="Data pipeline workers for iGaming sales intelligence",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    await connector.close() if hasattr(connector, "close") else None
    return {"connector": name, "status": status.value}


@app.post("/connectors/{name}/crawl")
async def trigger_crawl(name: str) -> dict[str, Any]:
    try:
        connector = get_connector(name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    docs = await connector.fetch()
    all_records = []
    for doc in docs:
        records = await connector.parse(doc)
        all_records.extend(records)

    await connector.close() if hasattr(connector, "close") else None

    return {
        "connector": name,
        "documents_fetched": len(docs),
        "records_parsed": len(all_records),
        "sample": [r.data for r in all_records[:3]],
    }
