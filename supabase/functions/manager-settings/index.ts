import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Hello from manager-settings!")

export const handler = async (req: Request) => {
  console.log(`[manager-settings] Request received: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log('[manager-settings] Handling OPTIONS');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[manager-settings] Creating Supabase client');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    console.log('[manager-settings] Verifying user...');
    // Check auth/role - although RLS handles it at DB level, we might want early exit
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
        console.error('[manager-settings] Auth error:', authError);
    }
    
    if (authError || !user) {
      console.log('[manager-settings] Unauthorized');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    console.log(`[manager-settings] User verified: ${user.id}`);

    if (req.method === 'GET') {
      console.log('[manager-settings] Processing GET request');
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .maybeSingle(); // Use maybeSingle to handle empty table gracefully if RLS permits but empty

      if (error) {
          console.error('[manager-settings] DB Select Error:', error);
          throw error;
      }
      
      console.log('[manager-settings] GET success, returning data');
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      
      // Server-side Validation
      const { weather_api_thresholds } = body;
      if (weather_api_thresholds) {
        const min = Number(weather_api_thresholds.min_wind_speed);
        const max = Number(weather_api_thresholds.max_wind_speed);
        
        if (min < 0 || max < 0) {
           return new Response(JSON.stringify({ error: 'Wind speeds must be positive' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (min > max) {
          return new Response(JSON.stringify({ error: 'Minimum wind speed cannot be greater than maximum wind speed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // We assume singleton row with id=1
      const { error } = await supabase
        .from('school_settings')
        .update(body)
        .eq('id', 1);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[manager-settings] Unexpected Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

Deno.serve(handler);
