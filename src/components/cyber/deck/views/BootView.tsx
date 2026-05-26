"use client"

import { motion } from "framer-motion"
import { TerminalConsole } from "@/components/cyber/TerminalConsole"
import { BOOT_LOG_SEED } from "@/lib/cyber-logs"
import { bootLineVariants } from "../deck-animations"

const BOOT_LINES = [
  { text: "KIM_SYS BIOS v2.2", level: "sys" as const },
  { text: "MEMORY CHECK.......... 1024kb OK", level: "ok" as const },
  { text: "DITHER_ENGINE........ ACTIVE", level: "ok" as const },
  { text: "MOUNTING PROJECT_ARCHIVE/", level: "info" as const },
  { text: "LUCY INTERFACE HANDSHAKE v3.0", level: "info" as const },
  { text: "CYBERDECK READY", level: "ok" as const },
]

const LEVEL_COLORS = {
  sys: "text-muted-foreground",
  ok: "text-primary",
  info: "text-primary/70",
  err: "text-accent",
}

export function BootView() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-6 md:flex-row md:gap-12 md:p-10">
      {/* Boot sequence */}
      <div className="w-full max-w-md flex-1">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-1 font-mono text-[9px] uppercase tracking-[0.3em] text-primary/40"
        >
          &gt;&gt; boot sequence
        </motion.p>
        <motion.div
          className="mb-5 h-px bg-primary/20"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.4 }}
        />

        <div className="space-y-2">
          {BOOT_LINES.map((line, i) => (
            <motion.p
              key={line.text}
              custom={i}
              variants={bootLineVariants}
              initial="hidden"
              animate="show"
              className={`font-mono text-sm md:text-base ${LEVEL_COLORS[line.level]}`}
            >
              <span className="mr-2 text-accent">[{String(i + 1).padStart(2, "0")}]</span>
              {line.text}
              {line.level === "ok" && (
                <motion.span
                  className="ml-2 text-primary/60 text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.18 + 0.5 }}
                >
                  ✓
                </motion.span>
              )}
            </motion.p>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-7">
          <div className="mb-1 flex justify-between font-mono text-[9px] text-primary/40">
            <span>LOADING</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              100%
            </motion.span>
          </div>
          <div className="h-2 overflow-hidden border border-primary/30 bg-[#000e0e]">
            <motion.div
              className="h-full bg-primary shadow-[0_0_12px_rgba(204,255,0,0.6)]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.3, duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          {/* Segmented ticks on bar */}
          <div className="relative -mt-2 h-2 pointer-events-none">
            {[20, 40, 60, 80].map((pct) => (
              <div
                key={pct}
                className="absolute top-0 h-full w-px bg-black/60"
                style={{ left: `${pct}%` }}
              />
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1.9, duration: 0.6, repeat: 1 }}
          className="mt-3 font-mono text-[10px] text-primary/60"
        >
          SYSTEM ONLINE — LAUNCHING DECK
        </motion.p>
      </div>

      {/* Boot terminal */}
      <div className="w-full max-w-xs shrink-0">
        <TerminalConsole
          title="boot.log"
          maxLines={8}
          intervalMs={680}
          seed={BOOT_LOG_SEED}
        />
      </div>
    </div>
  )
}
