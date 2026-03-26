-- Add storage_limit to organizations (default 10GB)
ALTER TABLE public.organizations 
ADD COLUMN storage_limit BIGINT DEFAULT 10737418240 NOT NULL;

-- Create file_uploads table to track individual uploads
CREATE TABLE public.file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT,
  google_file_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on file_uploads
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Owners of the organization can view its uploads
CREATE POLICY "Users can view uploads from their own organizations."
  ON public.file_uploads FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = file_uploads.org_id AND o.user_id = auth.uid()
    )
  );
