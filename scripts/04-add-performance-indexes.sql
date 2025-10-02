-- Add indexes to improve analytics query performance
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON link_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_name ON link_clicks(link_name);
CREATE INDEX IF NOT EXISTS idx_link_clicks_ip_address ON link_clicks(ip_address);

CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_ip_address ON page_visits(ip_address);
CREATE INDEX IF NOT EXISTS idx_page_visits_referrer_platform ON page_visits(referrer_platform);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_link_clicks_date_name ON link_clicks(clicked_at DESC, link_name);
CREATE INDEX IF NOT EXISTS idx_page_visits_date_platform ON page_visits(visited_at DESC, referrer_platform);
