import express from "express"
import { fetchEventDetailsFromSupabase } from "../database/functions"

const router = express.Router()

router.get("/:hostid/:eventName", (req, res) => {
    const {hostid, eventName} = req.params
    res.json(fetchEventDetailsFromSupabase(hostid, eventName))
})

export default router