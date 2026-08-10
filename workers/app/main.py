from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

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


@app.get("/config/sources")
async def list_sources() -> dict[str, list[str]]:
    return {
        "regulators": ["ukgc", "gcgra", "arizona_dog", "aglc"],
        "news": ["igb", "gaming_intelligence", "sbc"],
    }
