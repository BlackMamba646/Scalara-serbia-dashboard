from __future__ import annotations
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

SCALARA_CAPABILITIES = {
    "services": [
        "platform_development",
        "game_integration",
        "payment_solutions",
        "regulatory_compliance",
        "player_management",
        "analytics",
        "marketing_tools",
        "responsible_gambling",
    ],
    "markets": [
        "gb", "us", "ca", "ae", "eu", "latam", "africa", "asia",
    ],
    "verticals": [
        "casino", "sportsbook", "lottery", "bingo", "poker", "fantasy_sports",
    ],
    "strengths": [
        "b2b_platform", "turnkey_solutions", "multi_jurisdiction",
        "custom_development", "igaming_expertise",
    ],
}

SIGNAL_TYPE_INTENT = {
    "rfp_issued": 1.0,
    "provider_change": 0.95,
    "technology_migration": 0.90,
    "new_market_entry": 0.85,
    "new_license": 0.80,
    "expansion": 0.75,
    "funding": 0.70,
    "new_product_launch": 0.65,
    "hiring_surge": 0.60,
    "key_hire": 0.55,
    "partnership": 0.50,
    "acquisition": 0.45,
    "executive_change": 0.40,
    "license_renewed": 0.30,
    "compliance_issue": 0.25,
    "license_condition_change": 0.20,
    "regulatory_action": 0.15,
    "ipo": 0.35,
    "license_suspended": 0.10,
    "license_revoked": 0.05,
    "market_exit": 0.05,
    "layoffs": 0.05,
}

RECENCY_HALF_LIFE_DAYS = 14


@dataclass
class ScoreBreakdown:
    intent_score: float
    fit_score: float
    evidence_confidence: float
    combined_score: float
    recommendation: str
    reasoning: list[str]
    signal_contributions: list[dict[str, Any]] = field(default_factory=list)


def recency_decay(detected_at: datetime, now: datetime | None = None) -> float:
    now = now or datetime.utcnow()
    age_days = (now - detected_at).total_seconds() / 86400
    if age_days <= 0:
        return 1.0
    return math.exp(-0.693 * age_days / RECENCY_HALF_LIFE_DAYS)


def compute_intent_score(signals: list[dict[str, Any]]) -> tuple[float, list[dict[str, Any]]]:
    if not signals:
        return 0.0, []

    contributions: list[dict[str, Any]] = []
    weighted_sum = 0.0
    total_weight = 0.0

    for signal in signals:
        signal_type = signal.get("signal_type", "")
        base_intent = SIGNAL_TYPE_INTENT.get(signal_type, 0.3)
        confidence = signal.get("confidence", 0.5)
        weight = signal.get("weight", 0.5)

        detected_str = signal.get("detected_at", "")
        if isinstance(detected_str, str) and detected_str:
            try:
                detected = datetime.fromisoformat(detected_str)
                decay = recency_decay(detected)
            except ValueError:
                decay = 0.5
        else:
            decay = 0.5

        contribution = base_intent * confidence * decay
        weighted_sum += contribution * weight
        total_weight += weight

        contributions.append({
            "signal_type": signal_type,
            "title": signal.get("title", "")[:60],
            "base_intent": round(base_intent, 2),
            "confidence": round(confidence, 2),
            "decay": round(decay, 2),
            "contribution": round(contribution, 3),
        })

    score = weighted_sum / total_weight if total_weight > 0 else 0.0
    return min(1.0, score), contributions


def compute_fit_score(
    company: dict[str, Any],
    capabilities: dict[str, Any] | None = None,
) -> tuple[float, list[str]]:
    caps = capabilities or SCALARA_CAPABILITIES
    reasons: list[str] = []
    score = 0.0
    factors = 0

    verticals = company.get("verticals", [])
    if verticals:
        overlap = set(v.lower() for v in verticals) & set(caps["verticals"])
        if overlap:
            score += 1.0
            reasons.append(f"Vertical match: {', '.join(overlap)}")
        else:
            score += 0.2
            reasons.append("No vertical overlap")
        factors += 1

    markets = company.get("markets", company.get("jurisdictions", []))
    if markets:
        overlap = set(m.lower() for m in markets) & set(caps["markets"])
        if overlap:
            score += 1.0
            reasons.append(f"Market overlap: {', '.join(overlap)}")
        else:
            score += 0.3
            reasons.append("New market — expansion opportunity")
        factors += 1

    company_size = company.get("employee_count", 0)
    if company_size:
        if 10 <= company_size <= 500:
            score += 1.0
            reasons.append(f"Ideal company size ({company_size} employees)")
        elif company_size > 500:
            score += 0.7
            reasons.append(f"Large company ({company_size} employees) — enterprise deal")
        else:
            score += 0.4
            reasons.append(f"Small company ({company_size} employees)")
        factors += 1

    tech_stack = company.get("technologies", [])
    if tech_stack:
        needs_platform = not any(
            t.lower() in ("proprietary", "custom", "in-house")
            for t in tech_stack
        )
        if needs_platform:
            score += 0.8
            reasons.append("Uses third-party tech — potential platform client")
        else:
            score += 0.3
            reasons.append("Has proprietary platform — harder sell")
        factors += 1

    company_type = company.get("company_type", "").lower()
    if company_type:
        if company_type == "operator":
            score += 1.0
            reasons.append("Operator — primary target")
        else:
            score += 0.2
            reasons.append(f"Company type: {company_type}")
        factors += 1

    if factors == 0:
        return 0.5, ["Insufficient data for fit scoring"]

    return min(1.0, score / factors), reasons


def compute_evidence_confidence(signals: list[dict[str, Any]]) -> float:
    if not signals:
        return 0.0

    primary_count = sum(
        1 for s in signals if s.get("evidence_type") == "fact"
    )
    total = len(signals)

    base = sum(s.get("confidence", 0.5) for s in signals) / total
    primary_bonus = min(0.2, primary_count * 0.1)

    return min(1.0, base + primary_bonus)


def score_opportunity(
    signals: list[dict[str, Any]],
    company: dict[str, Any],
    capabilities: dict[str, Any] | None = None,
) -> ScoreBreakdown:
    intent_score, contributions = compute_intent_score(signals)
    fit_score, fit_reasons = compute_fit_score(company, capabilities)
    evidence_confidence = compute_evidence_confidence(signals)

    combined = (intent_score * 0.5) + (fit_score * 0.3) + (evidence_confidence * 0.2)

    if combined >= 0.7:
        recommendation = "pursue"
    elif combined >= 0.4:
        recommendation = "qualify"
    else:
        recommendation = "monitor"

    reasoning = []
    if intent_score >= 0.7:
        reasoning.append(f"Strong buying signals detected (intent: {intent_score:.0%})")
    elif intent_score >= 0.4:
        reasoning.append(f"Moderate buying signals (intent: {intent_score:.0%})")
    else:
        reasoning.append(f"Weak buying signals (intent: {intent_score:.0%})")

    reasoning.extend(fit_reasons)

    if evidence_confidence >= 0.8:
        reasoning.append("High-confidence evidence from primary sources")
    elif evidence_confidence >= 0.5:
        reasoning.append("Mixed evidence — verify key claims")
    else:
        reasoning.append("Low-confidence evidence — needs verification")

    return ScoreBreakdown(
        intent_score=round(intent_score, 3),
        fit_score=round(fit_score, 3),
        evidence_confidence=round(evidence_confidence, 3),
        combined_score=round(combined, 3),
        recommendation=recommendation,
        reasoning=reasoning,
        signal_contributions=contributions,
    )
