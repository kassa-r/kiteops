-- 1) Drop the problematic recursive policy (if it exists)
drop policy if exists "Managers can select all profiles" on public.profiles;

-- 2) Ensure the essential "self profile" policy exists (so AuthService.getUserRole works)
-- Create only if not already present in your DB; if you already have it, you can omit this block.
drop policy if exists "Users can select their own profile" on public.profiles;
create policy "Users can select their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- 3) Create a SECURITY DEFINER helper to check manager role safely (avoids RLS recursion)
create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'manager'
  );
$$;

revoke all on function public.is_manager() from public;
grant execute on function public.is_manager() to authenticated;

-- 4) Recreate manager policy using the helper (safe)
create policy "Managers can select all profiles"
on public.profiles
for select
to authenticated
using (public.is_manager());