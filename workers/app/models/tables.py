from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    Integer,
    String,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    canonical_name: Mapped[str] = mapped_column(Text, nullable=False)
    legal_name: Mapped[Optional[str]] = mapped_column(Text)
    country: Mapped[Optional[str]] = mapped_column(Text)
    company_type: Mapped[Optional[str]] = mapped_column(Enum("operator", "vendor", "studio", "affiliate", "regulator", "other", name="company_type", create_type=False), default="other")
    employee_count: Mapped[Optional[int]] = mapped_column(Integer)
    website_url: Mapped[Optional[str]] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text)
    parent_company_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    logo_url: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_companies_name", "canonical_name"),
        Index("idx_companies_country", "country"),
        Index("idx_companies_type", "company_type"),
    )


class CompanyAlias(Base):
    __tablename__ = "company_aliases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    alias_name: Mapped[str] = mapped_column(Text, nullable=False)
    alias_type: Mapped[Optional[str]] = mapped_column(Enum("legal", "brand", "trading", "abbreviation", name="alias_type", create_type=False), default="trading")
    source: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_aliases_company", "company_id"),
        Index("idx_aliases_name", "alias_name"),
    )


class Domain(Base):
    __tablename__ = "domains"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    domain_name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    domain_type: Mapped[Optional[str]] = mapped_column(Enum("primary", "brand", "corporate", name="domain_type", create_type=False), default="primary")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class License(Base):
    __tablename__ = "licenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    license_number: Mapped[Optional[str]] = mapped_column(Text)
    jurisdiction: Mapped[str] = mapped_column(Text, nullable=False)
    regulator: Mapped[str] = mapped_column(Text, nullable=False)
    license_type: Mapped[Optional[str]] = mapped_column(Text)
    license_status: Mapped[Optional[str]] = mapped_column(Enum("active", "pending", "conditional", "approved", "suspended", "revoked", "expired", "surrendered", "lapsed", "forfeited", name="license_status", create_type=False), default="active")
    legal_entity_name: Mapped[Optional[str]] = mapped_column(Text)
    approved_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    effective_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    expiry_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    official_url: Mapped[Optional[str]] = mapped_column(Text)
    source_document_url: Mapped[Optional[str]] = mapped_column(Text)
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    raw_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_licenses_company", "company_id"),
        Index("idx_licenses_jurisdiction", "jurisdiction"),
        Index("idx_licenses_status", "license_status"),
    )


class Signal(Base):
    __tablename__ = "signals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    signal_type: Mapped[str] = mapped_column(Enum("new_license", "license_approval", "license_change", "license_suspension", "market_expansion", "new_casino", "new_sportsbook", "new_brand", "platform_launch", "funding", "acquisition", "hiring_surge", "engineering_hiring", "payments_hiring", "devops_hiring", "provider_change", "technology_partner_search", "rfp", "game_studio_launch", "regulatory_change", "new_product", "new_tech_partner", "soft_launch", "platform_pain", "platform_migration", "payments_need", name="signal_type", create_type=False), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    evidence_confidence: Mapped[Optional[int]] = mapped_column(Integer, default=50)
    sales_intent: Mapped[Optional[int]] = mapped_column(Integer, default=50)
    detected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    raw_evidence: Mapped[Optional[str]] = mapped_column(Text)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    content_hash: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_signals_company", "company_id"),
        Index("idx_signals_type", "signal_type"),
        Index("idx_signals_detected", "detected_at"),
        Index("idx_signals_hash", "content_hash"),
    )


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    source_type: Mapped[str] = mapped_column(Enum("regulator", "news", "company", "jobs", "funding", "search", name="source_type", create_type=False), nullable=False)
    base_url: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    crawl_frequency_minutes: Mapped[Optional[int]] = mapped_column(Integer, default=720)
    rate_limit_rpm: Mapped[Optional[int]] = mapped_column(Integer, default=60)
    last_crawled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_success_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    error_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    config: Mapped[Optional[dict]] = mapped_column(JSONB)
    terms_url: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (Index("idx_sources_type", "source_type"),)


class SourceDocument(Base):
    __tablename__ = "source_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[Optional[str]] = mapped_column(Text)
    raw_html: Mapped[Optional[str]] = mapped_column(Text)
    raw_text: Mapped[Optional[str]] = mapped_column(Text)
    document_type: Mapped[Optional[str]] = mapped_column(Text)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    last_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class CrawlRun(Base):
    __tablename__ = "crawl_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(Enum("pending", "running", "completed", "failed", name="crawl_status", create_type=False), default="pending", nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    documents_processed: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    new_records: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    changed_records: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    errors: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    log: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_crawl_runs_source", "source_id"),
        Index("idx_crawl_runs_status", "status"),
    )


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("sources.id"))
    title: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    publisher: Mapped[Optional[str]] = mapped_column(Text)
    author: Mapped[Optional[str]] = mapped_column(Text)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    content: Mapped[Optional[str]] = mapped_column(Text)
    excerpt: Mapped[Optional[str]] = mapped_column(Text)
    entities: Mapped[Optional[dict]] = mapped_column(JSONB)
    topics: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    content_hash: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    intent_score: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    scalara_fit: Mapped[Optional[float]] = mapped_column(Float, default=0)
    evidence_confidence: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    opportunity_score: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    recommendation: Mapped[Optional[str]] = mapped_column(Enum("pursue", "qualify", "monitor", name="recommendation", create_type=False), default="monitor")
    status: Mapped[str] = mapped_column(Enum("new", "review", "qualified", "contacted", "replied", "meeting", "proposal", "won", "lost", "dismissed", "watch", name="opportunity_status", create_type=False), default="new", nullable=False)
    assigned_to: Mapped[Optional[str]] = mapped_column(Text)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    why_now: Mapped[Optional[str]] = mapped_column(Text)
    potential_needs: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    risks: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    recommended_approach: Mapped[Optional[str]] = mapped_column(Text)
    outreach_angle: Mapped[Optional[str]] = mapped_column(Text)
    score_explanation: Mapped[Optional[dict]] = mapped_column(JSONB)
    last_scored_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_opp_company", "company_id"),
        Index("idx_opp_score", "opportunity_score"),
        Index("idx_opp_status", "status"),
        Index("idx_opp_recommendation", "recommendation"),
    )


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(Text)
    email: Mapped[Optional[str]] = mapped_column(Text)
    linkedin_url: Mapped[Optional[str]] = mapped_column(Text)
    source: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[Optional[int]] = mapped_column(Integer, default=50)
    is_decision_maker: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
