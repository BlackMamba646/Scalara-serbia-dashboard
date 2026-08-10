import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockSignals = [
  {
    id: "1",
    type: "NEW_LICENSE",
    company: "Circa Sports",
    jurisdiction: "Arizona",
    flag: "🇺🇸",
    time: "2h ago",
    confidence: 78,
    source: "secondary",
  },
  {
    id: "2",
    type: "FUNDING",
    company: "Test Casino Group",
    jurisdiction: "Brazil",
    flag: "🇧🇷",
    time: "4h ago",
    confidence: 92,
    source: "company",
  },
  {
    id: "3",
    type: "HIRING_SURGE",
    company: "NovaBet",
    jurisdiction: "Malta",
    flag: "🇲🇹",
    time: "6h ago",
    confidence: 85,
    source: "primary",
  },
  {
    id: "4",
    type: "PROVIDER_CHANGE",
    company: "NovaBet",
    jurisdiction: "Malta",
    flag: "🇲🇹",
    time: "8h ago",
    confidence: 70,
    source: "secondary",
  },
  {
    id: "5",
    type: "LICENSE_APPROVAL",
    company: "EveryMatrix",
    jurisdiction: "Alberta",
    flag: "🇨🇦",
    time: "1d ago",
    confidence: 95,
    source: "company",
  },
  {
    id: "6",
    type: "MARKET_EXPANSION",
    company: "GoldStar Gaming",
    jurisdiction: "Ontario",
    flag: "🇨🇦",
    time: "1d ago",
    confidence: 65,
    source: "secondary",
  },
  {
    id: "7",
    type: "ENGINEERING_HIRING",
    company: "LuckyDice",
    jurisdiction: "UK",
    flag: "🇬🇧",
    time: "2d ago",
    confidence: 80,
    source: "primary",
  },
  {
    id: "8",
    type: "NEW_CASINO",
    company: "VegasOnline",
    jurisdiction: "Curaçao",
    flag: "🇨🇼",
    time: "2d ago",
    confidence: 60,
    source: "secondary",
  },
];

const signalColors: Record<string, string> = {
  NEW_LICENSE: "bg-primary/10 text-primary border-primary/30",
  LICENSE_APPROVAL: "bg-primary/10 text-primary border-primary/30",
  FUNDING: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  HIRING_SURGE: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  ENGINEERING_HIRING: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  PROVIDER_CHANGE: "bg-destructive/10 text-destructive border-destructive/30",
  MARKET_EXPANSION: "bg-chart-3/10 text-chart-3 border-chart-3/30",
  NEW_CASINO: "bg-chart-5/10 text-chart-5 border-chart-5/30",
};

const sourceIcons: Record<string, string> = {
  primary: "★",
  company: "◆",
  secondary: "●",
  inference: "○",
};

export function RecentSignals() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Recent Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {mockSignals.map((signal) => (
            <div
              key={signal.id}
              className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <span
                className="text-xs text-muted-foreground"
                title={`Source: ${signal.source}`}
              >
                {sourceIcons[signal.source]}
              </span>
              <Badge
                variant="outline"
                className={`text-[9px] font-mono shrink-0 ${signalColors[signal.type] ?? ""}`}
              >
                {signal.type}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                  {signal.flag} {signal.company}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {signal.jurisdiction}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {signal.time}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
