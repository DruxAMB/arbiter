import { GoogleGenerativeAI } from "@google/generative-ai"
import type { PriceGapResult } from "./arbiter"

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

function getClient() {
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured")
  return new GoogleGenerativeAI(apiKey)
}

export interface AnalysisResult {
  narrative: string
  confidence: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  recommendation: string
}

export async function analyzeOpportunity(result: PriceGapResult): Promise<AnalysisResult> {
  const model = getClient().getGenerativeModel({ model: "gemini-2.0-flash" })

  const prompt = `You are Arbiter, a CEX-DEX arbitrage intelligence agent. Analyze this price gap:

Token Pair: ${result.symbol}
BingX (CEX) Price: $${result.bingxPrice.toFixed(6)}
Base DEX (Uniswap V3) Price: $${result.dexPrice.toFixed(6)}
Gap: ${result.gapPercent.toFixed(3)}% ($${result.gapAbsolute.toFixed(6)})
Direction: ${result.direction === "CEX_LOWER" ? "BingX is cheaper than DEX" : "DEX is cheaper than BingX"}
Estimated Net Profit (after gas + slippage on $1000 trade): $${result.netProfit.toFixed(4)}
Pool Liquidity: ${result.liquidity.toString()}

Respond in this exact JSON format:
{
  "narrative": "2-3 sentences explaining why this gap exists and what it means",
  "confidence": <0-100 integer>,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "recommendation": "1 sentence actionable recommendation"
}

Focus on: market microstructure, why CEX-DEX gaps occur (withdrawal delays, gas costs, liquidity fragmentation, news events), and whether this gap is tradeable or likely to close quickly.`

  try {
    const response = await model.generateContent(prompt)
    const text = response.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error("Gemini analysis failed:", error)
    return {
      narrative: `Price gap of ${result.gapPercent.toFixed(3)}% detected between BingX and Base DEX. ${result.direction === "CEX_LOWER" ? "BingX is pricing lower" : "DEX is pricing lower"}, suggesting temporary liquidity imbalance or delayed price propagation.`,
      confidence: 50,
      riskLevel: "MEDIUM" as const,
      recommendation: "Monitor the gap. If it persists beyond 30 seconds, it may be actionable.",
    }
  }
}
