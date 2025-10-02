import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { linkName, url, userAgent, referrer } = body

    const supabase = await createServerSupabaseClient()

    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")

    let ip = forwardedFor?.split(",")[0]?.trim() || realIp || null

    if (ip && !isValidIP(ip)) {
      ip = null
    }

    try {
      const { error } = await supabase.from("link_clicks").insert({
        link_name: linkName,
        link_url: url,
        user_agent: userAgent,
        ip_address: ip,
        referrer: referrer || null,
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
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".")
    return parts.every((part) => Number.parseInt(part) >= 0 && Number.parseInt(part) <= 255)
  }

  return ipv6Regex.test(ip)
}
