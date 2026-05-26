export async function transcribeRecording(audioBase64: string, mimeType: string): Promise<string> {
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: audioBase64, mimeType }),
  })

  const data = (await response.json()) as { text?: string; error?: string }

  if (!response.ok) {
    throw new Error(data.error || `Transcription failed (${response.status})`)
  }

  if (!data.text) throw new Error("No transcription returned")
  return data.text
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== "string") {
        reject(new Error("Failed to read audio"))
        return
      }
      const base64 = result.split(",")[1]
      if (!base64) reject(new Error("Failed to encode audio"))
      else resolve(base64)
    }
    reader.onerror = () => reject(new Error("Failed to read audio"))
    reader.readAsDataURL(blob)
  })
}

export function pickRecorderMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ]
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return "audio/webm"
}
