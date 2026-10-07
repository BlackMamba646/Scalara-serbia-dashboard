import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/google";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type GmailMessage = {
  id: string;
  threadId: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
    }>;
  };
  snippet: string;
  internalDate: string;
};

function getHeader(msg: GmailMessage, name: string): string {
  return (
    msg.payload.headers.find(
      (h) => h.name.toLowerCase() === name.toLowerCase()
    )?.value ?? ""
  );
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function getBody(msg: GmailMessage): string {
  if (msg.payload.body?.data) {
    return decodeBase64Url(msg.payload.body.data);
  }
  const textPart = msg.payload.parts?.find(
    (p) => p.mimeType === "text/plain"
  );
  if (textPart?.body?.data) {
    return decodeBase64Url(textPart.body.data);
  }
  const htmlPart = msg.payload.parts?.find(
    (p) => p.mimeType === "text/html"
  );
  if (htmlPart?.body?.data) {
    const html = decodeBase64Url(htmlPart.body.data);
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return msg.snippet;
}

function extractNameFromEmail(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  return from.split("@")[0];
}

function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  if (match) return match[1];
  return from.trim();
}

function generateRefId(): string {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SL-${date}-${rand}`;
}

function detectLeadSource(from: string, subject: string, body: string): string {
  const text = `${subject} ${body}`.toLowerCase();
  if (text.includes("chatgpt") || text.includes("ai assistant") || text.includes("claude"))
    return "AI Assistant";
  if (text.includes("linkedin")) return "LinkedIn";
  if (text.includes("referral") || text.includes("referred")) return "Referral";
  if (text.includes("google") || text.includes("search")) return "Organic Search";
  if (text.includes("demo") || text.includes("trial")) return "Website Demo Form";
  return "Email Inbound";
}

function extractWebsite(body: string): string | null {
  const urlMatch = body.match(
    /(?:website|url|site|www)[:\s]*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
  );
  if (urlMatch) return urlMatch[1];
  return null;
}

export async function POST() {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 401 }
      );
    }

    const query = encodeURIComponent(
      "subject:(demo OR trial OR inquiry OR interested OR request OR scalara) -from:me is:inbox"
    );
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const err = await listRes.text();
      return NextResponse.json(
        { error: `Gmail API error: ${err}` },
        { status: listRes.status }
      );
    }

    const listData = await listRes.json();
    const messageIds: Array<{ id: string }> = listData.messages ?? [];

    let created = 0;
    let skipped = 0;

    for (const { id } of messageIds) {
      const existing = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.gmailMessageId, id))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!msgRes.ok) continue;

      const msg: GmailMessage = await msgRes.json();
      const from = getHeader(msg, "From");
      const subject = getHeader(msg, "Subject");
      const body = getBody(msg);
      const email = extractEmailAddress(from);
      const name = extractNameFromEmail(from);

      const knownNoise = [
        "noreply",
        "no-reply",
        "mailer-daemon",
        "notifications",
        "newsletter",
        "support@google",
        "calendar-notification",
      ];
      if (knownNoise.some((n) => email.toLowerCase().includes(n))) {
        skipped++;
        continue;
      }

      const existingByEmail = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.email, email))
        .limit(1);

      if (existingByEmail.length > 0) {
        skipped++;
        continue;
      }

      await db.insert(leads).values({
        refId: generateRefId(),
        name,
        email,
        company: extractWebsite(body) ?? undefined,
        website: extractWebsite(body) ?? undefined,
        description: `${subject}\n\n${body.slice(0, 500)}`,
        leadSource: detectLeadSource(from, subject, body),
        gmailMessageId: id,
        gmailThreadId: msg.threadId,
      });

      created++;
    }

    return NextResponse.json({ created, skipped, total: messageIds.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("Lead sync error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
