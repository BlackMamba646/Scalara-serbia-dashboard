"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, ExternalLink, RefreshCw } from "lucide-react";

type MeetingRow = {
  id: string;
  title: string;
  companyId: string | null;
  companyName: string | null;
  startTime: Date;
  endTime: Date | null;
  status: string;
  notes: string | null;
  summary: string | null;
};

type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  status: string;
  attendees?: { email: string; displayName?: string; responseStatus?: string }[];
  conferenceData?: {
    entryPoints?: { entryPointType: string; uri: string }[];
  };
};

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-chart-2/10 text-chart-2",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/10 text-destructive",
};

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const date = s.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const startTime = s.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = e.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${startTime} - ${endTime}`;
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function getMeetLink(event: CalendarEvent): string | null {
  if (event.hangoutLink) return event.hangoutLink;
  const entryPoints = event.conferenceData?.entryPoints;
  if (!entryPoints) return null;
  const video = entryPoints.find((e) => e.entryPointType === "video");
  return video?.uri ?? null;
}

export function MeetingsClient({
  meetings,
  googleConnected,
}: {
  meetings: MeetingRow[];
  googleConnected: boolean;
}) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);

  const now = new Date();
  const upcoming = meetings.filter(
    (m) => new Date(m.startTime) >= now && m.status === "scheduled"
  );
  const past = meetings.filter(
    (m) => new Date(m.startTime) < now || m.status !== "scheduled"
  );

  async function fetchCalendarEvents() {
    setCalLoading(true);
    setCalError(null);
    try {
      const res = await fetch("/api/calendar/events");
      const data = await res.json();
      if (data.connected === false) {
        setCalError("not_connected");
        return;
      }
      if (!res.ok) {
        setCalError(data.error || "Failed to fetch");
        return;
      }
      setCalendarEvents(data.events || []);
    } catch {
      setCalError("Network error");
    } finally {
      setCalLoading(false);
    }
  }

  useEffect(() => {
    if (googleConnected) {
      fetchCalendarEvents();
    }
  }, [googleConnected]);

  const upcomingCal = calendarEvents.filter(
    (e) => new Date(e.start) >= now && e.status !== "cancelled"
  );
  const todayCal = upcomingCal.filter((e) => isToday(e.start));
  const laterCal = upcomingCal.filter((e) => !isToday(e.start));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-sm text-muted-foreground">
            {googleConnected
              ? "Google Calendar synced"
              : "Connect Google in Settings for calendar sync"}
          </p>
        </div>
        {googleConnected && (
          <button
            onClick={fetchCalendarEvents}
            disabled={calLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${calLoading ? "animate-spin" : ""}`} />
            Sync
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Today</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-primary">{todayCal.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-chart-2" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Upcoming</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-chart-2">{upcomingCal.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">CRM Meetings</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{upcoming.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Past</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{past.length}</div>
          </CardContent>
        </Card>
      </div>

      {!googleConnected && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Connect Google Calendar</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              See your upcoming meetings and sync with your CRM
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Settings
            </Link>
          </CardContent>
        </Card>
      )}

      {calError && calError !== "not_connected" && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load calendar: {calError}
          </CardContent>
        </Card>
      )}

      {todayCal.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {todayCal.map((event) => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {laterCal.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Upcoming Calendar Events</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {laterCal.map((event) => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">CRM Meetings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {upcoming.map((meeting) => (
                <CrmMeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {past.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Past CRM Meetings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {past.map((meeting) => (
                <CrmMeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!googleConnected && meetings.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No meetings yet. Connect Google Calendar or create meetings from company pages.
        </div>
      )}
    </div>
  );
}

function CalendarEventCard({ event }: { event: CalendarEvent }) {
  const meetLink = getMeetLink(event);
  const attendeeCount = event.attendees?.length ?? 0;

  return (
    <div className="flex items-start justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{event.summary}</span>
          {meetLink && (
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors shrink-0"
            >
              <Video className="h-3 w-3" />
              Join
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{formatTimeRange(event.start, event.end)}</span>
          {attendeeCount > 0 && (
            <span className="text-muted-foreground/60">
              &middot; {attendeeCount} attendee{attendeeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {event.location && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {event.location}
          </p>
        )}
      </div>
      {event.htmlLink && (
        <a
          href={event.htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground ml-2 shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

function CrmMeetingCard({ meeting }: { meeting: MeetingRow }) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
      <div className="min-w-0">
        <div className="font-medium text-sm">{meeting.title}</div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className={`text-[9px] ${statusColors[meeting.status] ?? ""}`}>
            {meeting.status.replace("_", " ")}
          </Badge>
          {meeting.companyName && (
            <Link
              href={`/companies/${meeting.companyId}`}
              className="text-[10px] text-primary hover:underline"
            >
              {meeting.companyName}
            </Link>
          )}
        </div>
        {meeting.summary && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{meeting.summary}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0 ml-3">
        {formatDateTime(meeting.startTime)}
      </span>
    </div>
  );
}
