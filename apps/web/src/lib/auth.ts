import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "scalara_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  return process.env.AUTH_SECRET ?? process.env.AUTH_PASSWORD ?? "changeme";
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function verify(value: string, signature: string): boolean {
  const expected = sign(value);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  return verify(payload, sig);
}

export async function setSessionCookie() {
  const cookieStore = await cookies();
  const payload = Date.now().toString(36);
  const token = `${payload}.${sign(payload)}`;
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.AUTH_PASSWORD;
  if (!expected) return false;
  if (expected.length !== password.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(password));
}
