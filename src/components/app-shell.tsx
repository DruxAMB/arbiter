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
        <header className="border-b border-border">
          <div className="mx-auto max-w-[1120px] px-5 py-4 flex items-center justify-between">
            <button
              onClick={exitToLanding}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
              aria-label="Back to home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent/10">
                <Zap className="h-5 w-5 text-accent" aria-hidden="true" />
              </div>
              <span className="text-base font-medium tracking-tight">Arbiter</span>
            </button>
            <div className="flex items-center gap-1.5 rounded-sm bg-accent/10 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent">Live</span>
            </div>
          </div>
        </header>
        {dashboard}
      </div>
    )
  }

  return <div className="min-h-[100dvh] bg-background">{landing}</div>
}
