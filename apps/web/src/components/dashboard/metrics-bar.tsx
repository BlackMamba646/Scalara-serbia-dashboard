import { Card, CardContent } from "@/components/ui/card";
import { Target, Signal, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { getDashboardMetrics } from "@/lib/db/queries";

export async function MetricsBar() {
  const m = await getDashboardMetrics();

  const metrics = [
    { label: "Hot Leads", value: String(m.hotLeads), change: "pursue recommendation", icon: Target, color: "text-chart-1" },
    { label: "Active Signals", value: String(m.activeSignals), change: "last 30 days", icon: Signal, color: "text-chart-1" },
    { label: "Avg Fit", value: m.avgFit.toFixed(1), change: "/10", icon: TrendingUp, color: "text-chart-2" },
    { label: "License Changes", value: String(m.licenseChanges), change: "last 30 days", icon: ShieldCheck, color: "text-chart-4" },
    { label: "Companies", value: String(m.totalCompanies), change: "tracked", icon: Users, color: "text-muted-foreground" },
  ];

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
