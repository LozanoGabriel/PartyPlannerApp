import { EVENT_CATEGORIES } from "./event-categories";

export const GALA_TASKS = {
  "Event Type": `Help the user choose the best-fitting event type from: ${EVENT_CATEGORIES.join(", ")}. Give a brief reason and include the best matching type when appropriate.`,
  Name: "Help the user name this event. Suggest several original names that fit the details and any style they requested.",
  "Event Settings": "Help the user make practical event settings based on the information available. Offer optional duration, food, drink, or timeline ideas without claiming they have been saved or chosen.",
  "Guest List": "Help the user plan their guest list and headcount. Do not invent actual guests or claim any guests have been added.",
  Budget: "Help the user plan a realistic event budget. Suggest relevant expense items and explain why they may be needed. Do not imply that any amounts or items have been saved.",
  Prompt: "Answer the user's event-planning request using the provided context and details.",
  Task: "Suggest actionable planning tasks that fit the event. Do not imply that any tasks have been saved.",
} satisfies Record<string, string>;