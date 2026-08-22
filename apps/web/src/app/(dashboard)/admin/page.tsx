export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Database, Zap, HardDrive } from "lucide-react";
import { db } from "@/lib/db";
import { companies, signals, opportunities, sources, crawlRuns } from "@/lib/db/schema";
import { count, desc, eq } from "drizzle-orm";

export default async function AdminPage() {
  const [companyCount, signalCount, opportunityCount, sourceCount, recentCrawls] =
    await Promise.all([
      db.select({ count: count() }).from(companies),
      db.select({ count: count() }).from(signals),
      db.select({ count: count() }).from(opportunities),
      db.select({ count: count() }).from(sources),
      db
        .select({
          id: crawlRuns.id,
          sourceName: sources.name,
          status: crawlRuns.status,
          startedAt: crawlRuns.startedAt,
          completedAt: crawlRuns.completedAt,
          documentsProcessed: crawlRuns.documentsProcessed,
          newRecords: crawlRuns.newRecords,
          errors: crawlRuns.errors,
        })
        .from(crawlRuns)
        .innerJoin(sources, eq(crawlRuns.sourceId, sources.id))
        .orderBy(desc(crawlRuns.createdAt))
        .limit(10),
    ]);

  const systemMetrics = [
    { label: "Companies Tracked", value: companyCount[0]?.count ?? 0, icon: Database, color: "text-primary" },
    { label: "Active Signals", value: signalCount[0]?.count ?? 0, icon: Zap, color: "text-chart-2" },
    { label: "Opportunities", value: opportunityCount[0]?.count ?? 0, icon: Activity, color: "text-success" },
    { label: "Data Sources", value: sourceCount[0]?.count ?? 0, icon: HardDrive, color: "text-chart-3" },
  ];

  const jobStatusStyles: Record<string, string> = {
    completed: "bg-success/10 text-success border-success/30",
    running: "bg-primary/10 text-primary border-primary/30",
    failed: "bg-destructive/10 text-destructive border-destructive/30",
    pending: "bg-muted text-muted-foreground border-border",
  };

  function formatDuration(start: Date | null, end: Date | null): string {
    if (!start || !end) return "-";
    const ms = end.getTime() - start.getTime();
    return `${(ms / 1000).toFixed(1)}s`;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          System monitoring and pipeline health
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {systemMetrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</span>
              </div>
              <div className="text-2xl font-bold tabular-nums">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Pipeline Jobs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Processed</TableHead>
                  <TableHead className="pr-4">Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCrawls.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="pl-4 text-sm font-medium">{job.sourceName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${jobStatusStyles[job.status] ?? ""}`}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {formatDuration(job.startedAt, job.completedAt)}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">{job.documentsProcessed ?? 0}</TableCell>
                    <TableCell className="pr-4 text-xs tabular-nums">{job.errors ?? 0}</TableCell>
                  </TableRow>
                ))}
                {recentCrawls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                      No crawl runs yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <HealthItem label="API Server" status="healthy" detail="FastAPI workers on port 8000" />
            <HealthItem label="PostgreSQL" status="healthy" detail="Connected via Drizzle ORM" />
            <HealthItem label="Cron Jobs" status="healthy" detail="Render cron -- HTTP triggers" />
            <HealthItem label="Crawl Scheduler" status="healthy" detail="Sources configured in DB" />
            <HealthItem label="LLM Provider" status="healthy" detail="LiteLLM -- claude-haiku-4-5" />
            <HealthItem label="AI Budget" status="warning" detail="$12.40 / $50.00 monthly limit" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HealthItem({ label, status, detail }: { label: string; status: "healthy" | "warning" | "error"; detail: string }) {
  const dotColor = status === "healthy" ? "bg-success" : status === "warning" ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-3">
      <div className={`h-2 w-2 rounded-full ${dotColor}`} />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
      <Badge variant="outline" className={`text-[10px] ${status === "healthy" ? "text-success border-success/30" : status === "warning" ? "text-warning border-warning/30" : "text-destructive border-destructive/30"}`}>
        {status}
      </Badge>
    </div>
  );
}
