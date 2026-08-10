import { NextResponse } from "next/server";
import { getCompanies } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");

  try {
    const result = await getCompanies(limit, offset);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
