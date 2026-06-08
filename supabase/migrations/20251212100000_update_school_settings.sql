-- Migration: Update school_settings for Epic 3
-- Description: Adds weather parameters, logo URL, and ensures lesson_types structure. Creates storage bucket.
-- Date: 2025-12-12

-- 1. Update school_settings table
ALTER TABLE "school_settings"
ADD COLUMN IF NOT EXISTS "weather_api_thresholds" JSONB DEFAULT '{"min_wind_speed": 10, "max_wind_speed": 30, "allow_precipitation": false, "preferred_wind_directions": ["N", "NE"]}'::jsonb,
ADD COLUMN IF NOT EXISTS "school_logo_url" TEXT;

-- 2. Create storage bucket 'school-assets' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS Policies
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'school-assets' );

-- Allow Manager upload/update/delete
CREATE POLICY "Manager Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'school-assets' AND
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'manager'
);

CREATE POLICY "Manager Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'school-assets' AND
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'manager'
);

CREATE POLICY "Manager Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'school-assets' AND
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'manager'
);
