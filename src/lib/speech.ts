/** Strip terminal flair before TTS */
export function stripForSpeech(text: string): string {
  return text
    .replace(/^>>\s*/gm, "")
    .replace(/[`*_#]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Common female voice names across Chrome, Edge, Safari */
const FEMALE_VOICE =
  /female|zira|jenny|aria|samantha|karen|moira|tessa|victoria|fiona|susan|hazel|linda|heather|michelle|sonia|kate|serena|sarah|laura|emma|joanna|kendra|kimberly|ivy|salli|nicole|olivia|alice|natasha|sophie|libby|mia/i

const MALE_VOICE =
  /\bmale\b|david|mark|james|george|daniel|richard|guy|ryan|tom|alex|fred|bruce|paul|aaron|christopher|eric|steven|andrew/i

let cachedVoice: SpeechSynthesisVoice | null = null

export function pickFemaleEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return cachedVoice

  const en = voices.filter((v) => v.lang.startsWith("en"))

  const female = en.find((v) => FEMALE_VOICE.test(v.name))
  if (female) {
    cachedVoice = female
    return female
  }

  const notMale = en.find((v) => !MALE_VOICE.test(v.name))
  const pick = notMale ?? en[0] ?? null
  cachedVoice = pick
  return pick
}

/** Call once on mount so voices load before first speak */
export function preloadVoices(): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return () => {}
  }

  const refresh = () => pickFemaleEnglishVoice()
  refresh()
  window.speechSynthesis.addEventListener("voiceschanged", refresh)
  return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh)
}

export function speakText(
  text: string,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  const clean = stripForSpeech(text)
  if (!clean || !("speechSynthesis" in window)) return null

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.rate = 1.0
  utterance.pitch = 1.05
  utterance.volume = 1

  const voice = cachedVoice ?? pickFemaleEnglishVoice()
  if (voice) utterance.voice = voice

  if (onEnd) {
    utterance.onend = () => onEnd()
    utterance.onerror = () => onEnd()
  }

  window.speechSynthesis.speak(utterance)
  return utterance
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel()
  }
}

export function getSpeechRecognitionCtor():
  | SpeechRecognitionConstructor
  | undefined {
  if (typeof window === "undefined") return undefined
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}
