import { getSupabaseClient } from "./supabase";
import { EVENT_CATEGORIES, getApiBaseUrl } from "./events-api";
import type { EventType } from "./events-api";
import type { GalaConversationEntry } from "./gala-conversation";
import type { eventCreationSteps } from "../../../interfaces/event-creation-steps";

export type GalaContext = eventCreationSteps;

export type GalaResponse = {
  english_response: string;
  event_type?: EventType;
  names?: string[];
  settings_suggestions?: string[];
  guest_tips?: string[];
  estimated_budget?: number;
  budget_items?: { item_name: string; item_description: string }[];
  tasks?: { task_name: string; task_description: string }[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNamedDescriptionArray(
  value: unknown,
  nameKey: "item_name" | "task_name",
  descriptionKey: "item_description" | "task_description",
): boolean {
  return Array.isArray(value) && value.every((item) =>
    isRecord(item) && typeof item[nameKey] === "string" && typeof item[descriptionKey] === "string",
  );
}

function isEventType(value: unknown): value is EventType {
  return typeof value === "string" && EVENT_CATEGORIES.some((category) => category === value);
}

function isGalaResponse(value: unknown): value is GalaResponse {
  return (
    isRecord(value) &&
    typeof value.english_response === "string" &&
    (value.event_type === undefined || isEventType(value.event_type)) &&
    (value.names === undefined || isStringArray(value.names)) &&
    (value.settings_suggestions === undefined || isStringArray(value.settings_suggestions)) &&
    (value.guest_tips === undefined || isStringArray(value.guest_tips)) &&
    (value.estimated_budget === undefined ||
      (typeof value.estimated_budget === "number" && Number.isSafeInteger(value.estimated_budget) && value.estimated_budget > 0 && value.estimated_budget <= 999999999)) &&
    (value.budget_items === undefined || isNamedDescriptionArray(value.budget_items, "item_name", "item_description")) &&
    (value.tasks === undefined || isNamedDescriptionArray(value.tasks, "task_name", "task_description"))
  );
}

export async function askGala(
  context: GalaContext,
  eventDetails: Record<string, unknown>,
  userPrompt?: string,
  history: GalaConversationEntry[] = [],
): Promise<GalaResponse> {
  const { data: { session }, error: sessionError } = await getSupabaseClient().auth.getSession();
  if (sessionError) throw new Error(`Could not read the login session: ${sessionError.message}`);
  if (!session?.access_token) throw new Error("You need to sign in again before asking Gala.");

  const response = await fetch(`${getApiBaseUrl()}/api/gala`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      context,
      ...(userPrompt?.trim() ? { userPrompt: userPrompt.trim() } : {}),
      eventDetails,
      history: history.slice(-8),
    }),
  });

  const responseText = await response.text();
  let result: unknown;
  if (responseText) {
    try {
      result = JSON.parse(responseText) as unknown;
    } catch {
      throw new Error(`Gala's service returned an invalid response (HTTP ${response.status}).`);
    }
  }
  if (!response.ok) {
    const message = isRecord(result) && typeof result.error === "string" ? result.error : undefined;
    throw new Error(message ?? `Gala could not respond (HTTP ${response.status}).`);
  }
  if (!isGalaResponse(result)) {
    throw new Error("Gala returned a response in an unexpected format.");
  }
  if (context === "Budget" && result.estimated_budget === undefined) {
    throw new Error("Gala did not provide a total budget estimate. Ask again or enter a budget manually.");
  }
  return result;
}
