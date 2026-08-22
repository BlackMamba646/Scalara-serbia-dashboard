import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  real,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────

export const companyTypeEnum = pgEnum("company_type", [
  "operator",
  "vendor",
  "studio",
  "affiliate",
  "regulator",
  "other",
]);

export const aliasTypeEnum = pgEnum("alias_type", [
  "legal",
  "brand",
  "trading",
  "abbreviation",
]);

export const brandTypeEnum = pgEnum("brand_type", [
  "casino",
  "sportsbook",
  "poker",
  "bingo",
  "lottery",
  "other",
]);

export const domainTypeEnum = pgEnum("domain_type", [
  "primary",
  "brand",
  "corporate",
]);

export const licenseStatusEnum = pgEnum("license_status", [
  "active",
  "pending",
  "conditional",
  "approved",
  "suspended",
  "revoked",
  "expired",
  "surrendered",
  "lapsed",
  "forfeited",
]);

export const licenseEventTypeEnum = pgEnum("license_event_type", [
  "new",
  "approved",
  "modified",
  "suspended",
  "revoked",
  "expired",
  "renewed",
  "surrendered",
  "conditional",
]);

export const signalTypeEnum = pgEnum("signal_type", [
  "new_license",
  "license_approval",
  "license_change",
  "license_suspension",
  "market_expansion",
  "new_casino",
  "new_sportsbook",
  "new_brand",
  "platform_launch",
  "funding",
  "acquisition",
  "hiring_surge",
  "engineering_hiring",
  "payments_hiring",
  "devops_hiring",
  "provider_change",
  "technology_partner_search",
  "rfp",
  "game_studio_launch",
  "regulatory_change",
  "new_product",
  "new_tech_partner",
  "soft_launch",
  "platform_pain",
  "platform_migration",
  "payments_need",
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "regulator",
  "news",
  "company",
  "jobs",
  "funding",
  "search",
]);

export const evidenceTypeEnum = pgEnum("evidence_type", [
  "primary",
  "secondary",
  "company",
  "inference",
]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "new",
  "review",
  "qualified",
  "contacted",
  "replied",
  "meeting",
  "proposal",
  "won",
  "lost",
  "dismissed",
  "watch",
]);

export const recommendationEnum = pgEnum("recommendation", [
  "pursue",
  "qualify",
  "monitor",
]);

export const crawlStatusEnum = pgEnum("crawl_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const outreachChannelEnum = pgEnum("outreach_channel", [
  "email",
  "linkedin",
  "call",
]);

export const outreachStatusEnum = pgEnum("outreach_status", [
  "draft",
  "ready",
  "sent",
  "replied",
  "bounced",
]);

export const feedbackTypeEnum = pgEnum("feedback_type", [
  "good_lead",
  "bad_lead",
  "incorrect_data",
  "already_customer",
  "competitor",
]);

export const roleCategoryEnum = pgEnum("role_category", [
  "backend",
  "frontend",
  "fullstack",
  "devops",
  "platform",
  "payments",
  "security",
  "data",
  "game_dev",
  "qa",
  "mobile",
  "management",
  "product",
  "other",
]);

export const techCategoryEnum = pgEnum("tech_category", [
  "platform",
  "pam",
  "aggregator",
  "payments",
  "kyc",
  "fraud",
  "crm",
  "cloud",
  "sportsbook",
  "casino",
  "affiliate",
  "other",
]);

export const fundingRoundEnum = pgEnum("funding_round", [
  "pre_seed",
  "seed",
  "series_a",
  "series_b",
  "series_c",
  "growth",
  "strategic",
  "acquisition",
  "ipo",
  "other",
]);

// ─── CRM Enums ──────────────────────────────────────────

export const lifecycleStageEnum = pgEnum("lifecycle_stage", [
  "lead",
  "prospect",
  "qualified",
  "customer",
  "churned",
  "partner",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "note",
  "email",
  "call",
  "meeting",
  "task",
  "document",
  "signal",
  "status_change",
  "proposal",
  "follow_up",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "completed",
  "cancelled",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "nda",
  "proposal",
  "contract",
  "commercial",
  "presentation",
  "meeting",
  "legal",
  "other",
]);

export const ndaStatusEnum = pgEnum("nda_status", [
  "draft",
  "sent",
  "under_review",
  "signed",
  "expired",
]);

// ─── Companies ───────────────────────────────────────────

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    canonicalName: text("canonical_name").notNull(),
    legalName: text("legal_name"),
    country: text("country"),
    companyType: companyTypeEnum("company_type").default("other"),
    employeeCount: integer("employee_count"),
    websiteUrl: text("website_url"),
    description: text("description"),
    parentCompanyId: uuid("parent_company_id"),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    // CRM fields
    linkedinUrl: text("linkedin_url"),
    region: text("region"),
    industry: text("industry"),
    lifecycleStage: lifecycleStageEnum("lifecycle_stage").default("lead"),
    estimatedValue: real("estimated_value"),
    leadSource: text("lead_source"),
    accountOwner: text("account_owner"),
    lastActivityAt: timestamp("last_activity_at"),
    nextActivityAt: timestamp("next_activity_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_companies_name").on(t.canonicalName),
    index("idx_companies_country").on(t.country),
    index("idx_companies_type").on(t.companyType),
    index("idx_companies_lifecycle").on(t.lifecycleStage),
  ]
);

export const companyAliases = pgTable(
  "company_aliases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    aliasName: text("alias_name").notNull(),
    aliasType: aliasTypeEnum("alias_type").default("trading"),
    source: text("source"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_aliases_company").on(t.companyId),
    index("idx_aliases_name").on(t.aliasName),
  ]
);

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    brandName: text("brand_name").notNull(),
    brandType: brandTypeEnum("brand_type").default("other"),
    websiteUrl: text("website_url"),
    launchedAt: timestamp("launched_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_brands_company").on(t.companyId)]
);

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    domainName: text("domain_name").notNull(),
    domainType: domainTypeEnum("domain_type").default("primary"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("idx_domains_name").on(t.domainName),
    index("idx_domains_company").on(t.companyId),
  ]
);

// ─── Licenses ────────────────────────────────────────────

export const licenses = pgTable(
  "licenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    licenseNumber: text("license_number"),
    jurisdiction: text("jurisdiction").notNull(),
    regulator: text("regulator").notNull(),
    licenseType: text("license_type"),
    licenseStatus: licenseStatusEnum("license_status").default("active"),
    legalEntityName: text("legal_entity_name"),
    approvedDate: timestamp("approved_date"),
    effectiveDate: timestamp("effective_date"),
    expiryDate: timestamp("expiry_date"),
    officialUrl: text("official_url"),
    sourceDocumentUrl: text("source_document_url"),
    lastCheckedAt: timestamp("last_checked_at"),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_licenses_company").on(t.companyId),
    index("idx_licenses_jurisdiction").on(t.jurisdiction),
    index("idx_licenses_status").on(t.licenseStatus),
    index("idx_licenses_regulator").on(t.regulator),
  ]
);

export const licenseEvents = pgTable(
  "license_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    licenseId: uuid("license_id")
      .notNull()
      .references(() => licenses.id, { onDelete: "cascade" }),
    eventType: licenseEventTypeEnum("event_type").notNull(),
    previousStatus: text("previous_status"),
    newStatus: text("new_status"),
    eventDate: timestamp("event_date"),
    sourceUrl: text("source_url"),
    details: text("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_license_events_license").on(t.licenseId)]
);

// ─── Signals ─────────────────────────────────────────────

export const signals = pgTable(
  "signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    signalType: signalTypeEnum("signal_type").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    evidenceConfidence: integer("evidence_confidence").default(50),
    salesIntent: integer("sales_intent").default(50),
    detectedAt: timestamp("detected_at").defaultNow().notNull(),
    publishedAt: timestamp("published_at"),
    rawEvidence: text("raw_evidence"),
    metadata: jsonb("metadata"),
    isVerified: boolean("is_verified").default(false).notNull(),
    verifiedAt: timestamp("verified_at"),
    contentHash: text("content_hash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_signals_company").on(t.companyId),
    index("idx_signals_type").on(t.signalType),
    index("idx_signals_detected").on(t.detectedAt),
    index("idx_signals_hash").on(t.contentHash),
  ]
);

export const signalSources = pgTable(
  "signal_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    signalId: uuid("signal_id")
      .notNull()
      .references(() => signals.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").references(() => sources.id),
    sourceUrl: text("source_url").notNull(),
    sourceType: evidenceTypeEnum("source_type").default("secondary"),
    sourceName: text("source_name"),
    publishedAt: timestamp("published_at"),
    discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
    lastVerifiedAt: timestamp("last_verified_at"),
    sourceReliability: integer("source_reliability").default(3),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_signal_sources_signal").on(t.signalId)]
);

// ─── Sources & Pipeline ─────────────────────────────────

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    baseUrl: text("base_url"),
    isActive: boolean("is_active").default(true).notNull(),
    crawlFrequencyMinutes: integer("crawl_frequency_minutes").default(720),
    rateLimitRpm: integer("rate_limit_rpm").default(60),
    lastCrawledAt: timestamp("last_crawled_at"),
    lastSuccessAt: timestamp("last_success_at"),
    errorCount: integer("error_count").default(0),
    config: jsonb("config"),
    termsUrl: text("terms_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("idx_sources_type").on(t.sourceType)]
);

export const sourceDocuments = pgTable(
  "source_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    contentHash: text("content_hash"),
    rawHtml: text("raw_html"),
    rawText: text("raw_text"),
    documentType: text("document_type"),
    retrievedAt: timestamp("retrieved_at").defaultNow().notNull(),
    lastChangedAt: timestamp("last_changed_at"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_source_docs_source").on(t.sourceId),
    index("idx_source_docs_hash").on(t.contentHash),
    index("idx_source_docs_url").on(t.url),
  ]
);

export const crawlRuns = pgTable(
  "crawl_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    status: crawlStatusEnum("status").default("pending").notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    documentsProcessed: integer("documents_processed").default(0),
    newRecords: integer("new_records").default(0),
    changedRecords: integer("changed_records").default(0),
    errors: integer("errors").default(0),
    log: text("log"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_crawl_runs_source").on(t.sourceId),
    index("idx_crawl_runs_status").on(t.status),
  ]
);

export const crawlJobs = pgTable(
  "crawl_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    jobType: text("job_type").notNull(),
    status: crawlStatusEnum("status").default("pending").notNull(),
    scheduledAt: timestamp("scheduled_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    retryCount: integer("retry_count").default(0),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_crawl_jobs_status").on(t.status)]
);

// ─── News ────────────────────────────────────────────────

export const newsArticles = pgTable(
  "news_articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id").references(() => sources.id),
    title: text("title").notNull(),
    url: text("url").notNull().unique(),
    publisher: text("publisher"),
    author: text("author"),
    publishedAt: timestamp("published_at"),
    content: text("content"),
    excerpt: text("excerpt"),
    entities: jsonb("entities"),
    topics: text("topics").array(),
    contentHash: text("content_hash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_articles_published").on(t.publishedAt),
    index("idx_articles_hash").on(t.contentHash),
  ]
);

// ─── Jobs ────────────────────────────────────────────────

export const jobPostings = pgTable(
  "job_postings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    department: text("department"),
    location: text("location"),
    remoteType: text("remote_type"),
    sourceUrl: text("source_url"),
    postedAt: timestamp("posted_at"),
    roleCategory: roleCategoryEnum("role_category").default("other"),
    seniority: text("seniority"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_jobs_company").on(t.companyId),
    index("idx_jobs_category").on(t.roleCategory),
  ]
);

// ─── Funding ─────────────────────────────────────────────

export const fundingEvents = pgTable(
  "funding_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    roundType: fundingRoundEnum("round_type").default("other"),
    amount: real("amount"),
    currency: varchar("currency", { length: 3 }),
    date: timestamp("date"),
    investors: text("investors").array(),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_funding_company").on(t.companyId)]
);

// ─── Technology ──────────────────────────────────────────

export const companyTechnologies = pgTable(
  "company_technologies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    techCategory: techCategoryEnum("tech_category").notNull(),
    providerName: text("provider_name").notNull(),
    confidence: integer("confidence").default(50),
    sourceUrl: text("source_url"),
    detectedAt: timestamp("detected_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_company_tech_company").on(t.companyId)]
);

// ─── Contacts ────────────────────────────────────────────

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    email: text("email"),
    phone: text("phone"),
    linkedinUrl: text("linkedin_url"),
    source: text("source"),
    confidence: integer("confidence").default(50),
    isDecisionMaker: boolean("is_decision_maker").default(false).notNull(),
    notes: text("notes"),
    lastContactedAt: timestamp("last_contacted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_contacts_company").on(t.companyId),
    index("idx_contacts_email").on(t.email),
  ]
);

// ─── Opportunities ───────────────────────────────────────

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    // Intelligence scores
    intentScore: integer("intent_score").default(0),
    scalaraFit: real("scalara_fit").default(0),
    evidenceConfidence: integer("evidence_confidence").default(0),
    opportunityScore: integer("opportunity_score").default(0),
    recommendation: recommendationEnum("recommendation").default("monitor"),
    status: opportunityStatusEnum("status").default("new").notNull(),
    assignedTo: text("assigned_to"),
    summary: text("summary"),
    whyNow: text("why_now"),
    potentialNeeds: text("potential_needs").array(),
    risks: text("risks").array(),
    recommendedApproach: text("recommended_approach"),
    outreachAngle: text("outreach_angle"),
    scoreExplanation: jsonb("score_explanation"),
    lastScoredAt: timestamp("last_scored_at"),
    // CRM deal fields
    dealName: text("deal_name"),
    primaryContactId: uuid("primary_contact_id").references(() => contacts.id),
    amount: real("amount"),
    currency: varchar("currency", { length: 3 }).default("EUR"),
    probability: integer("probability").default(0),
    expectedCloseDate: timestamp("expected_close_date"),
    lostReason: text("lost_reason"),
    lastActivityAt: timestamp("last_activity_at"),
    nextActivityAt: timestamp("next_activity_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_opp_company").on(t.companyId),
    index("idx_opp_score").on(t.opportunityScore),
    index("idx_opp_status").on(t.status),
    index("idx_opp_recommendation").on(t.recommendation),
    index("idx_opp_close_date").on(t.expectedCloseDate),
  ]
);

// ─── AI Analyses ─────────────────────────────────────────

export const aiAnalyses = pgTable(
  "ai_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id),
    companyId: uuid("company_id").references(() => companies.id),
    analysisType: text("analysis_type").notNull(),
    modelProvider: text("model_provider"),
    modelName: text("model_name"),
    promptHash: text("prompt_hash"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    result: jsonb("result"),
    cachedUntil: timestamp("cached_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_ai_opp").on(t.opportunityId),
    index("idx_ai_hash").on(t.promptHash),
  ]
);

// ─── Outreach ────────────────────────────────────────────

export const outreachMessages = pgTable(
  "outreach_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id),
    contactId: uuid("contact_id").references(() => contacts.id),
    channel: outreachChannelEnum("channel").default("email"),
    subject: text("subject"),
    body: text("body"),
    status: outreachStatusEnum("status").default("draft").notNull(),
    generatedByModel: text("generated_by_model"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("idx_outreach_opp").on(t.opportunityId)]
);

// ─── User Feedback ───────────────────────────────────────

export const userFeedback = pgTable(
  "user_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id),
    predictedScore: integer("predicted_score"),
    actualOutcome: text("actual_outcome"),
    feedbackType: feedbackTypeEnum("feedback_type").notNull(),
    feedbackText: text("feedback_text"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_feedback_opp").on(t.opportunityId)]
);

// ─── Audit Log ───────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    actor: text("actor").notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_audit_entity").on(t.entityType, t.entityId),
    index("idx_audit_created").on(t.createdAt),
  ]
);

// ─── CRM: Activities ────────────────────────────────────

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityType: activityTypeEnum("activity_type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    meetingId: uuid("meeting_id"),
    actor: text("actor"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_activities_company").on(t.companyId),
    index("idx_activities_contact").on(t.contactId),
    index("idx_activities_opp").on(t.opportunityId),
    index("idx_activities_type").on(t.activityType),
    index("idx_activities_created").on(t.createdAt),
  ]
);

// ─── CRM: Tasks ─────────────────────────────────────────

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    owner: text("owner"),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    dueDate: timestamp("due_date"),
    priority: taskPriorityEnum("priority").default("medium").notNull(),
    status: taskStatusEnum("status").default("todo").notNull(),
    source: text("source"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_tasks_company").on(t.companyId),
    index("idx_tasks_status").on(t.status),
    index("idx_tasks_due").on(t.dueDate),
    index("idx_tasks_owner").on(t.owner),
  ]
);

// ─── CRM: Meetings ──────────────────────────────────────

export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    calendarEventId: text("calendar_event_id"),
    googleMeetCode: text("google_meet_code"),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    status: meetingStatusEnum("status").default("scheduled").notNull(),
    attendees: jsonb("attendees"),
    notes: text("notes"),
    summary: text("summary"),
    actionItems: jsonb("action_items"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_meetings_company").on(t.companyId),
    index("idx_meetings_opp").on(t.opportunityId),
    index("idx_meetings_start").on(t.startTime),
    index("idx_meetings_status").on(t.status),
  ]
);

// ─── CRM: Documents ─────────────────────────────────────

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    meetingId: uuid("meeting_id").references(() => meetings.id, {
      onDelete: "set null",
    }),
    documentType: documentTypeEnum("document_type").default("other").notNull(),
    name: text("name").notNull(),
    mimeType: text("mime_type"),
    driveFileId: text("drive_file_id"),
    driveFolderId: text("drive_folder_id"),
    webUrl: text("web_url"),
    fileSize: integer("file_size"),
    uploadedBy: text("uploaded_by"),
    // NDA-specific fields
    ndaStatus: ndaStatusEnum("nda_status"),
    ndaSignedDate: timestamp("nda_signed_date"),
    ndaExpiryDate: timestamp("nda_expiry_date"),
    ndaCounterparty: text("nda_counterparty"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_documents_company").on(t.companyId),
    index("idx_documents_opp").on(t.opportunityId),
    index("idx_documents_type").on(t.documentType),
  ]
);
