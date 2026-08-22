export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { contacts, companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ContactsClient } from "./_client";

export default async function ContactsPage() {
  const raw = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      title: contacts.title,
      companyName: companies.canonicalName,
      email: contacts.email,
      linkedinUrl: contacts.linkedinUrl,
      isDecisionMaker: contacts.isDecisionMaker,
      confidence: contacts.confidence,
    })
    .from(contacts)
    .innerJoin(companies, eq(contacts.companyId, companies.id))
    .limit(200);

  return <ContactsClient contacts={raw} />;
}
