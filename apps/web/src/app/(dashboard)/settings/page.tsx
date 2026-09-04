export const dynamic = "force-dynamic";

import { getGoogleAccount } from "@/lib/google";
import { SettingsClient } from "./_client";

export default async function SettingsPage() {
  const googleAccount = await getGoogleAccount();

  return <SettingsClient googleAccount={googleAccount} />;
}
