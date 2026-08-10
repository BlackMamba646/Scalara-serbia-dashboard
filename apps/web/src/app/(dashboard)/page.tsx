import { MetricsBar } from "@/components/dashboard/metrics-bar";
import { HotOpportunities } from "@/components/dashboard/hot-opportunities";
import { RecentSignals } from "@/components/dashboard/recent-signals";

export default function RadarPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Radar</h1>
        <p className="text-sm text-muted-foreground">
          AI-powered iGaming opportunity intelligence
        </p>
      </div>
      <MetricsBar />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <HotOpportunities />
        </div>
        <div>
          <RecentSignals />
        </div>
      </div>
    </div>
  );
}
