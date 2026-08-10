import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Decision-makers at tracked companies
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Database</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contact discovery and management will be built in Phase 9.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
