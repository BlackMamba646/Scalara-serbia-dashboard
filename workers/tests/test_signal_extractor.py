from app.connectors.base import ChangeEvent
from app.pipeline.signal_extractor import extract_signals_from_change


def test_new_license_from_regulator():
    change = ChangeEvent(
        event_type="new",
        entity_type="ukgc_business",
        entity_id="12345",
        field_name=None,
        old_value=None,
        new_value={"name": "NewCo", "status": "Active"},
        source_url="https://gamblingcommission.gov.uk",
    )
    signals = extract_signals_from_change(change)
    assert len(signals) == 1
    assert signals[0]["signal_type"] == "new_license"
    assert signals[0]["confidence"] == 0.95
    assert signals[0]["evidence_type"] == "fact"


def test_license_revoked():
    change = ChangeEvent(
        event_type="removed",
        entity_type="ukgc_business",
        entity_id="67890",
        field_name=None,
        old_value={"name": "OldCo"},
        new_value=None,
        source_url="https://gamblingcommission.gov.uk",
    )
    signals = extract_signals_from_change(change)
    assert len(signals) == 1
    assert signals[0]["signal_type"] == "license_revoked"


def test_license_status_change():
    change = ChangeEvent(
        event_type="modified",
        entity_type="ukgc_business",
        entity_id="11111",
        field_name="status",
        old_value="Active",
        new_value="Suspended",
        source_url="https://gamblingcommission.gov.uk",
    )
    signals = extract_signals_from_change(change)
    assert len(signals) == 1
    assert signals[0]["signal_type"] == "license_suspended"


def test_news_funding_signal():
    change = ChangeEvent(
        event_type="new",
        entity_type="news_article",
        entity_id=None,
        field_name=None,
        old_value=None,
        new_value={
            "title": "SuperBet raises $175M in Series B funding round",
            "summary": "Romanian-based SuperBet has raised $175 million in a Series B funding round led by Blackstone.",
            "url": "https://igamingbusiness.com/superbet-funding",
        },
        source_url="https://igamingbusiness.com/superbet-funding",
    )
    signals = extract_signals_from_change(change)
    types = [s["signal_type"] for s in signals]
    assert "funding" in types


def test_news_market_entry():
    change = ChangeEvent(
        event_type="new",
        entity_type="news_article",
        entity_id=None,
        field_name=None,
        old_value=None,
        new_value={
            "title": "BetMGM launches in Ontario, enters Canadian market",
            "summary": "BetMGM goes live in Ontario as it enters the regulated Canadian market.",
            "url": "https://sbcnews.co.uk/betmgm-ontario",
        },
        source_url="https://sbcnews.co.uk/betmgm-ontario",
    )
    signals = extract_signals_from_change(change)
    types = [s["signal_type"] for s in signals]
    assert "new_market_entry" in types


def test_news_provider_change():
    change = ChangeEvent(
        event_type="new",
        entity_type="news_article",
        entity_id=None,
        field_name=None,
        old_value=None,
        new_value={
            "title": "Betway switches provider from Microgaming to Evolution",
            "summary": "Betway migrates to Evolution's platform replacing their Microgaming backend.",
            "url": "https://gamingintelligence.com/betway-provider",
        },
        source_url="https://gamingintelligence.com/betway-provider",
    )
    signals = extract_signals_from_change(change)
    types = [s["signal_type"] for s in signals]
    assert "provider_change" in types


def test_news_generic_falls_back_to_expansion():
    change = ChangeEvent(
        event_type="new",
        entity_type="news_article",
        entity_id=None,
        field_name=None,
        old_value=None,
        new_value={
            "title": "iGaming industry revenue grows 15% year over year",
            "summary": "The global iGaming industry continues to see growth.",
            "url": "https://example.com/growth",
        },
        source_url="https://example.com/growth",
    )
    signals = extract_signals_from_change(change)
    assert len(signals) == 1
    assert signals[0]["signal_type"] == "expansion"
    assert signals[0]["confidence"] == 0.4
