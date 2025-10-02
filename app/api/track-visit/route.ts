import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAgent, referrer } = body

    console.log("[v0] Track visit request received:", { userAgent, referrer })

    const supabase = await createServerSupabaseClient()

    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")

    // Extract the first IP if there are multiple (comma-separated)
    let ip = forwardedFor?.split(",")[0]?.trim() || realIp || null

    console.log("[v0] Extracted IP:", ip)

    // Validate IP format - if invalid, set to null
    if (ip && !isValidIP(ip)) {
      console.log("[v0] Invalid IP format, setting to null")
      ip = null
    }

    // Extract platform from referrer
    const referrerPlatform = extractPlatform(referrer)
    console.log("[v0] Extracted platform:", referrerPlatform)

    try {
      const { error } = await supabase.from("page_visits").insert({
        user_agent: userAgent,
        ip_address: ip,
        referrer: referrer || null,
        referrer_platform: referrerPlatform,
      })

      if (error) {
        return NextResponse.json({ success: true })
      }

      return NextResponse.json({ success: true })
    } catch (dbError) {
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    return NextResponse.json({ success: true })
  }
}

function isValidIP(ip: string): boolean {
  // Basic IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  // Basic IPv6 validation (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".")
    return parts.every((part) => Number.parseInt(part) >= 0 && Number.parseInt(part) <= 255)
  }

  return ipv6Regex.test(ip)
}

function extractPlatform(referrer: string | null): string | null {
  if (!referrer) return null

  const url = referrer.toLowerCase()

  if (url.includes("twitter.com") || url.includes("t.co") || url.includes("x.com")) return "Twitter/X"
  if (url.includes("linkedin.com")) return "LinkedIn"
  if (url.includes("instagram.com")) return "Instagram"
  if (url.includes("facebook.com") || url.includes("fb.com")) return "Facebook"
  if (url.includes("medium.com")) return "Medium"
  if (url.includes("github.com")) return "GitHub"
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube"
  if (url.includes("tiktok.com")) return "TikTok"
  if (url.includes("reddit.com")) return "Reddit"
  if (url.includes("discord.com") || url.includes("discord.gg")) return "Discord"
  if (url.includes("telegram.org") || url.includes("t.me")) return "Telegram"
  if (url.includes("whatsapp.com")) return "WhatsApp"
  if (url.includes("google.com")) return "Google Search"
  if (url.includes("bing.com")) return "Bing Search"
  if (url.includes("duckduckgo.com")) return "DuckDuckGo"

  // Extract domain for other referrers
  try {
    const domain = new URL(referrer).hostname.replace("www.", "")
    return domain
  } catch {
    return "Unknown"
  }
}
