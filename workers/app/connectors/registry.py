from app.connectors.base import BaseConnector
from app.connectors.ukgc import UKGCConnector
from app.connectors.gcgra import GCGRAConnector
from app.connectors.news import IGBConnector, GamingIntelligenceConnector, SBCConnector

CONNECTOR_REGISTRY: dict[str, type[BaseConnector]] = {
    "ukgc": UKGCConnector,
    "gcgra": GCGRAConnector,
    "igb": IGBConnector,
    "gaming_intelligence": GamingIntelligenceConnector,
    "sbc": SBCConnector,
}


def get_connector(name: str) -> BaseConnector:
    cls = CONNECTOR_REGISTRY.get(name)
    if cls is None:
        raise ValueError(f"Unknown connector: {name}. Available: {list(CONNECTOR_REGISTRY.keys())}")
    return cls()


def list_connectors() -> list[dict[str, str]]:
    result = []
    for name, cls in CONNECTOR_REGISTRY.items():
        result.append({
            "name": name,
            "source_type": cls.source_type.value if hasattr(cls, "source_type") else "unknown",
            "crawl_frequency": str(cls.crawl_frequency) if hasattr(cls, "crawl_frequency") else "unknown",
        })
    return result
