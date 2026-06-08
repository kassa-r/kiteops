-- Add booking_reference column to bookings table
ALTER TABLE public.bookings
ADD COLUMN booking_reference text;

-- Add unique constraint
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_booking_reference_key UNIQUE (booking_reference);
