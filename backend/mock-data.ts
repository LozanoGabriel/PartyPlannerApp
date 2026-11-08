import { EventDetails } from "../interfaces/event-details"


const currentDateTime = new Date();
const endDateTime  = new Date(currentDateTime)
endDateTime.setHours(currentDateTime.getHours() + 2)

export const mockEventDetails: EventDetails = {
    name: "Grand 21st Celebration",
    description: "Let's celebrate!",
    eventType : "Celebration",
    startTime : currentDateTime.toUTCString(),
    endTime : endDateTime.toUTCString(),
}

export const mockOk = {
    body: "ok"
}

export const mockGuestDetails = {
    id : 0,
    family: "Gonzales",
    name : "Pedro",
    plus_one_allowed: false,
    phone: "000-000-0000",
    email:"pedrogon@gala.com",
    invitation_status: "not_sent",
    rsvp_status : "pending",
    plus_one_attening: true,
    dietary_notes: "Spawns cats on penut contact",
    note: "Keep him away from the punch bowl",
}

export const mockTaskDetails = {
    event_id: 0,
    pillar: "Guests",
    title: "AAAA",
    status: "not_started",
}
export const mockBudget = {
    expense: "$1,000,000",
    budgeted: "$2",
    actual: "$1",
    paid: "0",
}