import { defineConfig, loadEnv, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import {
  completeGroqChat,
  DEFAULT_GROQ_CHAT_MODEL,
} from "./api/lib/groq-chat"
import type { ChatMessage } from "./api/lib/types"
import { transcribeWithGroq } from "./api/lib/groq-transcribe"

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = ""
    req.on("data", (chunk) => {
      data += chunk
    })
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        reject(new Error("Invalid JSON"))
      }
    })
    req.on("error", reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(body))
}

function groqDevApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: "groq-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? ""
        if (!url.startsWith("/api/chat") && !url.startsWith("/api/transcribe")) {
          return next()
        }

        const httpRes = res as ServerResponse

        if (req.method === "OPTIONS") {
          httpRes.setHeader("Access-Control-Allow-Origin", "*")
          httpRes.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
          httpRes.setHeader("Access-Control-Allow-Headers", "Content-Type")
          httpRes.statusCode = 200
          httpRes.end()
          return
        }

        if (req.method !== "POST") {
          sendJson(httpRes, 405, { error: "Method not allowed" })
          return
        }

        const apiKey = env.GROQ_API_KEY
        if (!apiKey) {
          sendJson(httpRes, 503, {
            error: "GROQ_API_KEY missing. Copy .env.example to .env and add your key.",
          })
          return
        }

        try {
          if (url.startsWith("/api/transcribe")) {
            const body = (await readJsonBody(req)) as {
              audio?: string
              mimeType?: string
            }
            if (!body.audio) {
              sendJson(httpRes, 400, { error: "audio (base64) required" })
              return
            }
            const text = await transcribeWithGroq(
              body.audio,
              body.mimeType ?? "audio/webm",
              apiKey
            )
            sendJson(httpRes, 200, { text })
            return
          }

          const body = (await readJsonBody(req)) as { messages?: ChatMessage[] }
          const messages = body.messages
          if (!Array.isArray(messages) || messages.length === 0) {
            sendJson(httpRes, 400, { error: "messages array required" })
            return
          }

          const model = env.GROQ_CHAT_MODEL ?? DEFAULT_GROQ_CHAT_MODEL
          const reply = await completeGroqChat(messages, apiKey, model)
          sendJson(httpRes, 200, { reply })
        } catch (e) {
          const message = e instanceof Error ? e.message : "Groq request failed"
          sendJson(httpRes, 500, { error: message })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
    plugins: [react(), tailwindcss(), groqDevApiPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
