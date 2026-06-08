import { assert, assertEquals } from 'jsr:@std/assert'
import { mock } from 'jsr:@std/testing/mock'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import handler from './index.ts' // Import the actual Edge Function handler

// Mock the global Deno.env object for environment variables
const mockDenoEnv = mock.stub(Deno, 'env', {
  get: (key: string) => {
    switch (key) {
      case 'SUPABASE_URL': return 'http://mock-supabase-url.com';
      case 'SUPABASE_ANON_KEY': return 'mock-anon-key';
      default: return undefined;
    }
  }
});

// Mock the createClient function from Supabase to prevent actual network calls
const mockCreateClient = mock.stub(createClient, 'createClient', (
  supabaseUrl: string,
  supabaseKey: string,
  options: any // eslint-disable-line @typescript-eslint/no-explicit-any
) => {
  assert(supabaseUrl === 'http://mock-supabase-url.com');
  assert(supabaseKey === 'mock-anon-key');
  
  return {
    auth: {
      getUser: mock.fn(() => ({ data: { user: { id: 'mock-user-id', role: 'manager' } }, error: null })),
    },
    from: mock.fn(() => ({
      select: mock.fn(() => ({
        maybeSingle: mock.fn(() => ({ data: { id: 1, lesson_types: ['Kite'], weather_api_thresholds: {} }, error: null })),
      })),
      update: mock.fn(() => ({
        eq: mock.fn(() => ({ error: null })),
      })),
    })),
  };
});

Deno.test('manager-settings', 'PUT /edge/manager/settings with valid weather thresholds should succeed', async () => {
  const request = new Request('http://localhost:54321/functions/v1/manager-settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-manager-jwt',
    },
    body: JSON.stringify({
      weather_api_thresholds: {
        min_wind_speed: 10,
        max_wind_speed: 20,
        allow_precipitation: false,
        preferred_wind_directions: ['N'],
      },
      some_other_setting: 'value',
    }),
  });

  const response = await index.default(request); // Call the default export of the Edge Function
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body, { success: true });
});

Deno.test('manager-settings', 'PUT /edge/manager/settings with min_wind_speed > max_wind_speed should return 400', async () => {
  const request = new Request('http://localhost:54321/functions/v1/manager-settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-manager-jwt',
    },
    body: JSON.stringify({
      weather_api_thresholds: {
        min_wind_speed: 20,
        max_wind_speed: 10,
      },
    }),
  });

  const response = await index.default(request);
  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body, { error: 'Minimum wind speed cannot be greater than maximum wind speed' });
});

Deno.test('manager-settings', 'PUT /edge/manager/settings with negative wind speed should return 400', async () => {
  const request = new Request('http://localhost:54321/functions/v1/manager-settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-manager-jwt',
    },
    body: JSON.stringify({
      weather_api_thresholds: {
        min_wind_speed: -5,
        max_wind_speed: 10,
      },
    }),
  });

  const response = await index.default(request);
  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body, { error: 'Wind speeds must be positive' });
});

Deno.test('manager-settings', 'PUT /edge/manager/settings without weather thresholds should succeed', async () => {
  const request = new Request('http://localhost:54321/functions/v1/manager-settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-manager-jwt',
    },
    body: JSON.stringify({
      some_other_setting: 'new_value',
    }),
  });

  const response = await index.default(request);
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body, { success: true });
});

Deno.test('manager-settings', 'unauthorized GET request should return 401', async () => {
  // Override the getUser mock to simulate an unauthorized user
  mockCreateClient.restore(); // Restore original to modify only getUser
  mock.stub(createClient, 'createClient', (
    supabaseUrl: string,
    supabaseKey: string,
    options: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => {
    return {
      auth: {
        getUser: mock.fn(() => ({ data: { user: null }, error: new Error('Unauthorized') })),
      },
      from: mock.fn(() => ({ select: mock.fn(() => ({ maybeSingle: mock.fn(() => ({ data: null, error: null })) })) })),
    };
  });
  
  const request = new Request('http://localhost:54321/functions/v1/manager-settings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-jwt',
    },
  });

  const response = await index.default(request);
  const body = await response.json();

  assertEquals(response.status, 401);
  assertEquals(body, { error: 'Unauthorized' });

  // Restore the original mock after this test
  mockCreateClient.restore();
  mockCreateClient.stub(createClient, 'createClient', (
    supabaseUrl: string,
    supabaseKey: string,
    options: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => {
    assert(supabaseUrl === 'http://mock-supabase-url.com');
    assert(supabaseKey === 'mock-anon-key');
    
    return {
      auth: {
        getUser: mock.fn(() => ({ data: { user: { id: 'mock-user-id', role: 'manager' } }, error: null })),
      },
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          maybeSingle: mock.fn(() => ({ data: { id: 1, lesson_types: ['Kite'], weather_api_thresholds: {} }, error: null })),
        })),
        update: mock.fn(() => ({
          eq: mock.fn(() => ({ error: null })),
        })),
      })),
    };
  });
});

Deno.test('manager-settings', 'GET request should retrieve settings', async () => {
  const request = new Request('http://localhost:54321/functions/v1/manager-settings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-manager-jwt', // Authorized
    },
  });

  const response = await index.default(request);
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.id, 1); // Mocked data
});
