
import dotenv from "dotenv"

dotenv.config()
type Agent = {
  agent_name: string;
  description: string;
  system_prompt: string;
  model_name: string;
  max_loops: number;
  llm_args?: any;
};

type SwarmCompletionRequest = {
  name: string;
  description: string;
  swarm_type: string;
  task: string;
  agents: Agent[];
  max_loops: number;
};

const currentDateTime = new Date();
const endDateTime  = new Date(currentDateTime)
endDateTime.setHours(currentDateTime.getHours() + 2)

const mockevent = {
    name: "Grand 21st Celebration",
    description: "Let's celebrate!",
    eventType : "Celebration",
    startTime : currentDateTime.toUTCString(),
    endTime : endDateTime.toUTCString(),
}

const currentTask = "The current task of the user is to make a list of tasks that the event may require to be done before the occurance of the event."

const aiResponseLimitation = "You are limited to responding in two ways. First, you must give a human response for the user to read, which is the english_response field. Then, the tasks field is for you to create tasks that align with the users' goals. Preferably, make 5."

const userPrompt = `The user also sent their own prompt. Consider it as you discuss. User prompt: "I want to make my celebration look super pretty. What should I do in order to do that?" END OF USER PROMPT.`
const eventDetails = JSON.stringify(mockevent)
const payload: SwarmCompletionRequest = {
  "name": "Gala Consult",
  "description": "Gala's agents",
  "swarm_type": "GroupChat",
  "task": `You are a team of agents whose task is to help the user with hosting an event.
You will have a leader agent named Gala who will be in charge of compiling all the information you deliver to them, and make a suggestion to the user based on their current ask.
Discuss amongst each other to structure the best response, considering the details of the event, and the user's current task which are described next.
Here are the details of the event the user is planning over:
${eventDetails}
END EVENT DETAILS
Here is the current task of the user, which is the information they will need from Gala's final response.
${currentTask}
END USER'S TASK
${userPrompt}
Here is the structure Gala *MUST* follow in her response to the user. Gala is otherwise free to communicate with the other agents normally.
${aiResponseLimitation}
`

,
  "agents": [
    {
      "agent_name": "Gala JSON interpreter",
      "description": "You translate the leader's final output into a JSON format",
      "system_prompt": "You are the leader's translator. You will listen to what Gala says, and what the response to the user will be. You absolutely MUST follow the structure detailed in the structure Gala must follow when deciding what information goes into what fields in the JSON file.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 3,
    llm_args: {
      response_format: {
        type: "json_schema",
        json_schema: {
            name: "gala_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                english_response: { type: "string" },
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      task_name: { type: "string" },
                      task_description: { type: "string" }
                    },
                    required: ["task_name", "task_description"],
                    additionalProperties: false
                  }
                }
              },
              required: ["english_response", "tasks"],
              additionalProperties: false
            }
        }
      }
    },
    },
    {
      "agent_name": "Gala",
      "description": "Leader Agent who decides what is delivered to the user",
      "system_prompt": "You are the leader amongst all other agents. You are to listen to the other agents, compile all the information they deliver, consider their discussions and conclusions, conversate with them, task them, consider who to listen to more, then finally, you MUST follow the structure delivered in your task for the final response the user sees.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Wedding Planner",
      "description": "Expert in planning weddings.",
      "system_prompt": "You are an expert in planning weddings. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Professional Decorator",
      "description": "Expert in decorating events.",
      "system_prompt": "You are an expert in decorating events. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Florist",
      "description": "Expert Florist",
      "system_prompt": "You are an expert Florist. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Permit Coordinator",
      "description": "Professional Permit Coordinator",
      "system_prompt": "You are a expert Permit Coordinator. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Event Coordinator",
      "description": "Professional Event Coordinator",
      "system_prompt": "You are a expert Event Coordinator. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala. As the event coordiator, you are in charge of making sure all the other agents line up well in terms of time when considering the event, amongst all the other tasks a Event Coordinator should handle.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Event Photogropher",
      "description": "Professional Event Photogropher",
      "system_prompt": "You are a expert Event Photogropher. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Event Talent Booking Agent",
      "description": "Professional Event Talent Booking Agent",
      "system_prompt": "You are a professional Event Talent Booking Agent. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Event Caterer",
      "description": "Professional Event Caterer",
      "system_prompt": "You are a professional Event Caterer. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Event Bartender",
      "description": "Professional Event Bartender",
      "system_prompt": "You are a Professional Event Bartender. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Print Shop owner",
      "description": "Professional Print Shop owner",
      "system_prompt": "You are a Professional Print Shop owner. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Non-AI graphic designer",
      "description": "Professional Non-AI graphic designer",
      "system_prompt": "You are a Professional Non-AI graphic designer. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala. You are not to use AI-Generated graphic desings. Find real Designers.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },
    {
      "agent_name": "Therapist",
      "description": "Professional Therapist",
      "system_prompt": "You are a Professional Therapist. You are to listen to the task given, consider the event details and if they are relevant to you, consider what information the user will need for their current task, research for relevant details to deliver to the conversation amongst the other agents, and consider the information from other agents to be useful for Gala, and firstmost, to make sure that the details being discussed to be delivered aren't too stressful for the user, as they are the event planner.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 2
    },



  ],
  "max_loops": 2
};

const response = await fetch("https://api.swarms.world/v1/swarm/completions", {
  method: "POST",
  headers: {
    "x-api-key": process.env.SWARMS_API_KEY!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const responseBody = await response.text();
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${responseBody}`);
}

const data: unknown = JSON.parse(responseBody);
console.log(data);