"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import {
  companies,
  contacts,
  opportunities,
  activities,
  tasks,
  meetings,
  documents,
} from "@/lib/db/schema";

// ─── Companies ──────────────────────────────────────────

export async function updateCompany(
  id: string,
  data: {
    canonicalName?: string;
    legalName?: string | null;
    country?: string | null;
    companyType?: "operator" | "vendor" | "studio" | "affiliate" | "regulator" | "other";
    employeeCount?: number | null;
    websiteUrl?: string | null;
    description?: string | null;
    linkedinUrl?: string | null;
    region?: string | null;
    industry?: string | null;
    lifecycleStage?: "lead" | "prospect" | "qualified" | "customer" | "churned" | "partner";
    estimatedValue?: number | null;
    leadSource?: string | null;
    accountOwner?: string | null;
    notes?: string | null;
  }
) {
  await db
    .update(companies)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(companies.id, id));
  revalidatePath(`/companies/${id}`);
  revalidatePath("/companies");
}

// ─── Contacts ───────────────────────────────────────────

export async function createContact(data: {
  companyId: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  isDecisionMaker?: boolean;
  notes?: string;
}) {
  const [result] = await db.insert(contacts).values(data).returning({ id: contacts.id });
  revalidatePath(`/companies/${data.companyId}`);
  revalidatePath("/contacts");
  return result;
}

export async function updateContact(
  id: string,
  data: {
    name?: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedinUrl?: string | null;
    isDecisionMaker?: boolean;
    notes?: string | null;
  }
) {
  await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contacts.id, id));
  revalidatePath("/contacts");
}

export async function deleteContact(id: string, companyId: string) {
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/contacts");
}

// ─── Opportunities ──────────────────────────────────────

export async function createOpportunity(data: {
  companyId: string;
  dealName?: string;
  status?: "new" | "review" | "qualified" | "contacted" | "replied" | "meeting" | "proposal" | "won" | "lost" | "dismissed" | "watch";
  amount?: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: Date;
  summary?: string;
  assignedTo?: string;
  primaryContactId?: string;
}) {
  const [result] = await db.insert(opportunities).values(data).returning({ id: opportunities.id });
  revalidatePath(`/companies/${data.companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/opportunities");
  return result;
}

export async function updateOpportunity(
  id: string,
  data: {
    dealName?: string | null;
    status?: "new" | "review" | "qualified" | "contacted" | "replied" | "meeting" | "proposal" | "won" | "lost" | "dismissed" | "watch";
    amount?: number | null;
    currency?: string;
    probability?: number;
    expectedCloseDate?: Date | null;
    summary?: string | null;
    assignedTo?: string | null;
    lostReason?: string | null;
    primaryContactId?: string | null;
  }
) {
  await db
    .update(opportunities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(opportunities.id, id));
  revalidatePath("/pipeline");
  revalidatePath("/opportunities");
}

export async function deleteOpportunity(id: string, companyId: string) {
  await db.delete(opportunities).where(eq(opportunities.id, id));
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/opportunities");
}

// ─── Activities ─────────────────────────────────────────

export async function createActivity(data: {
  activityType: "note" | "email" | "call" | "meeting" | "task" | "document" | "signal" | "status_change" | "proposal" | "follow_up";
  title: string;
  description?: string;
  companyId?: string;
  contactId?: string;
  opportunityId?: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}) {
  const [result] = await db.insert(activities).values(data).returning({ id: activities.id });
  if (data.companyId) {
    await db
      .update(companies)
      .set({ lastActivityAt: new Date(), updatedAt: new Date() })
      .where(eq(companies.id, data.companyId));
    revalidatePath(`/companies/${data.companyId}`);
  }
  return result;
}

// ─── Tasks ──────────────────────────────────────────────

export async function createTask(data: {
  title: string;
  description?: string;
  owner?: string;
  companyId?: string;
  contactId?: string;
  opportunityId?: string;
  dueDate?: Date;
  priority?: "low" | "medium" | "high" | "urgent";
}) {
  const [result] = await db.insert(tasks).values(data).returning({ id: tasks.id });
  revalidatePath("/tasks");
  if (data.companyId) revalidatePath(`/companies/${data.companyId}`);
  return result;
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    owner?: string | null;
    dueDate?: Date | null;
    priority?: "low" | "medium" | "high" | "urgent";
    status?: "todo" | "in_progress" | "completed" | "cancelled";
  }
) {
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.status === "completed") {
    updates.completedAt = new Date();
  }
  await db.update(tasks).set(updates).where(eq(tasks.id, id));
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath("/tasks");
}

// ─── Meetings ───────────────────────────────────────────

export async function createMeeting(data: {
  title: string;
  companyId?: string;
  opportunityId?: string;
  startTime: Date;
  endTime?: Date;
  attendees?: unknown[];
  notes?: string;
}) {
  const [result] = await db.insert(meetings).values(data).returning({ id: meetings.id });
  if (data.companyId) revalidatePath(`/companies/${data.companyId}`);
  return result;
}

export async function updateMeeting(
  id: string,
  data: {
    title?: string;
    status?: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
    notes?: string | null;
    summary?: string | null;
    actionItems?: unknown[];
  }
) {
  await db
    .update(meetings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(meetings.id, id));
}

// ─── Documents ──────────────────────────────────────────

export async function createDocument(data: {
  companyId?: string;
  opportunityId?: string;
  meetingId?: string;
  documentType: "nda" | "proposal" | "contract" | "commercial" | "presentation" | "meeting" | "legal" | "other";
  name: string;
  mimeType?: string;
  webUrl?: string;
  uploadedBy?: string;
  ndaStatus?: "draft" | "sent" | "under_review" | "signed" | "expired";
  ndaCounterparty?: string;
}) {
  const [result] = await db.insert(documents).values(data).returning({ id: documents.id });
  if (data.companyId) revalidatePath(`/companies/${data.companyId}`);
  return result;
}
