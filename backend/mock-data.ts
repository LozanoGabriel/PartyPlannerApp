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