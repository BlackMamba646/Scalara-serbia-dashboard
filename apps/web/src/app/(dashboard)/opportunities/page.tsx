import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OpportunitiesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
        <p className="text-sm text-muted-foreground">
          Scored and ranked sales opportunities
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Opportunity list with filters, sorting, and scoring will be built in Phase 8.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
