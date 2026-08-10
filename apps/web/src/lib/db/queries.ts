import { db } from "./index";
import { desc, eq, sql, and, gte, count } from "drizzle-orm";
import {
  companies,
  signals,
  opportunities,
  sources,
  crawlRuns,
  licenses,
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
      effectiveDate: licenses.effectiveDate,
      expiryDate: licenses.expiryDate,
    })
    .from(licenses)
    .innerJoin(companies, eq(licenses.companyId, companies.id))
    .orderBy(desc(licenses.updatedAt))
    .limit(limit);
}
