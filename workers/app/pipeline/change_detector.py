from __future__ import annotations
import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class FieldChange:
    field_name: str
    old_value: Any
    new_value: Any


@dataclass
class ChangeEvent:
    event_type: str  # "new" | "modified" | "removed"
    entity_type: str  # "business" | "license" | "article" etc.
    entity_key: str
    changes: list[FieldChange] = field(default_factory=list)
    detected_at: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def summary(self) -> str:
        if self.event_type == "new":
            return f"New {self.entity_type}: {self.entity_key}"
        if self.event_type == "removed":
            return f"Removed {self.entity_type}: {self.entity_key}"
        changed_fields = ", ".join(c.field_name for c in self.changes)
        return f"Modified {self.entity_type} {self.entity_key}: {changed_fields}"


def content_hash(data: dict[str, Any]) -> str:
    normalized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(normalized.encode()).hexdigest()


def normalize_for_comparison(value: Any) -> Any:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip().lower()
    return value


def detect_field_changes(
    old_record: dict[str, Any],
    new_record: dict[str, Any],
    ignore_fields: set[str] | None = None,
) -> list[FieldChange]:
    ignore = ignore_fields or {"retrieved_at", "last_checked", "content_hash"}
    changes: list[FieldChange] = []
    all_keys = set(old_record.keys()) | set(new_record.keys())

    for key in all_keys:
        if key in ignore:
            continue
        old_val = normalize_for_comparison(old_record.get(key))
        new_val = normalize_for_comparison(new_record.get(key))
        if old_val != new_val:
            changes.append(FieldChange(
                field_name=key,
                old_value=old_record.get(key),
                new_value=new_record.get(key),
            ))
    return changes


def detect_changes(
    current_records: dict[str, dict[str, Any]],
    previous_records: dict[str, dict[str, Any]],
    entity_type: str,
    ignore_fields: set[str] | None = None,
) -> list[ChangeEvent]:
    """Compare two sets of records keyed by a unique identifier.

    Returns a list of ChangeEvents for new, modified, and removed records.
    """
    events: list[ChangeEvent] = []

    current_keys = set(current_records.keys())
    previous_keys = set(previous_records.keys())

    for key in current_keys - previous_keys:
        events.append(ChangeEvent(
            event_type="new",
            entity_type=entity_type,
            entity_key=key,
            metadata=current_records[key],
        ))

    for key in previous_keys - current_keys:
        events.append(ChangeEvent(
            event_type="removed",
            entity_type=entity_type,
            entity_key=key,
            metadata=previous_records[key],
        ))

    for key in current_keys & previous_keys:
        old_hash = content_hash(previous_records[key])
        new_hash = content_hash(current_records[key])
        if old_hash != new_hash:
            field_changes = detect_field_changes(
                previous_records[key],
                current_records[key],
                ignore_fields=ignore_fields,
            )
            if field_changes:
                events.append(ChangeEvent(
                    event_type="modified",
                    entity_type=entity_type,
                    entity_key=key,
                    changes=field_changes,
                    metadata=current_records[key],
                ))

    return events
