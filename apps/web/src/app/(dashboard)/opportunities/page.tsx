export const dynamic = "force-dynamic";

import { getHotOpportunities } from "@/lib/db/queries";
import { OpportunitiesClient } from "./_client";

export default async function OpportunitiesPage() {
  const opportunities = await getHotOpportunities(1000);
  return <OpportunitiesClient opportunities={opportunities} />;
}
