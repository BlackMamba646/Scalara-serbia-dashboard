import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google";

export async function GET() {
  try {
    const url = getGoogleAuthUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    );
  }
}
