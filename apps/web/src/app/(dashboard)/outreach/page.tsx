"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Send, MessageSquare, Clock, Sparkles } from "lucide-react";
import { SEED_OPPORTUNITIES } from "@/lib/seed-data";

const outreachDrafts = SEED_OPPORTUNITIES.filter((o) => o.recommendation === "pursue").map((opp) => ({
  id: `outreach-${opp.id}`,
  company: opp.company,
  flag: opp.flag,
  subject: `Scalara Labs — ${opp.potentialNeeds[0]} for ${opp.company}`,
  channel: "email" as const,
  status: "draft" as const,
  angle: opp.whyNow,
  generatedAt: opp.detectedAt,
}));

const channelIcons: Record<string, typeof Mail> = {
  email: Mail,
  linkedin: MessageSquare,
};

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-primary/10 text-primary",
  sent: "bg-success/10 text-success",
  replied: "bg-chart-2/10 text-chart-2",
};

export default function OutreachPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Outreach</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated outreach messages based on detected signals
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Drafts</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{outreachDrafts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Send className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Sent</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-success">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-chart-2" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Replied</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-chart-2">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reply Rate</div>
            <div className="text-2xl font-bold tabular-nums">—</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Outreach Queue</CardTitle>
            <Button size="sm" className="h-8 text-xs">
              <Sparkles className="mr-1 h-3 w-3" />
              Generate for All Pursue
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {outreachDrafts.map((draft) => {
            const Icon = channelIcons[draft.channel];
            return (
              <div
                key={draft.id}
                className="rounded-lg border p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{draft.flag}</span>
                      <span className="font-medium text-sm">{draft.company}</span>
                      <Badge variant="secondary" className={`text-[10px] ${statusStyles[draft.status]}`}>
                        {draft.status}
                      </Badge>
                    </div>
                    <div className="text-sm mb-1.5">
                      <span className="text-muted-foreground">Subject: </span>
                      {draft.subject}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Angle: </span>{draft.angle}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Icon className="h-3 w-3" />
                      {draft.channel}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Sparkles className="mr-1 h-3 w-3" /> Generate
                      </Button>
                      <Button size="sm" className="h-7 text-xs" disabled>
                        <Send className="mr-1 h-3 w-3" /> Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
