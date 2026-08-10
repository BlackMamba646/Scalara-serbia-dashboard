from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any


class SourceType(str, Enum):
    REGULATOR = "regulator"
    NEWS = "news"
    COMPANY = "company"
    JOBS = "jobs"
    FUNDING = "funding"
    SEARCH = "search"


class ConnectorStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"
    UNKNOWN = "unknown"


@dataclass
class RawDocument:
    url: str
    content: str
    content_type: str
    retrieved_at: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)
    content_hash: str = ""


@dataclass
class NormalizedRecord:
    source_name: str
    record_type: str
    data: dict[str, Any]
    source_url: str
    content_hash: str
    retrieved_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ChangeEvent:
    event_type: str
    entity_type: str
    entity_id: str | None
    field_name: str | None
    old_value: Any
    new_value: Any
    source_url: str
    detected_at: datetime = field(default_factory=datetime.utcnow)


class BaseConnector(ABC):
    source_name: str
    source_type: SourceType
    crawl_frequency: timedelta
    rate_limit_rpm: int = 60

    @abstractmethod
    async def fetch(self) -> list[RawDocument]:
        ...

    @abstractmethod
    async def parse(self, doc: RawDocument) -> list[NormalizedRecord]:
        ...

    @abstractmethod
    async def detect_changes(
        self,
        current: list[NormalizedRecord],
        previous: list[NormalizedRecord],
    ) -> list[ChangeEvent]:
        ...

    async def health_check(self) -> ConnectorStatus:
        try:
            docs = await self.fetch()
            return ConnectorStatus.HEALTHY if docs else ConnectorStatus.DEGRADED
        except Exception:
            return ConnectorStatus.DOWN
