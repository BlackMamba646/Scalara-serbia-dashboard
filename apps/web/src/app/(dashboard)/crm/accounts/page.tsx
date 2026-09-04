export const dynamic = "force-dynamic";

import { getCrmAccounts } from "@/lib/db/queries";
import { AccountsClient } from "./_client";

export default async function AccountsPage() {
  const accounts = await getCrmAccounts();
  return <AccountsClient accounts={accounts} />;
}
