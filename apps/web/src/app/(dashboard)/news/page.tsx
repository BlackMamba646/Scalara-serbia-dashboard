export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { newsArticles } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { NewsClient } from "./_client";

export default async function NewsPage() {
  const articles = await db
    .select()
    .from(newsArticles)
    .orderBy(desc(newsArticles.publishedAt))
    .limit(100);
  return <NewsClient articles={articles} />;
}
