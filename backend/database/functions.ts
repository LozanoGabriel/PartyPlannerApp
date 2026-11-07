//TODO: Change from mock data to true integration
import { supabase } from 
import { EventDetails } from "../../interfaces/event-details"
import { mockEventDetail, mockOk } from "../mock-data"


//TODO : Implement
export async function fetchEventDetailsFromSupabase(eventId: string): 
Promise<EventDetails | null> {
    if(!eventId){
        throw new Error('eventID is required.')
    }

    const {data, error} = await supabase
        .from('events')
        .select('Id, name, description, event_type, start_type, end_time, additional_fields')
        .eq('id',eventId)

        if(error){
            throw new Error('Failed to fetch event: ${error.message}')
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