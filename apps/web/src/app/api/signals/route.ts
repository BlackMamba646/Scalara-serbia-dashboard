import { NextResponse } from "next/server";
import { getRecentSignals } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "20");

  try {
    const signals = await getRecentSignals(limit);
    return NextResponse.json(signals);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
