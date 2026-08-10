import { NextResponse } from "next/server";
import { getHotOpportunities } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "10");

  try {
    const opportunities = await getHotOpportunities(limit);
    return NextResponse.json(opportunities);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
