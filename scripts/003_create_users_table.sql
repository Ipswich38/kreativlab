-- Create users table for username/passcode authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  passcode TEXT NOT NULL,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (true);

-- Insert the first client
INSERT INTO users (username, passcode, company_name)
VALUES ('htsscrm', '272829', 'Happy Teeth Support Services')
ON CONFLICT (username) DO NOTHING;
