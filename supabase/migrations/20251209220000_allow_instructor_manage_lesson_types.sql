CREATE POLICY "Allow instructor to manage their own lesson types"
ON public.instructor_lesson_types
FOR ALL
TO authenticated
USING (auth.uid() = instructor_id)
WITH CHECK (auth.uid() = instructor_id);
