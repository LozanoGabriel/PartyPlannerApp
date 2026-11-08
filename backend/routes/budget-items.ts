import express from "express"
import { getBudgetFromSupabase, patchBudgetInSupabase, postBudgetToSupabase } from "../database/budget_logic"


//This route is intended for the creation of Guests for an event.
const router = express.Router()

//Retrieves event-specific tasks
router.get("/:eventId", (req, res) => {
    const jwt = req.body.jwt
    const eventId = req.params.eventId
    res.json(getBudgetFromSupabase(jwt, eventId))
})


//Inserts a row for tasks
router.post("/:eventId", (req, res) => {
    const body = req.body
    res.json(postBudgetToSupabase(body.jwt, body.budget_data))
    //TODO: Must return budget's ID
})

router.delete("/:budgetId", (req, res) => {
    const jwt = req.body.jwt
    const budgetId = req.params.budgetId
    res.json() 
})

router.patch("/:budgetId", (req, res) => {
    const body = req.body
    res.json(patchBudgetInSupabase(body.jwt, body.budget_data))
})
