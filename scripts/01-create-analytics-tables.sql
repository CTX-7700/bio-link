-- Create analytics tables for bio link tracking
CREATE TABLE IF NOT EXISTS link_clicks (
  id SERIAL PRIMARY KEY,
  link_name VARCHAR(255) NOT NULL,
  link_url TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  country VARCHAR(100),
  city VARCHAR(100)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_name ON link_clicks(link_name);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON link_clicks(clicked_at);

-- Create admin users table for dashboard access
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ')
ON CONFLICT (username) DO NOTHING;

-- Disable RLS for analytics tables to allow public inserts
ALTER TABLE link_clicks DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for admin users (only they can read their own data)
CREATE POLICY IF NOT EXISTS "Admin users can read own data" ON admin_users
  FOR SELECT USING (true);
