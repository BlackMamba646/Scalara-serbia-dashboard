import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">News</h1>
        <p className="text-sm text-muted-foreground">
          Classified iGaming industry news
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">News Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI-classified news from iGaming publications with entity tagging will be built in Phase 3–6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
