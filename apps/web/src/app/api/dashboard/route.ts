import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/db/queries";

export async function GET() {
  try {
    const metrics = await getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch {
    return NextResponse.json(
      {
        hotLeads: 0,
        activeSignals: 0,
        avgFit: 0,
        licenseChanges: 0,
        totalCompanies: 0,
      },
      { status: 200 }
    );
  }
}
