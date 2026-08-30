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
  {
    inputs: [],
    name: "token0",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const

const ERC20_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const

const UNISWAP_V3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984" as Address
const FACTORY_ABI = [
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" },
    ],
    name: "getPool",
    outputs: [{ name: "pool", type: "address" }],
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
  // If true, the raw price from the pool is TOKEN/WETH and needs to be
  // converted to TOKEN/USD by inverting and multiplying by ETH USD price
  quoteIsWETH: boolean
}

export const POOLS: Record<string, PoolConfig> = {
  "ETH-USDC": {
    address: "0xd0b53d9277642d899df5c87a3966a349a798f224",
    token0Symbol: "WETH",
    token0Decimals: 18,
    token1Symbol: "USDC",
    token1Decimals: 6,
    baseIsToken1: false,
    quoteIsWETH: false,
  },
  "ETH-USDT": {
    address: "0xce1d8c90a5f0ef28fe0f457e5ad615215899319a",
    token0Symbol: "WETH",
    token0Decimals: 18,
    token1Symbol: "USDT",
    token1Decimals: 6,
    baseIsToken1: false,
    quoteIsWETH: false,
  },
  "LINK-USDT": {
    address: "0x224a5d3f2155f2f85af70b6d72aea61a15273ff4",
    token0Symbol: "WETH",
    token0Decimals: 18,
    token1Symbol: "LINK",
    token1Decimals: 18,
    baseIsToken1: false,
    quoteIsWETH: true,
  },
  "UNI-USDT": {
    address: "0xba4325479cc8be38255a0f5212db672c134b1d78",
    token0Symbol: "WETH",
    token0Decimals: 18,
    token1Symbol: "UNI",
    token1Decimals: 18,
    baseIsToken1: false,
    quoteIsWETH: true,
  },
  "AAVE-USDT": {
    address: "0x2e86514cfd61fb19c5cf2b879d536d273d6e693d",
    token0Symbol: "WETH",
    token0Decimals: 18,
    token1Symbol: "AAVE",
    token1Decimals: 18,
    baseIsToken1: false,
    quoteIsWETH: true,
  },
  "CRV-USDT": {
    address: "0x330e535c40eb49cc186496f061052fcf814d68cb",
    token0Symbol: "WETH",
    token0Decimals: 18,
    token1Symbol: "CRV",
    token1Decimals: 18,
    baseIsToken1: false,
    quoteIsWETH: true,
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
  const result = await readPoolPrice(pool.address, pool.token0Decimals, pool.token1Decimals, pool.baseIsToken1)
  if (!result) return null

  if (pool.quoteIsWETH) {
    const ethUsd = await getEthUsdPrice()
    if (!ethUsd) return null
    // raw price is TOKEN per WETH; TOKEN_USD = (1 / rawPrice) * ETH_USD
    return {
      ...result,
      price: (1 / result.price) * ethUsd,
    }
  }

  return result
}

let ethUsdCache: { price: number; time: number } | null = null

async function getEthUsdPrice(): Promise<number | null> {
  if (ethUsdCache && Date.now() - ethUsdCache.time < 30000) {
    return ethUsdCache.price
  }
  const result = await readPoolPrice(
    POOLS["ETH-USDC"].address,
    POOLS["ETH-USDC"].token0Decimals,
    POOLS["ETH-USDC"].token1Decimals,
    false
  )
  if (!result) return null
  ethUsdCache = { price: result.price, time: Date.now() }
  return result.price
}

export async function getDexPriceByTokens(
  token0: Address,
  token1: Address,
  poolAddress?: Address
): Promise<DEXPriceResult | null> {
  try {
    if (poolAddress) {
      const [token0Actual, token1Actual, decimals0, decimals1] = await Promise.all([
        client.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "token0" }),
        client.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "token1" }),
        client.readContract({ address: token0, abi: ERC20_ABI, functionName: "decimals" }),
        client.readContract({ address: token1, abi: ERC20_ABI, functionName: "decimals" }),
      ])

      const t0 = token0Actual as Address
      const t1 = token1Actual as Address
      const d0 = decimals0 as number
      const d1 = decimals1 as number

      const isToken0First = t0.toLowerCase() === token0.toLowerCase()
      const result = await readPoolPrice(
        poolAddress,
        isToken0First ? d0 : d1,
        isToken0First ? d1 : d0,
        false
      )
      return result
    }

    // Fallback: try factory discovery (may not work for all Base pools)
    const [decimals0, decimals1] = await Promise.all([
      client.readContract({ address: token0, abi: ERC20_ABI, functionName: "decimals" }),
      client.readContract({ address: token1, abi: ERC20_ABI, functionName: "decimals" }),
    ])

    const fees = [3000, 500, 100, 10000]
    for (const fee of fees) {
      const poolAddr = await client.readContract({
        address: UNISWAP_V3_FACTORY,
        abi: FACTORY_ABI,
        functionName: "getPool",
        args: [token0, token1, fee],
      }) as Address

      if (poolAddr && poolAddr !== "0x0000000000000000000000000000000000000000") {
        const result = await readPoolPrice(poolAddr, decimals0 as number, decimals1 as number, false)
        if (result) return result
      }
    }

    for (const fee of fees) {
      const poolAddr = await client.readContract({
        address: UNISWAP_V3_FACTORY,
        abi: FACTORY_ABI,
        functionName: "getPool",
        args: [token1, token0, fee],
      }) as Address

      if (poolAddr && poolAddr !== "0x0000000000000000000000000000000000000000") {
        const result = await readPoolPrice(poolAddr, decimals1 as number, decimals0 as number, false)
        if (result) return result
      }
    }

    return null
  } catch (error) {
    console.error(`Dynamic pool discovery failed for ${token0}/${token1}:`, error)
    return null
  }
}

async function readPoolPrice(
  poolAddress: Address,
  token0Decimals: number,
  token1Decimals: number,
  invert: boolean
): Promise<DEXPriceResult | null> {
  try {
    const [slot0, liquidity] = await Promise.all([
      client.readContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: "slot0",
      }),
      client.readContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: "liquidity",
      }),
    ])

    const sqrtPriceX96 = slot0[0] as bigint
    const liquidityValue = liquidity as bigint

    const rawPrice = sqrtPriceX96ToPrice(sqrtPriceX96, token0Decimals, token1Decimals)
    const price = invert ? 1 / rawPrice : rawPrice

    return {
      poolAddress,
      price,
      liquidity: liquidityValue,
    }
  } catch (error) {
    console.error(`Pool price read failed for ${poolAddress}:`, error)
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
