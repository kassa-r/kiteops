-- Add secure_token and secure_token_expires_at to bookings table
ALTER TABLE public.bookings
ADD COLUMN secure_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN secure_token_expires_at timestamptz DEFAULT (now() + interval '30 days');

-- Add unique constraint on secure_token
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_secure_token_key UNIQUE (secure_token);

-- Add index for fast lookup
CREATE INDEX bookings_secure_token_idx ON public.bookings (secure_token);
