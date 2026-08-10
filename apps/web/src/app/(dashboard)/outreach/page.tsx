import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OutreachPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Outreach</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated outreach messages and templates
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outreach Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Evidence-based outreach generation will be built in Phase 9.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
