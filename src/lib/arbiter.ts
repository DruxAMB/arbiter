import { getTicker, isBingxListed } from "./bingx"
import { getDexPrice, getDexPriceByTokens, POOLS } from "./basedex"
import type { Address } from "viem"

export interface PriceGapResult {
  symbol: string
  bingxPrice: number
  dexPrice: number
  gapAbsolute: number
  gapPercent: number
  netProfit: number
  direction: "CEX_LOWER" | "DEX_LOWER" | "NO_GAP" | "DEX_ONLY"
  liquidity: bigint
  poolAddress: string
  timestamp: number
  cexSupported: boolean
}

const BASE_GAS_COST_USD = 0.01
const SLIPPAGE_BPS = 30
const TRADE_AMOUNT_USD = 1000

export async function scanPair(symbol: string): Promise<PriceGapResult | null> {
  const [bingxTicker, dexResult] = await Promise.all([
    getTicker(symbol),
    getDexPrice(symbol),
  ])

  if (!dexResult) return null

  if (!bingxTicker) {
    return {
      symbol,
      bingxPrice: 0,
      dexPrice: dexResult.price,
      gapAbsolute: 0,
      gapPercent: 0,
      netProfit: 0,
      direction: "DEX_ONLY",
      liquidity: dexResult.liquidity,
      poolAddress: dexResult.poolAddress,
      timestamp: Date.now(),
      cexSupported: false,
    }
  }

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
    cexSupported: true,
  }
}

export async function scanCustomPair(
  token0: Address,
  token1: Address,
  label: string,
  poolAddress?: Address
): Promise<PriceGapResult | null> {
  const dexResult = await getDexPriceByTokens(token0, token1, poolAddress)
  if (!dexResult) return null

  const cexListed = await isBingxListed(label)

  if (!cexListed) {
    return {
      symbol: label,
      bingxPrice: 0,
      dexPrice: dexResult.price,
      gapAbsolute: 0,
      gapPercent: 0,
      netProfit: 0,
      direction: "DEX_ONLY",
      liquidity: dexResult.liquidity,
      poolAddress: dexResult.poolAddress,
      timestamp: Date.now(),
      cexSupported: false,
    }
  }

  const bingxTicker = await getTicker(label)
  if (!bingxTicker) {
    return {
      symbol: label,
      bingxPrice: 0,
      dexPrice: dexResult.price,
      gapAbsolute: 0,
      gapPercent: 0,
      netProfit: 0,
      direction: "DEX_ONLY",
      liquidity: dexResult.liquidity,
      poolAddress: dexResult.poolAddress,
      timestamp: Date.now(),
      cexSupported: false,
    }
  }

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
    symbol: label,
    bingxPrice,
    dexPrice,
    gapAbsolute,
    gapPercent,
    netProfit,
    direction,
    liquidity: dexResult.liquidity,
    poolAddress: dexResult.poolAddress,
    timestamp: Date.now(),
    cexSupported: true,
  }
}

export async function scanAllPairs(): Promise<PriceGapResult[]> {
  const { SUPPORTED_SYMBOLS } = await import("./bingx")
  const results = await Promise.all(SUPPORTED_SYMBOLS.map(scanPair))
  return results.filter((r): r is PriceGapResult => r !== null)
}
