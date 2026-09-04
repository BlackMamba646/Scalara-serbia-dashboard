import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { googleAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  exchangeCodeForTokens,
  getGoogleUser,
} from "@/lib/google";
import { setSessionCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/login?error=${error || "no_code"}`, base)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const user = await getGoogleUser(tokens.access_token);
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    const existing = await db
      .select()
      .from(googleAccounts)
      .where(eq(googleAccounts.email, user.email))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(googleAccounts)
        .set({
          name: user.name,
          picture: user.picture,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? existing[0].refreshToken,
          tokenExpiry,
          scopes: tokens.scope,
          updatedAt: new Date(),
        })
        .where(eq(googleAccounts.email, user.email));
    } else {
      await db.insert(googleAccounts).values({
        email: user.email,
        name: user.name,
        picture: user.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry,
        scopes: tokens.scope,
      });
    }

    await setSessionCookie();

    return NextResponse.redirect(new URL("/", base));
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", base)
    );
  }
}
