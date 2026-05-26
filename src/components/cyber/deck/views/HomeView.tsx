"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import visorVideo from "@/assets/Animate_eye_to_move_blink_202605262051.mp4"
import { DitheredVideo } from "@/components/cyber/DitheredVideo"
import { TypewriterText } from "@/components/cyber/TypewriterText"
import { SystemVitals } from "@/components/cyber/SystemVitals"
import { DeckChatbot } from "../DeckChatbot"
import { VisorVoiceIndicator } from "../VisorVoiceIndicator"
import { Badge } from "@/components/ui/badge"
import { projects } from "@/data/portfolio"
import { useMousePosition } from "@/hooks/use-mouse-position"
import type { CSSProperties } from "react"
import type { NavigableScreen } from "@/lib/lucy-navigation"

export function HomeView({
  onNavigate,
  lucyIntroReady = false,
}: {
  onNavigate?: (screen: NavigableScreen) => void
  lucyIntroReady?: boolean
}) {
  const [lucySpeaking, setLucySpeaking] = useState(false)
  const mouse = useMousePosition()
  const liveCount = projects.filter((p) => p.progress >= 100).length

  return (
    <div
      className="relative flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-3 md:grid md:grid-cols-[minmax(0,38%)_1fr] md:grid-rows-1 md:gap-4 md:overflow-hidden md:p-4"
      style={
        {
          "--mx": `${mouse.x * 100}%`,
          "--my": `${mouse.y * 100}%`,
        } as CSSProperties
      }
    >
      {/* ── Visor (left on desktop, below header on mobile) ───────── */}
      <motion.aside
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 order-1 flex h-[min(42vh,280px)] shrink-0 flex-col md:order-1 md:h-auto md:min-h-0"
      >
        <div className="deck-frame flex h-full flex-col overflow-hidden">
          <div className="deck-frame-bar shrink-0">
            <span className="h-1.5 w-1.5 bg-accent" />
            <span className="h-1.5 w-1.5 bg-primary" />
            <span className="h-1.5 w-1.5 bg-secondary" />
            <span className="ml-auto font-mono text-[9px] text-primary/40">LUCY_VISOR</span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <DitheredVideo
              src={visorVideo}
              alt="Cyber visor feed"
              cellSize={3}
              playbackRate={2}
              className="absolute inset-0"
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgba(204,255,0,0.14)_0%,transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 scanlines opacity-20" />
            <motion.div
              className="pointer-events-none absolute inset-0 border border-primary/15"
              animate={{ opacity: [0.15, 0.45, 0.15] }}
              transition={{ duration: 2.8, repeat: Infinity }}
            />
            <div className="pointer-events-none absolute inset-0 deck-corners" />
            <VisorVoiceIndicator active={lucySpeaking} />
          </div>
        </div>
      </motion.aside>

      {/* ── Command panel (right on desktop) ───────────────────────── */}
      <div className="relative z-10 order-2 flex min-h-0 flex-1 flex-col gap-2.5 md:order-2 md:gap-3">
        {/* Status strip */}
        <div className="flex shrink-0 items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-primary/45">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            SYS.ONLINE
          </motion.span>
          <span className="text-primary/20">//</span>
          <span>DECK_v2.2</span>
          <span className="h-px flex-1 bg-primary/12" />
          <motion.span
            className="flex items-center gap-1 text-primary/50"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_5px_#ccff00]" />
            LIVE
          </motion.span>
        </div>

        {/* Identity block */}
        <header className="shrink-0 border-b border-primary/15 pb-2.5">
          <h1
            className="text-glitch font-mono text-2xl font-bold leading-tight text-glow-primary text-primary sm:text-3xl"
            data-text="Kim John Marell Ayco PORTFOLIO"
          >
            <TypewriterText text="Kim John Marell Ayco PORTFOLIO" speed={40} />
          </h1>
          <p className="mt-1 font-mono text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
            <TypewriterText
              text=">> LUCY online — Kim's deck assistant · chat or press [1-5] to navigate"
              speed={16}
              delay={300}
              showCursor={false}
            />
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[8px] sm:text-[9px]">
              LUCY: ONLINE
            </Badge>
            <Badge variant="outline" className="text-[8px] sm:text-[9px]">
              {liveCount}/{projects.length} NODES
            </Badge>
            <Badge
              variant="outline"
              className="border-accent/40 text-[8px] text-accent/80 sm:text-[9px]"
            >
              REACT · TS · PY
            </Badge>
          </div>
        </header>

        {/* Groq neural assistant */}
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="mb-1.5 flex shrink-0 items-center gap-2">
            <span className="font-mono text-[8px] uppercase tracking-widest text-primary/35">
              lucy_interface
            </span>
            <span className="h-px flex-1 bg-primary/10" />
            <span className="font-mono text-[8px] text-primary/25">ASSISTANT</span>
          </div>
          <DeckChatbot
            className="min-h-0 flex-1"
            onSpeakingChange={setLucySpeaking}
            onNavigate={onNavigate}
            introReady={lucyIntroReady}
          />
        </section>

        {/* Vitals footer */}
        <footer className="shrink-0 border border-primary/12 bg-[#000808]/80 px-2.5 py-2">
          <SystemVitals compact />
        </footer>
      </div>
    </div>
  )
}
