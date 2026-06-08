import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.23.4/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2';

const requestSchema = z.object({
  token: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { token } = requestSchema.parse(body);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { 
          autoRefreshToken: false, 
          persistSession: false,
          detectSessionInUrl: false
        },
        db: {
          bypassRLS: true
        }
      }
    );

    // 1. Fetch Booking and Lesson Info
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        status,
        location,
        booking_reference,
        secure_token_expires_at,
        instructor_id,
        lessons (
          name,
          duration_minutes
        )
      `)
      .eq('secure_token', token)
      .single();

    if (bookingError || !booking) {
      console.error("Booking fetch error:", bookingError);
      throw new Error('Invalid or expired token');
    }

    // 2. Check Expiration
    if (booking.secure_token_expires_at && new Date(booking.secure_token_expires_at) < new Date()) {
       throw new Error('Token has expired');
    }

    // 3. Fetch Instructor Name (if assigned)
    let instructorName = "Pending Assignment";
    if (booking.instructor_id) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(booking.instructor_id);
        if (userError) {
          console.error("Error fetching instructor details:", userError.message);
        } else if (userData && userData.user) {
             instructorName = userData.user.user_metadata.full_name || userData.user.user_metadata.name || "Instructor";
        }
    }

    const responseData = {
        ...booking,
        instructor_name: instructorName
    };

    return new Response(JSON.stringify({ 
        success: true, 
        data: responseData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Get Booking Error:', error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Return 404 for invalid token to avoid leaking existence? Or 400? 
    // "Invalid or expired token" covers both.
    const status = message === 'Invalid or expired token' || message === 'Token has expired' ? 404 : 400;

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});
