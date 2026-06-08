-- Add guest fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN guest_email text,
ADD COLUMN guest_name text,
ADD COLUMN guest_phone text;

-- Add check constraint to ensure either customer_id OR guest_email is present
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_customer_or_guest_check
CHECK (
  (customer_id IS NOT NULL) OR (guest_email IS NOT NULL)
);
