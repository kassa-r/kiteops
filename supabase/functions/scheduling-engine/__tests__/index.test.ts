import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { BookingRequestSchema, isWeatherCheckRequired, isWeatherSuitable, WeatherData, rankInstructors, handleRequest } from "../index.ts";
import { addDays } from "https://esm.sh/date-fns@4.1.0";

Deno.test("Input Validation - Valid Request", () => {
  const now = new Date();
  const validData = {
    lesson_type_id: 1,
    start_time: now.toISOString(),
    end_time: addDays(now, 1).toISOString(),
  };
  const result = BookingRequestSchema.safeParse(validData);
  assertEquals(result.success, true);
});

Deno.test("Input Validation - Invalid ID", () => {
  const invalidData = {
    lesson_type_id: "invalid-id",
    start_time: new Date().toISOString(),
    end_time: addDays(new Date(), 0.1).toISOString(),
  };
  const result = BookingRequestSchema.safeParse(invalidData);
  assertEquals(result.success, false);
});

Deno.test("Input Validation - Start Time After End Time", () => {
  const now = new Date();
  const invalidData = {
    lesson_type_id: 1,
    start_time: addDays(now, 1).toISOString(),
    end_time: now.toISOString(),
  };
  const result = BookingRequestSchema.safeParse(invalidData);
  assertEquals(result.success, false);
});

Deno.test("7-Day Rule - Within 7 Days", () => {
  const today = new Date("2025-12-09T12:00:00Z");
  const bookingDate = new Date("2025-12-12T12:00:00Z"); // 3 days later
  const required = isWeatherCheckRequired(bookingDate, today);
  assertEquals(required, true);
});

Deno.test("7-Day Rule - Exactly 7 Days", () => {
  const today = new Date("2025-12-09T12:00:00Z");
  const bookingDate = new Date("2025-12-16T12:00:00Z"); // 7 days later
  const required = isWeatherCheckRequired(bookingDate, today);
  assertEquals(required, true);
});

Deno.test("7-Day Rule - More Than 7 Days", () => {
  const today = new Date("2025-12-09T12:00:00Z");
  const bookingDate = new Date("2025-12-17T12:00:00Z"); // 8 days later
  const required = isWeatherCheckRequired(bookingDate, today);
  assertEquals(required, false);
});

Deno.test("Weather Suitability - Suitable", () => {
    const bookingTime = new Date("2025-12-10T10:00:00Z"); // Unix 1765360800
    const mockWeatherData: WeatherData = {
        hourly: [
            {
                dt: 1765360800, // Exact match
                wind_speed: 8, // Suitable (5 < 8 < 13)
                wind_deg: 180,
                weather: [{ main: "Clear", description: "clear sky" }]
            }
        ]
    };
    const limits = { min: 5, max: 13 };
    
    const result = isWeatherSuitable(bookingTime, mockWeatherData, limits);
    assertEquals(result.suitable, true);
});

Deno.test("Weather Suitability - Wind Too Low", () => {
    const bookingTime = new Date("2025-12-10T10:00:00Z");
    const mockWeatherData: WeatherData = {
        hourly: [
            {
                dt: 1765360800,
                wind_speed: 2, // Too low
                wind_deg: 180,
                weather: [{ main: "Clear", description: "clear sky" }]
            }
        ]
    };
    const limits = { min: 5, max: 13 };
    
    const result = isWeatherSuitable(bookingTime, mockWeatherData, limits);
    assertEquals(result.suitable, false);
    assertEquals(result.reason?.includes("Wind too low"), true);
});

Deno.test("Weather Suitability - Wind Too High", () => {
    const bookingTime = new Date("2025-12-10T10:00:00Z");
    const mockWeatherData: WeatherData = {
        hourly: [
            {
                dt: 1765360800,
                wind_speed: 20, // Too high
                wind_deg: 180,
                weather: [{ main: "Clear", description: "clear sky" }]
            }
        ]
    };
    const limits = { min: 5, max: 13 };
    
    const result = isWeatherSuitable(bookingTime, mockWeatherData, limits);
    assertEquals(result.suitable, false);
    assertEquals(result.reason?.includes("Wind too high"), true);
});

Deno.test("Weather Suitability - No Forecast", () => {
    const bookingTime = new Date("2025-12-10T10:00:00Z");
    const mockWeatherData: WeatherData = {
        hourly: []
    };
    const limits = { min: 5, max: 13 };
    
    const result = isWeatherSuitable(bookingTime, mockWeatherData, limits);
    assertEquals(result.suitable, false);
    assertEquals(result.reason, "No forecast data available for this time");
});

Deno.test("Ranking - Lowest Load Wins", () => {
    const candidates = ["A", "B"];
    // A has 1 booking, B has 0 bookings
    const bookings = [
        { instructor_id: "A", end_time: new Date().toISOString() }
    ];
    const names = {};
    
    const ranked = rankInstructors(candidates, bookings, names);
    assertEquals(ranked[0], "B"); // B (0 load) should be first
});

Deno.test("Ranking - Earliest Finish Wins Tie", () => {
    const candidates = ["A", "B"];
    // Both have 1 booking.
    // A finishes at 12:00. B finishes at 14:00.
    const bookings = [
        { instructor_id: "A", end_time: "2025-12-10T12:00:00Z" },
        { instructor_id: "B", end_time: "2025-12-10T14:00:00Z" }
    ];
    const names = {};
    
    const ranked = rankInstructors(candidates, bookings, names);
    assertEquals(ranked[0], "A"); // A finishes earlier
});

Deno.test("Ranking - Alphabetical Tie Breaker", () => {
    const candidates = ["Z", "A"];
    // Both have 0 bookings.
    const bookings: any[] = [];
    const names = { "Z": "Zack", "A": "Adam" };
    
    const ranked = rankInstructors(candidates, bookings, names);
    assertEquals(ranked[0], "A"); // Adam comes before Zack
});

function createFullMockClient(mocks: any) {
    return {
        from: (table: string) => {
            return {
                select: (cols: string) => {
                    if (table === "weather_cache") {
                        return {
                            eq: (col: string, val: any) => ({
                                order: () => ({
                                    limit: () => ({
                                        single: () => ({ data: mocks.weatherData, error: null })
                                    })
                                })
                            })
                        };
                    }
                    if (table === "instructor_lesson_types") {
                         return {
                             eq: () => ({ data: mocks.qualifiedData || [], error: null })
                         }
                    }
                    if (table === "bookings") {
                        const chain = {
                            in: () => chain,
                            lt: () => chain,
                            gt: () => chain,
                            gte: () => chain,
                            lte: () => {
                                return { data: mocks.bookingsData || [], error: null };
                            }
                        };
                        return chain;
                    }
                    if (table === "availability") {
                        const chain = {
                            in: () => chain,
                            lte: () => chain,
                            gte: () => {
                                return { data: mocks.availabilityData || [], error: null };
                            }
                        };
                        return chain;
                    }
                    return { data: [], error: null };
                }
            }
        }
    }
}

Deno.test("Handle Request - Unauthorized", async () => {
    const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "x-internal-secret": "wrong-secret" }
    });
    
    // Pass null as client since it shouldn't be reached
    const response = await handleRequest(req, null);
    const json = await response.json();
    
    assertEquals(response.status, 401);
    assertEquals(json.error, "Unauthorized");
});

Deno.test("Handle Request - Weather Unsuitable", async () => {
    const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
            lesson_type_id: 1,
            start_time: "2025-12-10T10:00:00Z",
            end_time: "2025-12-10T12:00:00Z"
        }),
        headers: { "x-internal-secret": "dev-secret" }
    });
    
    const mocks = {
        weatherData: {
            data: {
                hourly: [{
                    dt: 1765360800,
                    wind_speed: 2, // Too low
                    wind_deg: 180,
                    weather: []
                }]
            }
        },
    };
    
    const client = createFullMockClient(mocks);
    const response = await handleRequest(req, client);
    const json = await response.json();
    
    assertEquals(response.status, 400);
    assertEquals(json.error, "weather_unsuitable");
});

Deno.test("Handle Request - No Instructor Available", async () => {
    const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
            lesson_type_id: 1,
            start_time: "2025-12-20T10:00:00Z", // > 7 days, skip weather
            end_time: "2025-12-20T12:00:00Z"
        }),
        headers: { "x-internal-secret": "dev-secret" }
    });
    
    const mocks = {
        weatherData: null,
        qualifiedData: [], // No instructors
    };
    
    const client = createFullMockClient(mocks);
    const response = await handleRequest(req, client);
    const json = await response.json();
    
    assertEquals(response.status, 400);
    assertEquals(json.error, "no_instructor_available");
});
