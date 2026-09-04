"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Globe,
  Bell,
  Database,
  Cpu,
  Shield,
  Calendar,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { disconnectGoogle } from "@/lib/actions/google";

type GoogleAccount = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  scopes: string | null;
  createdAt: Date;
} | null;

const settingSections = [
  {
    title: "Company Profile",
    icon: Globe,
    description: "Configure Scalara Labs capabilities for fit scoring",
    items: [
      { label: "Company Name", value: "Scalara Labs" },
      { label: "Products", value: "Casino Platform, Sportsbook, PAM, Payments" },
      { label: "Target Markets", value: "Europe, LatAm, North America" },
      { label: "Target Company Size", value: "50-5,000 employees" },
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
      { label: "Pursue Threshold", value: "Score >= 80" },
      { label: "Qualify Threshold", value: "Score >= 65" },
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
      { label: "Alert Threshold", value: "Score >= 85" },
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
      { label: "Authentication", value: "Google OAuth + Password" },
      { label: "API Key", value: "Not set" },
      { label: "CORS", value: "localhost only" },
      { label: "Data Retention", value: "90 days" },
      { label: "Audit Logging", value: "Enabled" },
    ],
  },
];

export function SettingsClient({
  googleAccount,
}: {
  googleAccount: GoogleAccount;
}) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          System configuration and integrations
        </p>
      </div>

      {/* Google Integration Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Google Integration</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect Google for Calendar sync and meeting access
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {googleAccount ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30">
                {googleAccount.picture && (
                  <img
                    src={googleAccount.picture}
                    alt=""
                    className="h-10 w-10 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {googleAccount.name || googleAccount.email}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {googleAccount.email}
                  </span>
                </div>
                <form action={() => disconnectGoogle(googleAccount.id)}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  >
                    <LogOut className="h-3 w-3" />
                    Disconnect
                  </button>
                </form>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Calendar</span>
                  <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Connected since</span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {new Date(googleAccount.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Connect your Google account to sync your calendar and access
                meeting data.
              </p>
              <a
                href="/api/auth/google"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="currentColor"
                    opacity="0.8"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="currentColor"
                    opacity="0.6"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                    fill="currentColor"
                    opacity="0.7"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                </svg>
                Connect Google Account
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingSections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <section.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {section.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {item.value}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
