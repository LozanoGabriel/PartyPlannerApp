//TODO: Change from mock data to true integration
import { mockEventDetail, mockOk } from "../mock-data"


//TODO : Implement
export function fetchEventDetailsFromSupabase(eventId: string) {
    return mockEventDetails
}

export function postRSVPtoSupabase(eventId, token, sent_at, responses) {
    return mockOk
}