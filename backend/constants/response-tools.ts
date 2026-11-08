import type { eventCreationSteps } from "../../interfaces/event-creation-steps";
import { EVENT_TYPES } from "./event-types";

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
    task_name: {
      type: "string",
      description: "A concise title for the task.",
    },
    task_description: {
      type: "string",
      description: "Specific details for completing the task.",
    },
  },
  required: ["task_name", "task_description"],
  additionalProperties: false,
};

export const RESPONSE_TOOLS: Record<eventCreationSteps, ResponseTool> = {
  "Event Type": {
    type: "function",
    function: {
      name: "create_gala_response",
      description: "Return the event category selected from the available options.",
      parameters: {
        type: "object",
        properties: {
          event_type: {
            type: "string",
            enum: EVENT_TYPES,
            description: "The best-fitting event category.",
          },
        },
        required: ["event_type"],
        additionalProperties: false,
      },
    },
  },
  Name: {
    type: "function",
    function: {
      name: "create_gala_response",
      description: "Return four fitting name ideas for the event.",
      parameters: {
        type: "object",
        properties: {
          names: {
            type: "array",
            description: "Four suggested event names.",
            items: { type: "string" },
          },
        },
        required: ["names"],
        additionalProperties: false,
      },
    },
  },
  Prompt: {
    type: "function",
    function: {
      name: "create_gala_response",
      description: "Return the user-facing response to the user's request.",
      parameters: {
        type: "object",
        properties: {
          english_response: {
            type: "string",
            description: "A concise, friendly response to the user's request.",
          },
        },
        required: ["english_response"],
        additionalProperties: false,
      },
    },
  },
  Budget: {
    type: "function",
    function: {
      name: "create_gala_response",
      description: "Return items that should be added to the event budget.",
      parameters: {
        type: "object",
        properties: {
          budget_items: {
            type: "array",
            description: "Relevant items to include in the event budget.",
            items: {
              type: "object",
              properties: {
                item_name: {
                  type: "string",
                  description: "The budget item.",
                },
                item_description: {
                  type: "string",
                  description: "Why the item is needed or relevant.",
                },
              },
              required: ["item_name", "item_description"],
              additionalProperties: false,
            },
          },
        },
        required: ["budget_items"],
        additionalProperties: false,
      },
    },
  },
  Task: {
    type: "function",
    function: {
      name: "create_gala_response",
      description: "Return an array of actionable event tasks.",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            description:
              "All relevant actionable tasks; choose the number needed and do not pad the list.",
            items: taskItemSchema,
          },
        },
        required: ["tasks"],
        additionalProperties: false,
      },
    },
  },
};
