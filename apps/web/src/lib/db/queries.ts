import { db } from "./index";
import { desc, eq, sql, and, gte, lte, count, isNull, or } from "drizzle-orm";
import {
  companies,
  signals,
  opportunities,
  sources,
  crawlRuns,
  licenses,
  newsArticles,
  sourceDocuments,
  contacts,
  activities,
  tasks,
  meetings,
  documents,
} from "./schema";

export async function getHotOpportunities(limit = 10) {
  return db
    .select({
      id: opportunities.id,
      companyId: opportunities.companyId,
      companyName: companies.canonicalName,
      intentScore: opportunities.intentScore,
      scalaraFit: opportunities.scalaraFit,
      evidenceConfidence: opportunities.evidenceConfidence,
      opportunityScore: opportunities.opportunityScore,
      recommendation: opportunities.recommendation,
      status: opportunities.status,
      summary: opportunities.summary,
      whyNow: opportunities.whyNow,
      potentialNeeds: opportunities.potentialNeeds,
      scoreExplanation: opportunities.scoreExplanation,
      createdAt: opportunities.createdAt,
    })
    .from(opportunities)
    .innerJoin(companies, eq(opportunities.companyId, companies.id))
    .orderBy(desc(opportunities.opportunityScore))
    .limit(limit);
}

export async function getRecentSignals(limit = 20) {
  return db
    .select({
      id: signals.id,
      companyId: signals.companyId,
      companyName: companies.canonicalName,
      signalType: signals.signalType,
      title: signals.title,
      summary: signals.summary,
      evidenceConfidence: signals.evidenceConfidence,
      salesIntent: signals.salesIntent,
      detectedAt: signals.detectedAt,
      isVerified: signals.isVerified,
    })
    .from(signals)
    .innerJoin(companies, eq(signals.companyId, companies.id))
    .orderBy(desc(signals.detectedAt))
    .limit(limit);
}

export async function getDashboardMetrics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [hotLeads, activeSignals, avgFit, licenseChanges, totalCompanies] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(opportunities)
        .where(eq(opportunities.recommendation, "pursue")),
      db
        .select({ count: count() })
        .from(signals)
        .where(gte(signals.detectedAt, thirtyDaysAgo)),
      db
        .select({ avg: sql<number>`coalesce(avg(${opportunities.scalaraFit}), 0)` })
        .from(opportunities),
      db
        .select({ count: count() })
        .from(signals)
        .where(
          and(
            eq(signals.signalType, "new_license"),
            gte(signals.detectedAt, thirtyDaysAgo)
          )
        ),
      db.select({ count: count() }).from(companies),
    ]);

  return {
    hotLeads: hotLeads[0]?.count ?? 0,
    activeSignals: activeSignals[0]?.count ?? 0,
    avgFit: Math.round((avgFit[0]?.avg ?? 0) * 100) / 100,
    licenseChanges: licenseChanges[0]?.count ?? 0,
    totalCompanies: totalCompanies[0]?.count ?? 0,
  };
}

export async function getCompanies(limit = 50, offset = 0) {
  return db
    .select()
    .from(companies)
    .orderBy(desc(companies.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function getCompanyById(id: string) {
  const result = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getSources() {
  return db
    .select()
    .from(sources)
    .orderBy(sources.name);
}

export async function getSourceCrawlHistory(sourceId: string, limit = 10) {
  return db
    .select()
    .from(crawlRuns)
    .where(eq(crawlRuns.sourceId, sourceId))
    .orderBy(desc(crawlRuns.createdAt))
    .limit(limit);
}

export async function getLicenses(limit = 50) {
  return db
    .select({
      id: licenses.id,
      companyId: licenses.companyId,
      companyName: companies.canonicalName,
      licenseNumber: licenses.licenseNumber,
      jurisdiction: licenses.jurisdiction,
      regulator: licenses.regulator,
      licenseType: licenses.licenseType,
      licenseStatus: licenses.licenseStatus,
      legalEntityName: licenses.legalEntityName,
      effectiveDate: licenses.effectiveDate,
      expiryDate: licenses.expiryDate,
    })
    .from(licenses)
    .innerJoin(companies, eq(licenses.companyId, companies.id))
    .orderBy(desc(licenses.updatedAt))
    .limit(limit);
}

export async function getNews(limit = 20) {
  return db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt)).limit(limit);
}

export async function getCrawlRuns(limit = 10) {
  return db
    .select({
      id: crawlRuns.id,
      sourceName: sources.name,
      status: crawlRuns.status,
      startedAt: crawlRuns.startedAt,
      completedAt: crawlRuns.completedAt,
      documentsProcessed: crawlRuns.documentsProcessed,
      newRecords: crawlRuns.newRecords,
      changedRecords: crawlRuns.changedRecords,
      errors: crawlRuns.errors,
    })
    .from(crawlRuns)
    .innerJoin(sources, eq(crawlRuns.sourceId, sources.id))
    .orderBy(desc(crawlRuns.createdAt))
    .limit(limit);
}

export async function getSourceDocumentCount(sourceId: string) {
  const result = await db
    .select({ count: count() })
    .from(sourceDocuments)
    .where(eq(sourceDocuments.sourceId, sourceId));
  return result[0]?.count ?? 0;
}

// ─── CRM Queries ────────────────────────────────────────

export async function getCompanyWithRelations(id: string) {
  const [company, companyContacts, companyOpportunities, companyActivities, companyTasks, companyMeetings, companyDocuments] =
    await Promise.all([
      db.select().from(companies).where(eq(companies.id, id)).limit(1),
      db
        .select()
        .from(contacts)
        .where(eq(contacts.companyId, id))
        .orderBy(desc(contacts.updatedAt)),
      db
        .select({
          id: opportunities.id,
          companyId: opportunities.companyId,
          dealName: opportunities.dealName,
          status: opportunities.status,
          amount: opportunities.amount,
          currency: opportunities.currency,
          probability: opportunities.probability,
          expectedCloseDate: opportunities.expectedCloseDate,
          opportunityScore: opportunities.opportunityScore,
          recommendation: opportunities.recommendation,
          summary: opportunities.summary,
          assignedTo: opportunities.assignedTo,
          createdAt: opportunities.createdAt,
        })
        .from(opportunities)
        .where(eq(opportunities.companyId, id))
        .orderBy(desc(opportunities.createdAt)),
      db
        .select()
        .from(activities)
        .where(eq(activities.companyId, id))
        .orderBy(desc(activities.createdAt))
        .limit(50),
      db
        .select()
        .from(tasks)
        .where(eq(tasks.companyId, id))
        .orderBy(desc(tasks.createdAt)),
      db
        .select()
        .from(meetings)
        .where(eq(meetings.companyId, id))
        .orderBy(desc(meetings.startTime)),
      db
        .select()
        .from(documents)
        .where(eq(documents.companyId, id))
        .orderBy(desc(documents.createdAt)),
    ]);

  if (!company[0]) return null;

  return {
    company: company[0],
    contacts: companyContacts,
    opportunities: companyOpportunities,
    activities: companyActivities,
    tasks: companyTasks,
    meetings: companyMeetings,
    documents: companyDocuments,
  };
}

export async function getContacts(limit = 200) {
  return db
    .select({
      id: contacts.id,
      name: contacts.name,
      title: contacts.title,
      email: contacts.email,
      phone: contacts.phone,
      linkedinUrl: contacts.linkedinUrl,
      companyId: contacts.companyId,
      companyName: companies.canonicalName,
      isDecisionMaker: contacts.isDecisionMaker,
      confidence: contacts.confidence,
      lastContactedAt: contacts.lastContactedAt,
      notes: contacts.notes,
    })
    .from(contacts)
    .innerJoin(companies, eq(contacts.companyId, companies.id))
    .orderBy(desc(contacts.updatedAt))
    .limit(limit);
}

export async function getAllTasks() {
  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      owner: tasks.owner,
      companyId: tasks.companyId,
      companyName: companies.canonicalName,
      dueDate: tasks.dueDate,
      priority: tasks.priority,
      status: tasks.status,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .leftJoin(companies, eq(tasks.companyId, companies.id))
    .orderBy(desc(tasks.createdAt));
}

export async function getCrmMetrics() {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalDeals,
    openDeals,
    wonDeals,
    overdueTasks,
    pendingTasks,
    upcomingMeetings,
    totalContacts,
    pipelineValue,
  ] = await Promise.all([
    db.select({ count: count() }).from(opportunities),
    db
      .select({ count: count() })
      .from(opportunities)
      .where(
        and(
          sql`${opportunities.status} NOT IN ('won', 'lost', 'dismissed')`,
        )
      ),
    db
      .select({ count: count() })
      .from(opportunities)
      .where(eq(opportunities.status, "won")),
    db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          sql`${tasks.status} NOT IN ('completed', 'cancelled')`,
          lte(tasks.dueDate, now)
        )
      ),
    db
      .select({ count: count() })
      .from(tasks)
      .where(
        sql`${tasks.status} NOT IN ('completed', 'cancelled')`
      ),
    db
      .select({ count: count() })
      .from(meetings)
      .where(
        and(
          gte(meetings.startTime, now),
          eq(meetings.status, "scheduled")
        )
      ),
    db.select({ count: count() }).from(contacts),
    db
      .select({
        total: sql<number>`coalesce(sum(${opportunities.amount}), 0)`,
      })
      .from(opportunities)
      .where(
        sql`${opportunities.status} NOT IN ('won', 'lost', 'dismissed')`
      ),
  ]);

  return {
    totalDeals: totalDeals[0]?.count ?? 0,
    openDeals: openDeals[0]?.count ?? 0,
    wonDeals: wonDeals[0]?.count ?? 0,
    overdueTasks: overdueTasks[0]?.count ?? 0,
    pendingTasks: pendingTasks[0]?.count ?? 0,
    upcomingMeetings: upcomingMeetings[0]?.count ?? 0,
    totalContacts: totalContacts[0]?.count ?? 0,
    pipelineValue: pipelineValue[0]?.total ?? 0,
  };
}

export async function getRecentActivities(limit = 30) {
  return db
    .select({
      id: activities.id,
      activityType: activities.activityType,
      title: activities.title,
      description: activities.description,
      companyId: activities.companyId,
      companyName: companies.canonicalName,
      actor: activities.actor,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .leftJoin(companies, eq(activities.companyId, companies.id))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}
