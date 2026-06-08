ALTER TABLE public.instructor_details
ADD COLUMN IF NOT EXISTS lesson_types text[];