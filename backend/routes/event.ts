import express, { Response } from "express"
import { createEvent, deleteEventSupabase, getEventFromSupabase, getEventsFromSupabase, patchEventInSupabase } from "../database/event_logic"
import { RSVPerror } from "../database/invitation_logic"
import { requireAuth } from "../middleware/requireAuth"

// This route is intended for the manipulation of Events
const router = express.Router()

// Every route here is host-only. The token goes in the header: Authorization: Bearer <token>
// requireAuth verifies it and sets res.locals.userId
router.use(requireAuth)

function handleError(res: Response, err: unknown, fallback: string) {
    if (err instanceof RSVPerror) return res.status(err.status).json({ error: err.message })
    console.error(err)
    return res.status(500).json({ error: fallback })
}

// Create an event. Returns { event } including event.id
router.get("/", async (_req, res) => {
    try {
        const events = await getEventsFromSupabase(res.locals.userId)
        return res.status(200).json({ events })
    } catch (err) {
        return handleError(res, err, "Could not load events")
    }
})

router.get("/:eventId", async (req, res) => {
    try {
        const event = await getEventFromSupabase(res.locals.userId, req.params.eventId)
        return res.status(200).json({ event })
    } catch (err) {
        return handleError(res, err, "Could not load event")
    }
})

router.post("/", async (req, res) => {
    try {
        if (!req.body?.eventDetails) throw new RSVPerror("eventDetails is required", 400)
        const event = await createEvent(res.locals.userId, req.body.eventDetails)
        return res.status(201).json({ event })
    } catch (err) {
        return handleError(res, err, "Could not create event")
    }
})

router.delete("/:eventId", async (req, res) => {
    try {
        await deleteEventSupabase(res.locals.userId, req.params.eventId)
        return res.status(204).send()
    } catch (err) {
        return handleError(res, err, "Could not delete event")
    }
})

// Send only the fields that changed: { eventDetails: { name: "New name" } }
router.patch("/:eventId", async (req, res) => {
    try {
        if (!req.body?.eventDetails) throw new RSVPerror("eventDetails is required", 400)
        const event = await patchEventInSupabase(res.locals.userId, req.params.eventId, req.body.eventDetails)
        return res.status(200).json({ event })
    } catch (err) {
        return handleError(res, err, "Could not update event")
    }
})

export default router