export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCompanyWithRelations } from "@/lib/db/queries";
import { CompanyAccountClient } from "./_client";

export default async function CompanyAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCompanyWithRelations(id);
  if (!data) notFound();

  return <CompanyAccountClient data={data} />;
}
