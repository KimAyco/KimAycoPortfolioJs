/** Parse Vercel/API JSON; avoid crashing on plain-text error pages */
export async function parseApiJson<T extends Record<string, unknown>>(
  response: Response
): Promise<T> {
  const text = await response.text()
  if (!text) {
    throw new Error(`Empty response (${response.status})`)
  }
  try {
    return JSON.parse(text) as T
  } catch {
    const snippet = text.replace(/\s+/g, " ").slice(0, 160)
    if (response.status >= 500) {
      throw new Error(
        snippet.startsWith("A server error")
          ? "Server error — check Vercel logs and GROQ_API_KEY."
          : snippet
      )
    }
    throw new Error(snippet)
  }
}
