import { NextResponse } from "next/server"
import { scanPair, scanAllPairs } from "@/lib/arbiter"
import { SUPPORTED_SYMBOLS, getTicker } from "@/lib/bingx"
import { getDexPrice } from "@/lib/basedex"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  try {
    if (symbol) {
      if (!SUPPORTED_SYMBOLS.includes(symbol as typeof SUPPORTED_SYMBOLS[number])) {
        return NextResponse.json({ error: `Unsupported pair: ${symbol}` }, { status: 400 })
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
