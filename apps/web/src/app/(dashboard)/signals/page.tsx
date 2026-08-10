import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignalsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Signals</h1>
        <p className="text-sm text-muted-foreground">
          Detected iGaming buying signals from all sources
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signal Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chronological signal feed with filtering will be built in Phase 8.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
