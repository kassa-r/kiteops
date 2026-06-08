import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2';
import { corsHeaders } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.23.4/mod.ts';

const createSchema = z.object({
  customer_id: z.string().uuid().optional(),
  instructor_id: z.string().uuid().nullable().optional(),
  lesson_id: z.number(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  location: z.string().optional(),
  manager_notes: z.string().optional(),
  new_customer: z.object({
    full_name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    skill_level: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    experience_hours: z.number().optional(),
    additional_notes: z.string().optional() // Assuming we want this too
  }).optional()
});

const updateSchema = z.object({
  id: z.number(),
  customer_id: z.string().uuid().optional(),
  instructor_id: z.string().uuid().nullable().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  location: z.string().optional(),
  manager_notes: z.string().optional(),
  status: z.string().optional(),
  lesson_id: z.number().optional(),
});

const deleteSchema = z.object({
  id: z.number(),
});

// Helper: Check for conflicts
export const checkForConflicts = async (client: any, instructorId: string, startTime: string, endTime: string, excludeId?: number) => {
    let query = client
        .from('bookings')
        .select('id')
        .eq('instructor_id', instructorId)
        .neq('status', 'cancelled')
        .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

    if (excludeId) {
        query = query.neq('id', excludeId);
    }

    const { data: conflicts, error } = await query;
    if (error) throw error;
    return conflicts && conflicts.length > 0;
};

// Helper: Send Notification
export const sendNotification = async (client: any, type: 'CREATED' | 'UPDATED' | 'CANCELLED', booking: any) => {
    try {
        await client.functions.invoke('notification-service', {
            body: {
                type: 'BOOKING_' + type,
                payload: {
                    booking_id: booking.id,
                    customer_id: booking.customer_id,
                    instructor_id: booking.instructor_id,
                    start_time: booking.start_time
                }
            }
        });
    } catch (e) {
        console.error('Failed to trigger notification:', e);
    }
};

// Core Logic
export const bookingServiceCore = async (req: Request, supabaseClient: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify Manager Role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'manager') {
      return new Response(JSON.stringify({ error: 'Forbidden: Managers only' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const url = new URL(req.url);

    if (req.method === 'POST') {
        const body = await req.json();
        console.log("POST Body:", JSON.stringify(body));
        const data = createSchema.parse(body);

        let finalCustomerId = data.customer_id;

        if (!finalCustomerId && data.new_customer) {
            const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
            if (!serviceRoleKey) {
                throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY configuration");
            }

            // Initialize Admin Client for User Creation
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                serviceRoleKey,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );

            // Create Auth User
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: data.new_customer.email,
                email_confirm: true,
                user_metadata: { 
                    full_name: data.new_customer.full_name,
                    role: 'customer'
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Failed to create user");

            finalCustomerId = authData.user.id;

            // Ensure Profile exists and has correct role
            await supabaseAdmin.from('profiles').upsert({
                id: finalCustomerId,
                role: 'customer'
            });

            // Insert Customer Details
            const { error: detailsError } = await supabaseAdmin.from('customer_details').insert({
                user_id: finalCustomerId,
                skill_level: data.new_customer.skill_level,
                age: data.new_customer.age,
                gender: data.new_customer.gender,
                experience_hours: data.new_customer.experience_hours,
                additional_notes: data.new_customer.additional_notes
            });

            if (detailsError) throw detailsError;

        } else if (!finalCustomerId) {
             throw new Error("Customer ID or New Customer details required");
        }

        // Conflict Detection
        let warning = null;
        if (data.instructor_id) {
             const hasConflict = await checkForConflicts(supabaseClient, data.instructor_id, data.start_time, data.end_time);
             if (hasConflict) {
                 warning = `Manager override: Double booking created for instructor ${data.instructor_id} at ${data.start_time}`;
                 console.warn(warning);
             }
        }

        const bookingReference = `MAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const { data: booking, error } = await supabaseClient
            .from('bookings')
            .insert({ 
                customer_id: finalCustomerId,
                instructor_id: data.instructor_id,
                lesson_id: data.lesson_id,
                start_time: data.start_time,
                end_time: data.end_time,
                location: data.location,
                manager_notes: data.manager_notes,
                status: 'confirmed',
                booking_reference: bookingReference
            })
            .select()
            .single();
        
        if (error) throw error;
        
        await sendNotification(supabaseClient, 'CREATED', booking);

        return new Response(JSON.stringify({ ...booking, warning }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201
        });
    } 
    
    else if (req.method === 'PUT') {
        const body = await req.json();
        const data = updateSchema.parse(body);
        
        // Fetch current booking for conflict check context
        const { data: currentBooking, error: fetchError } = await supabaseClient
            .from('bookings')
            .select('*')
            .eq('id', data.id)
            .single();
            
        if (fetchError || !currentBooking) {
            throw new Error('Booking not found');
        }

        // Determine effective values
        const effectiveInstructorId = data.instructor_id === undefined ? currentBooking.instructor_id : data.instructor_id;
        const effectiveStartTime = data.start_time || currentBooking.start_time;
        const effectiveEndTime = data.end_time || currentBooking.end_time;

        // Check conflicts if we have an instructor (might be null if unassigned)
        let warning = null;
        if (effectiveInstructorId) {
             const hasConflict = await checkForConflicts(
                 supabaseClient, 
                 effectiveInstructorId, 
                 effectiveStartTime, 
                 effectiveEndTime, 
                 data.id
             );
             
             if (hasConflict) {
                 warning = `Manager override: Double booking update for instructor ${effectiveInstructorId} at ${effectiveStartTime}`;
                 console.warn(warning);
             }
        }
        
        const { data: booking, error } = await supabaseClient
            .from('bookings')
            .update(data)
            .eq('id', data.id)
            .select()
            .single();

         if (error) throw error;
         
         await sendNotification(supabaseClient, 'UPDATED', booking);

         return new Response(JSON.stringify({ ...booking, warning }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    else if (req.method === 'DELETE') {
        // Soft delete (Cancel)
        let id: number | undefined;
        // Try body first
        try {
            const body = await req.json();
            const parsed = deleteSchema.safeParse(body);
            if (parsed.success) id = parsed.data.id;
        } catch (e) {
            // Ignore body parse error, try param
        }
        
        if (!id) {
             const idParam = url.searchParams.get('id');
             if (idParam) id = parseInt(idParam);
        }

        if (!id) throw new Error("Missing Booking ID");

        const { data: booking, error } = await supabaseClient
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        
         await sendNotification(supabaseClient, 'CANCELLED', booking);

        return new Response(JSON.stringify({ success: true, booking }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  } catch (error) {
    console.error('Booking Service Error:', error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // If it's a known logic error we threw, we might want 400, but for now let's use 500 for general errors to verify.
    // Actually, "Missing SUPABASE_SERVICE_ROLE_KEY" is a server config error (500).
    // "Customer ID required" is a client error (400).
    // Let's keep it simple: 500 for everything else to see if it changes the status code in your browser.
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

export const bookingServiceHandler = async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 400, headers: corsHeaders });
    }

    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    );
    
    return await bookingServiceCore(req, supabaseClient);
};

serve(bookingServiceHandler);