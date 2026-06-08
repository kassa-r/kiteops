// supabase/functions/weather-poller/__tests__/index.test.ts
import { assertEquals } from "jsr:@std/assert";
import { spy, stub } from "jsr:@std/testing/mock";
import { handleRequest } from "../index.ts";

// Mock Supabase client for general use
const createMockSupabaseClient = (data: any[] | null, error: any | null) => {
  const insertSpy = spy(() => Promise.resolve({ error: null }));
  const mockClient = {
    from: (tableName: string) => {
      if (tableName === "weather_cache") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data, error }),
              }),
            }),
          }),
          insert: insertSpy,
        };
      }
      return {
        select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: new Error("Table not mocked") }) }) }) }),
        insert: () => Promise.resolve({ error: new Error("Table not mocked") }),
      };
    },
    insertSpy, // Expose spy for assertion
  };
  return mockClient;
};

// Mock fetch utility
const mockFetch = (response: any, ok: boolean) => {
  return stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(JSON.stringify(response), {
        status: ok ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
};

// Helper to create a valid mock weather response
const createMockWeatherResponse = (temp: number) => ({
  lat: 37.89,
  lon: 12.47,
  timezone: "Europe/Rome",
  timezone_offset: 7200,
  current: {
    dt: 1672531200,
    sunrise: 1672516800,
    sunset: 1672555200,
    temp: temp,
    feels_like: temp - 2,
    pressure: 1012,
    humidity: 80,
    dew_point: 16,
    uvi: 0,
    clouds: 20,
    visibility: 10000,
    wind_speed: 5,
    wind_deg: 180,
    weather: [{ id: 801, main: "Clouds", description: "few clouds", icon: "02d" }],
  },
});

Deno.test("handleRequest returns fresh data when cache is stale", async (t) => {
  await t.step("it should fetch new data, insert it into cache, and return it", async () => {
    const freshData = createMockWeatherResponse(25);
    const staleCache = [{ data: createMockWeatherResponse(10), created_at: "2023-01-01T12:00:00.000Z" }];
    const mockClient = createMockSupabaseClient(staleCache, null);
    const fetchStub = mockFetch(freshData, true);

    try {
      const req = new Request("http://localhost");
      const res = await handleRequest(req, mockClient);
      const data = await res.json();

      assertEquals(res.status, 200);
      assertEquals(res.headers.get("X-Cache-Status"), "miss");
      assertEquals(data.current.temp, 25);
      // Verify that insert was called
      assertEquals(mockClient.insertSpy.calls.length, 1);
    } finally {
      fetchStub.restore();
    }
  });
});

Deno.test("handleRequest returns stale data on API fetch failure", async (t) => {
  await t.step("it should return stale cache if the external API fails", async () => {
    const staleData = createMockWeatherResponse(15);
    const staleCache = [{ data: staleData, created_at: "2023-01-01T12:00:00.000Z" }];
    const mockClient = createMockSupabaseClient(staleCache, null);
    const fetchStub = mockFetch({ error: "API Down" }, false);

    try {
      const req = new Request("http://localhost");
      const res = await handleRequest(req, mockClient);
      const data = await res.json();

      assertEquals(res.status, 200);
      assertEquals(res.headers.get("X-Cache-Status"), "stale");
      assertEquals(data.current.temp, 15);
    } finally {
      fetchStub.restore();
    }
  });
});

Deno.test("handleRequest returns cached data if not stale", async (t) => {
  await t.step("it should return data from the cache", async () => {
    const cachedData = createMockWeatherResponse(20);
    const validCache = [{ data: cachedData, created_at: new Date().toISOString() }];
    const mockClient = createMockSupabaseClient(validCache, null);

    const req = new Request("http://localhost");
    const res = await handleRequest(req, mockClient);
    const data = await res.json();

    assertEquals(res.status, 200);
    assertEquals(res.headers.get("X-Cache-Status"), "hit");
    assertEquals(data.current.temp, 20);
  });
});
