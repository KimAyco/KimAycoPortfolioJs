import type { VercelRequest } from "@vercel/node"

export function parseJsonBody<T>(req: VercelRequest): T {
  const raw = req.body
  if (raw == null || raw === "") {
    throw new Error("Request body is empty")
  }
  if (typeof raw === "string") {
    return JSON.parse(raw) as T
  }
  return raw as T
}
