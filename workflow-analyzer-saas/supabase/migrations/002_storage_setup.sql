-- Create storage buckets for video uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('videos', 'videos', false, 524288000, ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage buckets for analysis reports
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('reports', 'reports', true)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public;

-- RLS policies for videos bucket
CREATE POLICY "Users can upload their own videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for reports bucket
CREATE POLICY "Users can view their own reports" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can upload reports" ON storage.objects
  FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'reports');

-- Update the uploads table to include storage references
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS video_storage_path TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS report_storage_path TEXT;

-- Add analysis tracking columns
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending';
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS analysis_started_at TIMESTAMPTZ;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMPTZ;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS analysis_error TEXT;

-- Create analyses table for detailed tracking
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result_data JSONB,
  frames_analyzed INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for analyses lookup
CREATE INDEX idx_analyses_upload_id ON analyses(upload_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_status ON analyses(status);

-- RLS for analyses table
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses" ON analyses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage analyses" ON analyses
  FOR ALL TO service_role
  USING (true);

-- Function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for analyses table
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();