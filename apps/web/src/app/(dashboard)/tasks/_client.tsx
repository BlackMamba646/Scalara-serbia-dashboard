"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckSquare,
  Plus,
  AlertTriangle,
  Clock,
  ListTodo,
  CheckCircle2,
} from "lucide-react";
import { createTask, updateTask } from "@/lib/actions/crm";

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

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-4/10 text-chart-4",
  high: "bg-chart-5/10 text-chart-5",
  urgent: "bg-destructive/10 text-destructive",
};

const statusColors: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground line-through",
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TasksClient({ tasks }: { tasks: TaskRow[] }) {
  const [filter, setFilter] = useState<"all" | "open" | "overdue" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const now = new Date();

  const overdue = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < now &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  );

  const open = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  );

  const completed = tasks.filter((t) => t.status === "completed");

  const filtered = tasks.filter((t) => {
    if (filter === "open" && (t.status === "completed" || t.status === "cancelled")) return false;
    if (filter === "completed" && t.status !== "completed") return false;
    if (filter === "overdue") {
      if (!t.dueDate || new Date(t.dueDate) >= now) return false;
      if (t.status === "completed" || t.status === "cancelled") return false;
    }
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Track follow-ups, calls, and action items
          </p>
        </div>
        <CreateTaskDialog />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          className={`cursor-pointer transition-colors ${filter === "all" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "open" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("open")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Open</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-primary">{open.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "overdue" ? "ring-2 ring-destructive" : ""}`}
          onClick={() => setFilter("overdue")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Overdue</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-destructive">{overdue.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "completed" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("completed")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-chart-3" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Done</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-chart-3">{completed.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">
              {filter === "all" ? "All Tasks" : filter === "open" ? "Open Tasks" : filter === "overdue" ? "Overdue Tasks" : "Completed Tasks"}
            </CardTitle>
            <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No tasks match the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TaskItem({ task }: { task: TaskRow }) {
  const [isPending, startTransition] = useTransition();
  const now = new Date();
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < now &&
    task.status !== "completed" &&
    task.status !== "cancelled";
  const isDone = task.status === "completed" || task.status === "cancelled";

  function toggleComplete() {
    startTransition(async () => {
      await updateTask(task.id, {
        status: isDone ? "todo" : "completed",
      });
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
      <button
        onClick={toggleComplete}
        disabled={isPending}
        className={`h-5 w-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
          isDone
            ? "bg-primary border-primary text-primary-foreground"
            : isOverdue
              ? "border-destructive"
              : "border-muted-foreground/30 hover:border-primary"
        }`}
      >
        {isDone && <CheckSquare className="h-3 w-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="secondary" className={`text-[9px] ${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
          <Badge variant="secondary" className={`text-[9px] ${statusColors[task.status]}`}>
            {task.status.replace("_", " ")}
          </Badge>
          {task.companyName && (
            <Link href={`/companies/${task.companyId}`} className="text-[10px] text-primary hover:underline">
              {task.companyName}
            </Link>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        {task.dueDate && (
          <span className={`text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {isOverdue ? "Overdue: " : "Due: "}
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.owner && (
          <div className="text-[10px] text-muted-foreground mt-0.5">{task.owner}</div>
        )}
      </div>
    </div>
  );
}

function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const dueDate = formData.get("dueDate") as string;
      await createTask({
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || undefined,
        owner: (formData.get("owner") as string) || undefined,
        priority: (formData.get("priority") as "low" | "medium" | "high" | "urgent") ?? "medium",
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-3.5 w-3.5 mr-1" /> New Task
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <Input name="title" placeholder="Task title" required />
          <Textarea name="description" placeholder="Description..." rows={2} />
          <Input name="owner" placeholder="Assigned to" />
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
