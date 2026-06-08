-- Migration: Create school_settings table and add lesson_types
-- Description: Creates a singleton settings table and adds a JSONB column to store configurable lesson types.
-- Date: 2025-12-11

-- Create table if not exists
CREATE TABLE IF NOT EXISTS "school_settings" (
    id SERIAL PRIMARY KEY,
    lesson_types JSONB DEFAULT '["Kite", "Wing", "Surf"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check if lesson_types column exists (in case table existed but column didn't - defensive coding)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'school_settings'
        AND column_name = 'lesson_types'
    ) THEN
        ALTER TABLE "school_settings" ADD COLUMN "lesson_types" JSONB DEFAULT '["Kite", "Wing", "Surf"]'::jsonb;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE "school_settings" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe (idempotency)
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON "school_settings";
DROP POLICY IF EXISTS "Allow update access for managers" ON "school_settings";

-- Allow read for authenticated users (instructors need to see lesson types too)
CREATE POLICY "Allow read access for authenticated users" ON "school_settings"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Allow update for managers only
CREATE POLICY "Allow update access for managers" ON "school_settings"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'manager'
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'manager'
);

-- Insert default row if empty (assuming one school setting row for now)
INSERT INTO "school_settings" (id, lesson_types)
SELECT 1, '["Kite", "Wing", "Surf"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "school_settings");