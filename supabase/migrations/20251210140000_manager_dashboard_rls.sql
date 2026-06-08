-- Manager Dashboard RLS Policies

-- Helper function to avoid recursion
-- SECURITY DEFINER allows this function to bypass RLS when querying profiles
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 1. Grant Managers read access to all bookings
-- Note: 'availability' is already public readable. 'lessons' is authenticated readable.

DROP POLICY IF EXISTS "Managers can view all bookings" ON public.bookings;
CREATE POLICY "Managers can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'manager'
);

-- 2. Grant Managers read access to all profiles
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
CREATE POLICY "Managers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'manager'
);