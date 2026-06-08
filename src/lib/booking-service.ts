import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase/client';

export type Booking = {
  lesson_id: number;
  lesson_name: string;
  start_time: string;
  customer_info: {
    name: string;
    email: string;
    phone: string;
  };
};

export async function createBooking(booking: Booking) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.functions.invoke('create-booking', {
    body: JSON.stringify(booking),
  });

  if (error) {
    // Check if the response body contains a specific error message
    // The supabase.functions.invoke might wrap the error, so we try to extract useful info
    try {
      if (typeof error === 'object' && error !== null && 'context' in error) {
         const errorBody = await (error as any).context.json();
         if (errorBody && errorBody.error) {
             const msg = typeof errorBody.error === 'string' ? errorBody.error : JSON.stringify(errorBody.error);
             throw new Error(msg);
         }
      }

      if (error instanceof Error) {
         throw new Error(error.message);
      }
    } catch (e) {
        if (e instanceof Error && e.message !== "Unknown Edge Function Error") throw e;
        throw new Error(error.message || "Unknown Edge Function Error");
    }
    throw new Error(error.message || "Unknown Edge Function Error");
  }

  return data;
}

export async function getBookingByToken(token: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.functions.invoke('get-booking-by-token', {
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ token }),
  });

  if (error) {
    try {
      if (typeof error === 'object' && error !== null && 'context' in error) {
         const errorBody = await (error as any).context.json();
         if (errorBody && errorBody.error) {
             const msg = typeof errorBody.error === 'string' ? errorBody.error : JSON.stringify(errorBody.error);
             throw new Error(msg);
         }
      }

      if (error instanceof Error) {
         throw new Error(error.message);
      }
    } catch (e) {
        if (e instanceof Error && e.message !== "Unknown Edge Function Error") throw e;
        throw new Error(error.message || "Unknown Edge Function Error");
    }
    throw new Error(error.message || "Unknown Edge Function Error");
  }

  return data;
}

export interface ManagerBookingPayload {
  id?: number;
  customer_id?: string;
  instructor_id?: string | null;
  lesson_id?: number;
  start_time?: string;
  end_time?: string;
  manager_notes?: string;
  status?: string;
  new_customer?: {
    full_name: string;
    email: string;
    phone?: string;
    skill_level?: string;
    age?: number;
    gender?: string;
    experience_hours?: number;
  };
}

export async function createManagerBooking(bookingData: ManagerBookingPayload) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('booking-service', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
  if (error) throw error;
  return data;
}

export async function updateManagerBooking(bookingData: ManagerBookingPayload) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('booking-service', {
    method: 'PUT',
    body: JSON.stringify(bookingData),
  });
  if (error) throw error;
  return data;
}

export async function cancelManagerBooking(id: number) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('booking-service', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
  if (error) throw error;
  return data;
}
