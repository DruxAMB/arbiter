import { createPublicClient, http, fallback, type Address } from "viem"
import { base } from "viem/chains"

const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"
const FALLBACK_RPC = "https://base.publicnode.com"

const POOL_ABI = [
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
] as const

function createClient() {
  return createPublicClient({
    chain: base,
    transport: fallback([
      http(RPC_URL),
      http(FALLBACK_RPC),
    ]),
  })
}

const client = createClient()

function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number
): number {
  // price = (sqrtPriceX96 / 2^96)^2 * 10^(decimals0 - decimals1)
  // Scale down to avoid Number precision loss
  // Divide both by 10^15 to keep within safe integer range
  const Q96 = 79228162514264337593543950336n // 2^96
  const SCALE = 1000000000000000n // 10^15
  const scaledSqrt = sqrtPriceX96 / SCALE
  const scaledQ96 = Q96 / SCALE
  const sqrtRatio = Number(scaledSqrt) / Number(scaledQ96)
  const priceRaw = sqrtRatio * sqrtRatio
  const decimalAdjust = Math.pow(10, token0Decimals - token1Decimals)
  return priceRaw * decimalAdjust
}

export interface PoolConfig {
  address: Address
  token0Symbol: string
  token0Decimals: number
  token1Symbol: string
  token1Decimals: number
  baseIsToken1: boolean
}

export const POOLS: Record<string, PoolConfig> = {
  "ETH-USDC": {
    address: "0xd0b53d9277642d899df5c87a3966a349a798f224",
    token0Symbol: "WETH",
    token0Decimals: 18,
    token1Symbol: "USDC",
    token1Decimals: 6,
    baseIsToken1: false,
  },
  "ETH-USDT": {
    address: "0xce1d8c90a5f0ef28fe0f457e5ad615215899319a",
    token0Symbol: "WETH",
    token0Decimals: 18,
    token1Symbol: "USDT",
    token1Decimals: 6,
    baseIsToken1: false,
  },
}

export interface DEXPriceResult {
  poolAddress: string
  price: number
  liquidity: bigint
}

export async function getDexPrice(symbol: string): Promise<DEXPriceResult | null> {
  const pool = POOLS[symbol]
  if (!pool) return null

  try {
    const [slot0, liquidity] = await Promise.all([
      client.readContract({
        address: pool.address,
        abi: POOL_ABI,
        functionName: "slot0",
      }),
      client.readContract({
        address: pool.address,
        abi: POOL_ABI,
        functionName: "liquidity",
      }),
    ])

    const sqrtPriceX96 = slot0[0] as bigint
    const liquidityValue = liquidity as bigint

    const rawPrice = sqrtPriceX96ToPrice(
      sqrtPriceX96,
      pool.token0Decimals,
      pool.token1Decimals
    )

    const price = pool.baseIsToken1 ? 1 / rawPrice : rawPrice

    return {
      poolAddress: pool.address,
      price,
      liquidity: liquidityValue,
    }
  } catch (error) {
    console.error(`DEX price read failed for ${symbol}:`, error)
    return null
  }
}

export interface AttestationData {
  pair: string
  bingxPrice: number
  dexPrice: number
  gapPercent: number
  netProfit: number
  timestamp: number
}

export const SAMPLE_ATTESTATIONS: AttestationData[] = [
  {
    pair: "ETH-USDC",
    bingxPrice: 2447.02,
    dexPrice: 2449.50,
    gapPercent: 0.101,
    netProfit: 1.23,
    timestamp: Date.now() - 3600000,
  },
  {
    pair: "ETH-USDT",
    bingxPrice: 2442.35,
    dexPrice: 2444.10,
    gapPercent: 0.072,
    netProfit: 0.42,
    timestamp: Date.now() - 7200000,
  },
  {
    pair: "ETH-USDC",
    bingxPrice: 2438.80,
    dexPrice: 2441.20,
    gapPercent: 0.098,
    netProfit: 0.88,
    timestamp: Date.now() - 10800000,
  },
]
