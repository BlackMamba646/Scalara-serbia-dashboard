"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

type SignalRow = {
  id: string;
  signalType: string;
  companyName: string | null;
  title: string;
  summary: string | null;
  evidenceConfidence: number | null;
  salesIntent: number | null;
  detectedAt: Date;
  isVerified: boolean;
};

const signalTypeColors: Record<string, string> = {
  new_license: "bg-primary/10 text-primary border-primary/30",
  license_approval: "bg-primary/10 text-primary border-primary/30",
  license_change: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  funding: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  hiring_surge: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  engineering_hiring: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  devops_hiring: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  provider_change: "bg-destructive/10 text-destructive border-destructive/30",
  market_expansion: "bg-chart-3/10 text-chart-3 border-chart-3/30",
  new_casino: "bg-chart-5/10 text-chart-5 border-chart-5/30",
  new_brand: "bg-chart-5/10 text-chart-5 border-chart-5/30",
  acquisition: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  regulatory_change: "bg-warning/10 text-warning border-warning/30",
  new_product: "bg-success/10 text-success border-success/30",
  soft_launch: "bg-chart-5/10 text-chart-5 border-chart-5/30",
  platform_pain: "bg-destructive/10 text-destructive border-destructive/30",
  platform_migration: "bg-destructive/10 text-destructive border-destructive/30",
  payments_need: "bg-chart-2/10 text-chart-2 border-chart-2/30",
};

const confidenceColor = (c: number) => {
  if (c >= 90) return "text-success";
  if (c >= 70) return "text-chart-2";
  return "text-muted-foreground";
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const PAGE_SIZE = 50;

export function SignalsClient({ signals }: { signals: SignalRow[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const signalTypes = [...new Set(signals.map((s) => s.signalType))].sort();

  const filtered = signals.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !(s.companyName ?? "").toLowerCase().includes(q) &&
        !s.title.toLowerCase().includes(q)
      )
        return false;
    }
    if (typeFilter !== "all" && s.signalType !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const highConfidence = signals.filter(
    (s) => (s.evidenceConfidence ?? 0) >= 90
  ).length;
  const uniqueCompanies = new Set(
    signals.filter((s) => s.companyName).map((s) => s.companyName)
  ).size;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Signals</h1>
        <p className="text-sm text-muted-foreground">
          Detected iGaming buying signals from all sources
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Total Signals
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {signals.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              High Confidence
            </div>
            <div className="text-2xl font-bold tabular-nums text-success">
              {highConfidence}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Companies
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {uniqueCompanies}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search signals..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => { setTypeFilter(v ?? "all"); setPage(1); }}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {signalTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t.toUpperCase().replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {paged.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No signals match your filters.
            </CardContent>
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1.5 text-xs rounded-md border bg-background hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
            >
              Previous
            </button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 text-xs rounded-md border bg-background hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SignalCard({ signal }: { signal: SignalRow }) {
  const confidence = signal.evidenceConfidence ?? 50;

  return (
    <Card className="hover:bg-accent/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
            <span
              className={`text-xs font-bold tabular-nums ${confidenceColor(confidence)}`}
            >
              {confidence}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[10px] font-mono shrink-0 ${signalTypeColors[signal.signalType] ?? ""}`}
              >
                {signal.signalType.toUpperCase().replace(/_/g, " ")}
              </Badge>
              <span className="text-xs font-medium">
                {signal.companyName ?? "Unknown"}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                {timeAgo(new Date(signal.detectedAt))}
              </span>
            </div>
            <h3 className="text-sm font-medium mb-1">{signal.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {signal.summary}
            </p>
            {signal.isVerified && (
              <div className="mt-2">
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-success/10 text-success"
                >
                  Verified
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
