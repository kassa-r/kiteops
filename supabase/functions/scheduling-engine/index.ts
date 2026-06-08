import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { differenceInCalendarDays, startOfDay, endOfDay } from "https://esm.sh/date-fns@4.1.0";
import { toZonedTime, fromZonedTime } from "https://esm.sh/date-fns-tz@3.1.3";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const BookingRequestSchema = z.object({
  lesson_type_id: z.number(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
}).refine((data) => {
  const start = new Date(data.start_time);
  const end = new Date(data.end_time);
  return start < end;
}, {
  message: "Start time must be before end time",
  path: ["start_time"],
});

export interface WeatherData {
  hourly: Array<{
    dt: number;
    wind_speed: number;
    wind_deg: number;
    weather: Array<{ main: string; description: string }>;
  }>;
}

export interface WindLimits {
    min: number;
    max: number;
}

export interface SchoolSettings {
  wind_limits: Record<string, WindLimits>;
  timezone: string;
}

export interface InstructorMetrics {
    instructor_id: string;
    name: string;
    load: number;
    last_finish: number; // Unix timestamp
}

export function isWeatherCheckRequired(bookingDate: Date, referenceDate: Date = new Date()): boolean {
    const daysDifference = differenceInCalendarDays(bookingDate, referenceDate);
    return daysDifference <= 7;
}

export async function fetchCachedWeather(supabaseClient: any, location: string = "main_beach"): Promise<WeatherData | null> {
  const { data, error } = await supabaseClient
    .from("weather_cache")
    .select("data")
    .eq("location", location)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.data as WeatherData;
}

export async function fetchSchoolSettings(supabaseClient: any): Promise<SchoolSettings> {
  // TODO: Fetch from school_settings table when implemented (Story 3.6)
  // For now, use Env Var for timezone and defaults for wind limits
  return {
    wind_limits: {
      "default": { min: 5, max: 13 },
    },
    timezone: Deno.env.get("SCHOOL_TIMEZONE") || "UTC"
  };
}

export function isWeatherSuitable(
  bookingTime: Date,
  weatherData: WeatherData,
  limits: WindLimits
): { suitable: boolean; reason?: string } {
  const bookingUnix = Math.floor(bookingTime.getTime() / 1000);
  
  if (!weatherData.hourly) {
      return { suitable: false, reason: "No hourly forecast available" };
  }

  const forecast = weatherData.hourly.find(h => Math.abs(h.dt - bookingUnix) <= 1800);

  if (!forecast) {
    return { suitable: false, reason: "No forecast data available for this time" };
  }

  const windSpeed = forecast.wind_speed;
  
  if (windSpeed < limits.min) {
    return { suitable: false, reason: `Wind too low (${windSpeed} m/s < ${limits.min} m/s)` };
  }
  if (windSpeed > limits.max) {
    return { suitable: false, reason: `Wind too high (${windSpeed} m/s > ${limits.max} m/s)` };
  }

  return { suitable: true };
}

export async function findAvailableInstructors(
  supabaseClient: any,
  lessonTypeId: number,
  startTime: Date,
  endTime: Date
): Promise<string[]> {
    const { data: qualifiedData, error: qualifiedError } = await supabaseClient
        .from("instructor_lesson_types")
        .select("instructor_id")
        .eq("lesson_id", lessonTypeId);

    if (qualifiedError) {
        console.error("Error fetching qualified instructors:", qualifiedError);
        throw new Error("Database error fetching instructors");
    }

    if (!qualifiedData || qualifiedData.length === 0) {
        return [];
    }
    
    const candidateIds = qualifiedData.map((d: any) => d.instructor_id);

    const { data: busyData, error: busyError } = await supabaseClient
        .from("bookings")
        .select("instructor_id")
        .in("instructor_id", candidateIds)
        .in("status", ["confirmed", "pending"])
        .lt("start_time", endTime.toISOString())
        .gt("end_time", startTime.toISOString());
        
    if (busyError) {
        console.error("Error fetching busy instructors:", busyError);
        throw new Error("Database error checking bookings");
    }
    
    const busyIds = new Set(busyData?.map((d: any) => d.instructor_id));

    const { data: availableData, error: availableError } = await supabaseClient
        .from("availability")
        .select("instructor_id")
        .in("instructor_id", candidateIds)
        .lte("start_time", startTime.toISOString())
        .gte("end_time", endTime.toISOString());
        
    if (availableError) {
         console.error("Error fetching availability:", availableError);
         throw new Error("Database error checking availability");
    }
    
    const availableIds = new Set(availableData?.map((d: any) => d.instructor_id));
    
    const finalCandidates = candidateIds.filter((id: string) => 
        !busyIds.has(id) && availableIds.has(id)
    );
    
    return finalCandidates;
}

export function rankInstructors(
    candidateIds: string[],
    bookings: { instructor_id: string; end_time: string }[],
    names: Record<string, string>
): string[] {
    const metrics: Record<string, InstructorMetrics> = {};
    candidateIds.forEach(id => {
        metrics[id] = { instructor_id: id, name: names[id] || id, load: 0, last_finish: 0 };
    });
    
    bookings.forEach((b) => {
        if (metrics[b.instructor_id]) {
            metrics[b.instructor_id].load += 1;
            const endUnix = new Date(b.end_time).getTime();
            if (endUnix > metrics[b.instructor_id].last_finish) {
                metrics[b.instructor_id].last_finish = endUnix;
            }
        }
    });
    
    return candidateIds.sort((a, b) => {
        const mA = metrics[a];
        const mB = metrics[b];
        
        if (mA.load !== mB.load) return mA.load - mB.load;
        if (mA.last_finish !== mB.last_finish) return mA.last_finish - mB.last_finish;
        return mA.name.localeCompare(mB.name);
    });
}

export async function selectBestInstructor(
    supabaseClient: any,
    candidateIds: string[],
    bookingDate: Date,
    settings: SchoolSettings
): Promise<string | null> {
    if (candidateIds.length === 0) return null;
    
    const timeZone = settings.timezone;
    const zonedDate = toZonedTime(bookingDate, timeZone);
    const zonedStart = startOfDay(zonedDate);
    const zonedEnd = endOfDay(zonedDate);
    
    const startUtc = fromZonedTime(zonedStart, timeZone);
    const endUtc = fromZonedTime(zonedEnd, timeZone);

    const { data: bookingsData, error: bookingsError } = await supabaseClient
        .from("bookings")
        .select("instructor_id, end_time")
        .in("instructor_id", candidateIds)
        .in("status", ["confirmed", "pending"])
        .gte("start_time", startUtc.toISOString())
        .lte("end_time", endUtc.toISOString());

    if (bookingsError) throw new Error("Error fetching daily load");

    const names: Record<string, string> = {}; 
    const ranked = rankInstructors(candidateIds, bookingsData || [], names);
    return ranked[0];
}

export async function handleRequest(req: Request, supabaseClient: any) {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const internalSecret = Deno.env.get("INTERNAL_SERVICE_KEY") || "dev-secret";
    const authHeader = req.headers.get("x-internal-secret");

    if (authHeader !== internalSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
        const body = await req.json();
        const validationResult = BookingRequestSchema.safeParse(body);

        if (!validationResult.success) {
          return new Response(JSON.stringify({ error: validationResult.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { lesson_type_id, start_time, end_time } = validationResult.data;
        const bookingDate = new Date(start_time);
        
        // 7-Day Rule: Only check weather if within 7 days
        // isWeatherCheckRequired: true if <= 7 days
        if (isWeatherCheckRequired(bookingDate)) {
            const weatherData = await fetchCachedWeather(supabaseClient);
            const settings = await fetchSchoolSettings(supabaseClient);
            const limits = settings.wind_limits["default"]; 

            if (weatherData) {
                const check = isWeatherSuitable(bookingDate, weatherData, limits);
                if (!check.suitable) {
                    return new Response(JSON.stringify({
                        error: "weather_unsuitable",
                        message: check.reason
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }
            } else {
                 console.warn("No weather data found in cache");
            }
        }
        
        let candidates = await findAvailableInstructors(supabaseClient, lesson_type_id, new Date(start_time), new Date(end_time));
        
        if (candidates.length === 0) {
            return new Response(JSON.stringify({
                error: "no_instructor_available",
                message: "No qualified instructors available for this slot"
            }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
        
        const settings = await fetchSchoolSettings(supabaseClient);
        const bestInstructor = await selectBestInstructor(supabaseClient, candidates, new Date(start_time), settings);

        return new Response(
          JSON.stringify({
            message: "Request processed",
            data: {
                lesson_type_id,
                start_time,
                end_time,
                instructor_id: bestInstructor
            }
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
}

if (import.meta.main) {
  serve(async (req) => {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    return handleRequest(req, supabaseClient);
  });
}
