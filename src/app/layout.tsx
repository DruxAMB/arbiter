import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arbiter — CEX-DEX Arbitrage Intelligence on Base",
  description: "AI agent detecting real-time price gaps between BingX and Base DEXes, with AI analysis and on-chain attestations.",
  openGraph: {
    title: "Arbiter — CEX-DEX Arbitrage Intelligence on Base",
    description: "Detect price gaps between BingX and Uniswap V3, analyze with AI, and attest opportunities on-chain.",
    type: "website",
    url: "https://arbiter-sooty-six.vercel.app",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
