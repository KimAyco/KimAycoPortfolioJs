"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Project } from "@/data/portfolio"
import { DECK_MODULES, type DeckScreen } from "@/types/deck"
import type { TransitionDirection } from "@/components/cyber/deck/deck-animations"
import { getTransitionDirection } from "@/lib/deck-navigation"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { CyberConsoleShell } from "@/components/cyber/CyberConsoleShell"
import { CyberTicker } from "@/components/cyber/CyberTicker"
import { DeckSidebar } from "./DeckSidebar"
import { DeckPanel } from "./DeckScreen"
import { StatusBar } from "./StatusBar"
import { HexRain } from "./HexRain"
import { BootView } from "./views/BootView"
import { HomeView } from "./views/HomeView"
import { ProjectsView } from "./views/ProjectsView"
import { ProjectDetailView } from "./views/ProjectDetailView"
import { CapabilitiesView } from "./views/CapabilitiesView"
import { HelpView } from "./views/HelpView"
import { UplinkView } from "./views/UplinkView"

export function CyberDeck() {
  const reducedMotion = useReducedMotion()
  const [screen, setScreen] = useState<DeckScreen>(reducedMotion ? "home" : "boot")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | undefined>()
  const [lucyIntroReady, setLucyIntroReady] = useState(reducedMotion)
  const [transitionDir, setTransitionDir] = useState<TransitionDirection>("forward")
  const screenRef = useRef<DeckScreen>(screen)
  screenRef.current = screen

  const goTo = useCallback((next: DeckScreen) => {
    setTransitionDir(getTransitionDirection(screenRef.current, next))
    setScreen(next)
  }, [])

  useEffect(() => {
    document.documentElement.classList.add("deck-mode")
    return () => document.documentElement.classList.remove("deck-mode")
  }, [])

  useEffect(() => {
    if (screen !== "boot" || reducedMotion) return
    const t = window.setTimeout(() => {
      goTo("home")
      setLucyIntroReady(true)
      setStatusMessage("BOOT COMPLETE — LUCY ONLINE")
    }, 2600)
    return () => window.clearTimeout(t)
  }, [screen, reducedMotion, goTo])

  const flashStatus = useCallback((msg: string, ms = 2400) => {
    setStatusMessage(msg)
    window.setTimeout(() => setStatusMessage(undefined), ms)
  }, [])

  const navigate = useCallback(
    (next: DeckScreen) => {
      if (next !== "project-detail") setSelectedProject(null)
      goTo(next)
      const mod = DECK_MODULES.find((m) => m.id === next)
      flashStatus(mod ? `>> ${mod.label}` : `>> ${next.toUpperCase()}`)
    },
    [flashStatus, goTo]
  )

  const openProject = useCallback(
    (project: Project) => {
      setSelectedProject(project)
      goTo("project-detail")
      flashStatus(`MOUNTING // ${project.title}`)
    },
    [flashStatus, goTo]
  )

  const backToProjects = useCallback(() => {
    setSelectedProject(null)
    goTo("projects")
    flashStatus("ARCHIVE RESTORED")
  }, [flashStatus, goTo])

  useEffect(() => {
    if (screen === "boot") return
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return
      if (e.key === "Escape") {
        if (screen === "project-detail") { backToProjects(); return }
        if (screen !== "home") navigate("home")
        return
      }
      const mod = DECK_MODULES.find((m) => m.key === e.key)
      if (mod) navigate(mod.id)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [screen, navigate, backToProjects])

  const screenKey =
    screen === "project-detail" && selectedProject
      ? `project-${selectedProject.id}`
      : screen

  const renderContent = () => {
    switch (screen) {
      case "boot":       return <BootView />
      case "home":       return <HomeView onNavigate={navigate} />
      case "projects":   return <ProjectsView onSelectProject={openProject} />
      case "project-detail":
        return selectedProject ? (
          <ProjectDetailView project={selectedProject} onBack={backToProjects} />
        ) : (
          <ProjectsView onSelectProject={openProject} />
        )
      case "capabilities": return <CapabilitiesView />
      case "help":         return <HelpView />
      case "uplink":       return <UplinkView />
      default:             return <HomeView onNavigate={navigate} lucyIntroReady={lucyIntroReady} />
    }
  }

  return (
    <CyberConsoleShell>
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
        {/* Scrolling ticker — hidden during boot */}
        {screen !== "boot" && <CyberTicker />}

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <DeckSidebar
            active={screen}
            onNavigate={navigate}
            disabled={screen === "boot"}
          />

          <main className="relative min-h-0 flex-1 overflow-hidden bg-[#001a1a]">
            {/* Ambient hex rain */}
            {screen !== "boot" && (
              <HexRain className="absolute inset-0 opacity-[0.07]" />
            )}
            {/* Top radial glow */}
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(204,255,0,0.07) 0%, transparent 70%)",
              }}
            />
            {/* Dot grid */}
            <div className="pointer-events-none absolute inset-0 cyber-dot-grid opacity-10" />
            {/* Line grid */}
            <div className="pointer-events-none absolute inset-0 cyber-line-grid opacity-60" />

            <div className="relative h-full overflow-hidden">
              <DeckPanel
                screenKey={screenKey}
                direction={transitionDir}
                className="relative h-full"
              >
                {renderContent()}
              </DeckPanel>
            </div>
          </main>
        </div>

        <StatusBar screen={screen} message={statusMessage} />
      </div>
    </CyberConsoleShell>
  )
}
