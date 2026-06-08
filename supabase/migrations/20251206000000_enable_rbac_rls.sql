---
-- Enable RLS for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select their own profile" ON public.profiles;
CREATE POLICY "Users can select their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Enable RLS for instructor_details table
ALTER TABLE public.instructor_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view instructor details" ON public.instructor_details;
CREATE POLICY "Public can view instructor details" ON public.instructor_details FOR SELECT USING (true);
DROP POLICY IF EXISTS "Instructors can manage their own details" ON public.instructor_details;
CREATE POLICY "Instructors can manage their own details" ON public.instructor_details FOR ALL USING (auth.uid() = user_id);

-- Enable RLS for availability table
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view availability" ON public.availability;
CREATE POLICY "Public can view availability" ON public.availability FOR SELECT USING (true);
DROP POLICY IF EXISTS "Instructors can manage their own availability" ON public.availability;
CREATE POLICY "Instructors can manage their own availability" ON public.availability FOR ALL USING (auth.uid() = instructor_id);
