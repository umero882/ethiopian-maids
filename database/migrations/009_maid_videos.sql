-- Migration: Add maid_videos table for video content management
-- This migration creates the maid_videos table to store video metadata
-- and sets up appropriate RLS policies for secure access control.

-- Create maid_videos table
CREATE TABLE IF NOT EXISTS maid_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    maid_id UUID NOT NULL REFERENCES maid_profiles(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    video_type TEXT NOT NULL DEFAULT 'introduction', -- 'introduction', 'skill_demo', etc.
    duration INTEGER, -- Duration in seconds (optional)
    thumbnail_url TEXT, -- Optional thumbnail image URL
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maid_videos_maid_id ON maid_videos(maid_id);
CREATE INDEX IF NOT EXISTS idx_maid_videos_video_type ON maid_videos(video_type);
CREATE INDEX IF NOT EXISTS idx_maid_videos_is_active ON maid_videos(is_active);
CREATE INDEX IF NOT EXISTS idx_maid_videos_created_at ON maid_videos(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_maid_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maid_videos_updated_at
    BEFORE UPDATE ON maid_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_maid_videos_updated_at();

-- Enable Row Level Security
ALTER TABLE maid_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view videos for maids they have access to
CREATE POLICY "Users can view maid videos" ON maid_videos
    FOR SELECT
    USING (
        -- Agencies can see videos for their maids
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_videos.maid_id
            AND mp.agency_id = auth.uid()
        )
        OR
        -- Sponsors can see videos for active maids (public access)
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_videos.maid_id
            AND mp.status = 'available'
            AND maid_videos.is_active = true
        )
    );

-- Policy: Only agencies can insert videos for their maids
CREATE POLICY "Agencies can insert maid videos" ON maid_videos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_videos.maid_id
            AND mp.agency_id = auth.uid()
        )
    );

-- Policy: Only agencies can update videos for their maids
CREATE POLICY "Agencies can update maid videos" ON maid_videos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_videos.maid_id
            AND mp.agency_id = auth.uid()
        )
    );

-- Policy: Only agencies can delete videos for their maids
CREATE POLICY "Agencies can delete maid videos" ON maid_videos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_videos.maid_id
            AND mp.agency_id = auth.uid()
        )
    );

-- Update storage policies to allow video uploads
-- Note: This assumes the user-uploads bucket already exists from previous migrations

-- Storage policy for video uploads
CREATE POLICY "Users can upload videos" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'user-uploads'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maids'
        AND (storage.foldername(name))[3] = 'videos'
    );

-- Storage policy for video access
CREATE POLICY "Users can view videos" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'user-uploads'
        AND (storage.foldername(name))[1] = 'maids'
        AND (storage.foldername(name))[3] = 'videos'
    );

-- Storage policy for video updates (for agencies only)
CREATE POLICY "Agencies can update videos" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'user-uploads'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maids'
        AND (storage.foldername(name))[3] = 'videos'
    );

-- Storage policy for video deletion (for agencies only)
CREATE POLICY "Agencies can delete videos" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'user-uploads'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maids'
        AND (storage.foldername(name))[3] = 'videos'
    );

-- Add helpful comments
COMMENT ON TABLE maid_videos IS 'Stores metadata for maid video content including introduction videos and skill demonstrations';
COMMENT ON COLUMN maid_videos.video_type IS 'Type of video: introduction, skill_demo, testimonial, etc.';
COMMENT ON COLUMN maid_videos.duration IS 'Video duration in seconds (optional)';
COMMENT ON COLUMN maid_videos.thumbnail_url IS 'Optional thumbnail image URL for video preview';
COMMENT ON COLUMN maid_videos.is_active IS 'Whether the video is active and should be displayed';
