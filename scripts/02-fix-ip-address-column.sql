-- Update the ip_address column to allow NULL values for invalid IPs
ALTER TABLE link_clicks ALTER COLUMN ip_address DROP NOT NULL;
