import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";

const mockOpportunities = [
  {
    id: "1",
    company: "Circa Sports Arizona LLC",
    score: 86,
    fit: 7.8,
    confidence: 78,
    recommendation: "qualify" as const,
    signals: ["NEW_LICENSE", "MARKET_EXPANSION"],
    jurisdiction: "Arizona, USA",
    summary:
      "Circa Sports received an Arizona event-wagering operator license as a tribal designee. New market entry creates potential for sportsbook technology and platform infrastructure needs.",
    potentialNeeds: ["Sportsbook technology", "Platform infrastructure", "Payments"],
    flag: "🇺🇸",
  },
  {
    id: "2",
    company: "Test Casino Group",
    score: 96,
    fit: 9.4,
    confidence: 92,
    recommendation: "pursue" as const,
    signals: [
      "NEW_LICENSE",
      "FUNDING",
      "HIRING_SURGE",
      "NEW_CASINO",
      "MARKET_EXPANSION",
    ],
    jurisdiction: "Brazil",
    summary:
      "New Brazilian license + €8M funding round + 5 backend engineering hires + new casino brand launch. No known platform provider identified.",
    potentialNeeds: [
      "Casino platform",
      "Payments",
      "Game aggregation",
      "Engineering",
    ],
    flag: "🇧🇷",
  },
  {
    id: "3",
    company: "NovaBet",
    score: 79,
    fit: 8.6,
    confidence: 70,
    recommendation: "qualify" as const,
    signals: ["PROVIDER_CHANGE", "ENGINEERING_HIRING"],
    jurisdiction: "Malta",
    summary:
      "NovaBet appears to be migrating away from their current platform provider. 4 platform engineering roles posted in the last 2 weeks.",
    potentialNeeds: ["Platform migration", "Engineering services"],
    flag: "🇲🇹",
  },
  {
    id: "4",
    company: "GoldStar Gaming",
    score: 72,
    fit: 7.2,
    confidence: 65,
    recommendation: "monitor" as const,
    signals: ["NEW_BRAND", "MARKET_EXPANSION"],
    jurisdiction: "Ontario, Canada",
    summary:
      "New casino brand announcement targeting the Ontario regulated market. Early-stage — launch timeline unclear.",
    potentialNeeds: ["White-label platform", "Game content"],
    flag: "🇨🇦",
  },
];

const recommendationColors = {
  pursue: "bg-primary/10 text-primary border-primary/30",
  qualify: "bg-warning/10 text-warning border-warning/30",
  monitor: "bg-muted text-muted-foreground border-border",
};

const recommendationLabels = {
  pursue: "Pursue Now",
  qualify: "Qualify First",
  monitor: "Monitor",
};

export function HotOpportunities() {
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
        {mockOpportunities.map((opp) => (
          <div
            key={opp.id}
            className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{opp.flag}</span>
                  <h3 className="font-semibold text-sm truncate">
                    {opp.company}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${recommendationColors[opp.recommendation]}`}
                  >
                    {recommendationLabels[opp.recommendation]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {opp.summary}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {opp.signals.map((signal) => (
                    <Badge
                      key={signal}
                      variant="secondary"
                      className="text-[10px] font-mono"
                    >
                      {signal}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {opp.potentialNeeds.map((need) => (
                    <span
                      key={need}
                      className="text-[10px] text-muted-foreground"
                    >
                      {need}
                      {need !== opp.potentialNeeds[opp.potentialNeeds.length - 1] && " ·"}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="text-2xl font-bold tabular-nums text-primary">
                  {opp.score}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Intent
                </div>
                <div className="text-xs tabular-nums mt-1">
                  Fit: <span className="font-semibold">{opp.fit}</span>/10
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  Conf: {opp.confidence}%
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
        ))}
      </CardContent>
    </Card>
  );
}
