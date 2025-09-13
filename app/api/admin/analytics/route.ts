import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeFilter = searchParams.get("timeFilter") || "7d"

    const supabase = await createServerSupabaseClient()

    // Calculate date filter
    let dateFilter = ""
    const now = new Date()

    switch (timeFilter) {
      case "1d":
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        break
      case "7d":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case "30d":
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      default:
        dateFilter = "1970-01-01T00:00:00.000Z" // All time
    }

    // Get total clicks
    const { data: totalClicksData, error: totalError } = await supabase
      .from("link_clicks")
      .select("id")
      .gte("clicked_at", dateFilter)

    if (totalError) throw totalError

    const { data: totalVisitsData, error: visitsError } = await supabase
      .from("page_visits")
      .select("id")
      .gte("visited_at", dateFilter)

    if (visitsError) throw visitsError

    // Get unique visitors (by IP from both tables)
    const { data: uniqueClickVisitorsData, error: uniqueClickError } = await supabase
      .from("link_clicks")
      .select("ip_address")
      .gte("clicked_at", dateFilter)

    const { data: uniquePageVisitorsData, error: uniquePageError } = await supabase
      .from("page_visits")
      .select("ip_address")
      .gte("visited_at", dateFilter)

    if (uniqueClickError || uniquePageError) throw uniqueClickError || uniquePageError

    const allIPs = new Set([
      ...(uniqueClickVisitorsData?.map((row) => row.ip_address) || []),
      ...(uniquePageVisitorsData?.map((row) => row.ip_address) || []),
    ])
    const uniqueVisitors = allIPs.size

    // Get top links
    const { data: topLinksData, error: topLinksError } = await supabase
      .from("link_clicks")
      .select("link_name")
      .gte("clicked_at", dateFilter)

    if (topLinksError) throw topLinksError

    const linkCounts =
      topLinksData?.reduce((acc: Record<string, number>, row) => {
        acc[row.link_name] = (acc[row.link_name] || 0) + 1
        return acc
      }, {}) || {}

    const topLinks = Object.entries(linkCounts)
      .map(([name, clicks]) => ({ name, clicks: clicks as number }))
      .sort((a, b) => b.clicks - a.clicks)

    const { data: referrerData, error: referrerError } = await supabase
      .from("page_visits")
      .select("referrer_platform")
      .gte("visited_at", dateFilter)
      .not("referrer_platform", "is", null)

    if (referrerError) throw referrerError

    const platformCounts =
      referrerData?.reduce((acc: Record<string, number>, row) => {
        if (row.referrer_platform) {
          acc[row.referrer_platform] = (acc[row.referrer_platform] || 0) + 1
        }
        return acc
      }, {}) || {}

    const topPlatforms = Object.entries(platformCounts)
      .map(([platform, visits]) => ({ platform, visits: visits as number }))
      .sort((a, b) => b.visits - a.visits)

    // Get recent clicks
    const { data: recentClicksData, error: recentError } = await supabase
      .from("link_clicks")
      .select("*")
      .gte("clicked_at", dateFilter)
      .order("clicked_at", { ascending: false })
      .limit(50)

    if (recentError) throw recentError

    const { data: recentVisitsData, error: recentVisitsError } = await supabase
      .from("page_visits")
      .select("*")
      .gte("visited_at", dateFilter)
      .order("visited_at", { ascending: false })
      .limit(50)

    if (recentVisitsError) throw recentVisitsError

    // Get clicks by day
    const { data: clicksByDayData, error: dayError } = await supabase
      .from("link_clicks")
      .select("clicked_at")
      .gte("clicked_at", dateFilter)
      .order("clicked_at", { ascending: true })

    if (dayError) throw dayError

    const clicksByDay =
      clicksByDayData?.reduce((acc: Record<string, number>, row) => {
        const date = new Date(row.clicked_at).toISOString().split("T")[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {}) || {}

    const clicksByDayArray = Object.entries(clicksByDay)
      .map(([date, clicks]) => ({ date, clicks: clicks as number }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const analytics = {
      totalClicks: totalClicksData?.length || 0,
      totalVisits: totalVisitsData?.length || 0,
      uniqueVisitors,
      topLinks,
      topPlatforms,
      recentClicks: recentClicksData || [],
      recentVisits: recentVisitsData || [],
      clicksByDay: clicksByDayArray,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
