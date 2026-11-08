import express, { Response } from "express"
import { getBudgetFromSupabase, postBudgetToSupabase, patchBudgetInSupabase, deleteBudgetItemFromSupabase } from "../database/budget_logic"
import { RSVPerror } from "../database/invitation_logic"
import { requireAuth } from "../middleware/requireAuth"

// This route is intended for the host's budget lines for an event.
const router = express.Router()

// Every route here is host-only. The token goes in the header: Authorization: Bearer <token>
router.use(requireAuth)

function handleError(res: Response, err: unknown, fallback: string) {
    if (err instanceof RSVPerror) return res.status(err.status).json({ error: err.message })
    console.error(err)
    return res.status(500).json({ error: fallback })
}

// Retrieves the event's budget lines, plus totals
router.get("/:eventId", async (req, res) => {
    try {
        const budget = await getBudgetFromSupabase(res.locals.userId, req.params.eventId)
        return res.status(200).json(budget) // { items, summary }
    } catch (err) {
        return handleError(res, err, "Could not load budget")
    }
})

// Inserts a budget line. Only expense is required.
// Body: { budgetData: { expense, budgeted?, actual?, paymentStatus? } }
router.post("/:eventId", async (req, res) => {
    try {
        if (!req.body?.budgetData) throw new RSVPerror("budgetData is required", 400)
        const item = await postBudgetToSupabase(res.locals.userId, req.params.eventId, req.body.budgetData)
        return res.status(201).json({ item })
    } catch (err) {
        return handleError(res, err, "Could not create budget item")
    }
})

// Updates a budget line. Send only the fields that changed: { budgetData: { paymentStatus: "partial" } }
router.patch("/:itemId", async (req, res) => {
    try {
        if (!req.body?.budgetData) throw new RSVPerror("budgetData is required", 400)
        const item = await patchBudgetInSupabase(res.locals.userId, req.params.itemId, req.body.budgetData)
        return res.status(200).json({ item })
    } catch (err) {
        return handleError(res, err, "Could not update budget item")
    }
})

// Deletes a budget line
router.delete("/:itemId", async (req, res) => {
    try {
        await deleteBudgetItemFromSupabase(res.locals.userId, req.params.itemId)
        return res.status(204).send()
    } catch (err) {
        return handleError(res, err, "Could not delete budget item")
    }
})

export default router