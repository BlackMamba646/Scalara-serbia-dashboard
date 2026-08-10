import { Card, CardContent } from "@/components/ui/card";
import { Target, Signal, ShieldCheck, TrendingUp, Users } from "lucide-react";

const metrics = [
  {
    label: "Hot Leads",
    value: "12",
    change: "+3 today",
    icon: Target,
    color: "text-chart-1",
  },
  {
    label: "Active Signals",
    value: "47",
    change: "+8 this week",
    icon: Signal,
    color: "text-chart-1",
  },
  {
    label: "Avg Fit",
    value: "8.2",
    change: "/10",
    icon: TrendingUp,
    color: "text-chart-2",
  },
  {
    label: "License Changes",
    value: "6",
    change: "last 7 days",
    icon: ShieldCheck,
    color: "text-chart-4",
  },
  {
    label: "Companies",
    value: "234",
    change: "tracked",
    icon: Users,
    color: "text-muted-foreground",
  },
];

export function MetricsBar() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <m.icon className={`h-4 w-4 ${m.color}`} />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {m.label}
              </span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {m.change}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
