export const dynamic = "force-dynamic";

import { getLicenses } from "@/lib/db/queries";
import { LicensesClient } from "./_client";

export default async function LicensesPage() {
  const licenses = await getLicenses(10000);
  return <LicensesClient licenses={licenses} />;
}
