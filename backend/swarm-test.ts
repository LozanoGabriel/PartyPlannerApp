import dotenv from "dotenv"


dotenv.config()
console.log(process.env.SWARMS_API_KEY)
async function test () {
const response = await fetch("https://api.swarms.world/v1/swarms/available", {
  headers: { "x-api-key": process.env.SWARMS_API_KEY! },
});

if (!response.ok) throw new Error(`HTTP ${response.status}`);

const data: unknown = await response.json();
console.log(data);
}
test()


type Agent = {
  agent_name: string;
  description: string;
  system_prompt: string;
  model_name: string;
  max_loops: number;
};

type SwarmCompletionRequest = {
  name: string;
  description: string;
  swarm_type: string;
  task: string;
  agents: Agent[];
  max_loops: number;
};

const payload: SwarmCompletionRequest = {
  "name": "Hierarchical Swarm demo",
  "description": "An example Hierarchical Swarm swarm.",
  "swarm_type": "HierarchicalSwarm",
  "task": "Summarize the current state of the electric vehicle battery market and recommend where to focus next.",
  "agents": [
    {
      "agent_name": "Researcher",
      "description": "Gathers and summarizes source material.",
      "system_prompt": "You are a meticulous researcher. Gather the relevant facts and summarize them clearly.",
      "model_name": "claude-haiku-4-5",
      "max_loops": 1
    },
    {
      "agent_name": "Analyst",
      "description": "Turns research into a recommendation.",
      "system_prompt": "You are a sharp analyst. Turn the research you are given into a concrete recommendation.",
      "model_name": "gpt-5.5",
      "max_loops": 1
    }
  ],
  "max_loops": 1
};

const response = await fetch("https://api.swarms.world/v1/swarm/completions", {
  method: "POST",
  headers: {
    "x-api-key": process.env.SWARMS_API_KEY!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

if (!response.ok) throw new Error(`HTTP ${response.status}`);

const data: unknown = await response.json();
console.log(data);