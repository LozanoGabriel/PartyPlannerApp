import { supabase } from "../server";
import { RSVPerror } from "./invitation_logic";

// The host's global invitation settings: one row per event, shared by every guest's invitation.
// (Per-guest settings, plus-one and tasks, live on the guest and task rows instead.)
export interface InvitationSettingsInput {
  defaultPlusOneAllowed?: boolean;
  contactName?: string | null;
  contactPhone?: string | null;
  parkingInfo?: string | null;
  dressCode?: string | null;
  giftRegistryUrl?: string | null;
  introMessage?: string | null;
  askDietary?: boolean;
  customQuestions?: string[];   // replaces the whole list
}

const SETTINGS_COLUMNS =
  "default_plus_one_allowed, contact_name, contact_phone, parking_info, dress_code, " +
  "gift_registry_url, intro_message, ask_dietary, custom_questions";

const MAX_FIELD = 200;
const MAX_INTRO = 1000;
const MAX_QUESTIONS = 10;
const MAX_QUESTION_LENGTH = 200;

// ---------- helpers ----------

// "" and null both become null in the database
function cleanText(v: unknown, field: string, max: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  if (s.length > max) throw new RSVPerror(`${field} must be ${max} characters or fewer`, 400);
  return s;
}

// The RSVP page shows this as a clickable link, so only real web addresses are allowed
// (this blocks things like "javascript:..." links)
function cleanUrl(v: unknown): string | null {
  const s = cleanText(v, "giftRegistryUrl", 500);
  if (s === null) return null;

  let url: URL;
  try {
    url = new URL(s);
  } catch {
    throw new RSVPerror("giftRegistryUrl must be a full web address, like https://example.com", 400);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new RSVPerror("giftRegistryUrl must start with http:// or https://", 400);
  return url.toString();
}

function cleanQuestions(v: unknown): string[] {
  if (!Array.isArray(v)) throw new RSVPerror("customQuestions must be an array of strings", 400);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of v) {
    if (typeof q !== "string") throw new RSVPerror("customQuestions must be an array of strings", 400);
    const text = q.replace(/\s+/g, " ").trim();
    if (!text) continue; // ignore blank questions
    if (text.length > MAX_QUESTION_LENGTH)
      throw new RSVPerror(`Each question must be ${MAX_QUESTION_LENGTH} characters or fewer`, 400);
    const key = text.toLowerCase();
    if (seen.has(key)) continue; // same question twice would make the answers ambiguous
    seen.add(key);
    out.push(text);
  }
  if (out.length > MAX_QUESTIONS) throw new RSVPerror(`At most ${MAX_QUESTIONS} custom questions`, 400);
  return out;
}

// Only includes the fields that were actually sent
function toRow(f: InvitationSettingsInput) {
  const row: Record<string, unknown> = {};

  if (f.defaultPlusOneAllowed !== undefined) {
    if (typeof f.defaultPlusOneAllowed !== "boolean")
      throw new RSVPerror("defaultPlusOneAllowed must be true or false", 400);
    row.default_plus_one_allowed = f.defaultPlusOneAllowed;
  }
  if (f.askDietary !== undefined) {
    if (typeof f.askDietary !== "boolean") throw new RSVPerror("askDietary must be true or false", 400);
    row.ask_dietary = f.askDietary;
  }
  if (f.contactName !== undefined) row.contact_name = cleanText(f.contactName, "contactName", MAX_FIELD);
  if (f.contactPhone !== undefined) row.contact_phone = cleanText(f.contactPhone, "contactPhone", MAX_FIELD);
  if (f.parkingInfo !== undefined) row.parking_info = cleanText(f.parkingInfo, "parkingInfo", MAX_INTRO);
  if (f.dressCode !== undefined) row.dress_code = cleanText(f.dressCode, "dressCode", MAX_FIELD);
  if (f.introMessage !== undefined) row.intro_message = cleanText(f.introMessage, "introMessage", MAX_INTRO);
  if (f.giftRegistryUrl !== undefined) row.gift_registry_url = cleanUrl(f.giftRegistryUrl);
  if (f.customQuestions !== undefined) row.custom_questions = cleanQuestions(f.customQuestions);

  return row;
}

// Same names the RSVP page uses in its "invitation" section.
// A missing row (shouldn't happen) is treated as the defaults.
function toApi(row: any) {
  return {
    defaultPlusOneAllowed: row?.default_plus_one_allowed ?? false,
    contactName: row?.contact_name ?? null,
    contactPhone: row?.contact_phone ?? null,
    parkingInfo: row?.parking_info ?? null,
    dressCode: row?.dress_code ?? null,
    giftRegistryUrl: row?.gift_registry_url ?? null,
    introMessage: row?.intro_message ?? null,
    askDietary: row?.ask_dietary ?? true,
    customQuestions: row?.custom_questions ?? [],
  };
}

// The server uses the service-role key, which skips database permissions,
// so this check is what keeps hosts out of each other's events.
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

// ---------- the settings ----------

export async function getInvitationSettings(hostId: string, eventId: string) {
  await assertHostOwnsEvent(hostId, eventId);

  const { data, error } = await supabase
    .from("invitation_settings")
    .select(SETTINGS_COLUMNS)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw new RSVPerror(`Failed to load invitation settings: ${error.message}`, 500);
  return toApi(data);
}

// Send only the fields that changed. customQuestions replaces the whole list.
export async function patchInvitationSettings(hostId: string, eventId: string, changes: InvitationSettingsInput) {
  await assertHostOwnsEvent(hostId, eventId);

  if (!changes || typeof changes !== "object" || Object.keys(changes).length === 0)
    throw new RSVPerror("No changes provided", 400);

  const row = toRow(changes);
  if (Object.keys(row).length === 0) throw new RSVPerror("No valid fields to update", 400);

  // upsert: updates the event's settings row, or creates it if it is somehow missing.
  // Only the columns sent are changed.
  const { data, error } = await supabase
    .from("invitation_settings")
    .upsert({ event_id: eventId, ...row }, { onConflict: "event_id" })
    .select(SETTINGS_COLUMNS)
    .single();

  if (error || !data) throw new RSVPerror(`Failed to update invitation settings: ${error?.message}`, 500);
  return toApi(data);
}