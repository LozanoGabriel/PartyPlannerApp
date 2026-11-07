import type { EventFields } from "./event-fields"
import type { EventType } from "./event-type"

export type EventDetails = {
    name: string,
    description: string,
    eventType: EventType,
    startTime: string, //Ensure handling of date to string conversion when used.
    endTime: string , // ^ same as on top.
    additionalFields?: EventFields[]
}