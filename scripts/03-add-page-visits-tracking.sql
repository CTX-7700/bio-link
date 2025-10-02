-- Create page visits table to track where visitors come from
CREATE TABLE IF NOT EXISTS page_visits (
  id SERIAL PRIMARY KEY,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  referrer_platform VARCHAR(100), -- extracted platform name (twitter, linkedin, etc.)
  country VARCHAR(100),
  city VARCHAR(100)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_referrer_platform ON page_visits(referrer_platform);

-- Disable RLS to allow public inserts for tracking
ALTER TABLE page_visits DISABLE ROW LEVEL SECURITY;
