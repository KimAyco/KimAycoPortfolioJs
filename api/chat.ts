import type { VercelRequest, VercelResponse } from "@vercel/node"
import { completeGroqChat, DEFAULT_GROQ_CHAT_MODEL } from "./lib/groq-chat"
import { parseJsonBody } from "./lib/parse-body"
import type { ChatMessage } from "./lib/types"

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "lucy-chat" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      error: "GROQ_API_KEY is not configured on the server.",
    })
  }

  try {
    const body = parseJsonBody<{ messages?: ChatMessage[] }>(req)
    const messages = body.messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" })
    }

    const model = process.env.GROQ_CHAT_MODEL ?? DEFAULT_GROQ_CHAT_MODEL
    const reply = await completeGroqChat(messages, apiKey, model)
    return res.status(200).json({ reply })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Groq request failed"
    console.error("[api/chat]", message)
    return res.status(500).json({ error: message })
  }
}
