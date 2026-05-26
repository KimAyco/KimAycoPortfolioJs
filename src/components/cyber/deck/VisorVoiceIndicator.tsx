"use client"

import { motion } from "framer-motion"
import { VoicePulseBars } from "@/components/cyber/VoicePulseBars"
import { cn } from "@/lib/utils"

export function VisorVoiceIndicator({
  active,
  className,
}: {
  active: boolean
  className?: string
}) {
  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-1.5 border-t border-primary/25 bg-gradient-to-t from-[#000808]/95 via-[#000808]/70 to-transparent px-3 pb-3 pt-4",
        className
      )}
      animate={{ opacity: active ? 1 : 0.55 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex w-full max-w-[200px] items-center justify-between gap-2">
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-primary/50">
          LUCY
        </span>
        <VoicePulseBars active={active} barCount={14} className="h-8 flex-1" />
        <span
          className={cn(
            "font-mono text-[8px] uppercase tracking-wider",
            active ? "text-primary text-glow-primary" : "text-primary/35"
          )}
        >
          {active ? "VOICE" : "IDLE"}
        </span>
      </div>
      {active && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="font-mono text-[8px] text-primary/60"
        >
          voiceline active
        </motion.p>
      )}
    </motion.div>
  )
}
