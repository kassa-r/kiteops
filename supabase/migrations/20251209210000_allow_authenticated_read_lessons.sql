CREATE POLICY "Allow authenticated users to read lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (true);
