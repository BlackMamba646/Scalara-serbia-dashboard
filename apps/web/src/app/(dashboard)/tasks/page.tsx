export const dynamic = "force-dynamic";

import { getAllTasks } from "@/lib/db/queries";
import { TasksClient } from "./_client";

export default async function TasksPage() {
  const tasks = await getAllTasks();
  return <TasksClient tasks={tasks} />;
}
