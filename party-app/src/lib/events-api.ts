import { Platform } from "react-native";
import * as Device from "expo-device";
import { getSupabaseClient } from "./supabase";

export type EventType = "Conversation" | "Celebration" | "Dance Party" | "Family Gathering" | "Shared Meal";

export type CreateEventInput = {
  name: string;
  eventType: EventType;
  startTime: string;
  endTime: string;
  rsvpDeadline?: string;
  totalBudget?: number;
  expectedHeadcount?: number;
};

export type CreatedEvent = {
  id: string;
  name: string;
  event_type: EventType;
  start_time: string;
  end_time: string;
  rsvp_deadline: string | null;
  total_budget: number | null;
  expected_headcount: number | null;
};

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!configuredUrl) throw new Error("The backend URL is missing. Set EXPO_PUBLIC_API_URL in party-app/.env.");

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("EXPO_PUBLIC_API_URL must be an absolute URL, such as http://192.168.1.10:3000.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("EXPO_PUBLIC_API_URL must use HTTP or HTTPS.");
  }

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    if (Device.isDevice && Platform.OS !== "web") {
      throw new Error("A phone cannot reach your computer at localhost. Set EXPO_PUBLIC_API_URL to your computer's LAN IP or deployed backend URL.");
    }
    if (Platform.OS === "android") url.hostname = "10.0.2.2";
  }

  return url.toString().replace(/\/+$/, "");
}

export async function createEvent(eventDetails: CreateEventInput): Promise<CreatedEvent> {
  const { data: { session }, error: sessionError } = await getSupabaseClient().auth.getSession();
  if (sessionError) throw new Error(`Could not read the login session: ${sessionError.message}`);
  if (!session?.access_token) throw new Error("You need to sign in again before creating an event.");

  const response = await fetch(`${getApiBaseUrl()}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ eventDetails }),
  });
  const responseText = await response.text();
  let result: { event?: CreatedEvent; error?: string } = {};
  if (responseText) {
    try {
      result = JSON.parse(responseText) as typeof result;
    } catch {
      throw new Error(`The backend returned an invalid response (HTTP ${response.status}).`);
    }
  }

  if (!response.ok) {
    throw new Error(result.error ?? `Could not create event (HTTP ${response.status}).`);
  }
  if (!result.event?.id) throw new Error("The backend response did not include the created event.");
  return result.event;
}
