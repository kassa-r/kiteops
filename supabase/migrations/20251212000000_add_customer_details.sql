-- Add missing fields to customer_details
ALTER TABLE public.customer_details
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS experience_hours INTEGER,
ADD COLUMN IF NOT EXISTS additional_notes TEXT;
