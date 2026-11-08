import express from "express";
import { EVENT_TYPES } from "../constants/event-types";
import { consultGala } from "../gala/gala";
import type { eventCreationSteps } from "../../interfaces/event-creation-steps";

const router = express.Router();

function isEventCreationStep(value: unknown): value is eventCreationSteps {
  return (
    typeof value === "string" &&
    (EVENT_TYPES as readonly string[]).includes(value)
  );
}

router.post("/", async (req, res, next) => {
  const { context, userPrompt, eventDetails } = req.body ?? {};
  if (
    !isEventCreationStep(context) ||
    typeof userPrompt !== "string" ||
    typeof eventDetails !== "object" ||
    eventDetails === null ||
    Array.isArray(eventDetails)
  ) {
    res.status(400).json({
      error:
        "context, userPrompt, and an eventDetails object are required.",
    });
    return;
  }

  try {
    const result = await consultGala(context, userPrompt, eventDetails);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;