import { NextResponse } from "next/server";
import { getSources } from "@/lib/db/queries";

export async function GET() {
  try {
    const result = await getSources();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
