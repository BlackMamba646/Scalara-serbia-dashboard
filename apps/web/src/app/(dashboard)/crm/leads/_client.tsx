"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Search,
  Globe,
  Clock,
  RefreshCw,
  ExternalLink,
  User,
  MessageSquare,
} from "lucide-react";
import { updateLead } from "@/lib/actions/crm";
import { useRouter } from "next/navigation";

type Lead = {
  id: string;
  refId: string;
  name: string;
  email: string;
  company: string | null;
  website: string | null;
  description: string | null;
  leadSource: string | null;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  assignedTo: string | null;
  companyId: string | null;
  gmailMessageId: string | null;
  gmailThreadId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Metrics = {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
};

const statusColors: Record<string, string> = {
  new: "bg-chart-4/10 text-chart-4",
  contacted: "bg-chart-2/10 text-chart-2",
  qualified: "bg-primary/10 text-primary",
  converted: "bg-chart-3/10 text-chart-3",
  lost: "bg-destructive/10 text-destructive",
};

function timeAgo(d: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}

function LeadDetail({
  lead,
  open,
  onClose,
}: {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [assignedTo, setAssignedTo] = useState(lead.assignedTo ?? "");
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      await updateLead(lead.id, {
        status,
        notes: notes || null,
        assignedTo: assignedTo || null,
      });
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{lead.name}</span>
            <Badge
              variant="secondary"
              className={`text-[10px] ${statusColors[lead.status] ?? ""}`}
            >
              {lead.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Ref ID</span>
              <div className="font-mono text-xs">{lead.refId}</div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Email</span>
              <div>
                <a
                  href={`mailto:${lead.email}`}
                  className="text-primary hover:underline"
                >
                  {lead.email}
                </a>
              </div>
            </div>
            {lead.company && (
              <div>
                <span className="text-muted-foreground text-xs">Company</span>
                <div>{lead.company}</div>
              </div>
            )}
            {lead.website && (
              <div>
                <span className="text-muted-foreground text-xs">Website</span>
                <div>
                  <a
                    href={
                      lead.website.startsWith("http")
                        ? lead.website
                        : `https://${lead.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {lead.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
            {lead.leadSource && (
              <div>
                <span className="text-muted-foreground text-xs">Source</span>
                <div>{lead.leadSource}</div>
              </div>
            )}
            <div>
              <span className="text-muted-foreground text-xs">Received</span>
              <div>{new Date(lead.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {lead.description && (
            <div>
              <span className="text-muted-foreground text-xs">
                Email Content
              </span>
              <div className="mt-1 text-sm bg-muted/50 rounded-md p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {lead.description}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select
                value={status}
                onValueChange={(v) =>
                  v &&
                  setStatus(
                    v as
                      | "new"
                      | "contacted"
                      | "qualified"
                      | "converted"
                      | "lost"
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Assigned To
              </label>
              <Input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Team member"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LeadsClient({
  leads,
  metrics,
}: {
  leads: Lead[];
  metrics: Metrics;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/leads/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Sync failed");
      } else {
        router.refresh();
      }
    } finally {
      setSyncing(false);
    }
  }

  const filtered = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.company?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      l.refId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {metrics.total} inbound leads from email
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Syncing..." : "Sync Gmail"}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(
          [
            ["Total", metrics.total, ""],
            ["New", metrics.new, statusColors.new],
            ["Contacted", metrics.contacted, statusColors.contacted],
            ["Qualified", metrics.qualified, statusColors.qualified],
            ["Converted", metrics.converted, statusColors.converted],
          ] as const
        ).map(([label, value, color]) => (
          <Card key={label}>
            <CardContent className="p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {label}
              </span>
              <div className={`text-xl font-bold tabular-nums mt-0.5`}>
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => v && setStatusFilter(v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          {leads.length === 0
            ? 'No leads yet. Click "Sync Gmail" to pull demo request emails.'
            : "No leads match your search."}
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((lead) => (
            <Card
              key={lead.id}
              className="hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => setSelectedLead(lead)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {lead.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {lead.refId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {lead.email}
                        </span>
                        {lead.company && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {lead.company}
                          </span>
                        )}
                        {lead.leadSource && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {lead.leadSource}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {lead.assignedTo && (
                      <span className="text-xs text-muted-foreground">
                        {lead.assignedTo}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(lead.createdAt)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${statusColors[lead.status] ?? ""}`}
                    >
                      {lead.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          open={!!selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
}
