-- Migration: Add RLS Policies to school_settings
-- Description: Secures the school_settings table by adding row-level security policies.
-- Date: 2025-12-13

-- 1. Enable RLS on the table
ALTER TABLE "school_settings" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist to prevent errors on re-run
DROP POLICY IF EXISTS "Allow authenticated read access" ON "school_settings";
DROP POLICY IF EXISTS "Allow managers to update" ON "school_settings";

-- 3. Create RLS Policies
-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated read access"
ON "school_settings" FOR SELECT
TO authenticated
USING (true);

-- Allow users with the 'manager' role to update settings
CREATE POLICY "Allow managers to update"
ON "school_settings" FOR UPDATE
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'manager'
);
