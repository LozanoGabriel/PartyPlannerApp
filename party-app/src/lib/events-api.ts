import { Platform } from "react-native";
import * as Device from "expo-device";
import { getSupabaseClient } from "./supabase";

export const EVENT_CATEGORIES = [
  "Conversation",
  "Celebration",
  "Dance Party",
  "Family Gathering",
  "Shared Meal",
] as const;
export type EventType = (typeof EVENT_CATEGORIES)[number];

export type CreateEventInput = {
  name: string;
  eventType: EventType;
  startTime: string;
  endTime: string;
  description?: string | null;
  address?: string | null;
  rsvpDeadline?: string | null;
  totalBudget?: number | null;
  expectedHeadcount?: number | null;
};

export type EventRecord = {
  id: string;
  name: string;
  event_type: EventType;
  start_time: string;
  end_time: string;
  rsvp_deadline: string | null;
  total_budget: number | null;
  expected_headcount: number | null;
  description: string | null;
  address: string | null;
};

export type CreatedEvent = EventRecord;

export function getApiBaseUrl() {
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

async function authenticatedRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  const { data: { session }, error: sessionError } = await getSupabaseClient().auth.getSession();
  if (sessionError) throw new Error(`Could not read the login session: ${sessionError.message}`);
  if (!session?.access_token) throw new Error("You need to sign in again to manage events.");

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...init.headers,
    },
  });
  const text = await response.text();
  let result: unknown;
  if (text) {
    try {
      result = JSON.parse(text) as unknown;
    } catch {
      throw new Error(`The backend returned an invalid response (HTTP ${response.status}).`);
    }
  }
  if (!response.ok) {
    const message = typeof result === "object" && result !== null && "error" in result &&
      typeof result.error === "string" ? result.error : `Event request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEventRecord(value: unknown): value is EventRecord {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.event_type === "string" && EVENT_CATEGORIES.includes(value.event_type as EventType) &&
    typeof value.start_time === "string" &&
    typeof value.end_time === "string" &&
    (typeof value.rsvp_deadline === "string" || value.rsvp_deadline === null) &&
    (typeof value.total_budget === "number" || value.total_budget === null) &&
    (typeof value.expected_headcount === "number" || value.expected_headcount === null) &&
    (typeof value.description === "string" || value.description === null) &&
    (typeof value.address === "string" || value.address === null);
}

export async function createEvent(eventDetails: CreateEventInput): Promise<CreatedEvent> {
  const result = await authenticatedRequest("/api/events", {
    method: "POST",
    body: JSON.stringify({ eventDetails }),
  });
  if (!isRecord(result) || !isEventRecord(result.event)) {
    throw new Error("The backend response did not include the created event.");
  }
  return result.event;
}

export async function getEvents(): Promise<EventRecord[]> {
  const result = await authenticatedRequest("/api/events");
  if (!isRecord(result) || !Array.isArray(result.events) || !result.events.every(isEventRecord)) {
    throw new Error("The backend did not return a valid event list.");
  }
  return result.events;
}

export async function getEvent(eventId: string): Promise<EventRecord> {
  const result = await authenticatedRequest(`/api/events/${encodeURIComponent(eventId)}`);
  if (!isRecord(result) || !isEventRecord(result.event)) throw new Error("The backend did not return the requested event.");
  return result.event;
}

export async function updateEvent(eventId: string, eventDetails: Partial<CreateEventInput>): Promise<EventRecord> {
  const result = await authenticatedRequest(`/api/events/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    body: JSON.stringify({ eventDetails }),
  });
  if (!isRecord(result) || !isEventRecord(result.event)) throw new Error("The backend did not return the updated event.");
  return result.event;
}

export async function deleteEvent(eventId: string): Promise<void> {
  await authenticatedRequest(`/api/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
}
