import express, { Response } from "express"
import { getInvitationSettings, patchInvitationSettings } from "../database/invitation_settings"
import { RSVPerror } from "../database/invitation_logic"
import { requireAuth } from "../middleware/requireAuth"

// This route is intended for the host editing the invitation settings of their event.
// These settings apply to every guest's invitation.
const router = express.Router()

// Every route here is host-only. The token goes in the header: Authorization: Bearer <token>
router.use(requireAuth)

function handleError(res: Response, err: unknown, fallback: string) {
    if (err instanceof RSVPerror) return res.status(err.status).json({ error: err.message })
    console.error(err)
    return res.status(500).json({ error: fallback })
}

// Get the settings for an event
router.get("/:eventId", async (req, res) => {
    try {
        const settings = await getInvitationSettings(res.locals.userId, req.params.eventId)
        return res.status(200).json({ settings })
    } catch (err) {
        return handleError(res, err, "Could not load invitation settings")
    }
})

// Update the settings. Send only the fields that changed: { settings: { dressCode: "Cocktail" } }
// customQuestions replaces the whole list: { settings: { customQuestions: ["Any allergies?", "Song request?"] } }
router.patch("/:eventId", async (req, res) => {
    try {
        if (!req.body?.settings) throw new RSVPerror("settings is required", 400)
        const settings = await patchInvitationSettings(res.locals.userId, req.params.eventId, req.body.settings)
        return res.status(200).json({ settings })
    } catch (err) {
        return handleError(res, err, "Could not update invitation settings")
    }
})

export default router