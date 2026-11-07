import type { EventFields } from "./eventFields"
import type { EventType } from "./eventType"

type EventDetails = {
    name: string,
    description: string,
    eventType: EventType,
    startTime: Date,
    endTime: Date,
    additionalFields: EventFields[]
}