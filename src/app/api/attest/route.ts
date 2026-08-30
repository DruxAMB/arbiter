import { NextResponse } from "next/server"
import { createWalletClient, createPublicClient, http } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import type { PriceGapResult } from "@/lib/arbiter"

const ARBITER_CONTRACT = "0x0000000000000000000000000000000000000000" as const

const CONTRACT_ABI = [
  {
    inputs: [
      { name: "pair", type: "string" },
      { name: "bingxPrice", type: "uint256" },
      { name: "dexPrice", type: "uint256" },
      { name: "gapBps", type: "uint256" },
    ],
    name: "attestOpportunity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

function priceToUint(price: number): bigint {
  return BigInt(Math.round(price * 1e6))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result: PriceGapResult = body.result

    if (!result || !result.symbol) {
      return NextResponse.json({ error: "Missing scan result" }, { status: 400 })
    }

    const privateKey = process.env.ATTESTER_PRIVATE_KEY
    if (!privateKey || ARBITER_CONTRACT === "0x0000000000000000000000000000000000000000") {
      const mockHash = "0x" + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")
      return NextResponse.json({
        txHash: mockHash,
        explorerUrl: `https://basescan.org/tx/${mockHash}`,
        simulated: true,
        message: "Attestation recorded (simulated — contract not yet deployed)",
      })
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"),
    })

    const txHash = await walletClient.writeContract({
      address: ARBITER_CONTRACT,
      abi: CONTRACT_ABI,
      functionName: "attestOpportunity",
      args: [
        result.symbol,
        priceToUint(result.bingxPrice),
        priceToUint(result.dexPrice),
        BigInt(Math.round(result.gapPercent * 100)),
      ],
    })

    return NextResponse.json({
      txHash,
      explorerUrl: `https://basescan.org/tx/${txHash}`,
      simulated: false,
    })
  } catch (error) {
    console.error("Attestation error:", error)
    return NextResponse.json(
      { error: "On-chain attestation failed — please retry" },
      { status: 500 }
    )
  }
}
