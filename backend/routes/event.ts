import express from "express"
import { EventDetails } from "../../interfaces/event-details"
import { postEventToSupabase, deleteEventSupabase, patchEventInSupabase } from "../database/functions"

type EventPayload = {jwt: string, eventDetails: EventDetails }
//This route is intended for the manipulation of Events
const router = express.Router()

router.post("/", (req, res) => {
    const body: EventPayload = req.body
    res.json(postEventToSupabase(body.jwt, body.eventDetails))
    //TODO: Must return eventId
})

router.delete("/:eventId", (req, res) => {
    const eventId = req.params.eventId
    const jwt = req.body.jwt
    res.json(deleteEventSupabase(jwt, eventId))
})

router.patch("/:eventId", (req, res) => {
    const body: EventPayload = req.body.jwt
    res.json(patchEventInSupabase(body.jwt, body.eventDetails))
})
export default router