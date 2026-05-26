"use client"

import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

const ITEMS = [
  "SYS.ONLINE",
  "DITHER_ENGINE: ACTIVE",
  "LUCY: ONLINE",
  "UPLINK: SECURE",
  "KIM_SYS: v2.2",
  "PROJECTS: 4 ARCHIVED",
  "STACK: REACT • TS • PYTHON • AI",
  "STATUS: AVAILABLE FOR HIRE",
  "VISOR_UPLINK: ARMED",
  "ALL_SYSTEMS: NOMINAL",
  "BAYER_MATRIX: LOADED",
  "CYBERDECK: OPERATIONAL",
]

export function CyberTicker({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  if (reduced) return null

  const doubled = [...ITEMS, ...ITEMS]

  return (
    <div
      className={cn(
        "flex h-6 shrink-0 items-center overflow-hidden border-b border-primary/15 bg-[#000808]",
        className
      )}
    >
      <span className="shrink-0 border-r border-primary/20 px-2 font-mono text-[8px] uppercase tracking-widest text-accent">
        ◆
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div className="animate-ticker flex gap-0 whitespace-nowrap">
          {doubled.map((item, i) => (
            <span
              key={i}
              className="px-5 font-mono text-[9px] uppercase tracking-[0.18em] text-primary/40"
            >
              <span className="mr-2 text-primary/20">◆</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
