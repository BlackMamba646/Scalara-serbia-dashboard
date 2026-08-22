"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Users,
  CheckSquare,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  MessageSquare,
  Mail,
  Phone,
  FileText,
} from "lucide-react";

type CrmMetrics = {
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  overdueTasks: number;
  pendingTasks: number;
  upcomingMeetings: number;
  totalContacts: number;
  pipelineValue: number;
};

type ActivityRow = {
  id: string;
  activityType: string;
  title: string;
  description: string | null;
  companyId: string | null;
  companyName: string | null;
  actor: string | null;
  createdAt: Date;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  owner: string | null;
  companyId: string | null;
  companyName: string | null;
  dueDate: Date | null;
  priority: string;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
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

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-4/10 text-chart-4",
  high: "bg-chart-5/10 text-chart-5",
  urgent: "bg-destructive/10 text-destructive",
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function timeAgo(d: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatCurrency(amount: number) {
  if (!amount) return "€0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CrmDashboardClient({
  metrics,
  recentActivities,
  overdueTasks,
  upcomingTasks,
}: {
  metrics: CrmMetrics;
  recentActivities: ActivityRow[];
  overdueTasks: TaskRow[];
  upcomingTasks: TaskRow[];
}) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
        <p className="text-sm text-muted-foreground">
          Relationship management overview
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={<Target className="h-4 w-4 text-primary" />}
          label="Open Deals"
          value={metrics.openDeals}
          accent="text-primary"
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4 text-chart-3" />}
          label="Pipeline Value"
          value={formatCurrency(metrics.pipelineValue)}
          accent="text-chart-3"
        />
        <MetricCard
          icon={<Users className="h-4 w-4 text-chart-2" />}
          label="Contacts"
          value={metrics.totalContacts}
          accent="text-chart-2"
        />
        <MetricCard
          icon={<CheckSquare className="h-4 w-4 text-chart-4" />}
          label="Pending Tasks"
          value={metrics.pendingTasks}
          accent="text-chart-4"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={<Target className="h-4 w-4 text-chart-3" />}
          label="Won Deals"
          value={metrics.wonDeals}
          accent="text-chart-3"
        />
        <MetricCard
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          label="Total Deals"
          value={metrics.totalDeals}
          accent=""
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          label="Overdue Tasks"
          value={metrics.overdueTasks}
          accent="text-destructive"
        />
        <MetricCard
          icon={<Calendar className="h-4 w-4 text-chart-5" />}
          label="Upcoming Meetings"
          value={metrics.upcomingMeetings}
          accent="text-chart-5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {overdueTasks.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Overdue Tasks ({overdueTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className={`text-[9px] ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </Badge>
                        {task.companyName && (
                          <Link href={`/companies/${task.companyId}`} className="text-[10px] text-primary hover:underline">
                            {task.companyName}
                          </Link>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-destructive font-medium shrink-0 ml-2">
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                ))}
                {overdueTasks.length > 5 && (
                  <Link href="/tasks" className="block text-xs text-primary text-center py-2 hover:underline">
                    View all {overdueTasks.length} overdue tasks
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                Upcoming Tasks
              </CardTitle>
              <Link href="/tasks" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingTasks.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No upcoming tasks
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className={`text-[9px] ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </Badge>
                        {task.companyName && (
                          <span className="text-[10px] text-muted-foreground">{task.companyName}</span>
                        )}
                      </div>
                    </div>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentActivities.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No activity yet. Start by logging notes, calls, or emails on company pages.
              </div>
            ) : (
              <div className="space-y-1">
                {recentActivities.map((activity) => {
                  const Icon = activityIcons[activity.activityType] ?? MessageSquare;
                  return (
                    <div key={activity.id} className="flex gap-3 p-2 rounded-lg hover:bg-accent/30">
                      <div className="mt-0.5 h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{activity.title}</span>
                          <Badge variant="secondary" className="text-[9px] shrink-0">{activity.activityType}</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {activity.companyName && (
                            <Link href={`/companies/${activity.companyId}`} className="text-primary hover:underline mr-2">
                              {activity.companyName}
                            </Link>
                          )}
                          {activity.actor && <span>{activity.actor} · </span>}
                          {timeAgo(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <div className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
