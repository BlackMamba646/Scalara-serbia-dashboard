import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          System administration and monitoring
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Crawler status, job queue, and pipeline observability will be built in Phase 10.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Token usage, cost breakdown by use case, and budget monitoring will be built in Phase 10.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
