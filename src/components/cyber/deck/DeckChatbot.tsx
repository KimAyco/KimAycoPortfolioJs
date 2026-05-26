"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sendChatMessage, type ChatMessage } from "@/lib/chat-api"
import {
  buildPortfolioSystemPrompt,
  LUCY_OPENING_INTRO,
} from "@/lib/portfolio-context"
import {
  formatLucyDisplay,
  resolveLucyFastReply,
  sanitizeLucyReply,
} from "@/lib/lucy-navigation"
import type { NavigableScreen } from "@/lib/lucy-navigation"
import { useGroqRecording } from "@/hooks/use-groq-recording"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { preloadVoices, speakText, stopSpeaking } from "@/lib/speech"
import { cn } from "@/lib/utils"

const LUCY_INTRO_SESSION_KEY = "lucy-intro-played"

function MessageBubble({
  msg,
  speaking,
}: {
  msg: ChatMessage
  speaking?: boolean
}) {
  const isUser = msg.role === "user"
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[92%] border px-2.5 py-2 font-mono text-[10px] leading-relaxed sm:text-[11px]",
          isUser
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-primary/25 bg-[#000c0c] text-muted-foreground",
          speaking && !isUser && "border-primary/60 shadow-[0_0_12px_rgba(204,255,0,0.15)]"
        )}
      >
        {!isUser && (
          <span className="mb-1 flex items-center gap-1.5 text-[8px] uppercase tracking-widest text-primary/45">
            LUCY
            {speaking && (
              <motion.span
                className="inline-flex gap-0.5"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <span className="h-1 w-1 bg-primary" />
                <span className="h-1 w-1 bg-primary" />
                <span className="h-1 w-1 bg-primary" />
              </motion.span>
            )}
          </span>
        )}
        <p className="whitespace-pre-wrap break-words">
          {isUser ? msg.content : formatLucyDisplay(msg.content)}
        </p>
      </div>
    </motion.div>
  )
}

export function DeckChatbot({
  className,
  onSpeakingChange,
  onNavigate,
  introReady = false,
}: {
  className?: string
  onSpeakingChange?: (speaking: boolean) => void
  onNavigate?: (screen: NavigableScreen) => void
  /** When true (after boot), LUCY introduces herself once per session */
  introReady?: boolean
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voiceOut, setVoiceOut] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const systemRef = useRef(buildPortfolioSystemPrompt())
  const reducedMotion = useReducedMotion()
  const loadingRef = useRef(loading)

  loadingRef.current = loading

  const setSpeakingState = useCallback(
    (value: boolean) => {
      setSpeaking(value)
      onSpeakingChange?.(value)
    },
    [onSpeakingChange]
  )

  useEffect(() => preloadVoices(), [])

  useEffect(() => {
    if (!introReady) return
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(LUCY_INTRO_SESSION_KEY)) {
      return
    }
    sessionStorage?.setItem(LUCY_INTRO_SESSION_KEY, "1")
    const formatted = formatLucyDisplay(LUCY_OPENING_INTRO)
    setMessages([{ role: "assistant", content: formatted }])
    if (voiceOut && !reducedMotion) {
      setSpeakingState(true)
      speakText(formatted, () => setSpeakingState(false))
    }
  }, [introReady, voiceOut, reducedMotion, setSpeakingState])

  const deliverReply = useCallback(
    (reply: string, afterSpeak?: () => void) => {
      const formatted = formatLucyDisplay(reply)
      setMessages((prev) => [...prev, { role: "assistant", content: formatted }])

      if (voiceOut && !reducedMotion) {
        setSpeakingState(true)
        speakText(formatted, () => {
          setSpeakingState(false)
          afterSpeak?.()
        })
      } else {
        afterSpeak?.()
      }
    },
    [voiceOut, reducedMotion, setSpeakingState]
  )

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loadingRef.current) return

      stopSpeaking()
      setSpeakingState(false)
      setError(null)

      const userMsg: ChatMessage = { role: "user", content: trimmed }
      let conversation: ChatMessage[] = []
      setMessages((prev) => {
        conversation = [...prev, userMsg]
        return conversation
      })

      const fast = resolveLucyFastReply(trimmed)
      if (fast) {
        deliverReply(fast.reply, () => {
          const nav = fast.navigate
          if (nav?.autoNavigate && onNavigate && nav.screen !== "home") {
            window.setTimeout(() => onNavigate(nav.screen), 1400)
          }
        })
        return
      }

      setLoading(true)
      try {
        const apiMessages: ChatMessage[] = [
          { role: "system", content: systemRef.current },
          ...conversation.filter((m) => m.role !== "system"),
        ]
        const raw = await sendChatMessage(apiMessages)
        deliverReply(sanitizeLucyReply(raw, trimmed))
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transmission failed"
        setError(msg)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I apologize — I hit a system error: ${msg}. Please ensure GROQ_API_KEY is configured, or use the UPLINK module to contact Kim directly.`,
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [deliverReply, onNavigate]
  )

  const sendRef = useRef(sendUserMessage)
  sendRef.current = sendUserMessage

  const onFinalTranscript = useCallback((text: string) => {
    if (!text.trim()) return
    setInput("")
    void sendRef.current(text)
  }, [])

  const {
    recording,
    transcribing,
    listening,
    supported: sttSupported,
    error: sttError,
    toggle: toggleMic,
    stop: stopMic,
    clearError: clearSttError,
  } = useGroqRecording({
    onTranscript: onFinalTranscript,
  })

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  useEffect(() => () => stopSpeaking(), [])

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput("")
    void sendUserMessage(text)
  }

  const handleMicClick = () => {
    if (transcribing) return
    stopSpeaking()
    setSpeakingState(false)
    clearSttError()
    if (recording) stopMic()
    else void toggleMic()
  }

  const toggleVoiceOut = () => {
    if (voiceOut) stopSpeaking()
    setSpeakingState(false)
    setVoiceOut((v) => !v)
  }

  const lastAssistantIdx = messages.reduce(
    (last, m, i) => (m.role === "assistant" ? i : last),
    -1
  )

  return (
    <div
      className={cn(
        "terminal-flicker flex min-h-0 flex-1 flex-col overflow-hidden border-2 border-primary/30 bg-[#000808]/95",
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-primary/25 bg-[#000e0e] px-2 py-1.5">
        <motion.span
          className="h-1.5 w-1.5 bg-primary"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
        <span className="font-mono text-[9px] uppercase tracking-wider text-primary/70">
          LUCY.sys
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0",
              voiceOut ? "text-primary" : "text-primary/30"
            )}
            onClick={toggleVoiceOut}
            title={voiceOut ? "LUCY voice on" : "LUCY voice off"}
            aria-pressed={voiceOut}
          >
            {voiceOut ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          </Button>
          {sttSupported && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 w-6 p-0",
                listening && "text-accent shadow-[0_0_8px_rgba(255,0,0,0.4)]"
              )}
              onClick={handleMicClick}
              disabled={loading || transcribing}
              title={recording ? "Stop & transcribe" : "Speak to LUCY"}
              aria-pressed={listening}
            >
              {listening ? (
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Mic className="h-3 w-3" />
                </motion.span>
              ) : (
                <Mic className="h-3 w-3" />
              )}
            </Button>
          )}
          <span className="font-mono text-[8px] text-primary/35">online</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 space-y-2 overflow-y-auto p-2"
      >
        <div className="pointer-events-none absolute inset-0 scanlines opacity-15" />
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={`${i}-${msg.role}-${msg.content.slice(0, 12)}`}
              msg={msg}
              speaking={speaking && i === lastAssistantIdx && msg.role === "assistant"}
            />
          ))}
        </AnimatePresence>
        {loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[10px] text-primary/50"
          >
            {">>"} LUCY thinking
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              ...
            </motion.span>
          </motion.p>
        )}
        {recording && (
          <p className="font-mono text-[9px] text-accent animate-pulse">
            {">>"} recording… tap mic when done (max 30s)
          </p>
        )}
        {transcribing && (
          <p className="font-mono text-[9px] text-primary/60 animate-pulse">
            {">>"} transcribing…
          </p>
        )}
        {sttError && (
          <p className="font-mono text-[9px] leading-relaxed text-accent">{sttError}</p>
        )}
      </div>

      <form
        onSubmit={submit}
        className="flex shrink-0 gap-1.5 border-t border-primary/20 bg-[#000e0e] p-2"
      >
        {sttSupported && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-8 w-8 shrink-0 p-0", listening && "border-accent text-accent")}
            onClick={handleMicClick}
            disabled={loading || transcribing}
            aria-label="Voice input"
          >
            {recording ? (
              <MicOff className="h-3.5 w-3.5" />
            ) : transcribing ? (
              <span className="text-[8px]">…</span>
            ) : (
              <Mic className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            recording
              ? "RECORDING..."
              : transcribing
                ? "TRANSCRIBING..."
                : "MESSAGE LUCY..."
          }
          className="h-8 min-w-0 flex-1 font-mono text-[11px]"
          disabled={loading || recording || transcribing}
          autoComplete="off"
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading || !input.trim()}
          className="h-8 shrink-0 px-3"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>

      {!sttSupported && (
        <p className="shrink-0 px-2 py-0.5 font-mono text-[8px] text-primary/30">
          Voice input needs microphone support in this browser
        </p>
      )}

      {error && (
        <p className="shrink-0 border-t border-accent/30 bg-accent/5 px-2 py-1 font-mono text-[9px] text-accent">
          {error}
        </p>
      )}
    </div>
  )
}
