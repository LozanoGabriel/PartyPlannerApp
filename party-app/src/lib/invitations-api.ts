import { getApiBaseUrl } from "./events-api";

export type PublicInvitation = {
  guest: {
    name: string;
    rsvpStatus: "pending" | "attending" | "declined" | "maybe";
    plusOneAllowed: boolean;
    plusOneAttending: boolean | null;
    dietaryNotes: string | null;
  };
  event: {
    name: string;
    description: string | null;
    eventType: string | null;
    startTime: string | null;
    endTime: string | null;
    address: string | null;
    rsvpDeadline: string | null;
    rsvpClosed: boolean;
  };
  invitation: {
    introMessage: string | null;
    contactName: string | null;
    contactPhone: string | null;
    parkingInfo: string | null;
    dressCode: string | null;
    giftRegistryUrl: string | null;
    askDietary: boolean;
    customQuestions: string[];
  };
  tasks: { id: string; title: string; assignmentStatus: string | null }[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
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
    const message = isRecord(result) && typeof result.error === "string"
      ? result.error
      : `Invitation request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return result;
}

function isPublicInvitation(value: unknown): value is PublicInvitation {
  if (!isRecord(value) || !isRecord(value.guest) || !isRecord(value.event) ||
      !isRecord(value.invitation) || !Array.isArray(value.tasks)) return false;
  return typeof value.guest.name === "string" &&
    typeof value.guest.plusOneAllowed === "boolean" &&
    typeof value.event.name === "string" &&
    typeof value.event.rsvpClosed === "boolean" &&
    typeof value.invitation.askDietary === "boolean" &&
    Array.isArray(value.invitation.customQuestions) &&
    value.invitation.customQuestions.every((question) => typeof question === "string") &&
    value.tasks.every((task) => isRecord(task) && typeof task.id === "string" && typeof task.title === "string");
}

export async function getPublicInvitation(eventId: string, token: string): Promise<PublicInvitation> {
  const result = await request(
    `/api/rsvp/${encodeURIComponent(eventId)}/${encodeURIComponent(token)}`,
  );
  if (!isPublicInvitation(result)) throw new Error("The backend returned an invalid invitation.");
  return result;
}

export async function submitPublicRSVP(
  eventId: string,
  token: string,
  submission: {
    rsvpStatus: "attending" | "declined" | "maybe";
    plusOneAttending?: boolean;
    dietaryNotes?: string;
    taskResponses?: { taskId: string; accepted: boolean }[];
    answers?: { question: string; answer: string }[];
  },
): Promise<void> {
  await request(
    `/api/rsvp/${encodeURIComponent(eventId)}/${encodeURIComponent(token)}/rsvp`,
    { method: "POST", body: JSON.stringify(submission) },
  );
}
