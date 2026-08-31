"use client"

import { Zap, ArrowRight, Brain, Link2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LandingProps {
  onEnter?: () => void
}

export function Landing({ onEnter }: LandingProps) {
  const handleEnter = () => {
    if (onEnter) {
      onEnter()
    } else {
      window.dispatchEvent(new CustomEvent("enter-app"))
    }
  }
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* Ambient glow — 179deg gradient, pointer-events: none */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 rounded-full opacity-25 blur-[140px]"
          style={{ background: "var(--gradient-brand)" }}
        />
      </div>

      {/* Floating Nav Pill — 60px radius, Carbon fill, white-alpha border, nav shadow */}
      <nav className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
        <div
          className="flex items-center gap-6 rounded-xl border bg-card px-6 py-3"
          style={{ borderColor: "rgba(255,255,255,0.08)", boxShadow: "var(--shadow-nav)" }}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="text-sm font-medium tracking-tight text-foreground">Arbiter</span>
          </div>
          <a
            href="https://github.com/DruxAMB/arbiter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-colors hover:text-foreground"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            GitHub
          </a>
          <Button
            onClick={handleEnter}
            size="sm"
            className="h-8 rounded-lg px-4 text-sm font-medium"
          >
            Try demo
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </nav>

      {/* Hero — 80vh, centered, tight type stack */}
      <main className="relative z-10 mx-auto max-w-[1200px] px-5">
        <section className="flex min-h-[80vh] flex-col items-center justify-center text-center">
          {/* Eyebrow — 30px radius, Carbon fill, 1px border */}
          <span className="mb-8 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-[0.129em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Live on Base
          </span>

          {/* Headline — 96px desktop, weight 500, line-height 1.0, white + Signal Violet */}
          <h1 className="max-w-4xl text-5xl font-medium leading-[1.09] tracking-tight sm:text-6xl lg:text-8xl lg:leading-[1.0]">
            Real-time CEX-DEX arbitrage
            <br />
            <span className="text-accent">intelligence on Base</span>
          </h1>

          {/* Subhead — 18px, weight 400, Ash #d1d3d4, max-width 560px */}
          <p className="mt-8 max-w-[560px] text-lg font-normal leading-[1.5]" style={{ color: "#d1d3d4" }}>
            Detect price gaps between BingX and Uniswap V3, analyze opportunities
            with AI, and attest them on-chain. Built for traders who act in seconds.
          </p>

          {/* CTA — Voltage Blue primary + Signal Violet ghost outline */}
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <Button
              onClick={handleEnter}
              size="lg"
              className="h-14 rounded-lg px-8 text-base font-medium"
            >
              Try the demo
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
            <a
              href="https://github.com/DruxAMB/arbiter"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center rounded-lg border border-accent px-8 text-base font-medium text-accent transition-colors hover:bg-accent/10"
            >
              View the code
            </a>
          </div>
        </section>

        {/* Feature cards — 80-120px section gap, 3-col grid, Carbon fill + glow, 30px radius, 32px padding */}
        <section className="pb-32">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div
              className="flex flex-col items-start rounded-lg border border-border bg-card p-8"
              style={{ boxShadow: "var(--glow-soft)" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Search className="h-5 w-5 text-accent" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-xs font-medium uppercase tracking-[0.129em] text-muted-foreground">
                Step 1
              </h2>
              <p className="mt-2 text-lg font-medium">Scan</p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#d1d3d4" }}>
                Compare BingX and Uniswap V3 prices for 6 preset pairs, or input any
                ERC-20 token address on Base.
              </p>
            </div>
            <div
              className="flex flex-col items-start rounded-lg border border-border bg-card p-8"
              style={{ boxShadow: "var(--glow-soft)" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Brain className="h-5 w-5 text-accent" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-xs font-medium uppercase tracking-[0.129em] text-muted-foreground">
                Step 2
              </h2>
              <p className="mt-2 text-lg font-medium">Analyze</p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#d1d3d4" }}>
                Gemini AI evaluates the gap, estimates net profit after gas and
                slippage, and assigns a confidence score.
              </p>
            </div>
            <div
              className="flex flex-col items-start rounded-lg border border-border bg-card p-8"
              style={{ boxShadow: "var(--glow-soft)" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Link2 className="h-5 w-5 text-accent" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-xs font-medium uppercase tracking-[0.129em] text-muted-foreground">
                Step 3
              </h2>
              <p className="mt-2 text-lg font-medium">Attest</p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#d1d3d4" }}>
                Record the opportunity on-chain with a Base L2 transaction. Every
                attestation is verifiable on Basescan.
              </p>
            </div>
          </div>

          {/* Tech stack — logo strip style, Ash tone */}
          <div className="mt-24 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs" style={{ color: "#d1d3d4" }}>
            <span className="font-medium uppercase tracking-[0.129em]">Powered by</span>
            <span>Base L2</span>
            <span aria-hidden="true">·</span>
            <span>BingX API</span>
            <span aria-hidden="true">·</span>
            <span>Uniswap V3</span>
            <span aria-hidden="true">·</span>
            <span>Gemini AI</span>
          </div>
        </section>
      </main>
    </div>
  )
}
