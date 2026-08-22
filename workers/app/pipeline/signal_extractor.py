from __future__ import annotations
import json
import logging
import uuid
from datetime import datetime
from typing import Any

from app.connectors.base import ChangeEvent

logger = logging.getLogger(__name__)

SIGNAL_TYPES = {
    "new_license",
    "license_revoked",
    "license_suspended",
    "license_renewed",
    "license_condition_change",
    "new_market_entry",
    "market_exit",
    "provider_change",
    "new_product_launch",
    "partnership",
    "acquisition",
    "funding",
    "ipo",
    "hiring_surge",
    "key_hire",
    "layoffs",
    "executive_change",
    "rfp_issued",
    "technology_migration",
    "regulatory_action",
    "compliance_issue",
    "expansion",
    "soft_launch",
    "platform_pain",
    "platform_migration",
    "payments_need",
}

LICENSE_STATUS_SIGNALS = {
    "active": "new_license",
    "granted": "new_license",
    "issued": "new_license",
    "revoked": "license_revoked",
    "surrendered": "license_revoked",
    "suspended": "license_suspended",
    "renewed": "license_renewed",
}

HIRING_KEYWORDS = [
    "head of", "vp of", "director of", "chief", "cto", "cpo", "cmo",
    "platform", "integration", "payments", "compliance", "regulatory",
]

SIGNAL_WEIGHTS = {
    "new_license": 0.9,
    "license_revoked": 0.7,
    "license_suspended": 0.6,
    "license_renewed": 0.3,
    "license_condition_change": 0.5,
    "new_market_entry": 0.85,
    "market_exit": 0.4,
    "provider_change": 0.95,
    "new_product_launch": 0.7,
    "partnership": 0.6,
    "acquisition": 0.8,
    "funding": 0.75,
    "ipo": 0.5,
    "hiring_surge": 0.7,
    "key_hire": 0.65,
    "layoffs": 0.3,
    "executive_change": 0.5,
    "rfp_issued": 1.0,
    "technology_migration": 0.9,
    "regulatory_action": 0.6,
    "compliance_issue": 0.55,
    "expansion": 0.8,
    "soft_launch": 0.85,
    "platform_pain": 0.9,
    "platform_migration": 0.95,
    "payments_need": 0.8,
}


def extract_signals_from_change(change: ChangeEvent) -> list[dict[str, Any]]:
    signals: list[dict[str, Any]] = []

    if change.entity_type in ("ukgc_business", "gcgra_licensee"):
        signals.extend(_extract_license_signals(change))

    if change.entity_type == "news_article":
        signals.extend(_extract_news_signals(change))

    if change.entity_type == "ct_certificate":
        signals.extend(_extract_ct_signals(change))

    if change.entity_type in ("casino_reputation", "casino_complaint"):
        signals.extend(_extract_complaint_signals(change))

    return signals


def _extract_license_signals(change: ChangeEvent) -> list[dict[str, Any]]:
    signals: list[dict[str, Any]] = []

    if change.event_type == "new":
        signals.append(_make_signal(
            signal_type="new_license",
            title=f"New licensee detected: {change.entity_id}",
            description=f"A new entity appeared in the {change.entity_type} register.",
            confidence=0.95,
            evidence_type="fact",
            source_url=change.source_url,
            entity_name=change.entity_id or "",
            metadata=change.new_value if isinstance(change.new_value, dict) else {},
        ))
        return signals

    if change.event_type == "removed":
        signals.append(_make_signal(
            signal_type="license_revoked",
            title=f"Licensee removed from register: {change.entity_id}",
            description=f"Entity no longer appears in the {change.entity_type} register.",
            confidence=0.85,
            evidence_type="fact",
            source_url=change.source_url,
            entity_name=change.entity_id or "",
        ))
        return signals

    if change.event_type == "modified" and change.field_name == "status":
        old_status = str(change.old_value).lower().strip()
        new_status = str(change.new_value).lower().strip()

        signal_type = LICENSE_STATUS_SIGNALS.get(new_status, "license_condition_change")
        signals.append(_make_signal(
            signal_type=signal_type,
            title=f"License status change: {change.entity_id} ({old_status} → {new_status})",
            description=f"License status changed from '{old_status}' to '{new_status}'.",
            confidence=0.95,
            evidence_type="fact",
            source_url=change.source_url,
            entity_name=change.entity_id or "",
        ))

    if change.event_type == "modified" and change.field_name in ("name", "address"):
        signals.append(_make_signal(
            signal_type="expansion",
            title=f"Company details changed: {change.entity_id}",
            description=f"Field '{change.field_name}' changed from '{change.old_value}' to '{change.new_value}'.",
            confidence=0.5,
            evidence_type="inference",
            source_url=change.source_url,
            entity_name=change.entity_id or "",
        ))

    return signals


def _extract_news_signals(change: ChangeEvent) -> list[dict[str, Any]]:
    if change.event_type != "new":
        return []

    data = change.new_value if isinstance(change.new_value, dict) else {}
    title = data.get("title", "")
    summary = data.get("summary", "")
    text = f"{title} {summary}".lower()

    signals: list[dict[str, Any]] = []

    if any(kw in text for kw in ["new license", "granted license", "receives license", "approved for"]):
        signals.append(_make_signal(
            signal_type="new_license",
            title=f"License news: {title[:80]}",
            description=summary[:300],
            confidence=0.7,
            evidence_type="inference",
            source_url=data.get("url", change.source_url),
            entity_name="",
        ))

    if any(kw in text for kw in ["launches in", "enters market", "expands into", "goes live in", "market entry"]):
        signals.append(_make_signal(
            signal_type="new_market_entry",
            title=f"Market entry: {title[:80]}",
            description=summary[:300],
            confidence=0.65,
            evidence_type="inference",
            source_url=data.get("url", change.source_url),
            entity_name="",
        ))

    if any(kw in text for kw in ["switches provider", "replaces platform", "migrates to", "new platform deal"]):
        signals.append(_make_signal(
            signal_type="provider_change",
            title=f"Provider change: {title[:80]}",
            description=summary[:300],
            confidence=0.6,
            evidence_type="inference",
            source_url=data.get("url", change.source_url),
            entity_name="",
        ))

    if any(kw in text for kw in ["raises", "funding round", "series a", "series b", "series c", "investment"]):
        signals.append(_make_signal(
            signal_type="funding",
            title=f"Funding: {title[:80]}",
            description=summary[:300],
            confidence=0.7,
            evidence_type="inference",
            source_url=data.get("url", change.source_url),
            entity_name="",
        ))

    if any(kw in text for kw in ["acquires", "acquisition", "buys", "takes over", "merger"]):
        signals.append(_make_signal(
            signal_type="acquisition",
            title=f"M&A: {title[:80]}",
            description=summary[:300],
            confidence=0.7,
            evidence_type="inference",
            source_url=data.get("url", change.source_url),
            entity_name="",
        ))

    if any(kw in text for kw in ["partnership", "partners with", "integrates with", "deal with", "agreement"]):
        signals.append(_make_signal(
            signal_type="partnership",
            title=f"Partnership: {title[:80]}",
            description=summary[:300],
            confidence=0.6,
            evidence_type="inference",
            source_url=data.get("url", change.source_url),
            entity_name="",
        ))

    if any(kw in text for kw in ["appoints", "hires", "names new", "joins as"]):
        is_key = any(kw in text for kw in HIRING_KEYWORDS)
        signals.append(_make_signal(
            signal_type="key_hire" if is_key else "executive_change",
            title=f"Hire: {title[:80]}",
            description=summary[:300],
            confidence=0.7,
            evidence_type="inference",
            source_url=data.get("url", change.source_url),
            entity_name="",
        ))

    if any(kw in text for kw in ["rfp", "request for proposal", "tender", "seeking provider"]):
        signals.append(_make_signal(
            signal_type="rfp_issued",
            title=f"RFP: {title[:80]}",
            description=summary[:300],
            confidence=0.75,
            evidence_type="inference",
            source_url=data.get("url", change.source_url),
            entity_name="",
        ))

    if not signals:
        signals.append(_make_signal(
            signal_type="expansion",
            title=f"Industry news: {title[:80]}",
            description=summary[:300],
            confidence=0.4,
            evidence_type="inference",
            source_url=data.get("url", change.source_url),
            entity_name="",
        ))

    return signals


PAYMENT_COMPLAINT_KEYWORDS = [
    "payment", "withdrawal", "payout", "deposit", "cashout",
    "bank", "wire", "e-wallet", "crypto",
]

PLATFORM_COMPLAINT_KEYWORDS = [
    "software", "bug", "crash", "glitch", "error", "loading",
    "platform", "technical", "game", "frozen", "slow",
]


def _extract_ct_signals(change: ChangeEvent) -> list[dict[str, Any]]:
    if change.event_type != "new":
        return []

    data = change.new_value if isinstance(change.new_value, dict) else {}
    domain = data.get("domain", change.entity_id or "")

    return [_make_signal(
        signal_type="soft_launch",
        title=f"New gambling domain detected: {domain}",
        description=f"TLS certificate issued for {domain} — possible soft launch or new brand.",
        confidence=0.6,
        evidence_type="inference",
        source_url=change.source_url or "",
        entity_name=domain,
        metadata=data,
    )]


def _extract_complaint_signals(change: ChangeEvent) -> list[dict[str, Any]]:
    signals: list[dict[str, Any]] = []
    data = change.new_value if isinstance(change.new_value, dict) else {}
    casino_name = data.get("casino_name", change.entity_id or "")

    if change.entity_type == "casino_reputation" and change.event_type == "modified":
        signals.append(_make_signal(
            signal_type="platform_pain",
            title=f"Reputation change: {casino_name}",
            description=f"Rating/safety index changed for {casino_name} — may indicate platform or service issues.",
            confidence=0.65,
            evidence_type="inference",
            source_url=change.source_url or "",
            entity_name=casino_name,
            metadata=data,
        ))
        return signals

    if change.entity_type == "casino_complaint" and change.event_type == "new":
        category = data.get("category", "").lower()
        title = data.get("title", "").lower()
        text = f"{category} {title}"

        if any(kw in text for kw in PAYMENT_COMPLAINT_KEYWORDS):
            signals.append(_make_signal(
                signal_type="payments_need",
                title=f"Payment complaint: {casino_name}",
                description=f"Payment-related complaint filed against {casino_name}.",
                confidence=0.7,
                evidence_type="inference",
                source_url=change.source_url or "",
                entity_name=casino_name,
                metadata=data,
            ))

        if any(kw in text for kw in PLATFORM_COMPLAINT_KEYWORDS):
            signals.append(_make_signal(
                signal_type="platform_migration",
                title=f"Platform complaint: {casino_name}",
                description=f"Technical/platform complaint filed against {casino_name} — may be open to migration.",
                confidence=0.6,
                evidence_type="inference",
                source_url=change.source_url or "",
                entity_name=casino_name,
                metadata=data,
            ))

        if not signals:
            signals.append(_make_signal(
                signal_type="platform_pain",
                title=f"Complaint filed: {casino_name}",
                description=f"New complaint against {casino_name}: {data.get('title', '')}",
                confidence=0.5,
                evidence_type="inference",
                source_url=change.source_url or "",
                entity_name=casino_name,
                metadata=data,
            ))

    return signals


def _make_signal(
    signal_type: str,
    title: str,
    description: str,
    confidence: float,
    evidence_type: str,
    source_url: str,
    entity_name: str,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "signal_type": signal_type,
        "title": title,
        "description": description,
        "confidence": confidence,
        "evidence_type": evidence_type,
        "source_url": source_url,
        "entity_name": entity_name,
        "weight": SIGNAL_WEIGHTS.get(signal_type, 0.5),
        "detected_at": datetime.utcnow().isoformat(),
        "metadata": metadata or {},
    }


async def enrich_signal_with_llm(
    signal: dict[str, Any],
    llm_client: Any = None,
) -> dict[str, Any]:
    """Use LLM to extract structured entities and refine signal classification.

    This is the 'mid-tier' LLM call — used only when rule-based extraction
    needs reinforcement (e.g., entity name extraction from news headlines).
    """
    if llm_client is None:
        return signal

    prompt = f"""Analyze this iGaming industry signal and extract structured information.

Signal type: {signal['signal_type']}
Title: {signal['title']}
Description: {signal['description']}
Source: {signal['source_url']}

Extract:
1. company_names: List of company names mentioned
2. refined_signal_type: One of {list(SIGNAL_TYPES)}
3. jurisdictions: List of jurisdictions/markets mentioned
4. confidence_adjustment: float between -0.3 and +0.3 to adjust confidence
5. sales_relevance: Brief note on why this matters for B2B sales

Respond in JSON only."""

    try:
        from litellm import acompletion
        response = await acompletion(
            model="claude-haiku-4-5-20251001",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=500,
        )
        enrichment = json.loads(response.choices[0].message.content)

        if "company_names" in enrichment:
            signal["entity_names"] = enrichment["company_names"]
        if "refined_signal_type" in enrichment and enrichment["refined_signal_type"] in SIGNAL_TYPES:
            signal["signal_type"] = enrichment["refined_signal_type"]
        if "jurisdictions" in enrichment:
            signal["jurisdictions"] = enrichment["jurisdictions"]
        if "confidence_adjustment" in enrichment:
            adj = float(enrichment["confidence_adjustment"])
            signal["confidence"] = max(0.1, min(1.0, signal["confidence"] + adj))
        if "sales_relevance" in enrichment:
            signal["sales_relevance"] = enrichment["sales_relevance"]

    except Exception as e:
        logger.warning("LLM enrichment failed for signal %s: %s", signal["id"], e)

    return signal
