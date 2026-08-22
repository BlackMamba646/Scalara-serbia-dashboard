export const dynamic = "force-dynamic";

import { getHotOpportunities } from "@/lib/db/queries";
import { PipelineClient } from "./_client";

export default async function PipelinePage() {
  const raw = await getHotOpportunities(200);
  const opportunities = raw.map((o) => ({
    id: o.id,
    companyName: o.companyName,
    opportunityScore: o.opportunityScore,
    recommendation: o.recommendation,
    status: o.status,
    summary: o.summary,
    potentialNeeds: o.potentialNeeds,
  }));
  return <PipelineClient opportunities={opportunities} />;
}
