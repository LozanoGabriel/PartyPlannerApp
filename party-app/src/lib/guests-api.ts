import { getApiBaseUrl } from "./events-api";
import { getSupabaseClient } from "./supabase";

export type GuestResponse = "pending" | "attending" | "declined" | "maybe";

export type EventGuest = {
  id: string;
  event_id: string;
  name: string;
  rsvp_status: GuestResponse;
  invitation_last_sent_at: string | null;
  email?: string | null;
  phone?: string | null;
  family?: string | null;
  invite_link?: string;
};

export type GuestInput = {
  name: string;
  rsvpStatus?: GuestResponse;
  email?: string;
  phone?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGuest(value: unknown): value is EventGuest {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.event_id === "string" &&
    typeof value.name === "string" &&
    ["pending", "attending", "declined", "maybe"].includes(String(value.rsvp_status)) &&
    (typeof value.invitation_last_sent_at === "string" || value.invitation_last_sent_at === null);
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const { data: { session }, error } = await getSupabaseClient().auth.getSession();
  if (error) throw new Error(`Could not read the login session: ${error.message}`);
  if (!session?.access_token) throw new Error("You need to sign in again to manage guests.");

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
    const message = isRecord(result) && typeof result.error === "string"
      ? result.error
      : `Guest request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return result;
}

export async function getGuests(eventId: string): Promise<EventGuest[]> {
  const result = await request(`/api/guests/${encodeURIComponent(eventId)}`);
  if (!isRecord(result) || !Array.isArray(result.guests) || !result.guests.every(isGuest)) {
    throw new Error("The backend did not return a valid guest list.");
  }
  return result.guests;
}

export async function createGuest(eventId: string, guestData: GuestInput): Promise<EventGuest> {
  const result = await request(`/api/guests/${encodeURIComponent(eventId)}`, {
    method: "POST",
    body: JSON.stringify({ guestData }),
  });
  if (!isRecord(result) || !isGuest(result.guest)) {
    throw new Error("The backend did not return the created guest.");
  }
  return result.guest;
}

export async function updateGuest(guestId: string, guestData: Partial<GuestInput>): Promise<EventGuest> {
  const result = await request(`/api/guests/${encodeURIComponent(guestId)}`, {
    method: "PATCH",
    body: JSON.stringify({ guestData }),
  });
  if (!isRecord(result) || !isGuest(result.guest)) {
    throw new Error("The backend did not return the updated guest.");
  }
  return result.guest;
}

export async function markGuestInvitationSent(guestId: string): Promise<EventGuest> {
  const result = await request(`/api/guests/${encodeURIComponent(guestId)}/sent`, { method: "POST" });
  if (!isRecord(result) || !isGuest(result.guest)) {
    throw new Error("The backend did not return the updated guest.");
  }
  return result.guest;
}

export async function generateGuestInviteLink(guestId: string): Promise<string> {
  const result = await request(`/api/guests/${encodeURIComponent(guestId)}/invite`, { method: "POST" });
  if (!isRecord(result) || typeof result.inviteLink !== "string") {
    throw new Error("The backend did not return a valid invitation link.");
  }
  try {
    new URL(result.inviteLink);
  } catch {
    throw new Error("The backend did not return a valid invitation link.");
  }
  return result.inviteLink;
}

export async function deleteGuest(guestId: string): Promise<void> {
  await request(`/api/guests/${encodeURIComponent(guestId)}`, { method: "DELETE" });
}
