import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard - Bio Links Analytics",
  description: "Analytics dashboard for bio link performance tracking",
  robots: "noindex, nofollow", // Prevent search engines from indexing admin pages
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
