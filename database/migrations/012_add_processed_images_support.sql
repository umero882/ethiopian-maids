-- Migration: Add support for processed images
-- This migration adds columns and functions to support advanced image processing

-- Add processed image columns to maid_profiles table
ALTER TABLE maid_profiles 
ADD COLUMN IF NOT EXISTS primary_image_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS primary_image_original_url TEXT,
ADD COLUMN IF NOT EXISTS primary_image_processed_url TEXT,
ADD COLUMN IF NOT EXISTS image_processing_metadata JSONB DEFAULT '{}';

-- Create processed_images table to track all processed images
CREATE TABLE IF NOT EXISTS processed_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maid_profile_id UUID NOT NULL REFERENCES maid_profiles(id) ON DELETE CASCADE,
    original_image_url TEXT NOT NULL,
    processed_image_url TEXT NOT NULL,
    processing_type VARCHAR(50) NOT NULL, -- 'cropped', 'enhanced', 'background_removed', 'combined'
    processing_settings JSONB DEFAULT '{}',
    file_size_original INTEGER,
    file_size_processed INTEGER,
    dimensions_original JSONB, -- {width: number, height: number}
    dimensions_processed JSONB, -- {width: number, height: number}
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_processed_images_maid_profile_id ON processed_images(maid_profile_id);
CREATE INDEX IF NOT EXISTS idx_processed_images_is_primary ON processed_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_processed_images_processing_type ON processed_images(processing_type);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_primary_image_processed ON maid_profiles(primary_image_processed);

-- Create function to update processed image metadata
CREATE OR REPLACE FUNCTION update_processed_image_metadata()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for processed_images table
DROP TRIGGER IF EXISTS trigger_update_processed_images_updated_at ON processed_images;
CREATE TRIGGER trigger_update_processed_images_updated_at
    BEFORE UPDATE ON processed_images
    FOR EACH ROW
    EXECUTE FUNCTION update_processed_image_metadata();

-- Create function to get primary processed image for a maid
CREATE OR REPLACE FUNCTION get_primary_processed_image(maid_id UUID)
RETURNS TABLE (
    processed_image_url TEXT,
    original_image_url TEXT,
    processing_type VARCHAR(50),
    processing_settings JSONB,
    dimensions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.processed_image_url,
        pi.original_image_url,
        pi.processing_type,
        pi.processing_settings,
        pi.dimensions_processed as dimensions
    FROM processed_images pi
    WHERE pi.maid_profile_id = maid_id 
    AND pi.is_primary = TRUE
    ORDER BY pi.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to set primary processed image
CREATE OR REPLACE FUNCTION set_primary_processed_image(maid_id UUID, processed_image_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    image_exists BOOLEAN;
BEGIN
    -- Check if the processed image exists and belongs to the maid
    SELECT EXISTS(
        SELECT 1 FROM processed_images 
        WHERE id = processed_image_id 
        AND maid_profile_id = maid_id
    ) INTO image_exists;
    
    IF NOT image_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Unset all primary flags for this maid
    UPDATE processed_images 
    SET is_primary = FALSE 
    WHERE maid_profile_id = maid_id;
    
    -- Set the new primary image
    UPDATE processed_images 
    SET is_primary = TRUE 
    WHERE id = processed_image_id;
    
    -- Update maid profile
    UPDATE maid_profiles 
    SET 
        primary_image_processed = TRUE,
        primary_image_processed_url = (
            SELECT processed_image_url 
            FROM processed_images 
            WHERE id = processed_image_id
        ),
        primary_image_original_url = (
            SELECT original_image_url 
            FROM processed_images 
            WHERE id = processed_image_id
        )
    WHERE id = maid_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up processed images when maid is deleted
CREATE OR REPLACE FUNCTION cleanup_processed_images()
RETURNS TRIGGER AS $$
BEGIN
    -- This function is called when a maid profile is deleted
    -- The processed_images records will be automatically deleted due to CASCADE
    -- But we can add additional cleanup logic here if needed
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for maid profile deletion cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_processed_images ON maid_profiles;
CREATE TRIGGER trigger_cleanup_processed_images
    AFTER DELETE ON maid_profiles
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_processed_images();

-- Update the profile completion calculation to include processed images
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    total_fields INTEGER := 18; -- Updated to include processed image
    completed_fields INTEGER := 0;
BEGIN
    -- Personal Information (6 fields)
    IF profile_data->>'full_name' IS NOT NULL AND profile_data->>'full_name' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'date_of_birth' IS NOT NULL THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'nationality' IS NOT NULL AND profile_data->>'nationality' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'passport_number' IS NOT NULL AND profile_data->>'passport_number' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'marital_status' IS NOT NULL AND profile_data->>'marital_status' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'religion' IS NOT NULL AND profile_data->>'religion' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    -- Professional Information (4 fields)
    IF profile_data->>'primary_profession' IS NOT NULL AND profile_data->>'primary_profession' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'visa_status' IS NOT NULL AND profile_data->>'visa_status' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'preferred_country' IS NOT NULL AND profile_data->>'preferred_country' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'languages' IS NOT NULL AND jsonb_array_length(profile_data->'languages') > 0 THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    -- Work Experience (2 fields)
    IF profile_data->>'work_experience' IS NOT NULL AND jsonb_array_length(profile_data->'work_experience') > 0 THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'skills' IS NOT NULL AND jsonb_array_length(profile_data->'skills') > 0 THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    -- Additional Information (5 fields)
    IF profile_data->>'about_me' IS NOT NULL AND profile_data->>'about_me' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'introduction_video_url' IS NOT NULL AND profile_data->>'introduction_video_url' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'images' IS NOT NULL AND jsonb_array_length(profile_data->'images') > 0 THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    -- New: Processed primary image (1 field)
    IF profile_data->>'primary_image_processed' = 'true' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'medical_certificate' IS NOT NULL AND profile_data->>'medical_certificate' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    RETURN ROUND((completed_fields::DECIMAL / total_fields::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for processed_images table
ALTER TABLE processed_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view processed images for maids they have access to
CREATE POLICY "Users can view processed images for accessible maids" ON processed_images
    FOR SELECT USING (
        maid_profile_id IN (
            SELECT id FROM maid_profiles 
            WHERE agency_id = auth.uid()
            OR id IN (
                SELECT maid_profile_id FROM maid_applications 
                WHERE sponsor_id = auth.uid()
            )
        )
    );

-- Policy: Agencies can manage processed images for their maids
CREATE POLICY "Agencies can manage processed images for their maids" ON processed_images
    FOR ALL USING (
        maid_profile_id IN (
            SELECT id FROM maid_profiles 
            WHERE agency_id = auth.uid()
        )
    );

-- Add comment to document the migration
COMMENT ON TABLE processed_images IS 'Stores processed versions of maid profile images with metadata about the processing applied';
COMMENT ON COLUMN processed_images.processing_type IS 'Type of processing: cropped, enhanced, background_removed, or combined';
COMMENT ON COLUMN processed_images.processing_settings IS 'JSON object containing the specific settings used for processing';
COMMENT ON COLUMN processed_images.dimensions_original IS 'Original image dimensions as JSON: {width: number, height: number}';
COMMENT ON COLUMN processed_images.dimensions_processed IS 'Processed image dimensions as JSON: {width: number, height: number}';
