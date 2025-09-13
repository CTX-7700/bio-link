import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Arjan Chaudhary - Bio Links",
  description:
    "14 yo | offsec researcher @cyberalertnepal | co-founder @GlowTech | into startups | backed by HCB | 1x CVE | ACP | CASA",
  generator: "v0.app",
  keywords: ["cybersecurity", "researcher", "startup", "portfolio", "bio links"],
  authors: [{ name: "Arjan Chaudhary" }],
  openGraph: {
    title: "Arjan Chaudhary - Bio Links",
    description: "14 yo | offsec researcher @cyberalertnepal | co-founder @GlowTech",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
