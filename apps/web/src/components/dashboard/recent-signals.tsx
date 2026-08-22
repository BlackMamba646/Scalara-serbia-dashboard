import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecentSignals } from "@/lib/db/queries";

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

function formatRelativeTime(date: Date | null): string {
  if (!date) return "";
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMon = Math.floor(diffDay / 30);
  return `${diffMon}mo ago`;
}

export async function RecentSignals() {
  const signals = await getRecentSignals(8);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Recent Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {signals.map((signal) => {
            const typeKey = signal.signalType.toUpperCase();
            return (
              <div
                key={signal.id}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <Badge
                  variant="outline"
                  className={`text-[9px] font-mono shrink-0 ${signalColors[typeKey] ?? ""}`}
                >
                  {typeKey}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {signal.companyName}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                  Conf: {signal.evidenceConfidence}%
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatRelativeTime(signal.detectedAt)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
