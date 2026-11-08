import express, { Response } from "express"
import { getInvitationPage, postRSVPtoSupabase, getInvitationLink, RSVPerror } from "../database/invitation_logic"
import { requireAuth } from "../middleware/requireAuth"

// This route is intended for RSVP
// The guest routes are PUBLIC: the token in the URL is the credential, so there is no login.
// The link route at the bottom is for the host and needs the Authorization header.
const router = express.Router()

function handleError(res: Response, err: unknown, fallback: string) {
    if (err instanceof RSVPerror) return res.status(err.status).json({ error: err.message })
    console.error(err)
    return res.status(500).json({ error: fallback })
}

// Obtain everything the RSVP page needs: guest, event, invitation settings, assigned tasks
router.get("/:eventId/:token", async (req, res) => {
    try {
        const page = await getInvitationPage(req.params.eventId, req.params.token)
        res.set("Cache-Control", "no-store") // private to this guest
        return res.status(200).json(page)
    } catch (err) {
        return handleError(res, err, "Could not load invitation")
    }
})

// Handle Guest responses: add rsvp, task answers and custom answers to the guest's row
// Body: { rsvpStatus, plusOneAttending?, dietaryNotes?, taskResponses?: [{ taskId, accepted }], answers?: [{ question, answer }] }
router.post("/:eventId/:token/rsvp", async (req, res) => {
    try {
        const result = await postRSVPtoSupabase(req.params.eventId, req.params.token, req.body)
        return res.status(200).json(result)
    } catch (err) {
        return handleError(res, err, "Could not save RSVP")
    }
})

// Generate Invitation link (host only)
router.get("/:eventId/guests/:guestId/link", requireAuth, async (req, res) => {
    try {
        const link = await getInvitationLink(res.locals.userId, req.params.eventId, req.params.guestId)
        return res.status(200).json({ link })
    } catch (err) {
        return handleError(res, err, "Could not build invitation link")
    }
})

export default router