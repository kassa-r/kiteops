-- Set default value for role in profiles to prevent insert errors
ALTER TABLE public.profiles
ALTER COLUMN role SET DEFAULT 'customer';

-- Ensure full_name and email exist (based on app usage)
-- This is defensive; they might already exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;
