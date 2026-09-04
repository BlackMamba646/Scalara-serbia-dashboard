import { NextRequest, NextResponse } from "next/server";
import { getDownloadUrl } from "@vercel/blob";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [doc] = await db
      .select({ webUrl: documents.webUrl })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!doc?.webUrl) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const downloadUrl = await getDownloadUrl(doc.webUrl);
    return NextResponse.redirect(downloadUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
