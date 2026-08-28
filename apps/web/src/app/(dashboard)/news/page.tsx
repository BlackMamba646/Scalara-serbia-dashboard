export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { newsArticles } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { NewsClient } from "./_client";

function derivePublisher(url: string): string | null {
  if (url.includes("igamingbusiness.com")) return "iGaming Business";
  if (url.includes("sbcnews.co.uk") || url.includes("sbcamericas.com")) return "SBC News";
  if (url.includes("gamingintelligence.com")) return "Gaming Intelligence";
  return null;
}

export default async function NewsPage() {
  const raw = await db
    .select()
    .from(newsArticles)
    .orderBy(desc(newsArticles.publishedAt), desc(newsArticles.createdAt))
    .limit(500);

  const articles = raw.map((a) => ({
    ...a,
    publisher: a.publisher || derivePublisher(a.url),
  }));

  return <NewsClient articles={articles} />;
}
