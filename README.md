# Arbiter — CEX-DEX Arbitrage Intelligence Agent

> An AI-powered agent that detects real-time price gaps between BingX (CEX) and Uniswap V3 on Base (DEX), analyzes them with Gemini AI, and attests opportunities on-chain.

**Live demo:** [arbiter-sooty-six.vercel.app](https://arbiter-sooty-six.vercel.app)

## What It Does

Arbiter scans ETH-USDC and ETH-USDT pairs across BingX and Base DEX in real time, computes the price gap after gas + slippage costs, uses Gemini AI to generate a narrative analysis of why the gap exists and whether it's tradeable, and records notable opportunities as on-chain attestations on Base.

## Architecture

```
BingX API ──┐
            ├─→ Scan Engine ──→ Gemini AI ──→ On-Chain Attestation
Base RPC ───┘    (gap calc)     (narrative)     (Base L2)
```

- **CEX layer:** BingX public tickers (`/openApi/spot/v1/ticker/24hr`)
- **DEX layer:** Uniswap V3 `slot0` + `liquidity` reads via `viem` on Base mainnet
- **AI layer:** Gemini 2.0 Flash for narrative analysis and risk scoring
- **On-chain layer:** `ArbiterAttestation` contract on Base at `0x52335A48448F90Dc7656F3378CBEad20CB6070C2`
- **Frontend:** Next.js 16 + shadcn/ui + Tailwind CSS v4

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- viem (Base RPC + Uniswap V3 contract reads)
- Google Generative AI (Gemini 2.0 Flash)
- shadcn/ui + Radix UI + Tailwind CSS v4
- TypeScript (ES2020 target for BigInt support)

## Quick Start

```bash
git clone https://github.com/DruxAMB/arbiter.git
cd arbiter
npm install
```

Create `.env.local`:

```
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
```

Run dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan` | GET | Scan all supported pairs for price gaps |
| `/api/scan?symbol=ETH-USDC` | GET | Scan a specific pair |
| `/api/analyze` | POST | Gemini AI analysis of a scan result |
| `/api/attest` | POST | Record opportunity on-chain (Base L2) |

## Supported Pairs

| Pair | BingX Symbol | DEX Pool | Pool Address |
|------|-------------|----------|-------------|
| ETH-USDC | ETH-USDC | Uniswap V3 0.05% | `0xd0b53d9277642d899df5c87a3966a349a798f224` |
| ETH-USDT | ETH-USDT | Uniswap V3 | `0xce1d8c90a5f0ef28fe0f457e5ad615215899319a` |

## How Price Gaps Are Computed

1. Fetch BingX last price via public ticker API
2. Read Uniswap V3 `slot0.sqrtPriceX96` and `liquidity` from Base RPC
3. Convert `sqrtPriceX96` to human-readable price: `(sqrtPriceX96 / 2^96)^2 * 10^(decimals0 - decimals1)`
4. Compute gap percentage, direction, and net profit after Base gas (~$0.01) + 30bps slippage on $1000 trade

## Real vs Simulated

- **Real:** BingX price fetching, Uniswap V3 on-chain price reads, Gemini AI analysis, price gap computation, on-chain attestation on Base
- **Simulated:** Sample attestations shown in history are illustrative. Live attestation writes to `ArbiterAttestation` contract.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── scan/route.ts      # Price gap scanner
│   │   ├── analyze/route.ts   # Gemini AI analysis
│   │   └── attest/route.ts    # On-chain attestation
│   ├── globals.css            # Dark theme token layer
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard.tsx          # Main UI with scan/analyze/attest flow
│   └── ui/                    # shadcn/ui components
└── lib/
    ├── bingx.ts               # BingX API client
    ├── basedex.ts             # Uniswap V3 pool reader on Base
    ├── arbiter.ts             # Price gap scanner
    └── gemini.ts              # Gemini AI client
```

## License

MIT

## Links

- **GitHub:** [github.com/DruxAMB/arbiter](https://github.com/DruxAMB/arbiter)
- **Live:** [arbiter-sooty-six.vercel.app](https://arbiter-sooty-six.vercel.app)
- **X:** [@DruxAMB](https://x.com/DruxAMB)
- **Telegram:** [t.me/+nKaI7SaZqyM1YTBk](https://t.me/+nKaI7SaZqyM1YTBk)
