"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Mail, ArrowUpDown, ExternalLink } from "lucide-react";
import { SEED_OPPORTUNITIES, formatTimeAgo, type SeedOpportunity } from "@/lib/seed-data";

const recommendationStyles: Record<string, string> = {
  pursue: "bg-primary/10 text-primary border-primary/30",
  qualify: "bg-warning/10 text-warning border-warning/30",
  monitor: "bg-muted text-muted-foreground border-border",
};

const recommendationLabels: Record<string, string> = {
  pursue: "Pursue Now",
  qualify: "Qualify First",
  monitor: "Monitor",
};

const statusStyles: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  review: "bg-chart-2/10 text-chart-2",
  qualified: "bg-success/10 text-success",
  contacted: "bg-chart-3/10 text-chart-3",
  meeting: "bg-chart-5/10 text-chart-5",
  watch: "bg-muted text-muted-foreground",
};

type SortKey = "score" | "fit" | "confidence" | "detectedAt";

export default function OpportunitiesPage() {
  const [search, setSearch] = useState("");
  const [recFilter, setRecFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = SEED_OPPORTUNITIES
    .filter((o) => {
      if (search && !o.company.toLowerCase().includes(search.toLowerCase())) return false;
      if (recFilter !== "all" && o.recommendation !== recFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      if (sortKey === "detectedAt") return mul * (new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime());
      return mul * ((a[sortKey] as number) - (b[sortKey] as number));
    });

  const pursueCount = SEED_OPPORTUNITIES.filter((o) => o.recommendation === "pursue").length;
  const qualifyCount = SEED_OPPORTUNITIES.filter((o) => o.recommendation === "qualify").length;
  const monitorCount = SEED_OPPORTUNITIES.filter((o) => o.recommendation === "monitor").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
        <p className="text-sm text-muted-foreground">
          Scored and ranked sales opportunities from detected signals
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold tabular-nums text-primary">{pursueCount}</div>
              <div className="text-xs text-muted-foreground">Pursue Now</div>
            </div>
            <Badge variant="outline" className={recommendationStyles.pursue}>Hot</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold tabular-nums text-warning">{qualifyCount}</div>
              <div className="text-xs text-muted-foreground">Qualify First</div>
            </div>
            <Badge variant="outline" className={recommendationStyles.qualify}>Warm</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold tabular-nums">{monitorCount}</div>
              <div className="text-xs text-muted-foreground">Monitor</div>
            </div>
            <Badge variant="outline" className={recommendationStyles.monitor}>Watch</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">All Opportunities</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-48 pl-8 text-sm"
                />
              </div>
              <Select value={recFilter} onValueChange={(v) => setRecFilter(v ?? "all")}>
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recommendations</SelectItem>
                  <SelectItem value="pursue">Pursue Now</SelectItem>
                  <SelectItem value="qualify">Qualify First</SelectItem>
                  <SelectItem value="monitor">Monitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Company</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>
                  <button onClick={() => toggleSort("score")} className="flex items-center gap-1 hover:text-foreground">
                    Score <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort("fit")} className="flex items-center gap-1 hover:text-foreground">
                    Fit <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Signals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <button onClick={() => toggleSort("detectedAt")} className="flex items-center gap-1 hover:text-foreground">
                    Detected <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((opp) => (
                <OpportunityRow key={opp.id} opp={opp} />
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No opportunities match your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OpportunityRow({ opp }: { opp: SeedOpportunity }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <TableCell className="pl-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{opp.flag}</span>
            <div>
              <div className="font-medium text-sm">{opp.company}</div>
              <div className="text-[10px] text-muted-foreground">{opp.jurisdiction}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={`text-[10px] ${recommendationStyles[opp.recommendation]}`}>
            {recommendationLabels[opp.recommendation]}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="text-lg font-bold tabular-nums text-primary">{opp.score}</span>
        </TableCell>
        <TableCell>
          <span className="tabular-nums font-medium">{opp.fit}</span>
          <span className="text-muted-foreground text-xs">/10</span>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1 max-w-48">
            {opp.signals.map((s) => (
              <Badge key={s} variant="secondary" className="text-[9px] font-mono">
                {s}
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className={`text-[10px] ${statusStyles[opp.status]}`}>
            {opp.status}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(opp.detectedAt)}</span>
        </TableCell>
        <TableCell className="pr-4">
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
              <Mail className="mr-1 h-3 w-3" />
              Email
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={8} className="pl-4 pr-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
              <div className="lg:col-span-2 space-y-3">
                <div>
                  <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">Summary</div>
                  <p className="text-sm">{opp.summary}</p>
                </div>
                <div>
                  <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">Why Now</div>
                  <p className="text-sm">{opp.whyNow}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">Potential Needs</div>
                    <div className="flex flex-wrap gap-1">
                      {opp.potentialNeeds.map((n) => (
                        <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">Risks</div>
                    <div className="flex flex-wrap gap-1">
                      {opp.risks.map((r) => (
                        <Badge key={r} variant="outline" className="text-[10px] border-destructive/30 text-destructive">{r}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Score Breakdown</div>
                  <div className="space-y-1.5">
                    <ScoreBar label="Intent Score" value={opp.score} max={100} />
                    <ScoreBar label="Scalara Fit" value={opp.fit * 10} max={100} />
                    <ScoreBar label="Confidence" value={opp.confidence} max={100} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {opp.website && (
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {opp.website}
                    </div>
                  )}
                  {opp.employees && <div>{opp.employees.toLocaleString()} employees</div>}
                  <div>Type: {opp.companyType}</div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
