from app.pipeline.change_detector import (
    ChangeEvent,
    FieldChange,
    content_hash,
    detect_changes,
    detect_field_changes,
)


def test_content_hash_deterministic():
    data = {"name": "Bet365", "status": "active"}
    assert content_hash(data) == content_hash(data)


def test_content_hash_key_order_independent():
    h1 = content_hash({"a": 1, "b": 2})
    h2 = content_hash({"b": 2, "a": 1})
    assert h1 == h2


def test_detect_field_changes_finds_modification():
    old = {"name": "Acme Corp", "status": "active", "address": "123 Main St"}
    new = {"name": "Acme Corp", "status": "suspended", "address": "123 Main St"}
    changes = detect_field_changes(old, new)
    assert len(changes) == 1
    assert changes[0].field_name == "status"
    assert changes[0].old_value == "active"
    assert changes[0].new_value == "suspended"


def test_detect_field_changes_case_insensitive():
    old = {"name": "Bet365"}
    new = {"name": "bet365"}
    changes = detect_field_changes(old, new)
    assert len(changes) == 0


def test_detect_field_changes_ignores_default_fields():
    old = {"name": "Acme", "retrieved_at": "2024-01-01"}
    new = {"name": "Acme", "retrieved_at": "2024-01-02"}
    changes = detect_field_changes(old, new)
    assert len(changes) == 0


def test_detect_changes_new_entity():
    current = {"acc1": {"name": "New Corp", "status": "active"}}
    previous: dict = {}
    events = detect_changes(current, previous, "business")
    assert len(events) == 1
    assert events[0].event_type == "new"
    assert events[0].entity_key == "acc1"


def test_detect_changes_removed_entity():
    current: dict = {}
    previous = {"acc1": {"name": "Old Corp", "status": "active"}}
    events = detect_changes(current, previous, "business")
    assert len(events) == 1
    assert events[0].event_type == "removed"
    assert events[0].entity_key == "acc1"


def test_detect_changes_modified_entity():
    current = {"acc1": {"name": "Corp", "status": "suspended"}}
    previous = {"acc1": {"name": "Corp", "status": "active"}}
    events = detect_changes(current, previous, "business")
    assert len(events) == 1
    assert events[0].event_type == "modified"
    assert len(events[0].changes) == 1
    assert events[0].changes[0].field_name == "status"


def test_detect_changes_no_changes():
    data = {"acc1": {"name": "Corp", "status": "active"}}
    events = detect_changes(data, data, "business")
    assert len(events) == 0


def test_detect_changes_mixed():
    current = {
        "acc1": {"name": "Existing", "status": "active"},
        "acc3": {"name": "New", "status": "active"},
    }
    previous = {
        "acc1": {"name": "Existing", "status": "active"},
        "acc2": {"name": "Removed", "status": "active"},
    }
    events = detect_changes(current, previous, "business")
    types = {e.event_type for e in events}
    assert "new" in types
    assert "removed" in types
    assert len(events) == 2
