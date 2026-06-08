-- Add columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS email text;

-- Update trigger function to sync data from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email, created_at)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'role', 
    new.raw_user_meta_data->>'full_name',
    new.email,
    now()
  );
  RETURN new;
END;
$$;

-- RLS for Bookings: Instructors can view their own bookings
DROP POLICY IF EXISTS "Instructors can view their own bookings" ON public.bookings;
CREATE POLICY "Instructors can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = instructor_id);

-- RLS for Profiles: Allow Instructors to view their students
-- Replaces/Augments "Users can select their own profile"
-- We keep "Users can select their own profile" (it's fine).
-- We add a new policy for Instructors.

CREATE POLICY "Instructors can view their students"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.instructor_id = auth.uid() 
    AND bookings.customer_id = profiles.id
  )
);
