//TODO: Change from mock data to true integration
import { mockEventDetails, mockOk } from "../mock-data"


//TODO : Implement
export function fetchEventDetailsFromSupabase(eventId: string) {
    return mockEventDetails
}

export function postRSVPtoSupabase(eventId, token, sent_at, responses) {
    return mockOk
}

export function postEventToSupabase(jwt, eventDetails) {
    return mockOk 
}

export function deleteEventSupabase(jwt, eventId) {
    return mockEventDetails; // The intention is the user gets their event stored locally in a "recently deleted"
    //Although that's not really necessary at all so let's not do that for SharkByte
}

export function patchEventInSupabase(jwt, eventDetails) {
    return mockOk
}

export function postGuestToSupabase(jwt, guest_data) {
    return 0 // Return guest ID here
}
export function deleteGuestFromSupabase(jwt, guestId) {
    return mockOk
}

export function patchGuestInSupabase(jwt, guest_data) {
    return mockOk
}