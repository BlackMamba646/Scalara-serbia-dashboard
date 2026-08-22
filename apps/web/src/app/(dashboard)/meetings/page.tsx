export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { meetings, companies } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { MeetingsClient } from "./_client";

export default async function MeetingsPage() {
  const data = await db
    .select({
      id: meetings.id,
      title: meetings.title,
      companyId: meetings.companyId,
      companyName: companies.canonicalName,
      startTime: meetings.startTime,
      endTime: meetings.endTime,
      status: meetings.status,
      notes: meetings.notes,
      summary: meetings.summary,
    })
    .from(meetings)
    .leftJoin(companies, eq(meetings.companyId, companies.id))
    .orderBy(desc(meetings.startTime));

  return <MeetingsClient meetings={data} />;
}
