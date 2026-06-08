-- Add columns for Manager operations
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS manager_notes TEXT,
ADD COLUMN IF NOT EXISTS manager_confirmed_rebooking BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status_reason TEXT;

-- RLS for Managers on Bookings
DROP POLICY IF EXISTS "Managers can insert bookings" ON public.bookings;
CREATE POLICY "Managers can insert bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_role() = 'manager'
);

DROP POLICY IF EXISTS "Managers can update bookings" ON public.bookings;
CREATE POLICY "Managers can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  public.get_my_role() = 'manager'
);

DROP POLICY IF EXISTS "Managers can delete bookings" ON public.bookings;
CREATE POLICY "Managers can delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (
  public.get_my_role() = 'manager'
);
