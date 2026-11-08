import type { eventCreationSteps } from "../../interfaces/event-creation-steps";
import { EVENT_CATEGORIES } from "./event-categories";

type ResponseTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties: false;
    };
  };
};

const taskItemSchema = {
  type: "object",
  properties: {
    task_name: { type: "string", maxLength: 80, description: "A concise title for the task." },
    task_description: { type: "string", maxLength: 160, description: "One brief, actionable detail." },
  },
  required: ["task_name", "task_description"],
  additionalProperties: false,
};

const budgetItemSchema = {
  type: "object",
  properties: {
    item_name: { type: "string", maxLength: 80, description: "The budget item." },
    item_description: { type: "string", maxLength: 160, description: "One brief reason it may be needed." },
  },
  required: ["item_name", "item_description"],
  additionalProperties: false,
};

function responseTool(
  description: string,
  properties: Record<string, unknown> = {},
  requiredProperties: string[] = [],
): ResponseTool {
  return {
    type: "function",
    function: {
      name: "create_gala_response",
      description,
      parameters: {
        type: "object",
        properties: {
          english_response: {
            type: "string",
            maxLength: 320,
            description: "At most two short sentences, no more than 45 words.",
          },
          ...properties,
        },
        required: ["english_response", ...requiredProperties],
        additionalProperties: false,
      },
    },
  };
}

export const RESPONSE_TOOLS: Record<eventCreationSteps, ResponseTool> = {
  "Event Type": responseTool(
    "Explain which available event type best fits and why. Include event_type when enough information is available.",
    {
      event_type: {
        type: "string",
        enum: EVENT_CATEGORIES,
        description: "The suggested event type, when a clear match can be made.",
      },
    },
  ),
  Name: responseTool(
    "Help name the event and provide several fitting name suggestions.",
    {
      names: {
        type: "array",
        maxItems: 3,
        description: "Up to three original, relevant event name suggestions.",
        items: { type: "string", maxLength: 80 },
      },
    },
  ),
  "Event Settings": responseTool(
    "Give practical advice about the event settings shown to the user.",
    {
      settings_suggestions: {
        type: "array",
        maxItems: 3,
        description: "Up to three brief optional setting ideas.",
        items: { type: "string", maxLength: 160 },
      },
    },
  ),
  "Guest List": responseTool(
    "Help the user think through their guest list without inventing or adding guests.",
    {
      guest_tips: {
        type: "array",
        maxItems: 3,
        description: "Up to three brief, practical guest-list tips.",
        items: { type: "string", maxLength: 160 },
      },
    },
  ),
  Budget: responseTool(
    "Estimate a reasonable total event budget in US dollars using the event details, especially expected headcount and event type. Also suggest relevant budget categories. The estimate is guidance, not a saved expense.",
    {
      estimated_budget: {
        type: "number",
        minimum: 1,
        maximum: 999999999,
        description: "A single positive whole-number estimate of the total event budget in US dollars.",
      },
      budget_items: {
        type: "array",
        maxItems: 3,
        description: "Up to three relevant budget categories with a brief explanation.",
        items: budgetItemSchema,
      },
    },
    ["estimated_budget"],
  ),
  Prompt: responseTool("Answer the user's event-planning request."),
  Task: responseTool(
    "Suggest actionable planning tasks without implying they were saved.",
    {
      tasks: {
        type: "array",
        maxItems: 3,
        description: "Up to three brief, relevant actionable tasks.",
        items: taskItemSchema,
      },
    },
  ),
};
