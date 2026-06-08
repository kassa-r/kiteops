-- Migration: Enable RLS for lessons table
-- Description: Allow authenticated read access and manager full access to lessons table.
-- Date: 2025-12-13

-- Drop existing policies if any (to be safe)
DROP POLICY IF EXISTS "Deny Public Access lessons" ON public.lessons;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.lessons;
DROP POLICY IF EXISTS "Allow manager full access" ON public.lessons;

-- Create policies
CREATE POLICY "Allow authenticated read access"
ON public.lessons FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow manager full access"
ON public.lessons FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'manager'
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'manager'
);
