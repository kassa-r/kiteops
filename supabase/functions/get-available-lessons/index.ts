import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import { addWeeks, isBefore } from "https://esm.sh/date-fns@4.1.0";
import { corsHeaders } from "../_shared/cors.ts";
import { calculateSlots } from "./logic.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  lesson_type: z.string().optional(),
});

type Availability = {
  instructor_id: string;
  start_time: string;
  end_time: string;
  recurrence_rule: string | null;
};


export async function handleRequest(req: Request) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    const query = QuerySchema.safeParse(params);

    if (!query.success) {
      return new Response(JSON.stringify({ error: query.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Rate Limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await checkRateLimit(supabase, `ip:${clientIp}`, 60, 60); // 60 reqs per 60s
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { date, skill_level, lesson_type } = query.data;

    // Define day range (UTC)
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // 1. Get Lessons
    let lessonQuery = supabase
      .from('lessons')
      .select('id, name, duration_minutes, price')
      .eq('active', true);

    if (lesson_type) {
      lessonQuery = lessonQuery.ilike('name', `%${lesson_type}%`);
    }

    const { data: lessons, error: lessonError } = await lessonQuery;
    if (lessonError) throw lessonError;

    if (!lessons || lessons.length === 0) {
      return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const lessonIds = lessons.map(l => l.id);

    // 2. Get Instructors who can teach these lessons
    const { data: instructorLessons, error: ilError } = await supabase
      .from('instructor_lesson_types')
      .select('instructor_id, lesson_id')
      .in('lesson_id', lessonIds);
    
    if (ilError) throw ilError;

    const eligibleInstructorIds = [...new Set(instructorLessons.map(il => il.instructor_id))];

    if (eligibleInstructorIds.length === 0) {
      return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Get Availability
    // Fetch all potentially relevant recurring and one-time slots
    const { data: allAvailabilities, error: avError } = await supabase
      .from('availability')
      .select('instructor_id, start_time, end_time, recurrence_rule')
      .in('instructor_id', eligibleInstructorIds)
      .lte('start_time', endOfDay.toISOString()); // Get all slots that started on or before the target day

    if (avError) throw avError;

    // Expand recurring slots
    const finalAvailabilities: Availability[] = [];
    (allAvailabilities as Availability[]).forEach(slot => {
      // Handle one-time slots that fall on the day
      if (!slot.recurrence_rule) {
        if (new Date(slot.start_time) <= endOfDay && new Date(slot.end_time) >= startOfDay) {
          finalAvailabilities.push(slot);
        }
      } 
      // Handle weekly recurring slots
      else if (slot.recurrence_rule === 'WEEKLY') {
        let currentStart = new Date(slot.start_time);
        
        let safety = 0;
        while (isBefore(currentStart, endOfDay) && safety < 500) { // Safety break
          const slotDuration = new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime();
          const currentEnd = new Date(currentStart.getTime() + slotDuration);

          // Check if this occurrence is on the target date
          if (currentStart.toISOString().startsWith(date)) {
             finalAvailabilities.push({
               ...slot,
               start_time: currentStart.toISOString(),
               end_time: currentEnd.toISOString(),
             });
             break; // Found the occurrence for this date, move to next slot
          }
          
          currentStart = addWeeks(currentStart, 1);
          safety++;
        }
      }
    });


    // 4. Get Bookings
    const { data: bookings, error: bkError } = await supabase
      .from('bookings')
      .select('instructor_id, start_time, end_time')
      .in('instructor_id', eligibleInstructorIds)
      .neq('status', 'cancelled')
      .gte('end_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());
      
    if (bkError) throw bkError;

    // 6. Calculate Slots
    const results = calculateSlots(
      lessons, 
      instructorLessons, 
      finalAvailabilities || [], 
      bookings || [], 
      startOfDay.toISOString(), 
      endOfDay.toISOString()
    );

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

serve(handleRequest);
