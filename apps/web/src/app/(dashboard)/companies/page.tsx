import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompaniesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="text-sm text-muted-foreground">
          Tracked iGaming companies with intelligence profiles
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Database</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Company list with search, entity resolution, and profiles will be built in Phase 8.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
