import express, { Response } from "express"
import { getTasksFromSupabase, postTaskToSupabase, patchTaskInSupabase, deleteTaskFromSupabase } from "../database/task_logic"
import { RSVPerror } from "../database/invitation_logic"
import { requireAuth } from "../middleware/requireAuth"

// This route is intended for the host's to-do list for an event.
const router = express.Router()

// Every route here is host-only. The token goes in the header: Authorization: Bearer <token>
router.use(requireAuth)

function handleError(res: Response, err: unknown, fallback: string) {
    if (err instanceof RSVPerror) return res.status(err.status).json({ error: err.message })
    console.error(err)
    return res.status(500).json({ error: fallback })
}

// List all the tasks for an event
router.get("/:eventId", async (req, res) => {
    try {
        const result = await getTasksFromSupabase(res.locals.userId, req.params.eventId)
        return res.status(200).json(result)
    } catch (err) {
        return handleError(res, err, "Could not load tasks")
    }
})

// Create a task. Title and pillar are required.
// Body: { taskData: { title, pillar, dueDate?: "2026-12-01", status?, assignedGuestId? } }
router.post("/:eventId", async (req, res) => {
    try {
        if (!req.body?.taskData) throw new RSVPerror("taskData is required", 400)
        const task = await postTaskToSupabase(res.locals.userId, req.params.eventId, req.body.taskData)
        return res.status(201).json({ task })
    } catch (err) {
        return handleError(res, err, "Could not create task")
    }
})

// Update a task. Send only the fields that changed: { taskData: { status: "complete" } }
// dueDate: null clears the due date, assignedGuestId: null unassigns the task
router.patch("/:taskId", async (req, res) => {
    try {
        if (!req.body?.taskData) throw new RSVPerror("taskData is required", 400)
        const task = await patchTaskInSupabase(res.locals.userId, req.params.taskId, req.body.taskData)
        return res.status(200).json({ task })
    } catch (err) {
        return handleError(res, err, "Could not update task")
    }
})

// Delete a task
router.delete("/:taskId", async (req, res) => {
    try {
        await deleteTaskFromSupabase(res.locals.userId, req.params.taskId)
        return res.status(204).send()
    } catch (err) {
        return handleError(res, err, "Could not delete task")
    }
})

export default router