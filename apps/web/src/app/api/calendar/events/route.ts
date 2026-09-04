import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getValidAccessToken } from "@/lib/google";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Google account not connected", connected: false },
      { status: 401 }
    );
  }

  const { searchParams } = request.nextUrl;
  const timeMin =
    searchParams.get("timeMin") || new Date().toISOString();
  const timeMax =
    searchParams.get("timeMax") ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const maxResults = searchParams.get("maxResults") || "50";

  try {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      maxResults,
      singleEvents: "true",
      orderBy: "startTime",
    });

    const res = await fetch(
      `${CALENDAR_API}/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Google Calendar API error:", err);
      return NextResponse.json(
        { error: "Failed to fetch calendar events" },
        { status: res.status }
      );
    }

    const data = await res.json();

    const events = (data.items || []).map(
      (event: Record<string, unknown>) => ({
        id: event.id,
        summary: event.summary || "(No title)",
        description: event.description,
        start:
          (event.start as Record<string, string>)?.dateTime ||
          (event.start as Record<string, string>)?.date,
        end:
          (event.end as Record<string, string>)?.dateTime ||
          (event.end as Record<string, string>)?.date,
        location: event.location,
        htmlLink: event.htmlLink,
        hangoutLink: event.hangoutLink,
        status: event.status,
        attendees: event.attendees,
        conferenceData: event.conferenceData,
      })
    );

    return NextResponse.json({ events, connected: true });
  } catch (err) {
    console.error("Calendar fetch error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
