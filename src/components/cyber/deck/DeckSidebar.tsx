"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { DECK_MODULES, type DeckScreen } from "@/types/deck"
import { SidebarConsole } from "./SidebarConsole"
import { VoicePulseBars } from "@/components/cyber/VoicePulseBars"
import { cn } from "@/lib/utils"

function useLiveClock() {
  const fmt = () =>
    new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const [clock, setClock] = useState(fmt)
  useEffect(() => {
    const id = window.setInterval(() => setClock(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return clock
}

export function DeckSidebar({
  active,
  onNavigate,
  disabled,
}: {
  active: DeckScreen
  onNavigate: (screen: DeckScreen) => void
  disabled?: boolean
}) {
  const clock = useLiveClock()
  const logsEnabled = active !== "boot"

  return (
    <aside className="flex w-full shrink-0 flex-col border-b-2 border-primary/25 bg-[#000808] md:w-52 md:border-b-0 md:border-r-2">
      {/* Header — desktop only */}
      <div className="hidden border-b border-primary/15 px-3 py-3 md:block">
        <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-primary/35">CyberDeck</p>
        <p className="font-mono text-lg font-bold text-glow-primary text-primary">KIM_SYS</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[9px] tabular-nums text-primary/50">{clock}</span>
          <VoicePulseBars active={false} barCount={10} className="h-3" barClassName="w-0.5" />
        </div>
        <p className="mt-1 font-mono text-[8px] text-primary/25">KEYS [1-5] // ESC=HOME</p>
      </div>

      {/* Nav buttons */}
      <nav className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-col md:gap-1 md:p-2">
        {DECK_MODULES.map((mod) => {
          const isActive =
            active === mod.id || (mod.id === "projects" && active === "project-detail")
          return (
            <motion.button
              key={mod.id}
              type="button"
              disabled={disabled}
              onClick={() => onNavigate(mod.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.96, x: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className={cn(
                "group relative flex min-w-[4.5rem] shrink-0 flex-col gap-0.5 border-2 px-2.5 py-2 text-left font-mono transition-all md:min-w-0 md:w-full md:px-3 md:py-2",
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-[inset_0_0_16px_rgba(204,255,0,0.07),0_0_10px_rgba(204,255,0,0.12)]"
                  : "border-primary/12 bg-transparent text-muted-foreground hover:border-primary/35 hover:text-primary hover:bg-primary/5"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="deck-active-bar"
                  className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-primary shadow-[0_0_8px_#ccff00]"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative flex w-full items-center justify-between">
                <span className="text-[9px] tabular-nums text-primary/40">
                  {mod.short}
                  <span className="ml-1 hidden text-primary/20 md:inline">·{mod.key}</span>
                </span>
                <span className="text-sm text-primary/50 transition-colors group-hover:text-primary">
                  {mod.icon}
                </span>
              </span>
              <span className="relative text-[10px] font-bold uppercase tracking-wider md:text-[11px]">
                {mod.label}
              </span>
            </motion.button>
          )
        })}
      </nav>

      {/* Sidebar console — desktop only */}
      <SidebarConsole enabled={logsEnabled} />
    </aside>
  )
}
