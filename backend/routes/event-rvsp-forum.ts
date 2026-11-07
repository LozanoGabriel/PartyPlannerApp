import express from "express"
import { fetchEventDetailsFromSupabase, postRSVPtoSupabase } from "../database/functions"


//This route is intended for RSVP 
const router = express.Router()

router.get("/:eventId/:token", (req, res) => {
    const {eventId, token } = req.params
    console.log("Request recieved! URL parameters: %s %s %s", eventId, token )
    res.json(fetchEventDetailsFromSupabase(eventId))
})

router.post("/:eventId/:token", (req, res) => {
    const { eventId, token} = req.params
    const { sent_at, responses } = req.body
    res.json(postRSVPtoSupabase(eventId, token, sent_at, responses))
})

export default router