import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const companyId = formData.get("companyId") as string | null;
    const documentType = formData.get("documentType") as string | null;
    const name = formData.get("name") as string | null;

    if (!file || !companyId) {
      return NextResponse.json({ error: "File and companyId are required" }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Blob storage not configured — add BLOB_READ_WRITE_TOKEN to Vercel env vars" }, { status: 500 });
    }

    const blob = await put(`documents/${companyId}/${file.name}`, file, {
      access: "public",
    });

    const [doc] = await db
      .insert(documents)
      .values({
        companyId,
        documentType: (documentType as "nda" | "proposal" | "contract" | "commercial" | "presentation" | "meeting" | "legal" | "other") ?? "other",
        name: name || file.name,
        mimeType: file.type,
        webUrl: blob.url,
        fileSize: file.size,
      })
      .returning({ id: documents.id });

    return NextResponse.json({ id: doc.id, url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Document upload error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
