import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBookingByToken } from '@/lib/booking-service';
import { createBrowserClient } from '@supabase/ssr';

// Mock the Supabase client
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
}));

describe('getBookingByToken', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    mockSupabaseClient = {
      functions: {
        invoke: vi.fn(),
      },
    };

    // Ensure our mock function returns the mock client
    (createBrowserClient as vi.Mock).mockReturnValue(mockSupabaseClient);
  });

  it('should return booking data on successful API call', async () => {
    const mockToken = 'valid-token';
    const mockBookingData = { 
        success: true, 
        data: { id: 1, booking_reference: 'REF123' } 
    };

    // Setup the mock response for a successful call
    mockSupabaseClient.functions.invoke.mockResolvedValue({
      data: mockBookingData,
      error: null,
    });

    const result = await getBookingByToken(mockToken);

    // Assertions
    expect(result).toEqual(mockBookingData);
    expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('get-booking-by-token', {
      body: JSON.stringify({ token: mockToken }),
      headers: {
        Authorization: expect.stringContaining('Bearer'),
      }
    });
  });

  it('should throw an error when API returns an error', async () => {
    const mockToken = 'invalid-token';
    const mockError = {
        message: 'Function returned an error',
        context: {
            json: () => Promise.resolve({ error: 'Invalid or expired token' })
        }
    };
    
    // Setup the mock response for a failed call
    mockSupabaseClient.functions.invoke.mockResolvedValue({
      data: null,
      error: mockError,
    });

    // Assertions
    await expect(getBookingByToken(mockToken)).rejects.toThrow('Invalid or expired token');
    expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('get-booking-by-token', {
      body: JSON.stringify({ token: mockToken }),
      headers: {
        Authorization: expect.stringContaining('Bearer'),
      }
    });
  });

  it('should throw a generic error for unknown issues', async () => {
    const mockToken = 'another-token';
    const mockError = {
        message: 'Something went wrong'
    };
    
    // Setup a generic error response
    mockSupabaseClient.functions.invoke.mockResolvedValue({
      data: null,
      error: mockError,
    });

    // Assertions
    await expect(getBookingByToken(mockToken)).rejects.toThrow('Something went wrong');
  });
});
