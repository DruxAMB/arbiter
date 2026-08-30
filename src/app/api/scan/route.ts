import { NextResponse } from "next/server"
import { scanPair, scanAllPairs, scanCustomPair } from "@/lib/arbiter"
import { SUPPORTED_SYMBOLS, getTicker } from "@/lib/bingx"
import { getDexPrice } from "@/lib/basedex"
import type { Address } from "viem"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")
  const token0 = searchParams.get("token0")
  const token1 = searchParams.get("token1")
  const pool = searchParams.get("pool")
  const label = searchParams.get("label") || "CUSTOM"

  try {
    if (token0 && token1) {
      if (!token0.startsWith("0x") || !token1.startsWith("0x")) {
        return NextResponse.json({ error: "Token addresses must be hex (0x...)" }, { status: 400 })
      }
      const poolAddr = pool && pool.startsWith("0x") ? pool as Address : undefined
      const result = await scanCustomPair(token0 as Address, token1 as Address, label, poolAddr)
      if (!result) {
        return NextResponse.json(
          { error: "No Uniswap V3 pool found for this token pair on Base" },
          { status: 404 }
        )
      }
      return NextResponse.json({
        result: {
          ...result,
          liquidity: result.liquidity.toString(),
        },
      })
    }

    if (symbol) {
      if (!SUPPORTED_SYMBOLS.includes(symbol as typeof SUPPORTED_SYMBOLS[number])) {
        return NextResponse.json({ error: `Unsupported pair: ${symbol}. Use token0 & token1 params for custom tokens.` }, { status: 400 })
      }

      const [bingx, dex] = await Promise.allSettled([
        getTicker(symbol),
        getDexPrice(symbol),
      ])

      const bingxOk = bingx.status === "fulfilled" && bingx.value !== null
      const dexOk = dex.status === "fulfilled" && dex.value !== null

      if (!bingxOk || !dexOk) {
        const details: string[] = []
        if (!bingxOk) details.push(`BingX: ${bingx.status === "rejected" ? bingx.reason?.message : "not found"}`)
        if (!dexOk) details.push(`DEX: ${dex.status === "rejected" ? dex.reason?.message : "pool not found"}`)
        return NextResponse.json(
          { error: "Failed to fetch prices", details },
          { status: 502 }
        )
      }

      const result = await scanPair(symbol)
      if (!result) {
        return NextResponse.json({ error: "Failed to compute gap" }, { status: 500 })
      }
      return NextResponse.json({
        result: {
          ...result,
          liquidity: result.liquidity.toString(),
        },
      })
    }

    const results = await scanAllPairs()
    return NextResponse.json({
      results: results.map((r) => ({
        ...r,
        liquidity: r.liquidity.toString(),
      })),
    })
  } catch (error) {
    console.error("Scan error:", error)
    return NextResponse.json(
      { error: "Scan failed — external API may be unavailable" },
      { status: 500 }
    )
  }
}
