"use client"

import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

const IDLE_HEIGHTS = [3, 5, 4, 7, 5, 3, 6, 4, 5, 3, 4, 6]

export function VoicePulseBars({
  active = false,
  className,
  barClassName,
  barCount = 12,
}: {
  active?: boolean
  className?: string
  barClassName?: string
  barCount?: number
}) {
  const reduced = useReducedMotion()
  const heights = IDLE_HEIGHTS.slice(0, barCount)

  return (
    <div className={cn("flex items-end justify-center gap-0.5", className)} aria-hidden>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className={cn(
            "w-1 shrink-0 rounded-[1px]",
            active ? "bg-primary shadow-[0_0_6px_rgba(204,255,0,0.5)]" : "bg-primary/45",
            barClassName
          )}
          style={{ height: h }}
          animate={
            reduced
              ? { height: active ? h + 4 : h }
              : active
                ? {
                    height: [
                      h,
                      h + 6 + (i % 3) * 3,
                      h + 2,
                      h + 8 + (i % 2) * 4,
                      h,
                    ],
                  }
                : {
                    height: [h, h + 2, h],
                  }
          }
          transition={{
            duration: active ? 0.35 + (i % 4) * 0.05 : 0.8 + (i % 3) * 0.1,
            repeat: Infinity,
            delay: i * 0.04,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
