import dotenv from "dotenv";

dotenv.config();

type EventDetails = {
  name: string;
  description: string;
  eventType: string;
  startTime: string;
  endTime: string;
};

type PlannedTask = {
  task_name: string;
  task_description: string;
};

type GalaResponse = {
  english_response: string;
  tasks: PlannedTask[];
};

type AgentConfig = {
  agent_name: string;
  description: string;
  system_prompt: string;
  model_name: string;
  max_loops: number;
  tools_list_dictionary?: object[];
};

type SwarmsResponse = Record<string, unknown>;

const API_URL = "https://api.swarms.world/v1";
const MODEL_NAME = "claude-haiku-4-5";
const userPrompt =
  "I want to make my celebration look super pretty. What should I do in order to do that?";

const now = new Date();
const eventDetails: EventDetails = {
  name: "Grand 21st Celebration",
  description: "Let's celebrate!",
  eventType: "Celebration",
  startTime: now.toISOString(),
  endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
};

const responseTool = {
  type: "function",
  function: {
    name: "create_gala_response",
    description:
      "Return the final user-facing response and an array of actionable event tasks.",
    parameters: {
      type: "object",
      properties: {
        english_response: {
          type: "string",
          description: "A concise, friendly response to the user's request.",
        },
        tasks: {
          type: "array",
          description:
            "All relevant actionable tasks; choose the number needed and do not pad the list.",
          items: {
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
          },
        },
      },
      required: ["english_response", "tasks"],
      additionalProperties: false,
    },
  },
};

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

function outputToText(response: SwarmsResponse, agentName: string): string {
  const output = response.outputs;
  if (typeof output === "string" && output.trim()) return output.trim();
  if (Array.isArray(output) && output.length > 0) {
    return JSON.stringify(output);
  }
  if (isRecord(output) && Object.keys(output).length > 0) {
    return JSON.stringify(output);
  }
  throw new Error(`${agentName} returned no output.`);
}

function findFunctionCall(
  value: unknown,
  depth = 0,
): { arguments: unknown } | undefined {
  if (depth > 8) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const call = findFunctionCall(item, depth + 1);
      if (call) return call;
    }
    return undefined;
  }
  if (!isRecord(value)) return undefined;

  const fn = value.function;
  if (
    isRecord(fn) &&
    fn.name === "create_gala_response" &&
    "arguments" in fn
  ) {
    return { arguments: fn.arguments };
  }

  for (const child of Object.values(value)) {
    const call = findFunctionCall(child, depth + 1);
    if (call) return call;
  }
  return undefined;
}

function parseGalaResponse(value: unknown): GalaResponse {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch (error) {
      throw new Error("Gala returned malformed function arguments.", {
        cause: error,
      });
    }
  }

  if (!isRecord(parsed) || typeof parsed.english_response !== "string") {
    throw new Error("Gala's response is missing english_response.");
  }
  if (!Array.isArray(parsed.tasks)) {
    throw new Error("Gala's tasks field must be an array.");
  }

  const tasks = parsed.tasks.map((task, index): PlannedTask => {
    if (
      !isRecord(task) ||
      typeof task.task_name !== "string" ||
      typeof task.task_description !== "string"
    ) {
      throw new Error(`Gala returned an invalid task at index ${index}.`);
    }
    return {
      task_name: task.task_name,
      task_description: task.task_description,
    };
  });

  return { english_response: parsed.english_response, tasks };
}

async function runAgent(
  agent: AgentConfig,
  task: string,
  apiKey: string,
): Promise<string> {
  const response = await postJson(
    "/agent/completions",
    {
      agent_config: agent,
      task,
    },
    apiKey,
  );
  if (response.success === false) {
    throw new Error(`${agent.agent_name} completion was not successful.`);
  }
  return outputToText(response, agent.agent_name);
}

async function main(): Promise<void> {
  const apiKey = process.env.SWARMS_API_KEY;
  if (!apiKey) throw new Error("SWARMS_API_KEY is not set.");

  const discussion: { agent_name: string; message: string }[] = [];

  for (const specialist of specialists) {
    const task = `Discuss this event-planning request with the specialists who have already contributed. Respond with your own relevant advice and explicitly build on at least one earlier point when there is one. Do not write the final answer.

Event details:
${JSON.stringify(eventDetails, null, 2)}

User's request:
${userPrompt}

Earlier specialists' messages:
${JSON.stringify(discussion, null, 2)}`;

    const message = await runAgent(specialist, task, apiKey);
    discussion.push({ agent_name: specialist.agent_name, message });
    console.log(`\n--- ${specialist.agent_name} ---\n${message}\n`);
  }

  if (discussion.length < 2) {
    throw new Error(
      "The final agent was not called because fewer than two specialists contributed.",
    );
  }

  const finalizerTask = `Write the final response for the user using the specialist discussion below.

Event details:
${JSON.stringify(eventDetails, null, 2)}

User's request:
${userPrompt}

Specialist discussion:
${JSON.stringify(discussion, null, 2)}

Call create_gala_response exactly once. Make the english_response helpful and concise. Return all relevant actionable tasks in the tasks array; choose the number that fits the request rather than forcing a fixed count.`;

  const finalizerResponse = await postJson(
    "/agent/completions",
    {
      agent_config: {
        agent_name: "Gala Final Response",
        description:
          "Synthesizes specialist discussion into the final structured response.",
        system_prompt:
          "You are Gala, the sole final responder. Use the event details, user's request, and the specialist discussion. You must answer by calling create_gala_response; do not answer with plain text.",
        model_name: MODEL_NAME,
        max_loops: 1,
        tools_list_dictionary: [responseTool],
      } satisfies AgentConfig,
      task: finalizerTask,
    },
    apiKey,
  );

  if (finalizerResponse.success === false) {
    throw new Error("Gala's final completion was not successful.");
  }
  const functionCall = findFunctionCall(finalizerResponse.outputs);
  if (!functionCall) {
    throw new Error(
      `Gala did not call create_gala_response. Output: ${JSON.stringify(finalizerResponse.outputs)}`,
    );
  }

  const galaResponse = parseGalaResponse(functionCall.arguments);
  console.log(JSON.stringify(galaResponse, null, 2));
}

main().catch((error: unknown) => {
  console.error("Gala task generation failed:", error);
  process.exitCode = 1;
});
