import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LicensesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Licenses</h1>
        <p className="text-sm text-muted-foreground">
          Cross-jurisdiction gambling license tracker
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">License Database</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            License tracker with regulator data, change history, and alerts will be built in Phase 3–5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
