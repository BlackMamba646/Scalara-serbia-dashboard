export const dynamic = "force-dynamic";

import { getCrmMetrics, getRecentActivities, getAllTasks } from "@/lib/db/queries";
import { CrmDashboardClient } from "./_client";

export default async function CrmDashboardPage() {
  const [metrics, recentActivities, allTasks] = await Promise.all([
    getCrmMetrics(),
    getRecentActivities(20),
    getAllTasks(),
  ]);

  const now = new Date();
  const overdueTasks = allTasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < now &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  );

  const upcomingTasks = allTasks
    .filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        (!t.dueDate || new Date(t.dueDate) >= now)
    )
    .slice(0, 5);

  return (
    <CrmDashboardClient
      metrics={metrics}
      recentActivities={recentActivities}
      overdueTasks={overdueTasks}
      upcomingTasks={upcomingTasks}
    />
  );
}
