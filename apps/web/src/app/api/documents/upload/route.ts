import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const companyId = formData.get("companyId") as string | null;
  const documentType = formData.get("documentType") as string | null;
  const name = formData.get("name") as string | null;

  if (!file || !companyId) {
    return NextResponse.json({ error: "File and companyId are required" }, { status: 400 });
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
}
