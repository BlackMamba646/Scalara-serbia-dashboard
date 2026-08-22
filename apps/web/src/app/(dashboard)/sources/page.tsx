export const dynamic = "force-dynamic";

import { getSources } from "@/lib/db/queries";
import { SourcesClient } from "./_client";

export default async function SourcesPage() {
  const sources = await getSources();
  return <SourcesClient sources={sources} />;
}
