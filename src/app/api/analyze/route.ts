import { NextResponse } from "next/server"
import { analyzeOpportunity } from "@/lib/gemini"
import type { PriceGapResult } from "@/lib/arbiter"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result: PriceGapResult = body.result

    if (!result || !result.symbol) {
      return NextResponse.json({ error: "Missing scan result" }, { status: 400 })
    }

    const analysis = await analyzeOpportunity(result)
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      { error: "AI analysis failed — please retry" },
      { status: 500 }
    )
  }
}
