import OpenAI from "openai";
import readlineSync from "readline-sync";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

// Tools
function getWeatherDetails(city) {
  if (city.toLowerCase() === "delhi") return "10°C";
  if (city.toLowerCase() === "mumbai") return "20°C";
  if (city.toLowerCase() === "bangalore") return "24°C";
  if (city.toLowerCase() === "chandigarh") return "16°C";
  if (city.toLowerCase() === "gurgaon") return "13°C";
}

const tools = {
  getWeatherDetails: getWeatherDetails,
};

const SYSTEM_PROMPT = `
You are an AI Assistant with START, PLAN, ACTION, Observation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on action.
Once you get the observations, Return the AI response based on START prompt and observations

Strictly follow the JSON Output format as in examples

Available Tools:
-function getWeatherDetails(city: string): string
getWeatherDetails is a function that accepts the city name as string and returns the weather details

Example:
START
{"type": "user", "user": "What is the sum of weather of Delhi and Mumbai?"}
{"type": "plan", "plan": "I will call the getWeatherDetails for Delhi"}
{"type": "action", "function": "getWeatherDetails", input: "delhi"}
{"type": "observation", "observation": "10°C"}
{"type": "plan", "plan": "I will call the getWeatherDetails for mumbai"}
{"type": "action", "function": "getWeatherDetails", input: "mumbai"}
{"type": "observation", "observation": "20°C"}
{"type": "output", "output": "The sum of weather of Delhi and Mumbai is 30°C"}

`;

const messages = [{ role: "system", content: SYSTEM_PROMPT }];

while (true) {
  const query = readlineSync.question(">> ");
  const q = {
    type: "user",
    user: query,
  };
  messages.push({ role: "user", content: JSON.stringify(q) });

  while (true) {
    const chat = await client.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
    });

    const result = chat.choices[0].message.content;
    messages.push({ role: "assistant", content: result });

    const call = JSON.parse(result);

    if (call.type == "output") {
      break;
    } else if (call.type == "action") {
      const fn = tools[call.function];
      const observation = fn(call.input);
      const obs = { type: "observation", observation: observation };
      messages.push({ role: "developer", content: JSON.stringify(obs) });
    }
  }
}
