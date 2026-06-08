// tests/integration/verify-rate-limiting.ts
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { stub } from "https://deno.land/std@0.168.0/testing/mock.ts";
import { handleRequest } from "../../supabase/functions/weather-poller/index.ts";

const FAKE_WEATHER_DATA = {
  lat: 36.7783,
  lon: -119.4179,
  timezone: "America/Los_Angeles",
  timezone_offset: -25200,
  current: {
    dt: 1678886400,
    sunrise: 1678888476,
    sunset: 1678932185,
    temp: 15.0,
    feels_like: 14.0,
    pressure: 1012,
    humidity: 60,
    dew_point: 7.0,
    uvi: 5,
    clouds: 20,
    visibility: 10000,
    wind_speed: 5.0,
    wind_deg: 270,
    weather: [{ id: 801, main: "Clouds", description: "few clouds", icon: "02d" }],
  },
};

function createMockSupabaseClient(cacheData: any[] | null = null, cacheError: any = null, insertError: any = null) {
  let db = cacheData ? [...cacheData] : [];
  const from = () => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => ({ data: db, error: cacheError }),
        }),
      }),
    }),
    insert: (data: any) => {
        db = [...db, {data: data.data, created_at: new Date().toISOString()}];
        return Promise.resolve({ error: insertError });
    },
  });
  return { from };
}

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.test("Rate Limiting Verification", async () => {
  const mockSupabase = createMockSupabaseClient(null); // No cache initially
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify(FAKE_WEATHER_DATA), { status: 200 }))
  );

  try {
    const requests = Array(5).fill(0).map(async (_, i) => {
      await delay(i * 50); // Introduce a small delay to allow the cache to be populated.
      const req = new Request("http://localhost/weather-poller");
      return handleRequest(req, mockSupabase);
    });

    const responses = await Promise.all(requests);
    
    responses.forEach(res => {
        assertEquals(res.status, 200);
    });

    assertEquals(fetchStub.calls.length, 1);
    console.log("Rate limiting test passed. Fetch was called only once for 5 concurrent requests.");

  } finally {
    fetchStub.restore();
  }
});
