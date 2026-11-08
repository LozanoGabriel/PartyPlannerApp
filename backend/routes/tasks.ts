import express from "express"
import { getTasksFromSupabase, postTaskToSupabase, deleteTaskFromSupabase, patchTaskInSupabase } from "../database/functions"


//This route is intended for the creation of Guests for an event.
const router = express.Router()

//Retrieves all of the users' tasks
router.get("/", (req, res) => {
    const jwt = req.body.jwt
    res.json(getTasksFromSupabase(jwt))
})

//Retrieves event-specific tasks
router.get("/:eventId", (req, res) => {
    const jwt = req.body.jwt
    const eventId = req.params.eventId
    res.json(getTasksFromSupabase(jwt, eventId))
})

//Inserts a row for tasks
router.post("/:eventId", (req, res) => {
    const body = req.body
    res.json(postTaskToSupabase(body.jwt, body.task_data))
    //TODO: Must return task's ID
})

router.delete("/:taskId", (req, res) => {
    const jwt = req.body.jwt
    const taskId = req.params.taskId
    res.json(deleteTaskFromSupabase(jwt,taskId)) 
})

router.patch("/:taskId", (req, res) => {
    const body = req.body
    res.json(patchTaskInSupabase(body.jwt, body.task_data))
})
