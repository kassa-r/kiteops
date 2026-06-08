// tests/integration/weather-poller.test.ts
import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
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
  const from = () => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => ({ data: cacheData, error: cacheError }),
        }),
      }),
    }),
    insert: () => Promise.resolve({ error: insertError }),
  });
  return { from };
}


Deno.test("Integration: weather-poller", async (t) => {
  await t.step("should return fresh weather data on a cache miss", async () => {
    const mockSupabase = createMockSupabaseClient(null); // No cache
    const fetchStub = stub(globalThis, "fetch", () =>
      Promise.resolve(new Response(JSON.stringify(FAKE_WEATHER_DATA), { status: 200 }))
    );

    try {
      const req = new Request("http://localhost/weather-poller");
      const res = await handleRequest(req, mockSupabase);

      assertEquals(res.status, 200);
      assertEquals(res.headers.get("X-Cache-Status"), "miss");
      const body = await res.json();
      assertEquals(body.current.wind_speed, 5.0);

      assertEquals(fetchStub.calls.length, 1);
    } finally {
      fetchStub.restore();
    }
  });

  await t.step("should return cached weather data on a cache hit", async () => {
    const cachedEntry = {
      data: FAKE_WEATHER_DATA,
      created_at: new Date().toISOString(),
    };
    const mockSupabase = createMockSupabaseClient([cachedEntry]);
    const fetchStub = stub(globalThis, "fetch");

    try {
      const req = new Request("http://localhost/weather-poller");
      const res = await handleRequest(req, mockSupabase);


      assertEquals(res.status, 200);
      assertEquals(res.headers.get("X-Cache-Status"), "hit");
      const body = await res.json();
      assertEquals(body.current.wind_speed, 5.0);
      assertEquals(fetchStub.calls.length, 0);
    } finally {
      fetchStub.restore();
    }
  });

  await t.step("should return stale cache data if API fetch fails", async () => {
    const staleEntry = {
      data: FAKE_WEATHER_DATA,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours old
    };
    const mockSupabase = createMockSupabaseClient([staleEntry]);
    const fetchStub = stub(globalThis, "fetch", () => Promise.reject(new Error("API is down")));

    try {
      const req = new Request("http://localhost/weather-poller");
      const res = await handleRequest(req, mockSupabase);

      assertEquals(res.status, 200);
      assertEquals(res.headers.get("X-Cache-Status"), "stale");
      const body = await res.json();
      assertEquals(body.current.wind_speed, 5.0);

      assertEquals(fetchStub.calls.length, 1);
    } finally {
      fetchStub.restore();
    }
  });

  await t.step("should return 500 error if API fails and no cache is available", async () => {
    const mockSupabase = createMockSupabaseClient(null); // No cache
    const fetchStub = stub(globalThis, "fetch", () => Promise.reject(new Error("API is down")));
    try {
      const req = new Request("http://localhost/weather-poller");
      const res = await handleRequest(req, mockSupabase);

      assertEquals(res.status, 500);
      const body = await res.json();
      assertEquals(body.error, "Failed to fetch weather data and no cache is available.");
      assertEquals(fetchStub.calls.length, 1);
    } finally {
      fetchStub.restore();
    }
  });
});
