import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInstructorCalendar } from '@/lib/hooks/useInstructorCalendar';
import { CalendarService } from '@/lib/calendar-service';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { createClient } from '@/lib/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@/lib/hooks/useUserRole');
vi.mock('@/lib/calendar-service');
vi.mock('@/lib/supabase/client');
vi.mock('@/lib/db');

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useInstructorCalendar', () => {
  const mockUserId = 'test-instructor-id';
  const mockDateRange = { start: new Date('2025-01-01'), end: new Date('2025-01-31') };
  const mockEvents = [{ id: '1', title: 'Test Event', start: new Date(), end: new Date(), type: 'lesson' }];

  beforeEach(() => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
      },
    } as any);
    vi.mocked(CalendarService.getInstructorCalendarData).mockResolvedValue(mockEvents);
  });

  it('should not fetch data if role is not instructor', async () => {
    vi.mocked(useUserRole).mockReturnValue({ data: 'manager' } as any);

    const { result } = renderHook(() => useInstructorCalendar(), { wrapper });
    
    // Set date range to trigger the hook's internal logic
    act(() => {
      result.current.setDateRange(mockDateRange);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(CalendarService.getInstructorCalendarData).not.toHaveBeenCalled();
      expect(result.current.events).toEqual([]);
    });
  });

  it('should not fetch data if dateRange is not set', async () => {
    vi.mocked(useUserRole).mockReturnValue({ data: 'instructor' } as any);

    const { result } = renderHook(() => useInstructorCalendar(), { wrapper });

    await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(CalendarService.getInstructorCalendarData).not.toHaveBeenCalled();
    });
  });

  it('should fetch data when enabled (role=instructor, userId and dateRange are set)', async () => {
    vi.mocked(useUserRole).mockReturnValue({ data: 'instructor' } as any);

    const { result } = renderHook(() => useInstructorCalendar(), { wrapper });

    // Set date range
    act(() => {
      result.current.setDateRange(mockDateRange);
    });
    
    await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(CalendarService.getInstructorCalendarData).toHaveBeenCalledWith(
        mockUserId,
        mockDateRange.start,
        mockDateRange.end
      );
      expect(result.current.events).toEqual(mockEvents);
    });
  });
  
  it('should return an empty array if the fetch call returns no data', async () => {
    vi.mocked(useUserRole).mockReturnValue({ data: 'instructor' } as any);
    vi.mocked(CalendarService.getInstructorCalendarData).mockResolvedValue([]);

    const { result } = renderHook(() => useInstructorCalendar(), { wrapper });

    act(() => {
      result.current.setDateRange(mockDateRange);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.events).toEqual([]);
    });
  });

  it('should return an error state if the fetch fails', async () => {
    const testError = new Error('Failed to fetch');
    vi.mocked(useUserRole).mockReturnValue({ data: 'instructor' } as any);
    vi.mocked(CalendarService.getInstructorCalendarData).mockRejectedValue(testError);

    const { result } = renderHook(() => useInstructorCalendar(), { wrapper });

    act(() => {
      result.current.setDateRange(mockDateRange);
    });

    await waitFor(() => {
      expect(result.current.error).toBe(testError);
      expect(result.current.events).toEqual([]);
    });
  });
});
