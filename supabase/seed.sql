-- supabase/seed.sql
--
-- This script is run by `supabase db reset`. It's used to seed the database
-- for local development and testing.

-- Test users are now created programmatically via `vitest.setup.ts` using the Supabase Admin API.
-- This seed file should only contain data necessary for the application to function,
-- which does not include specific test user accounts.

-- The trigger `on_auth_user_created` will handle creating corresponding profiles
-- when users are created via the Admin API.