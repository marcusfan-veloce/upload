-- Create the user_folders table to store Google Drive folder selections
CREATE TABLE IF NOT EXISTS user_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create the permanent_upload_links table (one per user)
CREATE TABLE IF NOT EXISTS permanent_upload_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_token TEXT UNIQUE NOT NULL,
  folder_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  google_access_token TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create the uploads table to track uploads
CREATE TABLE IF NOT EXISTS uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_link_id UUID REFERENCES permanent_upload_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  google_drive_file_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE permanent_upload_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for user_folders
CREATE POLICY "Users can view own folder selection" ON user_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folder selection" ON user_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folder selection" ON user_folders
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for permanent_upload_links
CREATE POLICY "Users can view own upload link" ON permanent_upload_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upload link" ON permanent_upload_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upload link" ON permanent_upload_links
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow public access to validate upload tokens
CREATE POLICY "Public can validate active upload tokens" ON permanent_upload_links
  FOR SELECT USING (is_active = true);

-- Create policies for uploads
CREATE POLICY "Users can view own uploads" ON uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" ON uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" ON uploads
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow public access to create uploads (for client uploads)
CREATE POLICY "Public can create uploads" ON uploads
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_folders_user_id ON user_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_permanent_upload_links_user_id ON permanent_upload_links(user_id);
CREATE INDEX IF NOT EXISTS idx_permanent_upload_links_token ON permanent_upload_links(upload_token);
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
