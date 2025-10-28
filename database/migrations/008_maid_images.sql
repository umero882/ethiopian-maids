-- Migration: Add maid_images table for multi-image support
-- Description: Creates table to store multiple images per maid profile with metadata

-- Create maid_images table
CREATE TABLE IF NOT EXISTS maid_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maid_id UUID NOT NULL REFERENCES maid_profiles(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    alt_text TEXT,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maid_images_maid_id ON maid_images(maid_id);
CREATE INDEX IF NOT EXISTS idx_maid_images_is_primary ON maid_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_maid_images_display_order ON maid_images(maid_id, display_order);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maid_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maid_images_updated_at
    BEFORE UPDATE ON maid_images
    FOR EACH ROW
    EXECUTE FUNCTION update_maid_images_updated_at();

-- Ensure only one primary image per maid
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this image as primary, remove primary status from other images of the same maid
    IF NEW.is_primary = TRUE THEN
        UPDATE maid_images 
        SET is_primary = FALSE 
        WHERE maid_id = NEW.maid_id 
        AND id != NEW.id 
        AND is_primary = TRUE;
    END IF;
    
    -- If this is the first image for a maid, make it primary
    IF NOT EXISTS (
        SELECT 1 FROM maid_images 
        WHERE maid_id = NEW.maid_id 
        AND id != NEW.id
    ) THEN
        NEW.is_primary = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_image
    BEFORE INSERT OR UPDATE ON maid_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_image();

-- Row Level Security (RLS) policies
ALTER TABLE maid_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view images of maids they have access to
CREATE POLICY "Users can view maid images" ON maid_images
    FOR SELECT
    USING (
        -- Allow if user is the agency that owns the maid
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_images.maid_id
            AND mp.agency_id = auth.uid()
        )
        OR
        -- Allow if user is a sponsor viewing published profiles
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_images.maid_id
            AND mp.status = 'available'
        )
    );

-- Policy: Only agencies can insert images for their maids
CREATE POLICY "Agencies can insert maid images" ON maid_images
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_images.maid_id
            AND mp.agency_id = auth.uid()
        )
    );

-- Policy: Only agencies can update images for their maids
CREATE POLICY "Agencies can update maid images" ON maid_images
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_images.maid_id
            AND mp.agency_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_images.maid_id
            AND mp.agency_id = auth.uid()
        )
    );

-- Policy: Only agencies can delete images for their maids
CREATE POLICY "Agencies can delete maid images" ON maid_images
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_images.maid_id
            AND mp.agency_id = auth.uid()
        )
    );

-- Create storage bucket for user uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-uploads bucket
CREATE POLICY "Users can upload images" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'user-uploads'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maids'
    );

CREATE POLICY "Users can view uploaded images" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'user-uploads'
        AND (storage.foldername(name))[1] = 'maids'
    );

CREATE POLICY "Users can update their uploaded images" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'user-uploads'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maids'
    );

CREATE POLICY "Users can delete their uploaded images" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'user-uploads'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maids'
    );

-- Add comments for documentation
COMMENT ON TABLE maid_images IS 'Stores multiple images for each maid profile with metadata and ordering';
COMMENT ON COLUMN maid_images.maid_id IS 'Foreign key reference to maid_profiles table';
COMMENT ON COLUMN maid_images.file_path IS 'Storage path of the image file';
COMMENT ON COLUMN maid_images.file_url IS 'Public URL to access the image';
COMMENT ON COLUMN maid_images.is_primary IS 'Indicates if this is the primary/profile image';
COMMENT ON COLUMN maid_images.display_order IS 'Order in which images should be displayed';
COMMENT ON COLUMN maid_images.alt_text IS 'Alternative text for accessibility';
COMMENT ON COLUMN maid_images.caption IS 'Optional caption for the image';
