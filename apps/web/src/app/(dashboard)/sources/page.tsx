import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockSources = [
  { name: "UKGC", type: "Regulator", status: "active", records: "2,665", lastCrawl: "—" },
  { name: "GCGRA (UAE)", type: "Regulator", status: "active", records: "26", lastCrawl: "—" },
  { name: "Arizona DoG", type: "Regulator", status: "planned", records: "—", lastCrawl: "—" },
  { name: "AGLC", type: "Regulator", status: "planned", records: "—", lastCrawl: "—" },
  { name: "iGaming Business", type: "News", status: "planned", records: "—", lastCrawl: "—" },
  { name: "Gaming Intelligence", type: "News", status: "planned", records: "—", lastCrawl: "—" },
  { name: "SBC News", type: "News", status: "planned", records: "—", lastCrawl: "—" },
];

export default function SourcesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sources</h1>
        <p className="text-sm text-muted-foreground">
          Data source configuration and monitoring
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Source</th>
                  <th className="pb-2 font-medium text-muted-foreground">Type</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 font-medium text-muted-foreground">Records</th>
                  <th className="pb-2 font-medium text-muted-foreground">Last Crawl</th>
                </tr>
              </thead>
              <tbody>
                {mockSources.map((s) => (
                  <tr key={s.name} className="border-b last:border-0">
                    <td className="py-2.5 font-medium">{s.name}</td>
                    <td className="py-2.5 text-muted-foreground">{s.type}</td>
                    <td className="py-2.5">
                      <Badge
                        variant={s.status === "active" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 tabular-nums text-muted-foreground">{s.records}</td>
                    <td className="py-2.5 text-muted-foreground">{s.lastCrawl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
