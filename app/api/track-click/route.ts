import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { linkName, url, userAgent, referrer } = body

    const supabase = await createServerSupabaseClient()

    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")

    // Extract the first IP if there are multiple (comma-separated)
    let ip = forwardedFor?.split(",")[0]?.trim() || realIp || null

    // Validate IP format - if invalid, set to null instead of "unknown"
    if (ip && !isValidIP(ip)) {
      ip = null
    }

    // Insert click data
    const { error } = await supabase.from("link_clicks").insert({
      link_name: linkName,
      link_url: url,
      user_agent: userAgent,
      ip_address: ip, // This can be null now
      referrer: referrer || null,
    })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to track click" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
