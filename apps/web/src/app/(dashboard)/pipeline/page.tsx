import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PipelinePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Sales pipeline and opportunity tracking
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Kanban-style pipeline management will be built in Phase 9.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
