import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Globe, Bell, Database, Cpu, Shield } from "lucide-react";

const settingSections = [
  {
    title: "Company Profile",
    icon: Globe,
    description: "Configure Scalara Labs capabilities for fit scoring",
    items: [
      { label: "Company Name", value: "Scalara Labs" },
      { label: "Products", value: "Casino Platform, Sportsbook, PAM, Payments" },
      { label: "Target Markets", value: "Europe, LatAm, North America" },
      { label: "Target Company Size", value: "50–5,000 employees" },
      { label: "Target Verticals", value: "Casino, Sportsbook, Poker" },
    ],
  },
  {
    title: "Scoring Configuration",
    icon: Cpu,
    description: "Signal weights and scoring parameters",
    items: [
      { label: "Recency Half-Life", value: "14 days" },
      { label: "Min Confidence Threshold", value: "50%" },
      { label: "Pursue Threshold", value: "Score ≥ 80" },
      { label: "Qualify Threshold", value: "Score ≥ 65" },
      { label: "AI Enrichment", value: "Enabled (claude-haiku-4-5)" },
    ],
  },
  {
    title: "Data Sources",
    icon: Database,
    description: "Crawler configuration and rate limits",
    items: [
      { label: "Active Sources", value: "5 of 11" },
      { label: "Default Crawl Interval", value: "12 hours" },
      { label: "Rate Limit (Global)", value: "60 RPM" },
      { label: "Content Hashing", value: "SHA-256" },
      { label: "Change Detection", value: "Field-level diffing" },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    description: "Alert configuration for high-priority signals",
    items: [
      { label: "Email Alerts", value: "Enabled" },
      { label: "Alert Threshold", value: "Score ≥ 85" },
      { label: "Daily Digest", value: "08:00 UTC" },
      { label: "Slack Integration", value: "Not configured" },
      { label: "Webhook", value: "Not configured" },
    ],
  },
  {
    title: "AI & LLM",
    icon: Cpu,
    description: "LLM provider and budget configuration",
    items: [
      { label: "Provider", value: "LiteLLM (Multi-provider)" },
      { label: "Primary Model", value: "claude-haiku-4-5" },
      { label: "Enrichment Model", value: "claude-sonnet-5" },
      { label: "Monthly Budget", value: "$50.00" },
      { label: "Caching", value: "Prompt hash, 24h TTL" },
    ],
  },
  {
    title: "Security",
    icon: Shield,
    description: "Access control and API configuration",
    items: [
      { label: "Authentication", value: "Not configured" },
      { label: "API Key", value: "Not set" },
      { label: "CORS", value: "localhost only" },
      { label: "Data Retention", value: "90 days" },
      { label: "Audit Logging", value: "Enabled" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          System configuration and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingSections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <section.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <Badge variant="secondary" className="text-xs font-normal">{item.value}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
