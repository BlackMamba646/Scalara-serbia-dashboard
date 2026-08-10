import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          System configuration
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scalara Capability Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Editable company capability profile for the AI scoring engine will be configurable here.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Signal weights, recency decay parameters, and fit score factors will be configurable here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
