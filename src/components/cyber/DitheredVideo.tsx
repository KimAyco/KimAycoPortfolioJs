"use client"

import { useCallback, useEffect, useRef } from "react"
import { ditherImageData } from "@/lib/dither"
import { useMousePosition } from "@/hooks/use-mouse-position"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function DitheredVideo({
  src,
  alt,
  className,
  cellSize = 3,
  playbackRate = 2,
  idleMinMs = 1800,
  idleMaxMs = 6500,
}: {
  src: string
  alt: string
  className?: string
  cellSize?: number
  playbackRate?: number
  /** Random pause duration before each play */
  idleMinMs?: number
  idleMaxMs?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mouse = useMousePosition()
  const reducedMotion = useReducedMotion()
  const rafRef = useRef<number>(0)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const video = videoRef.current
    if (!canvas || !container || !video || video.readyState < 2) return

    const rect = container.getBoundingClientRect()
    const w = Math.floor(rect.width) || 400
    const h = Math.floor(rect.height) || 400

    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return

    const scale = Math.max(w / vw, h / vh)
    const sw = vw * scale
    const sh = vh * scale
    const sx = (w - sw) / 2
    const sy = (h - sh) / 2

    ctx.drawImage(video, sx, sy, sw, sh)

    const imageData = ctx.getImageData(0, 0, w, h)
    ditherImageData(imageData, cellSize)
    ctx.putImageData(imageData, 0, 0)

    if (!reducedMotion) {
      const containerRect = container.getBoundingClientRect()
      const mx = mouse.x * window.innerWidth - containerRect.left
      const my = mouse.y * window.innerHeight - containerRect.top
      const cx = w * 0.55
      const cy = h * 0.42
      const dist = Math.hypot(mx - cx, my - cy)
      const radius = Math.min(w, h) * 0.35
      if (dist < radius) {
        const intensity = 1 - dist / radius
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        gradient.addColorStop(0, `rgba(204, 255, 0, ${0.25 * intensity})`)
        gradient.addColorStop(0.5, `rgba(204, 255, 0, ${0.08 * intensity})`)
        gradient.addColorStop(1, "rgba(204, 255, 0, 0)")
        ctx.globalCompositeOperation = "screen"
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = "source-over"
      }
    }
  }, [cellSize, mouse.x, mouse.y, reducedMotion])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.loop = false
    video.playsInline = true
    video.preload = "auto"
    video.playbackRate = playbackRate

    const scheduleNextPlay = () => {
      clearIdleTimer()
      const delay = randomBetween(idleMinMs, idleMaxMs)
      idleTimerRef.current = setTimeout(() => {
        video.currentTime = 0
        video.playbackRate = playbackRate
        void video.play().catch(() => scheduleNextPlay())
      }, delay)
    }

    const onEnded = () => {
      video.pause()
      video.currentTime = 0
      render()
      scheduleNextPlay()
    }

    const onReady = () => {
      video.playbackRate = playbackRate
      video.pause()
      video.currentTime = 0
      render()

      if (reducedMotion) return

      // First play after a short random delay
      clearIdleTimer()
      idleTimerRef.current = setTimeout(() => {
        void video.play().catch(() => scheduleNextPlay())
      }, randomBetween(400, idleMinMs))
    }

    video.addEventListener("loadeddata", onReady)
    video.addEventListener("ended", onEnded)
    if (video.readyState >= 2) onReady()

    return () => {
      video.removeEventListener("loadeddata", onReady)
      video.removeEventListener("ended", onEnded)
      clearIdleTimer()
    }
  }, [
    src,
    playbackRate,
    reducedMotion,
    render,
    idleMinMs,
    idleMaxMs,
    clearIdleTimer,
  ])

  // Canvas render loop (runs while playing and while paused on a frame)
  useEffect(() => {
    const tick = () => {
      render()
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [render])

  useEffect(() => {
    const ro = new ResizeObserver(() => render())
    const el = containerRef.current
    if (el) ro.observe(el)
    return () => ro.disconnect()
  }, [render])

  return (
    <div ref={containerRef} className={cn("relative h-full w-full", className)}>
      <video
        ref={videoRef}
        src={src}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      <canvas
        ref={canvasRef}
        className="image-rendering-pixelated h-full w-full object-contain"
        role="img"
        aria-label={alt}
      />
    </div>
  )
}
