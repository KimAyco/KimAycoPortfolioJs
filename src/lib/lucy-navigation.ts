import { DECK_MODULES, type DeckScreen } from "@/types/deck"

export type NavigableScreen = Exclude<
  DeckScreen,
  "boot" | "project-detail"
>

export interface LucyNavAnswer {
  screen: NavigableScreen
  reply: string
  autoNavigate?: boolean
}

export interface LucyFastResult {
  reply: string
  navigate?: LucyNavAnswer
}

const MODULE_BY_SCREEN: Record<
  NavigableScreen,
  { key: string; label: string; hint: string }
> = Object.fromEntries(
  DECK_MODULES.map((m) => [
    m.id,
    { key: m.key, label: m.label, hint: m.hint },
  ])
) as Record<NavigableScreen, { key: string; label: string; hint: string }>

function navReply(
  screen: NavigableScreen,
  what: string,
  extra?: string
): string {
  const { key, label, hint } = MODULE_BY_SCREEN[screen]
  const base = `>> ${what} Open ${label} — press [${key}] or tap ${label} in the left sidebar (${hint}).`
  return extra ? `${base} ${extra}` : base
}

const UPLINK_REPLY = navReply(
  "uplink",
  "Kim's contact details are in UPLINK.",
  "Email: kimayco1@gmail.com · GitHub: github.com/KimAyco — use this for hiring, collaborations, or project inquiries."
)

/** Order matters: uplink before projects when "inquiry" + "project" appear together */
const NAV_TARGETS: {
  screen: NavigableScreen
  patterns: RegExp[]
  reply: string
  autoNavigate?: boolean
}[] = [
  {
    screen: "uplink",
    patterns: [
      /\b(where|how).*(personal|information|inquir|contact|email|hire|reach|uplink|github|send)/i,
      /\b(inquir|inquiry|send|reach).*(project|collaborat|hire|kim|work|create|commission)/i,
      /\b(where).*(inquir|send|contact|email|kim)/i,
      /\b(personal information)/i,
      /\b(find|get|see).*(kim'?s?|contact|email|github|details)/i,
      /\b(collaborat|hire|work with|get in touch|commission)/i,
      /\bhow (can|do) i (contact|reach|email)/i,
    ],
    reply: UPLINK_REPLY,
    autoNavigate: true,
  },
  {
    screen: "projects",
    patterns: [
      /\b(where|how).*(project|archive|certificate)/i,
      /\b(project|archive|certificate).*(where|find|located|go|see)/i,
      /\b(find|see|open|show|go to|take me to).*(project|archive|portfolio work)/i,
    ],
    reply: navReply(
      "projects",
      "Kim's projects and seminar certificates are in the PROJECTS archive.",
      "SignSpeak, FINSNAP, AUTOPRINT, VerVin Cam, and certs are listed there."
    ),
    autoNavigate: true,
  },
  {
    screen: "capabilities",
    patterns: [
      /\b(where|how).*(skill|capabilit|tech stack|matrix)/i,
      /\b(skill|capabilit|matrix).*(where|find|located|go)/i,
      /\b(find|see|open|show|go to).*(skill|capabilit)/i,
    ],
    reply: navReply(
      "capabilities",
      "Kim's skills and tech stack are in the SKILLS matrix."
    ),
    autoNavigate: true,
  },
  {
    screen: "help",
    patterns: [
      /\b(where|how).*(help|faq)/i,
      /\b(help|faq).*(where|find|located)/i,
      /\b(find|see|open).*(faq|help)\b/i,
    ],
    reply: navReply("help", "The FAQ lives in HELP."),
    autoNavigate: true,
  },
  {
    screen: "home",
    patterns: [
      /\b(where|how).*(home|root|chat|lucy|assistant)/i,
      /\b(back to|return to).*(home|start|chat)/i,
    ],
    reply: navReply(
      "home",
      "You're on ROOT — home is where you chat with me. Press [1] anytime to return here from another module."
    ),
    autoNavigate: false,
  },
]

export function isLucyIdentityQuestion(text: string): boolean {
  const q = text.trim().toLowerCase()
  return (
    /\b(who are you|what are you|your name|about you|who is lucy|what is lucy|who created you|who built you|who made you|your origin|where do you come from)\b/.test(
      q
    ) ||
    /\b(what('s| is) your (purpose|role|job|function))\b/.test(q) ||
    /\btell me about (yourself|lucy)\b/.test(q)
  )
}

export function buildLucyOriginReply(): string {
  return ">> I'm LUCY — an AI assistant Kim John Marell M. Ayco built for this portfolio deck. I help visitors explore his work, navigate modules, and find how to contact him."
}

export function isNavigationQuestion(text: string): boolean {
  const q = text.trim().toLowerCase()
  if (!q) return false

  if (NAV_TARGETS.some((t) => t.patterns.some((p) => p.test(text)))) return true

  const navIntent =
    /\b(where|how do i|how to|how can i|which key|what key|press|sidebar|navigate|take me|show me|go to|get to|find|send|locate|open|inquir|inquiry|contact|reach)\b/.test(
      q
    ) || /\bwhere\b.+\?/.test(q)

  const destinationRef =
    /\b(project|archive|certificate|skill|capabilit|matrix|help|faq|uplink|contact|email|hire|home|root|lucy|personal|information|kim|github|collaborat|inquir)\b/.test(
      q
    )

  return navIntent && destinationRef
}

export function matchNavigationQuestion(text: string): LucyNavAnswer | null {
  for (const target of NAV_TARGETS) {
    if (target.patterns.some((p) => p.test(text))) {
      return {
        screen: target.screen,
        reply: target.reply,
        autoNavigate: target.autoNavigate,
      }
    }
  }

  if (!isNavigationQuestion(text)) return null

  const q = text.toLowerCase()
  if (
    /\b(inquir|contact|email|personal|information|hire|collaborat|send|reach|kim|github|uplink)\b/.test(
      q
    )
  ) {
    return {
      screen: "uplink",
      reply: UPLINK_REPLY,
      autoNavigate: true,
    }
  }
  if (/\b(project|archive|certificate|portfolio)\b/.test(q)) {
    return {
      screen: "projects",
      reply: NAV_TARGETS.find((t) => t.screen === "projects")!.reply,
      autoNavigate: true,
    }
  }
  if (/\b(skill|capabilit|stack|matrix)\b/.test(q)) {
    return {
      screen: "capabilities",
      reply: NAV_TARGETS.find((t) => t.screen === "capabilities")!.reply,
      autoNavigate: true,
    }
  }

  return null
}

export function buildNavigationTourReply(): string {
  const lines = DECK_MODULES.map(
    (m) => `[${m.key}] ${m.label} — ${m.hint}`
  ).join("\n")
  return `>> Deck modules:\n${lines}\nESC returns to ROOT from anywhere.`
}

export function wantsNavigationTour(text: string): boolean {
  const q = text.trim().toLowerCase()
  return (
    /\b(all modules|full navigation|how do i navigate|what modules|deck tour|keyboard shortcuts)\b/.test(
      q
    ) || /\blist\b.*\b(module|screen)/.test(q)
  )
}

export function resolveLucyFastReply(text: string): LucyFastResult | null {
  if (wantsNavigationTour(text)) {
    return { reply: buildNavigationTourReply() }
  }
  if (isLucyIdentityQuestion(text)) {
    return { reply: buildLucyOriginReply() }
  }
  const nav = matchNavigationQuestion(text)
  if (nav) {
    return { reply: nav.reply, navigate: nav }
  }
  return null
}

const BOILERPLATE_LINE =
  /^(hello|hi|hey)[!.]?\s|i'?m lucy|welcome to kim|how can i assist|what can i assist|what would you like to (know|explore)|how can i help you today/i

export function formatLucyDisplay(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim()
}

/** Strip model re-intros; fallback to nav answer if reply is useless */
export function sanitizeLucyReply(reply: string, userMessage: string): string {
  if (isLucyIdentityQuestion(userMessage)) {
    return formatLucyDisplay(reply)
  }

  const lines = reply
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !BOILERPLATE_LINE.test(line))

  let cleaned = formatLucyDisplay(lines.join("\n"))

  if (cleaned.length < 12) {
    const fast = resolveLucyFastReply(userMessage)
    if (fast) cleaned = fast.reply
  }

  return cleaned || formatLucyDisplay(reply)
}
