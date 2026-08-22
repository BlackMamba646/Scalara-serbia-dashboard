CREATE TYPE "public"."activity_type" AS ENUM('note', 'email', 'call', 'meeting', 'task', 'document', 'signal', 'status_change', 'proposal', 'follow_up');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('nda', 'proposal', 'contract', 'commercial', 'presentation', 'meeting', 'legal', 'other');--> statement-breakpoint
CREATE TYPE "public"."lifecycle_stage" AS ENUM('lead', 'prospect', 'qualified', 'customer', 'churned', 'partner');--> statement-breakpoint
CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."nda_status" AS ENUM('draft', 'sent', 'under_review', 'signed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"company_id" uuid,
	"contact_id" uuid,
	"opportunity_id" uuid,
	"meeting_id" uuid,
	"actor" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"opportunity_id" uuid,
	"meeting_id" uuid,
	"document_type" "document_type" DEFAULT 'other' NOT NULL,
	"name" text NOT NULL,
	"mime_type" text,
	"drive_file_id" text,
	"drive_folder_id" text,
	"web_url" text,
	"file_size" integer,
	"uploaded_by" text,
	"nda_status" "nda_status",
	"nda_signed_date" timestamp,
	"nda_expiry_date" timestamp,
	"nda_counterparty" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"company_id" uuid,
	"opportunity_id" uuid,
	"calendar_event_id" text,
	"google_meet_code" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"attendees" jsonb,
	"notes" text,
	"summary" text,
	"action_items" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"owner" text,
	"company_id" uuid,
	"contact_id" uuid,
	"opportunity_id" uuid,
	"due_date" timestamp,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"source" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "lifecycle_stage" "lifecycle_stage" DEFAULT 'lead';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "estimated_value" real;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "lead_source" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "account_owner" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "last_activity_at" timestamp;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "next_activity_at" timestamp;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "last_contacted_at" timestamp;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "deal_name" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "primary_contact_id" uuid;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "amount" real;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "currency" varchar(3) DEFAULT 'EUR';--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "probability" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "expected_close_date" timestamp;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "lost_reason" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "last_activity_at" timestamp;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "next_activity_at" timestamp;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activities_company" ON "activities" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_activities_contact" ON "activities" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "idx_activities_opp" ON "activities" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "idx_activities_type" ON "activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_activities_created" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_documents_company" ON "documents" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_documents_opp" ON "documents" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_meetings_company" ON "meetings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_meetings_opp" ON "meetings" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "idx_meetings_start" ON "meetings" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_meetings_status" ON "meetings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_company" ON "tasks" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_due" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_tasks_owner" ON "tasks" USING btree ("owner");--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_primary_contact_id_contacts_id_fk" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_companies_lifecycle" ON "companies" USING btree ("lifecycle_stage");--> statement-breakpoint
CREATE INDEX "idx_contacts_email" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_opp_close_date" ON "opportunities" USING btree ("expected_close_date");