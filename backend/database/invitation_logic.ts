import { supabase } from "../server";
import { EventDetails } from "../../interfaces/event-details"

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:8081";

export class RSVPerror extends Error {
    constructor (message: string, public status: number){
        super(message)
    }
}

// What a guest can answer. "pending" is not an answer, so it is not allowed here.
// These match the rsvp_state values in the database.
export type RSVPstatus = "attending" | "declined" | "maybe";
const VALID_STATUSES: RSVPstatus[] = ["attending", "declined", "maybe"];

// What the RSVP page sends when the guest submits
export interface RSVPSubmission {
    rsvpStatus: RSVPstatus;
    plusOneAttending?: boolean;
    dietaryNotes?: string;
    taskResponses?: { taskId: string; accepted: boolean }[];   // answers for tasks the host assigned to this guest
    answers?: { question: string; answer: string }[];          // answers to the host's custom questions
}

// This endpoint is public, so cap what a guest can send
const MAX_TEXT = 500;
const MAX_ITEMS = 25;

// One line of plain text: newlines and extra spaces collapse into single spaces,
// so every answer stays on exactly one line in the guests.answers column
function oneLine(v: unknown, max = MAX_TEXT): string {
    return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

// Fetching data to create invitations
export async function fetchEventDetailsFromSupabase(eventId: string): 
Promise<EventDetails | null> {
    if(!eventId){
        throw new Error('eventID is required.')
    }

    const {data, error} = await supabase
        .from('events')
        .select('name, description, event_type, start_time, end_time, additional_fields')
        .eq('id',eventId)
        .maybeSingle();

        if(error){
            throw new Error(`Failed to fetch event: ${error.message}`)
        }
        if (!data){
            return null
        }
    return {
        name: data.name,
        description: data.description,
        eventType: data.event_type,
        startTime: data.start_time,
        endTime: data.end_time,
        additionalFields: data.additional_fields ?? undefined,
    };
}

// The one place that builds a guest's RSVP link.
// The link only identifies the guest. The page loads the current event, questions and tasks when opened.
export function buildInviteLink(eventId: string, token: string) {
    return `${FRONTEND_URL}/rsvp/${eventId}/${token}`;
}

// Generates a unique link for each guest to rsvp (host only)
export async function getInvitationLink(hostId: string, eventId: string, guestId: string){
    if (!eventId) throw new RSVPerror("eventId required", 400);
    if (!guestId) throw new RSVPerror("guestId required", 400);

    // events!inner makes sure the event belongs to this host
    const { data, error } = await supabase
        .from("guests")
        .select("token, events!inner(host_id)") //security measure, keep guests id private
        .eq("event_id", eventId)
        .eq("id", guestId)
        .eq("events.host_id", hostId)
        .maybeSingle();

    if (error){
        if(error.code === "22P02") throw new RSVPerror("Invalid eventId or guestId", 400);
        throw new RSVPerror(`Failed to load guest: ${error.message}`, 500);
    }
    if(!data) throw new RSVPerror("Guest not found", 404);

    return buildInviteLink(eventId, data.token);
}

// The token is the only credential on the RSVP routes.
// Bad ids and bad tokens give the same 404 so nobody can probe which part was wrong.
async function loadGuestByToken(eventId: string, token: string, columns: string): Promise<any> {
    const { data, error } = await supabase
        .from("guests")
        .select(columns)
        .eq("event_id", eventId)
        .eq("token", token)
        .maybeSingle();

    if (error) {
        if (error.code === "22P02") throw new RSVPerror("Invalid invite link", 404);
        throw new RSVPerror(`Failed to load invitation: ${error.message}`, 500);
    }
    if (!data) throw new RSVPerror("Invalid invite link", 404);
    return data;
}

// Everything the RSVP page needs to render, looked up by the guest's token
export async function getInvitationPage(eventId: string, token: string) {
    if (!eventId) throw new RSVPerror("eventId is required", 400);
    if (!token) throw new RSVPerror("token is required", 400);

    const guest = await loadGuestByToken(
        eventId, token,
        "id, name, plus_one_allowed, rsvp_status, plus_one_attending, dietary_notes, answers, responded_at"
    );

    const [eventRes, settingsRes, tasksRes] = await Promise.all([
        supabase.from("events")
            .select("name, description, event_type, start_time, end_time, address, rsvp_deadline, additional_fields")
            .eq("id", eventId).maybeSingle(),
        supabase.from("invitation_settings")
            .select("default_plus_one_allowed, contact_name, contact_phone, parking_info, dress_code, gift_registry_url, intro_message, ask_dietary, custom_questions")
            .eq("event_id", eventId).maybeSingle(),
        supabase.from("tasks")
            .select("id, title, assignment_status")
            .eq("event_id", eventId).eq("assigned_guest_id", guest.id)
            .order("created_at", { ascending: true }),
    ]);

    if (eventRes.error) throw new RSVPerror(`Failed to load event: ${eventRes.error.message}`, 500);
    if (settingsRes.error) throw new RSVPerror(`Failed to load invitation settings: ${settingsRes.error.message}`, 500);
    if (tasksRes.error) throw new RSVPerror(`Failed to load tasks: ${tasksRes.error.message}`, 500);
    if (!eventRes.data) throw new RSVPerror("Invalid invite link", 404);

    const event: any = eventRes.data;
    const settings: any = settingsRes.data; // null only if the settings row is missing

    return {
        guest: {
            name: guest.name,
            rsvpStatus: guest.rsvp_status,
            // the guest's own setting wins; null means follow the event's global setting
            plusOneAllowed: guest.plus_one_allowed ?? settings?.default_plus_one_allowed ?? false,
            plusOneAttending: guest.plus_one_attending,
            dietaryNotes: guest.dietary_notes,
            answers: guest.answers,
            respondedAt: guest.responded_at,
        },
        event: {
            name: event.name,
            description: event.description,
            eventType: event.event_type,
            startTime: event.start_time,
            endTime: event.end_time,
            address: event.address,
            rsvpDeadline: event.rsvp_deadline,
            additionalFields: event.additional_fields ?? undefined,
            rsvpClosed: !!event.rsvp_deadline && new Date() > new Date(event.rsvp_deadline)
        },
        invitation: {
            introMessage: settings?.intro_message ?? null,
            contactName: settings?.contact_name ?? null,
            contactPhone: settings?.contact_phone ?? null,
            parkingInfo: settings?.parking_info ?? null,
            dressCode: settings?.dress_code ?? null,
            giftRegistryUrl: settings?.gift_registry_url ?? null,
            askDietary: settings?.ask_dietary ?? true,
            customQuestions: settings?.custom_questions ?? [],
        },
        tasks: (tasksRes.data ?? []).map((t: any) => ({
            id: t.id,
            title: t.title,
            assignmentStatus: t.assignment_status,
        })),
    };
}

// TODO: Send the invitation via SMS (Twilio)
// Planned steps, in this order:
//   1. confirm the host owns the guest and the guest has a phone number
//   2. build the message from the event details + buildInviteLink(eventId, token)
//   3. send the SMS
//   4. only AFTER the send succeeds, set guests.invitation_last_sent_at = now()

// Guest responding to rsvp. Saves their answer on their guest row, and their
// accept/decline for each task assigned to them. Submitting again overwrites the earlier answers.
export async function postRSVPtoSupabase(
    eventId: string,
    token: string,
    submission: RSVPSubmission) {
        if (!eventId) throw new RSVPerror("eventId is required", 400);
        if (!token) throw new RSVPerror("token is required", 400);
        if (!submission || typeof submission !== "object")
            throw new RSVPerror("Request body is required", 400);

        const status = String(submission.rsvpStatus ?? "").trim().toLowerCase() as RSVPstatus;
        if (!VALID_STATUSES.includes(status)) {
            throw new RSVPerror(
                `rsvpStatus must be one of: ${VALID_STATUSES.join(", ")}`,
                400
            );
        }

        const taskResponses = submission.taskResponses ?? [];
        const customAnswers = submission.answers ?? [];
        if (!Array.isArray(taskResponses) || !Array.isArray(customAnswers))
            throw new RSVPerror("taskResponses and answers must be arrays", 400);
        if (taskResponses.length > MAX_ITEMS || customAnswers.length > MAX_ITEMS)
            throw new RSVPerror("Too many responses", 400);

        const guest = await loadGuestByToken(eventId, token, "id, plus_one_allowed");

        const [settingsRes, tasksRes, eventRes] = await Promise.all([
            supabase.from("invitation_settings")
                .select("default_plus_one_allowed")
                .eq("event_id", eventId).maybeSingle(),
            supabase.from("tasks")
                .select("id, title")
                .eq("event_id", eventId).eq("assigned_guest_id", guest.id),
            supabase.from("events")
                .select("rsvp_deadline")
                .eq("id", eventId).maybeSingle(),
        ]);
        if (settingsRes.error) throw new RSVPerror(`Failed to load invitation settings: ${settingsRes.error.message}`, 500);
        if (tasksRes.error) throw new RSVPerror(`Failed to load tasks: ${tasksRes.error.message}`, 500);
        if (eventRes.error) throw new RSVPerror(`Failed to load event: ${eventRes.error.message}`, 500);

        // No answers after the RSVP deadline
        const deadline = (eventRes.data as any)?.rsvp_deadline;
        if (deadline && new Date() > new Date(deadline))
            throw new RSVPerror("The RSVP deadline has passed", 403);


        // Plus one
        const plusOneAllowed: boolean =
            guest.plus_one_allowed ?? (settingsRes.data as any)?.default_plus_one_allowed ?? false;
        let plusOneAttending = false;
        if (status === "attending" && submission.plusOneAttending === true) {
            if (!plusOneAllowed) throw new RSVPerror("A plus one is not allowed for this invitation", 400);
            plusOneAttending = true;
        }

        // Tasks: a guest can only answer for tasks assigned to them
        const assignedTasks = new Map<string, string>(
            (tasksRes.data ?? []).map((t: any) => [t.id, t.title] as [string, string])
        );
        for (const r of taskResponses) {
            if (!r || typeof r.accepted !== "boolean")
                throw new RSVPerror("Each task response needs taskId and accepted (true or false)", 400);
            if (!assignedTasks.has(r.taskId))
                throw new RSVPerror("That task is not assigned to this guest", 400);
        }

        // The answers column: one labeled line per answer, so editing or reordering the
        // host's questions later never mixes up old answers
        const lines: string[] = [];
        const dietary = oneLine(submission.dietaryNotes);
        if (dietary) lines.push(`Dietary: ${dietary}`);
        if (status === "attending" && plusOneAllowed)
            lines.push(`Bringing a plus one: ${plusOneAttending ? "yes" : "no"}`);
        for (const r of taskResponses)
            lines.push(`Task "${oneLine(assignedTasks.get(r.taskId), 200)}": ${r.accepted ? "accepted" : "declined"}`);
        for (const a of customAnswers) {
            const question = oneLine(a?.question, 200);
            const answer = oneLine(a?.answer);
            if (question && answer) lines.push(`${question}: ${answer}`);
        }

        // Task answers go first and the guest row last. If something fails halfway,
        // the guest just submits again: everything is overwritten, so nothing is left inconsistent.
        const taskUpdates = await Promise.all(
            taskResponses.map((r) =>
                supabase.from("tasks")
                    .update({ assignment_status: r.accepted ? "accepted" : "declined" })
                    .eq("id", r.taskId)
                    .eq("assigned_guest_id", guest.id)
            )
        );
        const failedTask = taskUpdates.find((u) => u.error);
        if (failedTask?.error)
            throw new RSVPerror(`Failed to save task responses: ${failedTask.error.message}`, 500);

        const { data, error } = await supabase
            .from("guests")
            .update({
                rsvp_status: status,
                plus_one_attending: plusOneAttending,
                dietary_notes: dietary || null,
                answers: lines.join("\n") || null,
                responded_at: new Date().toISOString(),
            })
            .eq("id", guest.id)
            .select("rsvp_status, answers, responded_at") // never return the guest id
            .maybeSingle();

        if (error) throw new RSVPerror(`Failed to save RSVP: ${error.message}`, 500);
        if (!data) throw new RSVPerror("Invalid invite link", 404);

    return {
        rsvpStatus: data.rsvp_status,
        answers: data.answers,
        respondedAt: data.responded_at,
    };
}