"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ExternalLink } from "lucide-react";
import { SEED_SIGNALS, formatTimeAgo, type SeedSignal } from "@/lib/seed-data";

const signalTypeColors: Record<string, string> = {
  NEW_LICENSE: "bg-primary/10 text-primary border-primary/30",
  LICENSE_APPROVAL: "bg-primary/10 text-primary border-primary/30",
  LICENSE_CHANGE: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  FUNDING: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  HIRING_SURGE: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  ENGINEERING_HIRING: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  DEVOPS_HIRING: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  PROVIDER_CHANGE: "bg-destructive/10 text-destructive border-destructive/30",
  MARKET_EXPANSION: "bg-chart-3/10 text-chart-3 border-chart-3/30",
  NEW_CASINO: "bg-chart-5/10 text-chart-5 border-chart-5/30",
  NEW_BRAND: "bg-chart-5/10 text-chart-5 border-chart-5/30",
  ACQUISITION: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  REGULATORY_CHANGE: "bg-warning/10 text-warning border-warning/30",
  NEW_PRODUCT: "bg-success/10 text-success border-success/30",
};

const sourceLabels: Record<string, { label: string; icon: string }> = {
  primary: { label: "Primary Source", icon: "★" },
  company: { label: "Company Source", icon: "◆" },
  secondary: { label: "Secondary Source", icon: "●" },
  inference: { label: "AI Inference", icon: "○" },
};

const confidenceColor = (c: number) => {
  if (c >= 90) return "text-success";
  if (c >= 70) return "text-chart-2";
  return "text-muted-foreground";
};

export default function SignalsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const signalTypes = [...new Set(SEED_SIGNALS.map((s) => s.type))].sort();

  const filtered = SEED_SIGNALS.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.company.toLowerCase().includes(q) && !s.title.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (sourceFilter !== "all" && s.source !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Signals</h1>
        <p className="text-sm text-muted-foreground">
          Detected iGaming buying signals from all sources
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Signals</div>
            <div className="text-2xl font-bold tabular-nums">{SEED_SIGNALS.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">High Confidence</div>
            <div className="text-2xl font-bold tabular-nums text-success">
              {SEED_SIGNALS.filter((s) => s.confidence >= 90).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Primary Sources</div>
            <div className="text-2xl font-bold tabular-nums text-primary">
              {SEED_SIGNALS.filter((s) => s.source === "primary").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Companies</div>
            <div className="text-2xl font-bold tabular-nums">
              {new Set(SEED_SIGNALS.filter((s) => s.companyId !== "comp-0").map((s) => s.companyId)).size}
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
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {signalTypes.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? "all")}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="inference">AI Inference</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((signal) => (
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
    </div>
  );
}

function SignalCard({ signal }: { signal: SeedSignal }) {
  const src = sourceLabels[signal.source];

  return (
    <Card className="hover:bg-accent/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
            <span className="text-sm" title={src.label}>{src.icon}</span>
            <span className={`text-xs font-bold tabular-nums ${confidenceColor(signal.confidence)}`}>
              {signal.confidence}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={`text-[10px] font-mono shrink-0 ${signalTypeColors[signal.type] ?? ""}`}>
                {signal.type}
              </Badge>
              <span className="text-lg leading-none">{signal.flag}</span>
              <span className="text-xs font-medium">{signal.company}</span>
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                {formatTimeAgo(signal.detectedAt)}
              </span>
            </div>
            <h3 className="text-sm font-medium mb-1">{signal.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{signal.summary}</p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span>Source: {signal.sourceName}</span>
              <span>{signal.jurisdiction}</span>
              {signal.url && (
                <span className="flex items-center gap-0.5">
                  <ExternalLink className="h-2.5 w-2.5" /> Link
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
