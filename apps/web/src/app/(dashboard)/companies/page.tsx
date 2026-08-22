export const dynamic = "force-dynamic";

import { getCompanies } from "@/lib/db/queries";
import { CompaniesClient } from "./_client";

export default async function CompaniesPage() {
  const raw = await getCompanies(200);
  const companies = raw.map((c) => ({
    id: c.id,
    name: c.canonicalName,
    legalName: c.legalName,
    country: c.country,
    type: c.companyType,
    employees: c.employeeCount,
    website: c.websiteUrl,
    description: c.description,
    isActive: c.isActive,
  }));
  return <CompaniesClient companies={companies} />;
}
