"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type OpportunityRow = {
  id: string;
  companyName: string | null;
  opportunityScore: number | null;
  recommendation: string | null;
  status: string | null;
  summary: string | null;
  potentialNeeds: string[] | null;
};

const stages = [
  { key: "new", label: "New", color: "bg-primary" },
  { key: "review", label: "Review", color: "bg-chart-2" },
  { key: "qualified", label: "Qualified", color: "bg-chart-3" },
  { key: "contacted", label: "Contacted", color: "bg-chart-4" },
  { key: "meeting", label: "Meeting", color: "bg-chart-5" },
  { key: "watch", label: "Watching", color: "bg-muted-foreground" },
] as const;

const recommendationStyles: Record<string, string> = {
  pursue: "bg-primary/10 text-primary border-primary/30",
  qualify: "bg-warning/10 text-warning border-warning/30",
  monitor: "bg-muted text-muted-foreground border-border",
};

export function PipelineClient({ opportunities }: { opportunities: OpportunityRow[] }) {
  const opportunitiesByStage = stages.map((stage) => ({
    ...stage,
    items: opportunities.filter((o) => o.status === stage.key),
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Sales pipeline — drag opportunities between stages
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((stage) => {
          const count = opportunities.filter((o) => o.status === stage.key).length;
          return (
            <Card key={stage.key}>
              <CardContent className="p-3 text-center">
                <div className={`h-1 w-8 rounded-full mx-auto mb-2 ${stage.color}`} />
                <div className="text-lg font-bold tabular-nums">{count}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stage.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {opportunitiesByStage.map((stage) => (
          <div key={stage.key} className="min-w-64 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-2 w-2 rounded-full ${stage.color}`} />
              <span className="text-sm font-medium">{stage.label}</span>
              <Badge variant="secondary" className="text-[10px] ml-auto">{stage.items.length}</Badge>
            </div>
            <div className="space-y-2">
              {stage.items.map((opp) => (
                <Card key={opp.id} className="cursor-pointer hover:bg-accent/30 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm font-medium truncate">{opp.companyName ?? "Unknown"}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={`text-[9px] ${recommendationStyles[opp.recommendation ?? "monitor"]}`}>
                        {opp.recommendation ?? "monitor"}
                      </Badge>
                      <span className="text-lg font-bold tabular-nums text-primary">{opp.opportunityScore ?? 0}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {(opp.potentialNeeds ?? []).slice(0, 2).map((n) => (
                        <Badge key={n} variant="secondary" className="text-[8px] font-mono">{n}</Badge>
                      ))}
                      {(opp.potentialNeeds ?? []).length > 2 && (
                        <Badge variant="secondary" className="text-[8px]">+{(opp.potentialNeeds ?? []).length - 2}</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{opp.summary}</p>
                  </CardContent>
                </Card>
              ))}
              {stage.items.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No opportunities
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
