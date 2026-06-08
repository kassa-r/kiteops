CREATE POLICY "Managers can select all profiles" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
            and p.role = 'manager'
        )
    );