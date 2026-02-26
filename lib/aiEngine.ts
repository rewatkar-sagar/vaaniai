import "server-only";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIResponse(
  message: string,
  sentiment: string,
  urgency: boolean
) {
  const systemPrompt = `
You are a multilingual AI voice assistant.
Be polite, empathetic and context aware.
`;

  const userPrompt = `
User message: ${message}
Detected sentiment: ${sentiment}
Urgency detected: ${urgency}

Respond accordingly.
If urgency is true, prioritize the issue.
If sentiment is angry, show empathy.
`;

  const completion =
    await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

  return completion.choices[0].message.content;
}