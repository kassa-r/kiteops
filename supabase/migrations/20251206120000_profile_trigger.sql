-- Create a function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer 
set search_path = public
as $$
begin
  insert into public.profiles (id, role, created_at)
  values (new.id, new.raw_user_meta_data->>'role', now());
  return new;
end;
$$;

-- Create the trigger (Postgres 14+ syntax)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row 
  execute function public.handle_new_user();
