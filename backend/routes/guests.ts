import express, { Response } from "express"
import { getGuestsFromSupabase, postGuestToSupabase, deleteGuestFromSupabase, patchGuestInSupabase, markInvitationSent } from "../database/guest_logic"
import { RSVPerror } from "../database/invitation_logic"
import { requireAuth } from "../middleware/requireAuth"

// This route is intended for the host managing the guest list of their event.
// (Guests answering an invitation use the token-based RSVP routes, not these.)
const router = express.Router()

// Every route here is host-only. The token goes in the header: Authorization: Bearer <token>
// requireAuth verifies it and sets res.locals.userId
router.use(requireAuth)

function handleError(res: Response, err: unknown, fallback: string) {
    if (err instanceof RSVPerror) return res.status(err.status).json({ error: err.message })
    console.error(err)
    return res.status(500).json({ error: fallback })
}

// List all the guests for an event
router.get("/:eventId", async (req, res) => {
    try {
        const guests = await getGuestsFromSupabase(res.locals.userId, req.params.eventId)
        return res.status(200).json({ guests })
    } catch (err) {
        return handleError(res, err, "Could not load guests")
    }
})

// Create new guest. Returns { guest } including guest.id
router.post("/:eventId", async (req, res) => {
    try {
        if (!req.body?.guestData) throw new RSVPerror("guestData is required", 400)
        const guest = await postGuestToSupabase(res.locals.userId, req.params.eventId, req.body.guestData)
        return res.status(201).json({ guest })
    } catch (err) {
        return handleError(res, err, "Could not create guest")
    }
})

// Update guest. Send only the fields that changed: { guestData: { phone: "555-0100" } }
router.patch("/:guestId", async (req, res) => {
    try {
        if (!req.body?.guestData) throw new RSVPerror("guestData is required", 400)
        const guest = await patchGuestInSupabase(res.locals.userId, req.params.guestId, req.body.guestData)
        return res.status(200).json({ guest })
    } catch (err) {
        return handleError(res, err, "Could not update guest")
    }
})

// Record that the host sent this guest's invitation
router.post("/:guestId/sent", async (req, res) => {
    try {
        const guest = await markInvitationSent(res.locals.userId, req.params.guestId)
        return res.status(200).json({ guest })
    } catch (err) {
        return handleError(res, err, "Could not update guest")
    }
})

// Delete guest
router.delete("/:guestId", async (req, res) => {
    try {
        await deleteGuestFromSupabase(res.locals.userId, req.params.guestId)
        return res.status(204).send()
    } catch (err) {
        return handleError(res, err, "Could not delete guest")
    }
})

export default router