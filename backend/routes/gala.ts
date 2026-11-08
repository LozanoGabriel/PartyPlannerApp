import express from "express";
import { EVENT_TYPES } from "../constants/event-types";
import { consultGala } from "../gala/gala";
import type { eventCreationSteps } from "../../interfaces/event-creation-steps";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();
router.use(requireAuth);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEventCreationStep(value: unknown): value is eventCreationSteps {
  return (
    typeof value === "string" &&
    (EVENT_TYPES as readonly string[]).includes(value)
  );
}

function isConversationHistory(value: unknown): value is {
  context: string;
  userPrompt?: string;
  assistantResponse: string;
}[] {
  return (
    Array.isArray(value) &&
    value.length <= 8 &&
    value.every((entry) =>
      isRecord(entry) &&
      typeof entry.context === "string" &&
      entry.context.length <= 40 &&
      (entry.userPrompt === undefined ||
        (typeof entry.userPrompt === "string" && entry.userPrompt.length <= 2000)) &&
      typeof entry.assistantResponse === "string" &&
      entry.assistantResponse.length <= 2000
    )
  );
}

router.post("/", async (req, res, next) => {
  const { context, userPrompt, history } = req.body ?? {};
  const eventDetails = req.body?.eventDetails ?? {};
  if (
    !isEventCreationStep(context) ||
    (userPrompt !== undefined &&
      (typeof userPrompt !== "string" || userPrompt.length > 2000)) ||
    !isRecord(eventDetails) ||
    (history !== undefined && !isConversationHistory(history))
  ) {
    res.status(400).json({
      error: "A supported context is required; userPrompt must be a string of at most 2000 characters when provided, and eventDetails must be an object.",
    });
    return;
  }

  try {
    const result = await consultGala(context, eventDetails, userPrompt, history ?? []);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;