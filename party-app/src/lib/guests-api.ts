import { getApiBaseUrl } from "./events-api";
import { getSupabaseClient } from "./supabase";

export type EventGuest = {
  id: string;
  event_id: string;
  name: string;
  rsvp_status: "pending" | "attending" | "declined" | "maybe";
  invitation_last_sent_at: string | null;
};

export async function getGuests(eventId: string): Promise<EventGuest[]> {
  const { data: { session }, error } = await getSupabaseClient().auth.getSession();
  if (error) throw new Error(`Could not read the login session: ${error.message}`);
  if (!session?.access_token) throw new Error("You need to sign in again to load guests.");

  const response = await fetch(`${getApiBaseUrl()}/api/guests/${encodeURIComponent(eventId)}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
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
      typeof result.error === "string" ? result.error : `Guest request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  if (typeof result !== "object" || result === null || !("guests" in result) || !Array.isArray(result.guests)) {
    throw new Error("The backend did not return a guest list.");
  }
  return result.guests as EventGuest[];
}
