export const dynamic = "force-dynamic";

import { getLeads, getLeadMetrics } from "@/lib/db/queries";
import { LeadsClient } from "./_client";

export default async function LeadsPage() {
  const [leads, metrics] = await Promise.all([getLeads(), getLeadMetrics()]);
  return <LeadsClient leads={leads} metrics={metrics} />;
}
