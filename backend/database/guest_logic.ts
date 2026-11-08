import { supabase } from "../server";
import { RSVPerror, buildInviteLink } from "./invitation_logic";

export const GUEST_PRIORITIES = ["must_attend", "would_like", "if_space"] as const;
export type GuestPriority = (typeof GUEST_PRIORITIES)[number];

export const RSVP_STATES = ["pending", "attending", "declined", "maybe"] as const;
export type RsvpState = (typeof RSVP_STATES)[number];

export interface NewGuestInput {
  name: string;
  family?: string;
  phone?: string;
  email?: string;
  plusOneAllowed?: boolean | null;   // null = follow the event's global plus-one setting
  priority?: GuestPriority;
  note?: string;
}

// For PATCH: send only the fields that changed.
// The host can also set rsvpStatus by hand (e.g. a guest answered by phone).
export type PatchGuestInput = Partial<NewGuestInput> & { rsvpStatus?: RsvpState };

// token is selected so the server can build the invite link, but publicGuest() removes it
// before anything is sent to the app. The token itself never leaves the server.
const GUEST_COLUMNS =
  "id, event_id, family, name, plus_one_allowed, phone, email, rsvp_status, " +
  "plus_one_attending, dietary_notes, note, answers, responded_at, " +
  "invitation_last_sent_at, priority, created_at, token";

// ---------- helpers ----------

// What the app receives: the guest without the token, plus the finished invite link
function publicGuest(row: any) {
  const { token, ...rest } = row;
  return { ...rest, invite_link: buildInviteLink(row.event_id, token) };
}

// "" and null both become null in the database
function cleanText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function validateGuestFields(f: PatchGuestInput) {
  if (f.name !== undefined && (typeof f.name !== "string" || !f.name.trim()))
    throw new RSVPerror("Guest name cannot be empty", 400);
  if (f.email && !String(f.email).includes("@"))
    throw new RSVPerror("Email looks invalid", 400);
  if (f.plusOneAllowed !== undefined && f.plusOneAllowed !== null && typeof f.plusOneAllowed !== "boolean")
    throw new RSVPerror("plusOneAllowed must be true, false, or null", 400);
  if (f.priority !== undefined && !GUEST_PRIORITIES.includes(f.priority))
    throw new RSVPerror(`priority must be one of: ${GUEST_PRIORITIES.join(", ")}`, 400);
  if (f.rsvpStatus !== undefined && !RSVP_STATES.includes(f.rsvpStatus))
    throw new RSVPerror(`rsvpStatus must be one of: ${RSVP_STATES.join(", ")}`, 400);
}

// Only includes the fields that were actually sent
function toRow(f: PatchGuestInput) {
  const row: Record<string, unknown> = {};
  if (f.name !== undefined) row.name = f.name.trim();
  if (f.family !== undefined) row.family = cleanText(f.family);
  if (f.phone !== undefined) row.phone = cleanText(f.phone);
  if (f.email !== undefined) row.email = cleanText(f.email);
  if (f.plusOneAllowed !== undefined) row.plus_one_allowed = f.plusOneAllowed;
  if (f.priority !== undefined) row.priority = f.priority;
  if (f.note !== undefined) row.note = cleanText(f.note);
  if (f.rsvpStatus !== undefined) row.rsvp_status = f.rsvpStatus;
  return row;
}

// The server uses the service-role key, which skips database permissions,
// so these two checks are what keep hosts out of each other's guest lists.
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

async function assertHostOwnsGuest(hostId: string, guestId: string) {
  if (!guestId) throw new RSVPerror("guestId is required", 400);

  // events!inner joins the guest to its event, then we require that event's host
  const { data, error } = await supabase
    .from("guests")
    .select("id, events!inner(host_id)")
    .eq("id", guestId)
    .eq("events.host_id", hostId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") throw new RSVPerror("Invalid guestId", 400);
    throw new RSVPerror(`Failed to load guest: ${error.message}`, 500);
  }
  // Same answer whether it doesn't exist or belongs to someone else
  if (!data) throw new RSVPerror("Guest not found", 404);
}

export async function getGuestInviteLink(hostId: string, guestId: string) {
  await assertHostOwnsGuest(hostId, guestId);

  const { data, error } = await supabase
    .from("guests")
    .select("event_id, token")
    .eq("id", guestId)
    .maybeSingle();

  if (error) throw new RSVPerror(`Failed to generate invitation link: ${error.message}`, 500);
  if (!data) throw new RSVPerror("Guest not found", 404);
  return buildInviteLink(data.event_id, data.token);
}

// ---------- the guest list ----------
// There is no createGuestList(): an event with no guest rows IS the empty guest list.
// The expected headcount is saved on the event by createEvent().

// List all the guests for an event
export async function getGuestsFromSupabase(hostId: string, eventId: string) {
  await assertHostOwnsEvent(hostId, eventId);

  const { data, error } = await supabase
    .from("guests")
    .select(GUEST_COLUMNS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw new RSVPerror(`Failed to load guests: ${error.message}`, 500);
  return (data ?? []).map(publicGuest);
}

// Add a guest to the guest list. The unique RSVP token is generated by the database.
export async function postGuestToSupabase(hostId: string, eventId: string, input: NewGuestInput) {
  await assertHostOwnsEvent(hostId, eventId);

  if (typeof input?.name !== "string" || !input.name.trim())
    throw new RSVPerror("Guest name is required", 400);
  validateGuestFields(input);

  const { data, error } = await supabase
    .from("guests")
    .insert({ event_id: eventId, ...toRow(input) })
    .select(GUEST_COLUMNS)
    .single();

  if (error || !data) throw new RSVPerror(`Failed to create guest: ${error?.message}`, 500);
  return publicGuest(data); // .id is the guest ID, .invite_link is ready to copy or send
}

// Update a guest
export async function patchGuestInSupabase(hostId: string, guestId: string, changes: PatchGuestInput) {
  await assertHostOwnsGuest(hostId, guestId);

  if (!changes || Object.keys(changes).length === 0)
    throw new RSVPerror("No changes provided", 400);
  validateGuestFields(changes);

  const row = toRow(changes);
  if (Object.keys(row).length === 0) throw new RSVPerror("No valid fields to update", 400);

  const { data, error } = await supabase
    .from("guests")
    .update(row)
    .eq("id", guestId)
    .select(GUEST_COLUMNS)
    .maybeSingle();

  if (error) throw new RSVPerror(`Failed to update guest: ${error.message}`, 500);
  if (!data) throw new RSVPerror("Guest not found", 404);
  return publicGuest(data);
}

// The host copied or sent the invitation: record when
export async function markInvitationSent(hostId: string, guestId: string) {
  await assertHostOwnsGuest(hostId, guestId);

  const { data, error } = await supabase
    .from("guests")
    .update({ invitation_last_sent_at: new Date().toISOString() })
    .eq("id", guestId)
    .select(GUEST_COLUMNS)
    .maybeSingle();

  if (error) throw new RSVPerror(`Failed to update guest: ${error.message}`, 500);
  if (!data) throw new RSVPerror("Guest not found", 404);
  return publicGuest(data);
}

// Delete a guest. Tasks assigned to them become unassigned (foreign key: on delete set null).
export async function deleteGuestFromSupabase(hostId: string, guestId: string) {
  await assertHostOwnsGuest(hostId, guestId);

  const { error } = await supabase.from("guests").delete().eq("id", guestId);
  if (error) throw new RSVPerror(`Failed to delete guest: ${error.message}`, 500);
}