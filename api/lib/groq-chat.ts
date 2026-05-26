import type { ChatMessage } from "./types"

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

export const DEFAULT_GROQ_CHAT_MODEL = "llama-3.3-70b-versatile"

export async function completeGroqChat(
  messages: ChatMessage[],
  apiKey: string,
  model = DEFAULT_GROQ_CHAT_MODEL
): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 800,
      temperature: 0.35,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err || `Groq API error (${response.status})`)
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error("Empty response from Groq")
  return content
}
