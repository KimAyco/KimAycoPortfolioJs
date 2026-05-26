import type { ChatMessage } from "@/types/chat"
import { parseApiJson } from "@/lib/api-response"

export type { ChatMessage }

export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  })

  const data = await parseApiJson<{ reply?: string; error?: string }>(response)

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }

  if (!data.reply) throw new Error("No reply from assistant")
  return data.reply
}
