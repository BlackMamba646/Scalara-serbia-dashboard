export const dynamic = "force-dynamic";

import { getHotOpportunities } from "@/lib/db/queries";
import { OutreachClient } from "./_client";

export default async function OutreachPage() {
  const raw = await getHotOpportunities(200);
  const drafts = raw
    .filter((o) => o.recommendation === "pursue")
    .map((opp) => ({
      id: `outreach-${opp.id}`,
      company: opp.companyName ?? "Unknown",
      subject: `Scalara Labs — ${(opp.potentialNeeds ?? ["solution"])[0]} for ${opp.companyName ?? "your company"}`,
      channel: "email" as const,
      status: "draft" as const,
      angle: opp.whyNow,
    }));
  return <OutreachClient drafts={drafts} />;
}
