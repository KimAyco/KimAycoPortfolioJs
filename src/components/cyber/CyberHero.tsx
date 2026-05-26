"use client"

import { motion } from "framer-motion"
import type { CSSProperties, ReactNode } from "react"
import heroCyber from "@/assets/hero-cyber.png"
import { DitheredImage } from "./DitheredImage"
import { TypewriterText } from "./TypewriterText"
import { useMousePosition } from "@/hooks/use-mouse-position"

export function CyberHero({
  title = "Kim John Marell Ayco PORTFOLIO",
  subtitle,
  children,
}: {
  title?: string
  subtitle?: string
  children?: ReactNode
}) {
  const mouse = useMousePosition()

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#003838]"
      style={
        {
          "--mx": `${mouse.x * 100}%`,
          "--my": `${mouse.y * 100}%`,
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0 cyber-dot-grid opacity-30"
        style={{
          backgroundPosition: `calc(var(--mx) - 50%) calc(var(--my) - 50%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_var(--mx)_var(--my),rgba(204,255,0,0.08)_0%,transparent_50%)]" />

      <div className="container relative z-10 mx-auto grid grid-cols-1 gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:gap-12 md:px-6 md:py-24">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="order-2 mx-auto max-w-xl text-center md:order-1 md:mx-0 md:text-left"
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary/70">
            SYS.ONLINE // PORTFOLIO_v1.0
          </p>
          <h1 className="text-balance font-mono text-4xl font-bold uppercase tracking-tight sm:text-5xl lg:text-6xl text-glow-primary text-primary">
            <TypewriterText text={title} speed={60} />
          </h1>

          {subtitle ? (
            <p className="mt-5 max-w-prose font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
              <TypewriterText text={subtitle} speed={25} delay={800} showCursor={false} />
            </p>
          ) : null}

          <div className="mt-8">{children}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="order-1 mx-auto w-full max-w-md md:order-2"
        >
          <div className="relative border-2 border-primary/50 bg-black/40 p-1 shadow-[0_0_30px_rgba(204,255,0,0.15)]">
            <div className="flex items-center gap-2 border-b border-primary/30 bg-[#001818] px-3 py-1.5">
              <span className="h-2 w-2 bg-accent" />
              <span className="h-2 w-2 bg-primary" />
              <span className="h-2 w-2 bg-secondary" />
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-primary/60">
                VISOR_UPLINK.exe
              </span>
            </div>
            <div className="relative aspect-square w-full overflow-hidden">
              <DitheredImage src={heroCyber} alt="Cyber console portrait" cellSize={3} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
