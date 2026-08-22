import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { getHotOpportunities } from "@/lib/db/queries";

const recommendationColors: Record<string, string> = {
  pursue: "bg-primary/10 text-primary border-primary/30",
  qualify: "bg-warning/10 text-warning border-warning/30",
  monitor: "bg-muted text-muted-foreground border-border",
};

const recommendationLabels: Record<string, string> = {
  pursue: "Pursue Now",
  qualify: "Qualify First",
  monitor: "Monitor",
};

export async function HotOpportunities() {
  const opportunities = await getHotOpportunities(5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Hot Opportunities
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunities.map((opp) => {
          const needs = opp.potentialNeeds ?? [];
          const rec = opp.recommendation ?? "monitor";
          return (
            <div
              key={opp.id}
              className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">
                      {opp.companyName}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${recommendationColors[rec] ?? ""}`}
                    >
                      {recommendationLabels[rec] ?? rec}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {opp.summary}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {needs.map((need, i) => (
                      <span
                        key={need}
                        className="text-[10px] text-muted-foreground"
                      >
                        {need}
                        {i !== needs.length - 1 && " ·"}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="text-2xl font-bold tabular-nums text-primary">
                    {opp.opportunityScore}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Intent
                  </div>
                  <div className="text-xs tabular-nums mt-1">
                    Fit: <span className="font-semibold">{opp.scalaraFit}</span>/10
                  </div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    Conf: {opp.evidenceConfidence}%
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                  >
                    <Mail className="mr-1 h-3 w-3" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
