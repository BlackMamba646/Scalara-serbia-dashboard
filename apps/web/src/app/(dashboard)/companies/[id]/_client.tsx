"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Users,
  Target,
  Plus,
  Mail,
  Phone,
  ExternalLink,
  MessageSquare,
  CheckSquare,
  Calendar,
  FileText,
  Clock,
  Star,
} from "lucide-react";
import {
  updateCompany,
  createContact,
  createActivity,
  createTask,
  createOpportunity,
} from "@/lib/actions/crm";

type CompanyData = {
  company: {
    id: string;
    canonicalName: string;
    legalName: string | null;
    country: string | null;
    companyType: string | null;
    employeeCount: number | null;
    websiteUrl: string | null;
    description: string | null;
    linkedinUrl: string | null;
    region: string | null;
    industry: string | null;
    lifecycleStage: string | null;
    estimatedValue: number | null;
    leadSource: string | null;
    accountOwner: string | null;
    notes: string | null;
    lastActivityAt: Date | null;
    nextActivityAt: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  contacts: Array<{
    id: string;
    name: string;
    title: string | null;
    email: string | null;
    phone: string | null;
    linkedinUrl: string | null;
    isDecisionMaker: boolean;
    notes: string | null;
  }>;
  opportunities: Array<{
    id: string;
    dealName: string | null;
    status: string | null;
    amount: number | null;
    currency: string | null;
    probability: number | null;
    expectedCloseDate: Date | null;
    opportunityScore: number | null;
    recommendation: string | null;
    summary: string | null;
    assignedTo: string | null;
    createdAt: Date;
  }>;
  activities: Array<{
    id: string;
    activityType: string;
    title: string;
    description: string | null;
    actor: string | null;
    createdAt: Date;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    owner: string | null;
    dueDate: Date | null;
    priority: string;
    status: string;
    completedAt: Date | null;
    createdAt: Date;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date | null;
    status: string;
    notes: string | null;
    summary: string | null;
  }>;
  documents: Array<{
    id: string;
    documentType: string;
    name: string;
    webUrl: string | null;
    ndaStatus: string | null;
    createdAt: Date;
  }>;
};

const lifecycleColors: Record<string, string> = {
  lead: "bg-muted text-muted-foreground",
  prospect: "bg-chart-4/10 text-chart-4",
  qualified: "bg-chart-2/10 text-chart-2",
  customer: "bg-primary/10 text-primary",
  churned: "bg-destructive/10 text-destructive",
  partner: "bg-chart-3/10 text-chart-3",
};

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  review: "bg-chart-2/10 text-chart-2",
  qualified: "bg-chart-3/10 text-chart-3",
  contacted: "bg-chart-4/10 text-chart-4",
  meeting: "bg-chart-5/10 text-chart-5",
  proposal: "bg-chart-2/10 text-chart-2",
  won: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
  dismissed: "bg-muted text-muted-foreground",
  watch: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-4/10 text-chart-4",
  high: "bg-chart-5/10 text-chart-5",
  urgent: "bg-destructive/10 text-destructive",
};

const activityIcons: Record<string, typeof MessageSquare> = {
  note: MessageSquare,
  email: Mail,
  call: Phone,
  meeting: Calendar,
  task: CheckSquare,
  document: FileText,
  signal: Target,
  status_change: Clock,
  proposal: FileText,
  follow_up: Clock,
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(d: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function CompanyAccountClient({ data }: { data: CompanyData }) {
  const { company, contacts, opportunities, activities, tasks, meetings, documents } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/companies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
      </div>

      <CompanyHeader company={company} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity ({activities.length})</TabsTrigger>
              <TabsTrigger value="deals">Deals ({opportunities.length})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
              <TabsTrigger value="meetings">Meetings ({meetings.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4 space-y-3">
              <AddActivityForm companyId={company.id} />
              <ActivityTimeline activities={activities} />
            </TabsContent>

            <TabsContent value="deals" className="mt-4 space-y-3">
              <AddDealForm companyId={company.id} />
              <DealsList opportunities={opportunities} />
            </TabsContent>

            <TabsContent value="tasks" className="mt-4 space-y-3">
              <AddTaskForm companyId={company.id} />
              <TasksList tasks={tasks} />
            </TabsContent>

            <TabsContent value="meetings" className="mt-4">
              <MeetingsList meetings={meetings} />
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <DocumentsList documents={documents} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <ContactsPanel contacts={contacts} companyId={company.id} />
          <CompanyDetails company={company} />
        </div>
      </div>
    </div>
  );
}

function CompanyHeader({ company }: { company: CompanyData["company"] }) {
  const [editing, setEditing] = useState(false);
  const [stage, setStage] = useState(company.lifecycleStage ?? "lead");
  const [isPending, startTransition] = useTransition();

  function handleStageChange(value: string) {
    setStage(value);
    startTransition(async () => {
      await updateCompany(company.id, {
        lifecycleStage: value as "lead" | "prospect" | "qualified" | "customer" | "churned" | "partner",
      });
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{company.canonicalName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {company.legalName && company.legalName !== company.canonicalName && (
                  <span>{company.legalName}</span>
                )}
                {company.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {company.country}
                  </span>
                )}
                {company.websiteUrl && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" /> {company.websiteUrl}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {company.companyType && (
                  <Badge variant="secondary" className="text-[10px]">
                    {company.companyType}
                  </Badge>
                )}
                {company.industry && (
                  <Badge variant="outline" className="text-[10px]">
                    {company.industry}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={stage} onValueChange={(v) => v && handleStageChange(v)} disabled={isPending}>
              <SelectTrigger className="w-36 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {company.description && (
          <p className="text-sm text-muted-foreground mt-4 max-w-2xl">
            {company.description}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estimated Value</span>
            <div className="text-lg font-bold tabular-nums">
              {company.estimatedValue
                ? formatCurrency(company.estimatedValue, "EUR")
                : "—"}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Lead Source</span>
            <div className="text-sm font-medium">{company.leadSource ?? "—"}</div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Account Owner</span>
            <div className="text-sm font-medium">{company.accountOwner ?? "—"}</div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Activity</span>
            <div className="text-sm font-medium">
              {company.lastActivityAt ? timeAgo(company.lastActivityAt) : "—"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddActivityForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createActivity({
        companyId,
        activityType: formData.get("type") as "note" | "email" | "call" | "meeting",
        title: formData.get("title") as string,
        description: formData.get("description") as string,
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Log Activity
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <Select name="type" defaultValue="note">
            <SelectTrigger>
              <SelectValue placeholder="Activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="note">Note</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
            </SelectContent>
          </Select>
          <Input name="title" placeholder="Title" required />
          <Textarea name="description" placeholder="Details..." rows={3} />
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving..." : "Log Activity"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActivityTimeline({ activities }: { activities: CompanyData["activities"] }) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No activity yet. Log a note, call, or email to get started.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.activityType] ?? MessageSquare;
        return (
          <div key={activity.id} className="flex gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
            <div className="mt-0.5 h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{activity.title}</span>
                <Badge variant="secondary" className="text-[9px]">{activity.activityType}</Badge>
              </div>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {activity.description}
                </p>
              )}
              <div className="text-[10px] text-muted-foreground mt-1">
                {activity.actor && <span>{activity.actor} · </span>}
                {timeAgo(activity.createdAt)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AddDealForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const amount = formData.get("amount") as string;
      await createOpportunity({
        companyId,
        dealName: formData.get("dealName") as string,
        amount: amount ? parseFloat(amount) : undefined,
        status: "new",
        summary: formData.get("summary") as string,
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-3.5 w-3.5 mr-1" /> New Deal
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Deal</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <Input name="dealName" placeholder="Deal name" required />
          <Input name="amount" placeholder="Amount (EUR)" type="number" step="0.01" />
          <Textarea name="summary" placeholder="Summary..." rows={3} />
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating..." : "Create Deal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DealsList({ opportunities }: { opportunities: CompanyData["opportunities"] }) {
  if (opportunities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No deals yet. Create one to start tracking revenue.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {opportunities.map((opp) => (
        <Card key={opp.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-sm">{opp.dealName ?? "Untitled Deal"}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={`text-[9px] ${statusColors[opp.status ?? "new"]}`}>
                    {opp.status}
                  </Badge>
                  {opp.recommendation && (
                    <Badge variant="outline" className="text-[9px]">
                      {opp.recommendation}
                    </Badge>
                  )}
                </div>
                {opp.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{opp.summary}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold tabular-nums">
                  {formatCurrency(opp.amount, opp.currency)}
                </div>
                {opp.probability != null && opp.probability > 0 && (
                  <div className="text-[10px] text-muted-foreground">{opp.probability}% prob.</div>
                )}
                {opp.expectedCloseDate && (
                  <div className="text-[10px] text-muted-foreground">
                    Close: {formatDate(opp.expectedCloseDate)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AddTaskForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const dueDate = formData.get("dueDate") as string;
      await createTask({
        companyId,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        priority: (formData.get("priority") as "low" | "medium" | "high" | "urgent") ?? "medium",
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-3.5 w-3.5 mr-1" /> New Task
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <Input name="title" placeholder="Task title" required />
          <Textarea name="description" placeholder="Description..." rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Select name="priority" defaultValue="medium">
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Input name="dueDate" type="date" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TasksList({ tasks }: { tasks: CompanyData["tasks"] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No tasks yet.
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-1">
      {tasks.map((task) => {
        const isOverdue =
          task.dueDate &&
          new Date(task.dueDate) < now &&
          task.status !== "completed" &&
          task.status !== "cancelled";

        return (
          <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
            <div
              className={`h-5 w-5 rounded border-2 shrink-0 flex items-center justify-center ${
                task.status === "completed"
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              }`}
            >
              {task.status === "completed" && <CheckSquare className="h-3 w-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className={`text-[9px] ${priorityColors[task.priority]}`}>
                  {task.priority}
                </Badge>
                {task.dueDate && (
                  <span className={`text-[10px] ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {isOverdue ? "Overdue: " : "Due: "}
                    {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MeetingsList({ meetings }: { meetings: CompanyData["meetings"] }) {
  if (meetings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No meetings scheduled.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {meetings.map((meeting) => (
        <Card key={meeting.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{meeting.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(meeting.startTime)}
                  {meeting.endTime && ` — ${new Date(meeting.endTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
                </div>
              </div>
              <Badge variant="secondary" className="text-[9px]">{meeting.status}</Badge>
            </div>
            {meeting.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{meeting.notes}</p>
            )}
            {meeting.summary && (
              <p className="text-xs mt-1 line-clamp-2">{meeting.summary}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DocumentsList({ documents }: { documents: CompanyData["documents"] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{doc.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[9px]">{doc.documentType}</Badge>
              {doc.ndaStatus && (
                <Badge variant="outline" className="text-[9px]">NDA: {doc.ndaStatus}</Badge>
              )}
              <span className="text-[10px] text-muted-foreground">{formatDate(doc.createdAt)}</span>
            </div>
          </div>
          {doc.webUrl && (
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

function ContactsPanel({ contacts, companyId }: { contacts: CompanyData["contacts"]; companyId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createContact({
        companyId,
        name: formData.get("name") as string,
        title: (formData.get("title") as string) || undefined,
        email: (formData.get("email") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        isDecisionMaker: formData.get("isDecisionMaker") === "on",
      });
      setOpen(false);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Contacts ({contacts.length})</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" variant="ghost" className="h-7" />}>
              <Plus className="h-3.5 w-3.5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Contact</DialogTitle>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                <Input name="name" placeholder="Full name" required />
                <Input name="title" placeholder="Job title" />
                <Input name="email" placeholder="Email" type="email" />
                <Input name="phone" placeholder="Phone" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isDecisionMaker" className="rounded" />
                  Decision maker
                </label>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Adding..." : "Add Contact"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {contacts.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">No contacts yet</div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/30">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary shrink-0">
                  {contact.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-1">
                    {contact.name}
                    {contact.isDecisionMaker && <Star className="h-3 w-3 text-chart-2" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {contact.title ?? contact.email ?? ""}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {contact.email && <Mail className="h-3 w-3 text-muted-foreground" />}
                  {contact.phone && <Phone className="h-3 w-3 text-muted-foreground" />}
                  {contact.linkedinUrl && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompanyDetails({ company }: { company: CompanyData["company"] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Company Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <DetailRow label="Region" value={company.region} />
        <DetailRow label="Industry" value={company.industry} />
        <DetailRow label="Employees" value={company.employeeCount?.toLocaleString()} />
        <DetailRow label="Website" value={company.websiteUrl} />
        <DetailRow label="LinkedIn" value={company.linkedinUrl} />
        <DetailRow label="Account Owner" value={company.accountOwner} />
        <DetailRow label="Lead Source" value={company.leadSource} />
        <DetailRow label="Created" value={formatDate(company.createdAt)} />
        {company.notes && (
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Notes</span>
            <p className="text-xs mt-0.5">{company.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xs font-medium truncate max-w-[60%] text-right">{value ?? "—"}</span>
    </div>
  );
}
