import express from "express"
import { postGuestToSupabase, deleteGuestFromSupabase, patchGuestInSupabase } from "../database/functions"

type GuestPostPayload = {jwt: string, guest_data: MinimumGuestData }
type MinimumGuestData = { name: string, plus_one_allowed: boolean, invitation_status: string, rsvp_status: string}

//This route is intended for the creation of Guests for an event.
const router = express.Router()

router.post("/:eventId", (req, res) => {
    const body: GuestPostPayload = req.body
    res.json(postGuestToSupabase(body.jwt, body.guest_data))
    //TODO: Must return guestID
})

router.delete("/:guestId", (req, res) => {
    const jwt = req.body.jwt
    const guestId = req.params.guestId
    res.json(deleteGuestFromSupabase(jwt,guestId)) 
    //Verification that this guest belongs to an event from this user is required.
})

router.patch("/:guestId", (req, res) => {
    const body = req.body.jwt
    res.json(patchGuestInSupabase(body.jwt, body.guest_data))
    //Verification that this guest belongs to an event from this user is required.
})
