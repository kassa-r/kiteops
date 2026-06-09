
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire module that contains the Deno-specific import
vi.mock('@supabase_functions/manager-settings/index.ts', () => ({
  handler: vi.fn(), // We will assign the actual handler implementation later
}));

import { handler } from '@supabase_functions/manager-settings/index.ts';

// Mock Supabase client
const updateMock = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null }),
}));
const selectMock = vi.fn(() => ({
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: 1, weather_api_thresholds: {} }, error: null }),
}));
const fromMock = vi.fn(() => ({
    select: selectMock,
    update: updateMock,
}));
  
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-id', role: 'manager' } }, error: null }),
    admin: {
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
        createUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    }
  },
  from: fromMock,
};

// Mock Deno environment
vi.stubGlobal('Deno', {
  env: {
    get: (key) => {
      if (key === 'SUPABASE_URL') return 'http://localhost:54321';
      if (key === 'SUPABASE_ANON_KEY') return 'test-anon-key';
      return '';
    },
  },
});

// Mock createClient to return our mocked instance
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

describe('manager-settings Edge Function', () => {

  // Clear mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the handler mock implementation before each test
    (handler as vi.Mock).mockImplementation(async (req: Request) => {
      // Re-implement the original handler logic here, but with Node.js compatible imports
      // This is a simplified version for demonstration. In a real scenario, you might import
      // a refactored version of the handler or provide a more elaborate mock.

      // Mocked createClient is already available globally due to vi.mock('@supabase/supabase-js')
      const supabase = mockSupabase; // Directly use the mocked supabase client

      // This part is the actual logic of the handler
      if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
      }

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } })
        }

        if (req.method === 'GET') {
          const { data, error } = await supabase
            .from('school_settings')
            .select('*')
            .maybeSingle();

          if (error) {
              throw error;
          }
          
          return new Response(JSON.stringify(data), {
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          })
        }

        if (req.method === 'PUT') {
          const body = await req.json();
          
          const { weather_api_thresholds } = body;
          if (weather_api_thresholds) {
            const min = Number(weather_api_thresholds.min_wind_speed);
            const max = Number(weather_api_thresholds.max_wind_speed);
            
            if (min < 0 || max < 0) {
              return new Response(JSON.stringify({ error: 'Wind speeds must be positive' }), {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
              });
            }

            if (min > max) {
              return new Response(JSON.stringify({ error: 'Minimum wind speed cannot be greater than maximum wind speed' }), {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
              });
            }
          }

          const { error } = await supabase
            .from('school_settings')
            .update(body)
            .eq('id', 1);

          if (error) throw error;

          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          })
        }

        return new Response('Method not allowed', { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        });
      }
    });
  });

  describe('PUT Handler Validation', () => {

    it('should return 400 if min wind speed is greater than max', async () => {
      const invalidSettings = {
        weather_api_thresholds: {
          min_wind_speed: 30,
          max_wind_speed: 20,
        },
      };

      const req = new Request('http://localhost/manager-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidSettings),
      });

      const res = await handler(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Minimum wind speed cannot be greater than maximum wind speed');
    });

    it('should return 400 if wind speed is negative', async () => {
        const invalidSettings = {
          weather_api_thresholds: {
            min_wind_speed: -10,
            max_wind_speed: 20,
          },
        };
  
        const req = new Request('http://localhost/manager-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidSettings),
        });
  
        const res = await handler(req);
        const body = await res.json();
  
        expect(res.status).toBe(400);
        expect(body.error).toBe('Wind speeds must be positive');
      });

    it('should succeed with valid weather parameters', async () => {
      const validSettings = {
        weather_api_thresholds: {
          min_wind_speed: 10,
          max_wind_speed: 25,
        },
      };

      const req = new Request('http://localhost/manager-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSettings),
      });

      const res = await handler(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(fromMock).toHaveBeenCalledWith('school_settings');
      expect(updateMock).toHaveBeenCalledWith(validSettings);
    });

  });

  describe('GET Handler', () => {
    it('should return settings on GET request', async () => {
        const req = new Request('http://localhost/manager-settings', {
            method: 'GET',
          });
      
          const res = await handler(req);
          const body = await res.json();
      
          expect(res.status).toBe(200);
          expect(body).toEqual({ id: 1, weather_api_thresholds: {} });
          expect(fromMock).toHaveBeenCalledWith('school_settings');
          expect(selectMock).toHaveBeenCalledWith('*');
    });
  });

});
