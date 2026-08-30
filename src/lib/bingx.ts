export interface BingXTicker {
  symbol: string
  lastPrice: number
  bidPrice: number
  askPrice: number
  volume: number
  priceChangePercent: string
}

const BINGX_API = "https://open-api.bingx.com"

export async function getAllTickers(): Promise<BingXTicker[]> {
  const res = await fetch(`${BINGX_API}/openApi/spot/v1/ticker/24hr`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`BingX API error: ${res.status}`)
  const data = await res.json()
  if (data.code !== 0) throw new Error(`BingX API error: ${data.msg || data.code}`)
  return (data.data || []).map((t: Record<string, string | number>) => ({
    symbol: t.symbol as string,
    lastPrice: parseFloat(t.lastPrice as string),
    bidPrice: parseFloat(t.bidPrice as string),
    askPrice: parseFloat(t.askPrice as string),
    volume: parseFloat(t.volume as string),
    priceChangePercent: t.priceChangePercent as string,
  }))
}

export async function getTicker(symbol: string): Promise<BingXTicker | null> {
  const tickers = await getAllTickers()
  return tickers.find((t) => t.symbol === symbol) ?? null
}

export const SUPPORTED_SYMBOLS = ["ETH-USDC", "ETH-USDT", "LINK-USDT", "UNI-USDT", "AAVE-USDT", "CRV-USDT"] as const

export async function isBingxListed(symbol: string): Promise<boolean> {
  const tickers = await getAllTickers()
  return tickers.some((t) => t.symbol === symbol)
}
