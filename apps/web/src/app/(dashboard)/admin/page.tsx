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
import { Activity, Database, Cpu, Clock, Zap, HardDrive } from "lucide-react";
import { SEED_SOURCES, SEED_COMPANIES, SEED_SIGNALS, SEED_OPPORTUNITIES } from "@/lib/seed-data";

const systemMetrics = [
  { label: "Companies Tracked", value: SEED_COMPANIES.length, icon: Database, color: "text-primary" },
  { label: "Active Signals", value: SEED_SIGNALS.length, icon: Zap, color: "text-chart-2" },
  { label: "Opportunities", value: SEED_OPPORTUNITIES.length, icon: Activity, color: "text-success" },
  { label: "Data Sources", value: SEED_SOURCES.length, icon: HardDrive, color: "text-chart-3" },
];

const recentJobs = [
  { id: "job-1", source: "UKGC", type: "Full Crawl", status: "completed", duration: "12.4s", records: 2665, time: "2026-08-10 06:00" },
  { id: "job-2", source: "GCGRA (UAE)", type: "Full Crawl", status: "completed", duration: "3.2s", records: 26, time: "2026-08-10 06:00" },
  { id: "job-3", source: "iGaming Business", type: "RSS Fetch", status: "completed", duration: "1.8s", records: 12, time: "2026-08-10 08:00" },
  { id: "job-4", source: "Gaming Intelligence", type: "RSS Fetch", status: "completed", duration: "2.1s", records: 8, time: "2026-08-10 08:00" },
  { id: "job-5", source: "SBC News", type: "RSS Fetch", status: "completed", duration: "1.5s", records: 6, time: "2026-08-10 08:00" },
  { id: "job-6", source: "Signal Extraction", type: "Pipeline", status: "completed", duration: "4.7s", records: 15, time: "2026-08-10 08:05" },
  { id: "job-7", source: "Entity Resolution", type: "Pipeline", status: "completed", duration: "2.3s", records: 9, time: "2026-08-10 08:06" },
  { id: "job-8", source: "Scoring Engine", type: "Pipeline", status: "completed", duration: "1.9s", records: 9, time: "2026-08-10 08:07" },
];

const jobStatusStyles: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/30",
  running: "bg-primary/10 text-primary border-primary/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  pending: "bg-muted text-muted-foreground border-border",
};

export default function AdminPage() {
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
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="pr-4">Records</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="pl-4 text-sm font-medium">{job.source}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{job.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${jobStatusStyles[job.status]}`}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">{job.duration}</TableCell>
                    <TableCell className="pr-4 text-xs tabular-nums">{job.records}</TableCell>
                  </TableRow>
                ))}
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
            <HealthItem label="PostgreSQL" status="healthy" detail="5 tables, 4,673 rows" />
            <HealthItem label="Redis" status="healthy" detail="Queue depth: 0, Memory: 2.1MB" />
            <HealthItem label="Crawl Scheduler" status="healthy" detail="5 active sources, next run in 4h" />
            <HealthItem label="LLM Provider" status="healthy" detail="LiteLLM — claude-haiku-4-5" />
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
