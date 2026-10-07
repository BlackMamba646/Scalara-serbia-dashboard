export const dynamic = "force-dynamic";

import { getRecentSignals } from "@/lib/db/queries";
import { SignalsClient } from "./_client";

export default async function SignalsPage() {
  const raw = await getRecentSignals(5000);
  const signals = raw.map((s) => ({
    ...s,
    metadata: (s.metadata as Record<string, unknown> | null) ?? null,
  }));
  return <SignalsClient signals={signals} />;
}
