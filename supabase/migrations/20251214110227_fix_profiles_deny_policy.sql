-- Remove deny policy applied to `public`
drop policy if exists "Deny Public Access profiles" on public.profiles;

-- Recreate deny policy scoped to `anon` only
create policy "Deny anon access to profiles"
on public.profiles
for all
to anon
using (false)
with check (false);