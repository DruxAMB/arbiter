import { getTicker } from "./bingx"
import { getDexPrice } from "./basedex"

export interface PriceGapResult {
  symbol: string
  bingxPrice: number
  dexPrice: number
  gapAbsolute: number
  gapPercent: number
  netProfit: number
  direction: "CEX_LOWER" | "DEX_LOWER" | "NO_GAP"
  liquidity: bigint
  poolAddress: string
  timestamp: number
}

const BASE_GAS_COST_USD = 0.01
const SLIPPAGE_BPS = 30
const TRADE_AMOUNT_USD = 1000

export async function scanPair(symbol: string): Promise<PriceGapResult | null> {
  const [bingxTicker, dexResult] = await Promise.all([
    getTicker(symbol),
    getDexPrice(symbol),
  ])

  if (!bingxTicker || !dexResult) return null

  const bingxPrice = bingxTicker.lastPrice
  const dexPrice = dexResult.price
  const gapAbsolute = Math.abs(bingxPrice - dexPrice)
  const gapPercent = (gapAbsolute / Math.min(bingxPrice, dexPrice)) * 100

  const direction: PriceGapResult["direction"] =
    bingxPrice < dexPrice ? "CEX_LOWER" : dexPrice < bingxPrice ? "DEX_LOWER" : "NO_GAP"

  const slippageCost = (TRADE_AMOUNT_USD * SLIPPAGE_BPS) / 10000
  const grossProfit = (gapPercent / 100) * TRADE_AMOUNT_USD
  const netProfit = grossProfit - BASE_GAS_COST_USD - slippageCost

  return {
    symbol,
    bingxPrice,
    dexPrice,
    gapAbsolute,
    gapPercent,
    netProfit,
    direction,
    liquidity: dexResult.liquidity,
    poolAddress: dexResult.poolAddress,
    timestamp: Date.now(),
  }
}

export async function scanAllPairs(): Promise<PriceGapResult[]> {
  const { SUPPORTED_SYMBOLS } = await import("./bingx")
  const results = await Promise.all(SUPPORTED_SYMBOLS.map(scanPair))
  return results.filter((r): r is PriceGapResult => r !== null)
}
