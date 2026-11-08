import { supabase } from "../server";
import { RSVPerror } from "./invitation_logic";

export const TASK_STATUSES = ["not_started", "in_progress", "complete"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Which part of the party a task belongs to. Defaults to "other" in the database.
export const PILLARS = ["guests", "food", "venue_decor", "budget", "other"] as const;
export type Pillar = (typeof PILLARS)[number];

export interface NewTaskInput {
  title: string;
  dueDate?: string | null;           // "YYYY-MM-DD", or null for no due date
  status?: TaskStatus;
  pillar?: Pillar;
  assignedGuestId?: string | null;   // null = the host does it
}

// For PATCH: send only the fields that changed
export type PatchTaskInput = Partial<NewTaskInput>;

// assignment_status is the guest's accept/decline answer to an assigned task.
// It's shown to the host, but only a guest (through their invitation) can change it.
const TASK_COLUMNS =
  "id, event_id, pillar, title, status, due_date, assigned_guest_id, assignment_status, created_at";

// ---------- helpers ----------

// Dates stay as plain "YYYY-MM-DD" strings so time zones can never shift a due date
function cleanDate(v: unknown): string | null {
  if (v === null || v === "") return null;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v))
    throw new RSVPerror("dueDate must look like 2026-12-01", 400);

  const d = new Date(`${v}T00:00:00Z`);
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v)
    throw new RSVPerror("dueDate is not a real date", 400);
  return v;
}

// Validates and converts the fields that map straight to columns. Only includes what was sent.
function toRow(f: PatchTaskInput) {
  const row: Record<string, unknown> = {};

  if (f.title !== undefined) {
    if (typeof f.title !== "string" || !f.title.trim())
      throw new RSVPerror("Task title cannot be empty", 400);
    if (f.title.trim().length > 200)
      throw new RSVPerror("Task title must be 200 characters or fewer", 400);
    row.title = f.title.trim();
  }
  if (f.status !== undefined) {
    if (!TASK_STATUSES.includes(f.status))
      throw new RSVPerror(`status must be one of: ${TASK_STATUSES.join(", ")}`, 400);
    row.status = f.status;
  }
  if (f.pillar !== undefined) {
    if (!PILLARS.includes(f.pillar))
      throw new RSVPerror(`pillar must be one of: ${PILLARS.join(", ")}`, 400);
    row.pillar = f.pillar;
  }
  if (f.dueDate !== undefined) row.due_date = cleanDate(f.dueDate);

  return row;
}

// The server uses the service-role key, which skips database permissions,
// so these checks are what keep hosts out of each other's events and tasks.
async function assertHostOwnsEvent(hostId: string, eventId: string) {
  if (!eventId) throw new RSVPerror("eventId is required", 400);

  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_id", hostId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") throw new RSVPerror("Invalid eventId", 400);
    throw new RSVPerror(`Failed to load event: ${error.message}`, 500);
  }
  if (!data) throw new RSVPerror("Event not found", 404);
}

// Confirms the task belongs to one of this host's events, and returns that event's id
async function getOwnedTaskEventId(hostId: string, taskId: string): Promise<string> {
  if (!taskId) throw new RSVPerror("taskId is required", 400);

  const { data, error } = await supabase
    .from("tasks")
    .select("event_id, events!inner(host_id)")
    .eq("id", taskId)
    .eq("events.host_id", hostId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") throw new RSVPerror("Invalid taskId", 400);
    throw new RSVPerror(`Failed to load task: ${error.message}`, 500);
  }
  // Same answer whether it doesn't exist or belongs to someone else
  if (!data) throw new RSVPerror("Task not found", 404);
  return (data as any).event_id;
}

// A task can only be assigned to a guest on the SAME event
async function assignmentRow(value: unknown, eventId: string): Promise<Record<string, unknown>> {
  if (value === undefined) return {};              // not changing the assignment
  if (value === null) return { assigned_guest_id: null };
  if (typeof value !== "string") throw new RSVPerror("assignedGuestId must be a guest id or null", 400);

  const { data, error } = await supabase
    .from("guests")
    .select("id")
    .eq("id", value)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") throw new RSVPerror("Invalid assignedGuestId", 400);
    throw new RSVPerror(`Failed to load guest: ${error.message}`, 500);
  }
  if (!data) throw new RSVPerror("That guest is not on this event's guest list", 400);

  // The database resets assignment_status to "pending" whenever this changes
  return { assigned_guest_id: value };
}

// ---------- the to-do list ----------

// List all the tasks for an event: soonest due date first, tasks with no due date last
export async function getTasksFromSupabase(hostId: string, eventId: string) {
  await assertHostOwnsEvent(hostId, eventId);

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("event_id", eventId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw new RSVPerror(`Failed to load tasks: ${error.message}`, 500);
  return data ?? [];
}

// Add a task
export async function postTaskToSupabase(hostId: string, eventId: string, input: NewTaskInput) {
  await assertHostOwnsEvent(hostId, eventId);

  if (typeof input?.title !== "string" || !input.title.trim())
    throw new RSVPerror("Task title is required", 400);

  const row = { ...toRow(input), ...(await assignmentRow(input.assignedGuestId, eventId)) };

  const { data, error } = await supabase
    .from("tasks")
    .insert({ event_id: eventId, ...row })
    .select(TASK_COLUMNS)
    .single();

  if (error || !data) throw new RSVPerror(`Failed to create task: ${error?.message}`, 500);
  return data; // data.id is the task ID
}

// Update a task: rename it, change its due date or status, or assign it to a guest
export async function patchTaskInSupabase(hostId: string, taskId: string, changes: PatchTaskInput) {
  const eventId = await getOwnedTaskEventId(hostId, taskId);

  if (!changes || typeof changes !== "object" || Object.keys(changes).length === 0)
    throw new RSVPerror("No changes provided", 400);

  const row = { ...toRow(changes), ...(await assignmentRow(changes.assignedGuestId, eventId)) };
  if (Object.keys(row).length === 0) throw new RSVPerror("No valid fields to update", 400);

  const { data, error } = await supabase
    .from("tasks")
    .update(row)
    .eq("id", taskId)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error) throw new RSVPerror(`Failed to update task: ${error.message}`, 500);
  if (!data) throw new RSVPerror("Task not found", 404);
  return data;
}

// Delete a task
export async function deleteTaskFromSupabase(hostId: string, taskId: string) {
  await getOwnedTaskEventId(hostId, taskId);

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new RSVPerror(`Failed to delete task: ${error.message}`, 500);
}