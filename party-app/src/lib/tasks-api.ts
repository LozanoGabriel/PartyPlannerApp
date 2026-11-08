import { getApiBaseUrl } from "./events-api";
import { getSupabaseClient } from "./supabase";

export type TaskStatus = "not_started" | "in_progress" | "complete";
export type TaskPillar = "guests" | "food" | "venue_decor" | "budget" | "other";

export type EventTask = {
  id: string;
  event_id: string;
  pillar: TaskPillar;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  assigned_guest_id: string | null;
  assignment_status: string | null;
  created_at: string;
};

export type EventTaskList = {
  tasks: EventTask[];
  dueDateAvailable: boolean;
};

export type TaskInput = {
  title: string;
  pillar: TaskPillar;
  dueDate?: string | null;
  status?: TaskStatus;
  assignedGuestId?: string | null;
};

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const { data: { session }, error } = await getSupabaseClient().auth.getSession();
  if (error) throw new Error(`Could not read the login session: ${error.message}`);
  if (!session?.access_token) throw new Error("You need to sign in again to manage tasks.");

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...init.headers,
    },
  });
  const body = await response.text();
  let result: unknown;
  if (body) {
    try {
      result = JSON.parse(body) as unknown;
    } catch {
      throw new Error(`The backend returned an invalid response (HTTP ${response.status}).`);
    }
  }
  if (!response.ok) {
    const message = typeof result === "object" && result !== null && "error" in result &&
      typeof result.error === "string" ? result.error : `Task request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return result;
}

export async function getTasks(eventId: string): Promise<EventTaskList> {
  const result = await request(`/api/tasks/${encodeURIComponent(eventId)}`);
  if (typeof result !== "object" || result === null || !("tasks" in result) ||
      !Array.isArray(result.tasks) ||
      ("dueDateAvailable" in result && typeof result.dueDateAvailable !== "boolean")) {
    throw new Error("The backend did not return a task list.");
  }
  const dueDateAvailable = "dueDateAvailable" in result && typeof result.dueDateAvailable === "boolean"
    ? result.dueDateAvailable
    : true;
  return {
    tasks: result.tasks as EventTask[],
    dueDateAvailable,
  };
}

export async function createTask(eventId: string, taskData: TaskInput): Promise<EventTask> {
  const result = await request(`/api/tasks/${encodeURIComponent(eventId)}`, {
    method: "POST",
    body: JSON.stringify({ taskData }),
  });
  if (typeof result !== "object" || result === null || !("task" in result) || typeof result.task !== "object" || result.task === null) {
    throw new Error("The backend did not return the created task.");
  }
  return result.task as EventTask;
}

export async function updateTask(taskId: string, taskData: Partial<TaskInput>): Promise<EventTask> {
  const result = await request(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({ taskData }),
  });
  if (typeof result !== "object" || result === null || !("task" in result) || typeof result.task !== "object" || result.task === null) {
    throw new Error("The backend did not return the updated task.");
  }
  return result.task as EventTask;
}

export async function deleteTask(taskId: string): Promise<void> {
  await request(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
}
