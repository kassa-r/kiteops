// supabase/functions/weather-poller/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const OPENWEATHERMAP_API_KEY = Deno.env.get("OPENWEATHERMAP_API_KEY");
const SCHOOL_LAT = Deno.env.get("SCHOOL_LAT") || "YOUR_LATITUDE";
const SCHOOL_LON = Deno.env.get("SCHOOL_LON") || "YOUR_LONGITUDE";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or specify your Vercel app's domain for better security
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// New Zod schema for the /data/2.5/weather endpoint response
const CurrentWeatherSchema = z.object({
  coord: z.object({ lon: z.number(), lat: z.number() }),
  weather: z.array(z.object({
    id: z.number(),
    main: z.string(),
    description: z.string(),
    icon: z.string(),
  })),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    pressure: z.number(),
    humidity: z.number(),
  }),
  wind: z.object({
    speed: z.number(),
    deg: z.number(),
    gust: z.number().optional(),
  }).partial(),
  clouds: z.object({ all: z.number() }).optional(),
  dt: z.number(),
  name: z.string().optional(),
});

// Helper function to convert degrees to compass direction
function degreesToCompass(deg: number | undefined): string {
  if (deg === undefined) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

// Updated fetchWeather function to use the free-tier endpoint
async function fetchWeather(lat: string, lon: string) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`;
  const response = await fetch(url);
  const json = await response.json();

  if (!response.ok) {
    console.error("OpenWeather error:", json);
    throw new Error(`Failed to fetch weather data: ${response.status} ${response.statusText}`);
  }

  return CurrentWeatherSchema.parse(json);
}

export async function handleRequest(req: Request, supabaseClient: any) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. Attempt to retrieve the most recent cache entry
  const { data: cachedData, error: cacheError } = await supabaseClient
    .from("weather_cache")
    .select("data, created_at")
    .eq("location", "main_beach")
    .order("created_at", { ascending: false })
    .limit(1);

  if (cacheError) {
    console.error("Error fetching from cache:", cacheError);
    // Don't return; proceed to API fetch as a fallback
  }

  const cachedEntry = cachedData && cachedData.length > 0 ? cachedData[0] : null;

  // 2. Check if the cache is fresh enough
  if (cachedEntry) {
    const cacheAgeMs = Date.now() - new Date(cachedEntry.created_at).getTime();
    const ONE_HOUR_MS = 3600000;
    if (cacheAgeMs < ONE_HOUR_MS) {
      return new Response(JSON.stringify(cachedEntry.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache-Status": "hit" },
      });
    }
  }

  // 3. Cache is stale or missing, so fetch from the external API
  try {
    const rawWeatherData = await fetchWeather(SCHOOL_LAT, SCHOOL_LON);

    // **Transform the data to match the structure the frontend expects**
    const transformedData = {
      current: {
        temp: rawWeatherData.main.temp,
        feels_like: rawWeatherData.main.feels_like,
        pressure: rawWeatherData.main.pressure,
        humidity: rawWeatherData.main.humidity,
        weather: rawWeatherData.weather,
        wind_speed: rawWeatherData.wind?.speed,
        wind_deg: rawWeatherData.wind?.deg,
        wind_gust: rawWeatherData.wind?.gust,
        wind_direction: degreesToCompass(rawWeatherData.wind?.deg), // Add the compass direction
        // Add other fields from the old structure if needed, with default values
        dt: rawWeatherData.dt,
        sunrise: 0, 
        sunset: 0,
        dew_point: 0,
        uvi: 0,
        clouds: rawWeatherData.clouds?.all,
        visibility: 0,
      }
    };

    // Insert transformed data into cache
    const { error: insertError } = await supabaseClient
      .from("weather_cache")
      .insert({ location: "main_beach", data: transformedData });

    if (insertError) {
      console.error("Error inserting into cache:", insertError);
    }

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache-Status": "miss" },
    });
  } catch (apiError: unknown) {
    const errorMessage = (apiError as Error).message;
    console.error(`External API fetch failed: ${errorMessage}`);

    // 4. API failed, so fallback to the stale cache if it exists
    if (cachedEntry) {
      console.log("API fetch failed. Returning stale cache as fallback.");
      return new Response(JSON.stringify(cachedEntry.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache-Status": "stale" },
      });
    }

    // 5. API failed and there's no cache at all, return a server error
    return new Response(JSON.stringify({ error: "Failed to fetch weather data and no cache is available." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Only run the server when the script is executed directly
if (import.meta.main) {
  serve(async (req) => {
    // This is for local testing via `supabase functions serve`
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // The main logic is in handleRequest, so we call it and ensure CORS headers are on the final response.
    const response = await handleRequest(req, supabaseClient);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  });
}
