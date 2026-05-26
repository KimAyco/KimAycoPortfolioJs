import type { VercelRequest, VercelResponse } from "@vercel/node"
import { transcribeWithGroq } from "./lib/groq-transcribe"
import { parseJsonBody } from "./lib/parse-body"

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
    const body = parseJsonBody<{ audio?: string; mimeType?: string }>(req)
    const { audio, mimeType } = body
    if (!audio || typeof audio !== "string") {
      return res.status(400).json({ error: "audio (base64) required" })
    }

    const text = await transcribeWithGroq(audio, mimeType ?? "audio/webm", apiKey)
    return res.status(200).json({ text })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transcription failed"
    console.error("[api/transcribe]", message)
    return res.status(500).json({ error: message })
  }
}
