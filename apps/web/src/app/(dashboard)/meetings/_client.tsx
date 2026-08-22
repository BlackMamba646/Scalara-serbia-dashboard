"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

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

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-chart-2/10 text-chart-2",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/10 text-destructive",
};

function formatDateTime(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MeetingsClient({ meetings }: { meetings: MeetingRow[] }) {
  const now = new Date();
  const upcoming = meetings.filter(
    (m) => new Date(m.startTime) >= now && m.status === "scheduled"
  );
  const past = meetings.filter(
    (m) => new Date(m.startTime) < now || m.status !== "scheduled"
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
        <p className="text-sm text-muted-foreground">
          Scheduled and past meetings with prospects and customers
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Upcoming</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-primary">{upcoming.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{meetings.length}</div>
          </CardContent>
        </Card>
      </div>

      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {upcoming.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {upcoming.length > 0 ? "Past Meetings" : "All Meetings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {past.length === 0 && meetings.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No meetings yet. Create meetings from company account pages.
            </div>
          ) : past.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No past meetings.
            </div>
          ) : (
            <div className="space-y-2">
              {past.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: MeetingRow }) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
      <div className="min-w-0">
        <div className="font-medium text-sm">{meeting.title}</div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className={`text-[9px] ${statusColors[meeting.status] ?? ""}`}>
            {meeting.status.replace("_", " ")}
          </Badge>
          {meeting.companyName && (
            <Link href={`/companies/${meeting.companyId}`} className="text-[10px] text-primary hover:underline">
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
