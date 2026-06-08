
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../../../supabase/functions/manager-settings/index.ts';

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
