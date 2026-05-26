import { Buffer } from "node:buffer"

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
const WHISPER_MODEL = "whisper-large-v3-turbo"

export async function transcribeWithGroq(
  audioBase64: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const buffer = Buffer.from(audioBase64, "base64")
  if (buffer.length < 100) {
    throw new Error("Recording too short — hold mic and speak again.")
  }

  const blob = new Blob([buffer], { type: mimeType || "audio/webm" })
  const form = new FormData()
  form.append("file", blob, "recording.webm")
  form.append("model", WHISPER_MODEL)
  form.append("language", "en")
  form.append("response_format", "json")
  form.append("temperature", "0")

  const response = await fetch(GROQ_TRANSCRIBE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err || `Transcription failed (${response.status})`)
  }

  const data = (await response.json()) as { text?: string }
  const text = data.text?.trim()
  if (!text) throw new Error("No speech detected in recording.")
  return text
}
