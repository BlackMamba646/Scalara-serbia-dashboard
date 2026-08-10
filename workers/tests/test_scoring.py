from datetime import datetime, timedelta

from app.pipeline.scoring import (
    ScoreBreakdown,
    compute_evidence_confidence,
    compute_fit_score,
    compute_intent_score,
    recency_decay,
    score_opportunity,
)


def test_recency_decay_recent():
    now = datetime(2024, 6, 1)
    detected = datetime(2024, 6, 1)
    assert recency_decay(detected, now) == 1.0


def test_recency_decay_one_half_life():
    now = datetime(2024, 6, 15)
    detected = datetime(2024, 6, 1)
    decay = recency_decay(detected, now)
    assert 0.45 < decay < 0.55


def test_recency_decay_old():
    now = datetime(2024, 7, 1)
    detected = datetime(2024, 5, 1)
    decay = recency_decay(detected, now)
    assert decay < 0.1


def test_intent_score_rfp():
    now = datetime.utcnow()
    signals = [
        {
            "signal_type": "rfp_issued",
            "confidence": 0.9,
            "weight": 1.0,
            "detected_at": now.isoformat(),
        }
    ]
    score, contributions = compute_intent_score(signals)
    assert score > 0.8


def test_intent_score_empty():
    score, contributions = compute_intent_score([])
    assert score == 0.0
    assert contributions == []


def test_fit_score_ideal_operator():
    company = {
        "verticals": ["casino", "sportsbook"],
        "markets": ["gb", "us"],
        "employee_count": 100,
        "company_type": "operator",
    }
    score, reasons = compute_fit_score(company)
    assert score > 0.7
    assert any("Vertical match" in r for r in reasons)


def test_fit_score_no_data():
    score, reasons = compute_fit_score({})
    assert score == 0.5
    assert "Insufficient data" in reasons[0]


def test_evidence_confidence_all_facts():
    signals = [
        {"evidence_type": "fact", "confidence": 0.95},
        {"evidence_type": "fact", "confidence": 0.90},
    ]
    conf = compute_evidence_confidence(signals)
    assert conf > 0.9


def test_evidence_confidence_all_inference():
    signals = [
        {"evidence_type": "inference", "confidence": 0.5},
        {"evidence_type": "inference", "confidence": 0.6},
    ]
    conf = compute_evidence_confidence(signals)
    assert conf < 0.7


def test_score_opportunity_pursue():
    now = datetime.utcnow()
    signals = [
        {
            "signal_type": "rfp_issued",
            "confidence": 0.9,
            "weight": 1.0,
            "evidence_type": "fact",
            "detected_at": now.isoformat(),
        },
        {
            "signal_type": "new_license",
            "confidence": 0.95,
            "weight": 0.9,
            "evidence_type": "fact",
            "detected_at": now.isoformat(),
        },
    ]
    company = {
        "verticals": ["casino"],
        "markets": ["gb"],
        "employee_count": 150,
        "company_type": "operator",
    }
    result = score_opportunity(signals, company)
    assert isinstance(result, ScoreBreakdown)
    assert result.recommendation == "pursue"
    assert result.combined_score > 0.7
    assert len(result.reasoning) > 0
    assert len(result.signal_contributions) == 2


def test_score_opportunity_monitor():
    signals = [
        {
            "signal_type": "layoffs",
            "confidence": 0.4,
            "weight": 0.3,
            "evidence_type": "inference",
            "detected_at": (datetime.utcnow() - timedelta(days=60)).isoformat(),
        },
    ]
    company = {"company_type": "supplier"}
    result = score_opportunity(signals, company)
    assert result.recommendation == "monitor"
    assert result.combined_score < 0.4
