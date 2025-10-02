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

    let totalClicksResult, totalVisitsResult, uniqueClickVisitorsResult, uniquePageVisitorsResult
    let topLinksResult, referrerResult, recentClicksResult, recentVisitsResult, clicksByDayResult

    try {
      ;[
        totalClicksResult,
        totalVisitsResult,
        uniqueClickVisitorsResult,
        uniquePageVisitorsResult,
        topLinksResult,
        referrerResult,
        recentClicksResult,
        recentVisitsResult,
        clicksByDayResult,
      ] = await Promise.all([
        supabase.from("link_clicks").select("id", { count: "exact", head: true }).gte("clicked_at", dateFilter),
        supabase.from("page_visits").select("id", { count: "exact", head: true }).gte("visited_at", dateFilter),
        supabase.from("link_clicks").select("ip_address").gte("clicked_at", dateFilter),
        supabase.from("page_visits").select("ip_address").gte("visited_at", dateFilter),
        supabase.from("link_clicks").select("link_name").gte("clicked_at", dateFilter),
        supabase
          .from("page_visits")
          .select("referrer_platform")
          .gte("visited_at", dateFilter)
          .not("referrer_platform", "is", null),
        supabase
          .from("link_clicks")
          .select("*")
          .gte("clicked_at", dateFilter)
          .order("clicked_at", { ascending: false })
          .limit(50),
        supabase
          .from("page_visits")
          .select("*")
          .gte("visited_at", dateFilter)
          .order("visited_at", { ascending: false })
          .limit(50),
        supabase
          .from("link_clicks")
          .select("clicked_at")
          .gte("clicked_at", dateFilter)
          .order("clicked_at", { ascending: true }),
      ])
    } catch (dbError) {
      return NextResponse.json(
        {
          error: "DATABASE_NOT_SETUP",
          message:
            "Analytics tables not found. Please run the SQL scripts in order: 01-create-analytics-tables.sql, 03-add-page-visits-tracking.sql, and 04-add-performance-indexes.sql",
        },
        { status: 503 },
      )
    }

    // Calculate unique visitors
    const allIPs = new Set([
      ...(uniqueClickVisitorsResult.data?.map((row) => row.ip_address).filter(Boolean) || []),
      ...(uniquePageVisitorsResult.data?.map((row) => row.ip_address).filter(Boolean) || []),
    ])
    const uniqueVisitors = allIPs.size

    // Process top links
    const linkCounts =
      topLinksResult.data?.reduce((acc: Record<string, number>, row) => {
        acc[row.link_name] = (acc[row.link_name] || 0) + 1
        return acc
      }, {}) || {}

    const topLinks = Object.entries(linkCounts)
      .map(([name, clicks]) => ({ name, clicks: clicks as number }))
      .sort((a, b) => b.clicks - a.clicks)

    // Process top platforms
    const platformCounts =
      referrerResult.data?.reduce((acc: Record<string, number>, row) => {
        if (row.referrer_platform) {
          acc[row.referrer_platform] = (acc[row.referrer_platform] || 0) + 1
        }
        return acc
      }, {}) || {}

    const topPlatforms = Object.entries(platformCounts)
      .map(([platform, visits]) => ({ platform, visits: visits as number }))
      .sort((a, b) => b.visits - a.visits)

    // Process clicks by day
    const clicksByDay =
      clicksByDayResult.data?.reduce((acc: Record<string, number>, row) => {
        const date = new Date(row.clicked_at).toISOString().split("T")[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {}) || {}

    const clicksByDayArray = Object.entries(clicksByDay)
      .map(([date, clicks]) => ({ date, clicks: clicks as number }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const analytics = {
      totalClicks: totalClicksResult.count || 0,
      totalVisits: totalVisitsResult.count || 0,
      uniqueVisitors,
      topLinks,
      topPlatforms,
      recentClicks: recentClicksResult.data || [],
      recentVisits: recentVisitsResult.data || [],
      clicksByDay: clicksByDayArray,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
