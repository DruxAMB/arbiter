"use client"

import { useState, useEffect, useCallback } from "react"
import { Zap } from "lucide-react"
import type { ReactNode } from "react"

interface AppShellProps {
  landing: ReactNode
  dashboard: ReactNode
}

export function AppShell({ landing, dashboard }: AppShellProps) {
  const [showApp, setShowApp] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setShowApp(params.has("app"))
    setMounted(true)
  }, [])

  const enterApp = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("app", "1")
    window.history.pushState({}, "", url.toString())
    setShowApp(true)
  }, [])

  const exitToLanding = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete("app")
    window.history.pushState({}, "", url.toString())
    setShowApp(false)
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      setShowApp(params.has("app"))
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  useEffect(() => {
    const handleEnterApp = () => enterApp()
    window.addEventListener("enter-app", handleEnterApp)
    return () => window.removeEventListener("enter-app", handleEnterApp)
  }, [enterApp])

  if (!mounted) {
    return <div className="min-h-[100dvh] bg-background" />
  }

  if (showApp) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <nav className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
          <div
            className="flex items-center gap-6 rounded-xl border bg-card pl-6 pr-2 py-2"
            style={{ borderColor: "rgba(255,255,255,0.08)", boxShadow: "var(--shadow-nav)" }}
          >
            <button
              onClick={exitToLanding}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
              aria-label="Back to home"
            >
              <Zap className="h-5 w-5 text-accent" aria-hidden="true" />
              <span className="text-sm font-medium tracking-tight text-foreground">Arbiter</span>
            </button>
            <div className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-accent">Live</span>
            </div>
          </div>
        </nav>
        <div className="pt-24">{dashboard}</div>
      </div>
    )
  }

  return <div className="min-h-[100dvh] bg-background">{landing}</div>
}
