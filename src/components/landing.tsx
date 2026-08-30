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
      {/* Ambient glow — pointer-events: none so it never swallows clicks */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
          style={{ background: "var(--gradient-brand)" }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 mx-auto max-w-[1120px] px-5 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <span className="text-base font-medium tracking-tight">Arbiter</span>
        </div>
        <a
          href="https://github.com/DruxAMB/arbiter"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-[1120px] px-5 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="flex flex-col items-center text-center">
          {/* Eyebrow */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Live on Base
          </span>

          {/* Headline */}
          <h1 className="max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl sm:leading-[1.05]">
            Real-time CEX-DEX arbitrage
            <br />
            <span className="text-primary">intelligence on Base</span>
          </h1>

          {/* Subhead */}
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Detect price gaps between BingX and Uniswap V3, analyze opportunities
            with AI, and attest them on-chain. Built for traders who act in seconds.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button
              onClick={handleEnter}
              size="lg"
              className="h-12 rounded-full px-8 text-base"
            >
              Try the demo
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
            <a
              href="https://github.com/DruxAMB/arbiter"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              View the code
            </a>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:mt-24 sm:grid-cols-3 sm:gap-6">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Step 1
            </h2>
            <p className="mt-1 text-base font-medium">Scan</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Compare BingX and Uniswap V3 prices for 6 preset pairs, or input any
              ERC-20 token address on Base.
            </p>
          </div>
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Step 2
            </h2>
            <p className="mt-1 text-base font-medium">Analyze</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Gemini AI evaluates the gap, estimates net profit after gas and
              slippage, and assigns a confidence score.
            </p>
          </div>
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Step 3
            </h2>
            <p className="mt-1 text-base font-medium">Attest</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Record the opportunity on-chain with a Base L2 transaction. Every
              attestation is verifiable on Basescan.
            </p>
          </div>
        </div>

        {/* Tech stack */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-[0.1em]">Powered by</span>
          <span>Base L2</span>
          <span aria-hidden="true">·</span>
          <span>BingX API</span>
          <span aria-hidden="true">·</span>
          <span>Uniswap V3</span>
          <span aria-hidden="true">·</span>
          <span>Gemini AI</span>
        </div>
      </main>
    </div>
  )
}
