"use server";

import { db } from "@/lib/db";
import { googleAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function disconnectGoogle(accountId: string) {
  await db.delete(googleAccounts).where(eq(googleAccounts.id, accountId));
  revalidatePath("/settings");
  revalidatePath("/meetings");
}
