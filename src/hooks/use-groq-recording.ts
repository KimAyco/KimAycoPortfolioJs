"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  blobToBase64,
  pickRecorderMimeType,
  transcribeRecording,
} from "@/lib/transcribe-api"

const MAX_RECORD_MS = 30_000

export function useGroqRecording({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeRef = useRef("audio/webm")
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    )
  }, [])

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    recorderRef.current = null
    chunksRef.current = []
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }
  }, [])

  const processRecording = useCallback(
    async (blob: Blob) => {
      if (blob.size < 200) {
        setError("Recording too short — hold mic and speak, then tap again.")
        return
      }

      setTranscribing(true)
      setError(null)
      try {
        const base64 = await blobToBase64(blob)
        const text = await transcribeRecording(base64, mimeRef.current)
        onTranscriptRef.current(text)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Transcription failed")
      } finally {
        setTranscribing(false)
      }
    },
    []
  )

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === "inactive") {
      setRecording(false)
      cleanupStream()
      return
    }
    recorder.stop()
    setRecording(false)
  }, [cleanupStream])

  const startRecording = useCallback(async () => {
    setError(null)
    cleanupStream()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      mimeRef.current = pickRecorderMimeType()

      const recorder = new MediaRecorder(stream, { mimeType: mimeRef.current })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current })
        cleanupStream()
        void processRecording(blob)
      }

      recorder.onerror = () => {
        setError("Recording failed.")
        setRecording(false)
        cleanupStream()
      }

      recorderRef.current = recorder
      recorder.start(200)
      setRecording(true)

      maxTimerRef.current = setTimeout(() => {
        stopRecording()
      }, MAX_RECORD_MS)
    } catch {
      setError("Microphone permission denied or unavailable.")
      cleanupStream()
    }
  }, [cleanupStream, processRecording, stopRecording])

  const toggle = useCallback(() => {
    if (transcribing) return
    if (recording) stopRecording()
    else void startRecording()
  }, [recording, transcribing, startRecording, stopRecording])

  useEffect(() => () => cleanupStream(), [cleanupStream])

  return {
    recording,
    transcribing,
    listening: recording,
    supported,
    error,
    toggle,
    stop: stopRecording,
    clearError: () => setError(null),
  }
}
