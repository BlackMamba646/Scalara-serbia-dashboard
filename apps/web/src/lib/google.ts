import { db } from "@/lib/db";
import { googleAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

function getClientId() {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID not set");
  return id;
}

function getClientSecret() {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET not set");
  return secret;
}

function getRedirectUri() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/auth/google/callback`;
}

export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  });
  if (state) params.set("state", state);
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

export async function exchangeCodeForTokens(
  code: string
): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  return res.json();
}

type GoogleUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

export async function getGoogleUser(
  accessToken: string
): Promise<GoogleUser> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch Google user info");
  return res.json();
}

export async function getValidAccessToken(): Promise<string | null> {
  const [account] = await db
    .select()
    .from(googleAccounts)
    .limit(1);

  if (!account) return null;

  const now = new Date();
  const bufferMs = 5 * 60 * 1000;
  if (account.tokenExpiry && account.tokenExpiry.getTime() - bufferMs > now.getTime()) {
    return account.accessToken;
  }

  if (!account.refreshToken) return null;

  try {
    const refreshed = await refreshAccessToken(account.refreshToken);
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000);

    await db
      .update(googleAccounts)
      .set({
        accessToken: refreshed.access_token,
        tokenExpiry: newExpiry,
        updatedAt: new Date(),
      })
      .where(eq(googleAccounts.id, account.id));

    return refreshed.access_token;
  } catch {
    return null;
  }
}

export async function getGoogleAccount() {
  const [account] = await db
    .select({
      id: googleAccounts.id,
      email: googleAccounts.email,
      name: googleAccounts.name,
      picture: googleAccounts.picture,
      scopes: googleAccounts.scopes,
      createdAt: googleAccounts.createdAt,
    })
    .from(googleAccounts)
    .limit(1);

  return account ?? null;
}
