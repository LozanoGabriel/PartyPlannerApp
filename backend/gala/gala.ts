import dotenv from "dotenv";
import type { eventCreationSteps } from "../../interfaces/event-creation-steps";
import { EVENT_TYPES } from "../constants/event-types";
import { RESPONSE_TOOLS } from "../constants/response-tools";
import { GALA_TASKS } from "../constants/gala-tasks";
dotenv.config();


type AgentConfig = {
  agent_name: string;
  description: string;
  system_prompt: string;
  model_name: string;
  max_loops: number;
  tools_list_dictionary?: object[];
};

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

type SwarmsResponse = Record<string, unknown>;

const API_URL = "https://api.swarms.world/v1";
const MODEL_NAME = "claude-haiku-4-5";


const specialists: AgentConfig[] = [
  {
    agent_name: "Event Planner",
    description: "Provides practical event-planning recommendations.",
    system_prompt:
      "You are an event planner in a specialist discussion. Give practical ideas that directly address the user's request. Read and build on the earlier specialists' messages; point out useful additions or disagreements. Do not write the final user response.",
    model_name: MODEL_NAME,
    max_loops: 1,
  },
  {
    agent_name: "Event Decorator",
    description: "Specializes in decor, colors, lighting, and atmosphere.",
    system_prompt:
      "You are an event decorator in a specialist discussion. Focus on the visual style, decor, colors, lighting, and atmosphere. Read and build on the earlier specialists' messages; point out useful additions or disagreements. Do not write the final user response.",
    model_name: MODEL_NAME,
    max_loops: 1,
  },
  {
    agent_name: "Florist",
    description: "Specializes in flowers and floral styling.",
    system_prompt:
      "You are a florist in a specialist discussion. Suggest suitable flowers and arrangements, considering the event and practical constraints. Read and build on the earlier specialists' messages; point out useful additions or disagreements. Do not write the final user response.",
    model_name: MODEL_NAME,
    max_loops: 1,
  },
  {
    agent_name: "Event Coordinator",
    description: "Checks timing, dependencies, and feasibility.",
    system_prompt:
      "You are an event coordinator in a specialist discussion. Assess the earlier recommendations for timing, dependencies, and feasibility, and add practical coordination considerations. Do not write the final user response.",
    model_name: MODEL_NAME,
    max_loops: 1,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function postJson(
  path: string,
  body: unknown,
  apiKey: string,
): Promise<SwarmsResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(
      `Swarms ${path} failed with HTTP ${response.status}: ${responseBody}`,
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(responseBody);
  } catch (error) {
    throw new Error(`Swarms ${path} returned invalid JSON.`, { cause: error });
  }

  if (!isRecord(parsedBody)) {
    throw new Error(`Swarms ${path} returned an unexpected response shape.`);
  }
  return parsedBody;
}

async function runSequentialWorkflow(
  name: string,
  description: string,
  task: string,
  agents: AgentConfig[],
  apiKey: string,
): Promise<unknown> {
  const response = await postJson(
    "/swarm/completions",
    {
      name,
      description,
      swarm_type: "SequentialWorkflow",
      task,
      agents,
      max_loops: 1,
    },
    apiKey,
  );
  const status = typeof response.status === "string" ? response.status.toLowerCase() : "";
  if (["error", "failed", "failure", "cancelled"].includes(status)) {
    throw new Error(`${name} workflow failed with status "${response.status}".`);
  }
  if (!("output" in response) || response.output === null || response.output === undefined) {
    throw new Error(`${name} workflow returned no output.`);
  }
  return response.output;
}

function findFunctionCall(
  value: unknown,
  functionName: string,
  depth = 0,
): { arguments: unknown } | undefined {
  if (depth > 8) return undefined;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return findFunctionCall(parsed, functionName, depth + 1);
    } catch {
      return undefined;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const call = findFunctionCall(item, functionName, depth + 1);
      if (call) return call;
    }
    return undefined;
  }
  if (!isRecord(value)) return undefined;

  const fn = value.function;
  if (
    isRecord(fn) &&
    fn.name === functionName &&
    "arguments" in fn
  ) {
    return { arguments: fn.arguments };
  }

  for (const child of Object.values(value)) {
    const call = findFunctionCall(child, functionName, depth + 1);
    if (call) return call;
  }
  return undefined;
}

function isEventCreationStep(value: unknown): value is eventCreationSteps {
  return (
    typeof value === "string" &&
    (EVENT_TYPES as readonly string[]).includes(value)
  );
}

function parseFunctionArguments(
  value: unknown,
  functionName: string,
): Record<string, unknown> {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch (error) {
      throw new Error(`${functionName} returned malformed JSON arguments.`, {
        cause: error,
      });
    }
  }
  if (!isRecord(parsed)) {
    throw new Error(`${functionName} arguments must be a JSON object.`);
  }
  if (
    "english_response" in parsed &&
    typeof parsed.english_response !== "string"
  ) {
    throw new Error(`${functionName}.english_response must be a string.`);
  }
  return parsed;
}

export async function determineContext(
  userPrompt: string,
): Promise<eventCreationSteps> {
  const apiKey = process.env.SWARMS_API_KEY;
  if (!apiKey) throw new Error("SWARMS_API_KEY is not set.");

  const contextTool = {
    type: "function",
    function: {
      name: "select_event_context",
      description: "Choose the best matching event-planning context.",
      parameters: {
        type: "object",
        properties: {
          context: {
            type: "string",
            enum: EVENT_TYPES,
            description: "The single context that best fits the user's prompt.",
          },
        },
        required: ["context"],
        additionalProperties: false,
      },
    },
  };

  const output = await runSequentialWorkflow(
    "Gala Context Classifier",
    "Classifies a user prompt into one supported Gala context.",
    `Classify this user prompt into the single best matching context:\n\n${userPrompt}`,
    [{
      agent_name: "Gala Context Classifier",
      description: "Classifies a user prompt into one supported Gala context.",
      system_prompt:
        "Choose exactly one context that best describes what the user wants. You must call select_event_context. Do not select any value outside the provided enum.",
      model_name: MODEL_NAME,
      max_loops: 1,
      tools_list_dictionary: [contextTool],
    }],
    apiKey,
  );

  const functionCall = findFunctionCall(output, "select_event_context");
  if (!functionCall) {
    throw new Error(
      `The context classifier did not call select_event_context. Output: ${JSON.stringify(output)}`,
    );
  }

  const args = parseFunctionArguments(
    functionCall.arguments,
    "select_event_context",
  );
  if (!isEventCreationStep(args.context)) {
    throw new Error(
      `The context classifier returned an unsupported context: ${String(args.context)}`,
    );
  }
  return args.context;
}


export async function consultGala(
  requestedContext: eventCreationSteps,
  eventDetails: unknown,
  userPrompt?: string,
  history: { context: string; userPrompt?: string; assistantResponse: string }[] = [],
): Promise<Record<string, unknown>> {
  const apiKey = process.env.SWARMS_API_KEY;
  if (!apiKey) throw new Error("SWARMS_API_KEY is not set.");

  const prompt = userPrompt?.trim();
  const context = requestedContext === "Prompt" && prompt
    ? await determineContext(prompt)
    : requestedContext;
  const currentTask = GALA_TASKS[context];
  const userRequest = prompt || "No additional request was provided. Follow the current Gala task using the available event details.";
  const conversationHistory = history.slice(-8);
  const responseTool = JSON.parse(
    JSON.stringify(RESPONSE_TOOLS[context]),
  ) as ResponseTool;
  if (
    requestedContext === "Prompt" &&
    !("english_response" in responseTool.function.parameters.properties)
  ) {
    responseTool.function.parameters.properties.english_response = {
      type: "string",
      description: "A concise, friendly response to the user's request.",
    };
    responseTool.function.parameters.required.push("english_response");
  }

  const workflowTask = `Run Gala's event-planning specialists in sequence. Each specialist should contribute one or two directly useful points, build on earlier specialists' recommendations, and preserve the useful context for the next specialist. The final agent, Gala Final Response, must synthesize the discussion and call create_gala_response exactly once.

Current Gala task:
${currentTask}

Selected context:
${context}

Event details:
${JSON.stringify(eventDetails, null, 2)}

User's request:
${userRequest}

Previous conversation with the user:
${JSON.stringify(conversationHistory, null, 2)}

Final response requirements: Keep english_response to at most two short sentences and 45 words. Do not repeat structured suggestions in prose; avoid preambles and extra explanation. Limit suggestion arrays to at most three brief, relevant items.`

  const output = await runSequentialWorkflow(
    "Gala Sequential Planning",
    "Runs Gala's event-planning specialists in sequence, then returns one structured response.",
    workflowTask,
    [
      ...specialists,
      {
        agent_name: "Gala Final Response",
        description:
          "Synthesizes specialist discussion into the final structured response.",
        system_prompt:
          "You are Gala, the sole final responder. Be concise: english_response must be at most two short sentences and 45 words. Avoid preambles and do not repeat structured suggestions in prose. Return no more than three brief items in any suggestion array. Use the event details, user's request, prior conversation, and specialist discussion. You must answer by calling create_gala_response; do not answer with plain text.",
        model_name: MODEL_NAME,
        max_loops: 1,
        tools_list_dictionary: [responseTool],
      },
    ],
    apiKey,
  );

  const functionCall = findFunctionCall(output, "create_gala_response");
  if (!functionCall) {
    throw new Error(
      `Gala did not call create_gala_response. Output: ${JSON.stringify(output)}`,
    );
  }

  return parseFunctionArguments(
    functionCall.arguments,
    "create_gala_response",
  );
}