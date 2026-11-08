import { supabase } from "../server";
import { RSVPerror } from "./invitation_logic";
import { EVENT_CATEGORIES } from "../constants/event-categories";

export type EventType = (typeof EVENT_CATEGORIES)[number];

// The set up process
export interface NewEventInput {
  name: string;
  eventType: EventType;
  startTime: string;          // ISO 8601
  endTime: string;
  description?: string | null;
  address?: string | null;
  rsvpDeadline?: string | null;
  totalBudget?: number | null;
  expectedHeadcount?: number | null;
}

// For PATCH: send only the fields that changed
export type PatchEventInput = Partial<NewEventInput>;

const EVENT_COLUMNS =
  "id, name, event_type, start_time, end_time, rsvp_deadline, total_budget, expected_headcount, description, address";

export async function getEventsFromSupabase(hostId: string) {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("host_id", hostId)
    .order("start_time", { ascending: true });

  if (error) throw new RSVPerror(`Failed to load events: ${error.message}`, 500);
  return data ?? [];
}

export async function getEventFromSupabase(hostId: string, eventId: string) {
  if (!eventId) throw new RSVPerror("eventId is required", 400);
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", eventId)
    .eq("host_id", hostId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") throw new RSVPerror("Invalid eventId", 400);
    throw new RSVPerror(`Failed to load event: ${error.message}`, 500);
  }
  if (!data) throw new RSVPerror("Event not found", 404);
  return data;
}

// Shared by create and patch. Throws a 400 if anything is wrong, returns the parsed dates.
function validateEventInput(input: NewEventInput) {
  if (!input.name?.trim()) throw new RSVPerror("Event name is required", 400);
  if (!EVENT_CATEGORIES.includes(input.eventType)) throw new RSVPerror("Invalid event type", 400);

  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime()))
    throw new RSVPerror("Valid start and end times are required", 400);
  if (end <= start) throw new RSVPerror("End time must be after start time", 400);

  if (input.rsvpDeadline && new Date(input.rsvpDeadline) >= start)
    throw new RSVPerror("RSVP deadline must be before the event starts", 400);
  if (input.expectedHeadcount !== undefined && input.expectedHeadcount < 1)
    throw new RSVPerror("Headcount must be at least 1", 400);

  return { start, end };
}

export async function createEvent(hostId: string, input: NewEventInput) {
  const { start, end } = validateEventInput(input);

  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: hostId,
      name: input.name.trim(),
      event_type: input.eventType,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      description: input.description ?? null,
      address: input.address ?? null,
      rsvp_deadline: input.rsvpDeadline ?? null,
      total_budget: input.totalBudget ?? null,
      expected_headcount: input.expectedHeadcount ?? null,
    })
    .select(EVENT_COLUMNS)
    .single();

  if (error || !data) throw new RSVPerror(`Failed to create event: ${error?.message}`, 500);
  return data;
}


export async function deleteEventSupabase(hostId: string, eventId: string) {
  if (!eventId) throw new RSVPerror("eventId is required", 400);

  // host_id check
  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("host_id", hostId)
    .select("id");

  if (error) {
    if (error.code === "22P02") throw new RSVPerror("Invalid eventId", 400);
    throw new RSVPerror(`Failed to delete event: ${error.message}`, 500);
  }
  // Same answer whether it doesn't exist or belongs to someone else
  if (!data || data.length === 0) throw new RSVPerror("Event not found", 404);
}

export async function patchEventInSupabase(hostId: string, eventId: string, changes: PatchEventInput) {
  if (!eventId) throw new RSVPerror("eventId is required", 400);
  if (!changes || Object.keys(changes).length === 0)
    throw new RSVPerror("No changes provided", 400);

  // Load the current event (and confirm this host owns it)
  const { data: existing, error: loadErr } = await supabase
    .from("events")
    .select("name, event_type, start_time, end_time, rsvp_deadline, expected_headcount")
    .eq("id", eventId)
    .eq("host_id", hostId)
    .maybeSingle();

  if (loadErr) {
    if (loadErr.code === "22P02") throw new RSVPerror("Invalid eventId", 400);
    throw new RSVPerror(`Failed to load event: ${loadErr.message}`, 500);
  }
  if (!existing) throw new RSVPerror("Event not found", 404);

  // Validate the event as it WILL look after the change, so changing only the
  // end time is still checked against the existing start time
  const { start, end } = validateEventInput({
    name: changes.name ?? existing.name,
    eventType: changes.eventType ?? existing.event_type,
    startTime: changes.startTime ?? existing.start_time,
    endTime: changes.endTime ?? existing.end_time,
    rsvpDeadline: changes.rsvpDeadline !== undefined
      ? changes.rsvpDeadline ?? undefined
      : existing.rsvp_deadline ?? undefined,
    expectedHeadcount: changes.expectedHeadcount ?? existing.expected_headcount ?? undefined,
  });

  // Only write the fields the caller actually sent
  const update: Record<string, unknown> = {};
  if (changes.name !== undefined) update.name = changes.name.trim();
  if (changes.eventType !== undefined) update.event_type = changes.eventType;
  if (changes.startTime !== undefined) update.start_time = start.toISOString();
  if (changes.endTime !== undefined) update.end_time = end.toISOString();
  if (changes.description !== undefined) update.description = changes.description;
  if (changes.address !== undefined) update.address = changes.address;
  if (changes.rsvpDeadline !== undefined) update.rsvp_deadline = changes.rsvpDeadline;
  if (changes.totalBudget !== undefined) update.total_budget = changes.totalBudget;
  if (changes.expectedHeadcount !== undefined) update.expected_headcount = changes.expectedHeadcount;

  const { data, error } = await supabase
    .from("events")
    .update(update)
    .eq("id", eventId)
    .eq("host_id", hostId)
    .select(EVENT_COLUMNS)
    .maybeSingle();

  if (error) throw new RSVPerror(`Failed to update event: ${error.message}`, 500);
  if (!data) throw new RSVPerror("Event not found", 404);
  return data;
}