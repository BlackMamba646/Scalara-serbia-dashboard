export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { documents, companies } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { DocumentsClient } from "./_client";

export default async function DocumentsPage() {
  const data = await db
    .select({
      id: documents.id,
      companyId: documents.companyId,
      companyName: companies.canonicalName,
      documentType: documents.documentType,
      name: documents.name,
      mimeType: documents.mimeType,
      webUrl: documents.webUrl,
      fileSize: documents.fileSize,
      uploadedBy: documents.uploadedBy,
      ndaStatus: documents.ndaStatus,
      ndaSignedDate: documents.ndaSignedDate,
      ndaExpiryDate: documents.ndaExpiryDate,
      ndaCounterparty: documents.ndaCounterparty,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .leftJoin(companies, eq(documents.companyId, companies.id))
    .orderBy(desc(documents.createdAt));

  return <DocumentsClient documents={data} />;
}
