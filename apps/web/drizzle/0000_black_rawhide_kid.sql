CREATE TYPE "public"."alias_type" AS ENUM('legal', 'brand', 'trading', 'abbreviation');--> statement-breakpoint
CREATE TYPE "public"."brand_type" AS ENUM('casino', 'sportsbook', 'poker', 'bingo', 'lottery', 'other');--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('operator', 'vendor', 'studio', 'affiliate', 'regulator', 'other');--> statement-breakpoint
CREATE TYPE "public"."crawl_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."domain_type" AS ENUM('primary', 'brand', 'corporate');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('primary', 'secondary', 'company', 'inference');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('good_lead', 'bad_lead', 'incorrect_data', 'already_customer', 'competitor');--> statement-breakpoint
CREATE TYPE "public"."funding_round" AS ENUM('pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'strategic', 'acquisition', 'ipo', 'other');--> statement-breakpoint
CREATE TYPE "public"."license_event_type" AS ENUM('new', 'approved', 'modified', 'suspended', 'revoked', 'expired', 'renewed', 'surrendered', 'conditional');--> statement-breakpoint
CREATE TYPE "public"."license_status" AS ENUM('active', 'pending', 'conditional', 'approved', 'suspended', 'revoked', 'expired', 'surrendered', 'lapsed', 'forfeited');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('new', 'review', 'qualified', 'contacted', 'replied', 'meeting', 'proposal', 'won', 'lost', 'dismissed', 'watch');--> statement-breakpoint
CREATE TYPE "public"."outreach_channel" AS ENUM('email', 'linkedin', 'call');--> statement-breakpoint
CREATE TYPE "public"."outreach_status" AS ENUM('draft', 'ready', 'sent', 'replied', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."recommendation" AS ENUM('pursue', 'qualify', 'monitor');--> statement-breakpoint
CREATE TYPE "public"."role_category" AS ENUM('backend', 'frontend', 'fullstack', 'devops', 'platform', 'payments', 'security', 'data', 'game_dev', 'qa', 'mobile', 'management', 'product', 'other');--> statement-breakpoint
CREATE TYPE "public"."signal_type" AS ENUM('new_license', 'license_approval', 'license_change', 'license_suspension', 'market_expansion', 'new_casino', 'new_sportsbook', 'new_brand', 'platform_launch', 'funding', 'acquisition', 'hiring_surge', 'engineering_hiring', 'payments_hiring', 'devops_hiring', 'provider_change', 'technology_partner_search', 'rfp', 'game_studio_launch', 'regulatory_change', 'new_product', 'new_tech_partner');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('regulator', 'news', 'company', 'jobs', 'funding', 'search');--> statement-breakpoint
CREATE TYPE "public"."tech_category" AS ENUM('platform', 'pam', 'aggregator', 'payments', 'kyc', 'fraud', 'crm', 'cloud', 'sportsbook', 'casino', 'affiliate', 'other');--> statement-breakpoint
CREATE TABLE "ai_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid,
	"company_id" uuid,
	"analysis_type" text NOT NULL,
	"model_provider" text,
	"model_name" text,
	"prompt_hash" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"result" jsonb,
	"cached_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"actor" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"brand_name" text NOT NULL,
	"brand_type" "brand_type" DEFAULT 'other',
	"website_url" text,
	"launched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_name" text NOT NULL,
	"legal_name" text,
	"country" text,
	"company_type" "company_type" DEFAULT 'other',
	"employee_count" integer,
	"website_url" text,
	"description" text,
	"parent_company_id" uuid,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"alias_name" text NOT NULL,
	"alias_type" "alias_type" DEFAULT 'trading',
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_technologies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"tech_category" "tech_category" NOT NULL,
	"provider_name" text NOT NULL,
	"confidence" integer DEFAULT 50,
	"source_url" text,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"email" text,
	"linkedin_url" text,
	"source" text,
	"confidence" integer DEFAULT 50,
	"is_decision_maker" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawl_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"job_type" text NOT NULL,
	"status" "crawl_status" DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"retry_count" integer DEFAULT 0,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawl_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"status" "crawl_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"documents_processed" integer DEFAULT 0,
	"new_records" integer DEFAULT 0,
	"changed_records" integer DEFAULT 0,
	"errors" integer DEFAULT 0,
	"log" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"domain_name" text NOT NULL,
	"domain_type" "domain_type" DEFAULT 'primary',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funding_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"round_type" "funding_round" DEFAULT 'other',
	"amount" real,
	"currency" varchar(3),
	"date" timestamp,
	"investors" text[],
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" text NOT NULL,
	"department" text,
	"location" text,
	"remote_type" text,
	"source_url" text,
	"posted_at" timestamp,
	"role_category" "role_category" DEFAULT 'other',
	"seniority" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_id" uuid NOT NULL,
	"event_type" "license_event_type" NOT NULL,
	"previous_status" text,
	"new_status" text,
	"event_date" timestamp,
	"source_url" text,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"license_number" text,
	"jurisdiction" text NOT NULL,
	"regulator" text NOT NULL,
	"license_type" text,
	"license_status" "license_status" DEFAULT 'active',
	"legal_entity_name" text,
	"approved_date" timestamp,
	"effective_date" timestamp,
	"expiry_date" timestamp,
	"official_url" text,
	"source_document_url" text,
	"last_checked_at" timestamp,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"publisher" text,
	"author" text,
	"published_at" timestamp,
	"content" text,
	"excerpt" text,
	"entities" jsonb,
	"topics" text[],
	"content_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "news_articles_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"intent_score" integer DEFAULT 0,
	"scalara_fit" real DEFAULT 0,
	"evidence_confidence" integer DEFAULT 0,
	"opportunity_score" integer DEFAULT 0,
	"recommendation" "recommendation" DEFAULT 'monitor',
	"status" "opportunity_status" DEFAULT 'new' NOT NULL,
	"assigned_to" text,
	"summary" text,
	"why_now" text,
	"potential_needs" text[],
	"risks" text[],
	"recommended_approach" text,
	"outreach_angle" text,
	"score_explanation" jsonb,
	"last_scored_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid,
	"contact_id" uuid,
	"channel" "outreach_channel" DEFAULT 'email',
	"subject" text,
	"body" text,
	"status" "outreach_status" DEFAULT 'draft' NOT NULL,
	"generated_by_model" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signal_id" uuid NOT NULL,
	"source_id" uuid,
	"source_url" text NOT NULL,
	"source_type" "evidence_type" DEFAULT 'secondary',
	"source_name" text,
	"published_at" timestamp,
	"discovered_at" timestamp DEFAULT now() NOT NULL,
	"last_verified_at" timestamp,
	"source_reliability" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"signal_type" "signal_type" NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"evidence_confidence" integer DEFAULT 50,
	"sales_intent" integer DEFAULT 50,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"raw_evidence" text,
	"metadata" jsonb,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"content_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"url" text NOT NULL,
	"content_hash" text,
	"raw_html" text,
	"raw_text" text,
	"document_type" text,
	"retrieved_at" timestamp DEFAULT now() NOT NULL,
	"last_changed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"source_type" "source_type" NOT NULL,
	"base_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"crawl_frequency_minutes" integer DEFAULT 720,
	"rate_limit_rpm" integer DEFAULT 60,
	"last_crawled_at" timestamp,
	"last_success_at" timestamp,
	"error_count" integer DEFAULT 0,
	"config" jsonb,
	"terms_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid,
	"predicted_score" integer,
	"actual_outcome" text,
	"feedback_type" "feedback_type" NOT NULL,
	"feedback_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_aliases" ADD CONSTRAINT "company_aliases_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_technologies" ADD CONSTRAINT "company_technologies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_jobs" ADD CONSTRAINT "crawl_jobs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_runs" ADD CONSTRAINT "crawl_runs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_events" ADD CONSTRAINT "funding_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_events" ADD CONSTRAINT "license_events_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_sources" ADD CONSTRAINT "signal_sources_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_sources" ADD CONSTRAINT "signal_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_opp" ON "ai_analyses" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "idx_ai_hash" ON "ai_analyses" USING btree ("prompt_hash");--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_brands_company" ON "brands" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_companies_name" ON "companies" USING btree ("canonical_name");--> statement-breakpoint
CREATE INDEX "idx_companies_country" ON "companies" USING btree ("country");--> statement-breakpoint
CREATE INDEX "idx_companies_type" ON "companies" USING btree ("company_type");--> statement-breakpoint
CREATE INDEX "idx_aliases_company" ON "company_aliases" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_aliases_name" ON "company_aliases" USING btree ("alias_name");--> statement-breakpoint
CREATE INDEX "idx_company_tech_company" ON "company_technologies" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_contacts_company" ON "contacts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_crawl_jobs_status" ON "crawl_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_crawl_runs_source" ON "crawl_runs" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_crawl_runs_status" ON "crawl_runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_domains_name" ON "domains" USING btree ("domain_name");--> statement-breakpoint
CREATE INDEX "idx_domains_company" ON "domains" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_funding_company" ON "funding_events" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_company" ON "job_postings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_category" ON "job_postings" USING btree ("role_category");--> statement-breakpoint
CREATE INDEX "idx_license_events_license" ON "license_events" USING btree ("license_id");--> statement-breakpoint
CREATE INDEX "idx_licenses_company" ON "licenses" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_licenses_jurisdiction" ON "licenses" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_licenses_status" ON "licenses" USING btree ("license_status");--> statement-breakpoint
CREATE INDEX "idx_licenses_regulator" ON "licenses" USING btree ("regulator");--> statement-breakpoint
CREATE INDEX "idx_articles_published" ON "news_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_articles_hash" ON "news_articles" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "idx_opp_company" ON "opportunities" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_opp_score" ON "opportunities" USING btree ("opportunity_score");--> statement-breakpoint
CREATE INDEX "idx_opp_status" ON "opportunities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_opp_recommendation" ON "opportunities" USING btree ("recommendation");--> statement-breakpoint
CREATE INDEX "idx_outreach_opp" ON "outreach_messages" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "idx_signal_sources_signal" ON "signal_sources" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "idx_signals_company" ON "signals" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_signals_type" ON "signals" USING btree ("signal_type");--> statement-breakpoint
CREATE INDEX "idx_signals_detected" ON "signals" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_signals_hash" ON "signals" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "idx_source_docs_source" ON "source_documents" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_source_docs_hash" ON "source_documents" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "idx_source_docs_url" ON "source_documents" USING btree ("url");--> statement-breakpoint
CREATE INDEX "idx_sources_type" ON "sources" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_feedback_opp" ON "user_feedback" USING btree ("opportunity_id");