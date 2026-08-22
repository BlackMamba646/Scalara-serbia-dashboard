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

type SourceRow = {
  id: string;
  name: string;
  sourceType: string;
  baseUrl: string | null;
  isActive: boolean;
  crawlFrequencyMinutes: number | null;
  lastCrawledAt: Date | null;
  lastSuccessAt: Date | null;
  errorCount: number | null;
};

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-border",
};

const typeStyles: Record<string, string> = {
  regulator: "bg-primary/10 text-primary",
  news: "bg-chart-2/10 text-chart-2",
  jobs: "bg-chart-4/10 text-chart-4",
  funding: "bg-chart-5/10 text-chart-5",
  company: "bg-chart-3/10 text-chart-3",
  search: "bg-chart-1/10 text-chart-1",
};

function formatFrequency(minutes: number | null): string {
  if (minutes == null) return "-";
  if (minutes < 60) return `Every ${minutes}m`;
  if (minutes < 1440) return `Every ${Math.round(minutes / 60)}h`;
  return `Every ${Math.round(minutes / 1440)}d`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function SourcesClient({ sources }: { sources: SourceRow[] }) {
  const activeSources = sources.filter((s) => s.isActive).length;

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
            <div className="text-2xl font-bold tabular-nums">{sources.length}</div>
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
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Inactive</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{sources.length - activeSources}</div>
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
                <TableHead>Frequency</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead className="pr-4">Last Crawl</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="pl-4">
                    <div>
                      <div className="font-medium text-sm">{source.name}</div>
                      {source.baseUrl && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-52">{source.baseUrl}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] ${typeStyles[source.sourceType] ?? ""}`}>
                      {source.sourceType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusStyles[source.isActive ? "active" : "inactive"]}`}>
                      {source.isActive ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatFrequency(source.crawlFrequencyMinutes)}
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {source.errorCount ?? 0}
                  </TableCell>
                  <TableCell className="pr-4 text-xs text-muted-foreground">
                    {source.lastCrawledAt ? timeAgo(source.lastCrawledAt) : "-"}
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
