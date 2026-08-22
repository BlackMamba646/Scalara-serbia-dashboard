export const dynamic = "force-dynamic";

import { getRecentSignals } from "@/lib/db/queries";
import { SignalsClient } from "./_client";

export default async function SignalsPage() {
  const signals = await getRecentSignals(5000);
  return <SignalsClient signals={signals} />;
}
