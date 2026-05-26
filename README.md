# KimAycoPortfolioJs

Personal portfolio site built with **React**, **TypeScript**, and **Vite**.

## Scripts

- `npm install` — install dependencies
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build

## LUCY assistant (Groq)

The home screen chat uses [Groq](https://groq.com/) via server-side routes (API key never ships to the browser):

- `/api/chat` — text replies (default: `llama-3.3-70b-versatile`)
- `/api/transcribe` — voice input (Whisper)

1. Create a key at [console.groq.com](https://console.groq.com/)
2. Copy `.env.example` to `.env` and set `GROQ_API_KEY=gsk_...`
3. Optional: set `GROQ_CHAT_MODEL` (e.g. `llama-3.3-70b-versatile`, `openai/gpt-oss-120b`)
4. Restart `npm run dev`

**Vercel:** Add `GROQ_API_KEY` (and optional `GROQ_CHAT_MODEL`) in Environment Variables, then redeploy.
