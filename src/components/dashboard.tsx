"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Activity, Brain, Link2, TrendingUp, TrendingDown, Zap, ExternalLink, Clock } from "lucide-react"
import { SUPPORTED_SYMBOLS } from "@/lib/bingx"
import { SAMPLE_ATTESTATIONS } from "@/lib/basedex"
import type { PriceGapResult } from "@/lib/arbiter"
import type { AnalysisResult } from "@/lib/gemini"

type ScanResult = Omit<PriceGapResult, "liquidity"> & { liquidity: string }

type ScanState = "idle" | "loading" | "success" | "error"
type AnalyzeState = "idle" | "loading" | "success" | "error"
type AttestState = "idle" | "loading" | "success" | "error"

interface AttestationRecord {
  pair: string
  bingxPrice: number
  dexPrice: number
  gapPercent: number
  netProfit: number
  timestamp: number
  txHash?: string
  explorerUrl?: string
  simulated?: boolean
}

function formatPrice(price: number): string {
  if (price >= 100) return `$${price.toFixed(2)}`
  if (price >= 1) return `$${price.toFixed(4)}`
  return `$${price.toFixed(6)}`
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${mins}m ago`
  return `${mins}m ago`
}

export function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("ETH-USDC")
  const [scanState, setScanState] = useState<ScanState>("idle")
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState<string>("")

  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>("idle")
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string>("")

  const [attestState, setAttestState] = useState<AttestState>("idle")
  const [attestResult, setAttestResult] = useState<{ txHash: string; explorerUrl: string; simulated: boolean } | null>(null)
  const [attestError, setAttestError] = useState<string>("")

  const [history, setHistory] = useState<AttestationRecord[]>(SAMPLE_ATTESTATIONS)

  const handleScan = useCallback(async () => {
    setScanState("loading")
    setAnalyzeState("idle")
    setAttestState("idle")
    setAnalysis(null)
    setAttestResult(null)
    setScanError("")

    try {
      const res = await fetch(`/api/scan?symbol=${selectedSymbol}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Scan failed")
      }
      const data = await res.json()
      setScanResult(data.result)
      setScanState("success")
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Failed to fetch prices")
      setScanState("error")
    }
  }, [selectedSymbol])

  const handleAnalyze = useCallback(async () => {
    if (!scanResult) return
    setAnalyzeState("loading")
    setAnalyzeError("")

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: scanResult }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Analysis failed")
      }
      const data = await res.json()
      setAnalysis(data.analysis)
      setAnalyzeState("success")
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "AI analysis failed")
      setAnalyzeState("error")
    }
  }, [scanResult])

  const handleAttest = useCallback(async () => {
    if (!scanResult) return
    setAttestState("loading")
    setAttestError("")

    try {
      const res = await fetch("/api/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: scanResult }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Attestation failed")
      }
      const data = await res.json()
      setAttestResult({
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
        simulated: data.simulated,
      })
      setAttestState("success")
      setHistory((prev) => [
        {
          pair: scanResult.symbol,
          bingxPrice: scanResult.bingxPrice,
          dexPrice: scanResult.dexPrice,
          gapPercent: scanResult.gapPercent,
          netProfit: scanResult.netProfit,
          timestamp: Date.now(),
          txHash: data.txHash,
          explorerUrl: data.explorerUrl,
          simulated: data.simulated,
        },
        ...prev,
      ])
    } catch (err) {
      setAttestError(err instanceof Error ? err.message : "On-chain attestation failed")
      setAttestState("error")
    }
  }, [scanResult])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Arbiter</h1>
              <p className="text-xs text-muted-foreground">CEX-DEX Arbitrage Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Live</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scan Price Gap</CardTitle>
            <CardDescription>Select a token pair and scan for CEX-DEX arbitrage opportunities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SUPPORTED_SYMBOLS.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
              <Button onClick={handleScan} disabled={scanState === "loading"} className="flex-1 sm:flex-none">
                {scanState === "loading" ? (
                  <>
                    <Activity className="mr-2 h-4 w-4 animate-pulse" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Scan Now
                  </>
                )}
              </Button>
            </div>

            {scanState === "loading" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            )}

            {scanState === "error" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">{scanError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleScan}>
                  Retry scan
                </Button>
              </div>
            )}

            {scanState === "success" && scanResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-border">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">BingX (CEX)</Badge>
                      </div>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatPrice(scanResult.bingxPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{scanResult.symbol}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">Base DEX</Badge>
                      </div>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatPrice(scanResult.dexPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uniswap V3 · {scanResult.symbol}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    {scanResult.direction === "CEX_LOWER" ? (
                      <TrendingDown className="h-5 w-5 text-primary" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        Gap: <span className="text-primary">{scanResult.gapPercent.toFixed(3)}%</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {scanResult.direction === "CEX_LOWER"
                          ? "BingX cheaper → buy CEX, sell DEX"
                          : "DEX cheaper → buy DEX, sell CEX"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Net: <span className={scanResult.netProfit > 0 ? "text-primary" : "text-destructive"}>
                        ${scanResult.netProfit.toFixed(4)}
                      </span>
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground cursor-help">on $1,000 trade</p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>After Base gas (~$0.01) + 30bps slippage</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzeState === "loading"}
                    variant="secondary"
                    className="flex-1"
                  >
                    {analyzeState === "loading" ? (
                      <>
                        <Brain className="mr-2 h-4 w-4 animate-pulse" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAttest}
                    disabled={attestState === "loading"}
                    className="flex-1"
                  >
                    {attestState === "loading" ? (
                      <>
                        <Link2 className="mr-2 h-4 w-4 animate-pulse" />
                        Attesting...
                      </>
                    ) : (
                      <>
                        <Link2 className="mr-2 h-4 w-4" />
                        Attest On-Chain
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {(analyzeState === "loading" || analyzeState === "success" || analyzeState === "error") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Opportunity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyzeState === "loading" && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
              {analyzeState === "error" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">{analyzeError}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleAnalyze}>
                    Retry analysis
                  </Button>
                </div>
              )}
              {analyzeState === "success" && analysis && (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed">{analysis.narrative}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Confidence: {analysis.confidence}/100
                    </Badge>
                    <Badge variant={analysis.riskLevel === "LOW" ? "default" : analysis.riskLevel === "MEDIUM" ? "secondary" : "destructive"}>
                      Risk: {analysis.riskLevel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground italic">{analysis.recommendation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(attestState === "loading" || attestState === "success" || attestState === "error") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                On-Chain Attestation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attestState === "loading" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 animate-pulse" />
                  Submitting transaction to Base...
                </div>
              )}
              {attestState === "error" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">{attestError}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleAttest}>
                    Retry attestation
                  </Button>
                </div>
              )}
              {attestState === "success" && attestResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-primary font-medium">Transaction confirmed</span>
                    {attestResult.simulated && (
                      <Badge variant="secondary" className="text-xs">Simulated</Badge>
                    )}
                  </div>
                  <a
                    href={attestResult.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View on Basescan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {attestResult.txHash}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attestation History</CardTitle>
            <CardDescription>Recorded arbitrage opportunities on Base</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No attestations yet. Scan and attest to build history.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Pair</th>
                      <th className="pb-2 pr-4 font-medium">BingX</th>
                      <th className="pb-2 pr-4 font-medium">DEX</th>
                      <th className="pb-2 pr-4 font-medium">Gap</th>
                      <th className="pb-2 pr-4 font-medium">Net</th>
                      <th className="pb-2 pr-4 font-medium">Time</th>
                      <th className="pb-2 font-medium">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">{record.pair}</td>
                        <td className="py-2 pr-4 tabular-nums">{formatPrice(record.bingxPrice)}</td>
                        <td className="py-2 pr-4 tabular-nums">{formatPrice(record.dexPrice)}</td>
                        <td className="py-2 pr-4 tabular-nums text-primary">{record.gapPercent.toFixed(3)}%</td>
                        <td className="py-2 pr-4 tabular-nums">${record.netProfit.toFixed(4)}</td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">{formatTimeAgo(record.timestamp)}</td>
                        <td className="py-2">
                          {record.explorerUrl ? (
                            <a
                              href={record.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground py-4">
          <p>
            Arbiter bridges BingX and Base DEXes in real-time. Powered by Gemini AI.
          </p>
          <p className="mt-1">
            Built on Base · BingX partner integration · On-chain attestations
          </p>
        </div>
      </main>
    </div>
  )
}
