"use client";

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
import { Database, Activity, Clock } from "lucide-react";
import { SEED_SOURCES, formatTimeAgo } from "@/lib/seed-data";

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  planned: "bg-muted text-muted-foreground border-border",
  error: "bg-destructive/10 text-destructive border-destructive/30",
};

const typeStyles: Record<string, string> = {
  Regulator: "bg-primary/10 text-primary",
  News: "bg-chart-2/10 text-chart-2",
  Jobs: "bg-chart-4/10 text-chart-4",
  Funding: "bg-chart-5/10 text-chart-5",
};

const reliabilityStars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default function SourcesPage() {
  const activeSources = SEED_SOURCES.filter((s) => s.status === "active").length;
  const totalRecords = SEED_SOURCES.reduce((sum, s) => sum + s.records, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sources</h1>
        <p className="text-sm text-muted-foreground">
          Data source configuration and crawl monitoring
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Sources</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{SEED_SOURCES.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Active</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-success">{activeSources}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Records</div>
            <div className="text-2xl font-bold tabular-nums">{totalRecords.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Planned</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{SEED_SOURCES.length - activeSources}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Reliability</TableHead>
                <TableHead className="pr-4">Last Crawl</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SEED_SOURCES.map((source) => (
                <TableRow key={source.name}>
                  <TableCell className="pl-4">
                    <div>
                      <div className="font-medium text-sm">{source.name}</div>
                      {source.connector && (
                        <div className="text-[10px] text-muted-foreground font-mono">{source.connector}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] ${typeStyles[source.type] ?? ""}`}>
                      {source.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusStyles[source.status]}`}>
                      {source.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{source.jurisdiction}</TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {source.records > 0 ? source.records.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{source.frequency}</TableCell>
                  <TableCell>
                    <span className="text-xs text-chart-2">{reliabilityStars(source.reliability)}</span>
                  </TableCell>
                  <TableCell className="pr-4 text-xs text-muted-foreground">
                    {source.lastCrawl ? formatTimeAgo(source.lastCrawl) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
