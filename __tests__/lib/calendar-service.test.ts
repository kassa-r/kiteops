import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarService } from '@/lib/calendar-service';
import { AvailabilityService } from '@/lib/availability-service';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
vi.mock('@/lib/availability-service');
vi.mock('@/lib/supabase/client');

describe('CalendarService', () => {
  const mockUserId = 'test-instructor-id';
  const mockStartDate = new Date('2025-01-01');
  const mockEndDate = new Date('2025-01-31');

  const mockAvailability = [
    { id: 'avail1', start_time: '2025-01-10T09:00:00Z', end_time: '2025-01-10T11:00:00Z' },
  ];

  const mockBookings = [
    {
      id: 'booking1',
      start_time: '2025-01-15T14:00:00Z',
      end_time: '2025-01-15T15:00:00Z',
      status: 'confirmed',
      lesson: { name: 'Kite Surfing 101' },
      customer: { full_name: 'John Doe' },
    },
    {
      id: 'booking2',
      start_time: '2025-01-16T10:00:00Z',
      end_time: '2025-01-16T11:00:00Z',
      status: 'pending',
      lesson: { name: 'Advanced Tricks' },
      customer: { full_name: 'Jane Smith' },
    },
    {
        id: 'booking3',
        start_time: '2025-01-17T10:00:00Z',
        end_time: '2025-01-17T11:00:00Z',
        status: 'cancelled',
        lesson: { name: 'Cancelled Lesson' },
        customer: { full_name: 'No Show' },
    }
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch and combine availability and booking events', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue(mockAvailability as any);

    const { bookings, availability } = await CalendarService.getInstructorCalendarData(mockUserId, mockStartDate, mockEndDate);
    
    expect(bookings).toEqual(mockBookings);
    expect(availability).toEqual(mockAvailability);
    expect(AvailabilityService.getAvailability).toHaveBeenCalledWith(mockUserId, mockStartDate, mockEndDate);
    expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
    expect(mockSupabase.eq).toHaveBeenCalledWith('instructor_id', mockUserId);
  });

  it('should correctly return confirmed lessons', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue([]);

    const { bookings } = await CalendarService.getInstructorCalendarData(mockUserId, mockStartDate, mockEndDate);
    const confirmedLesson = bookings.find(b => b.status === 'confirmed');

    expect(confirmedLesson).toBeDefined();
    expect(confirmedLesson).toEqual(expect.objectContaining({
      id: 'booking1',
      status: 'confirmed',
      lesson: { name: 'Kite Surfing 101' },
      customer: { full_name: 'John Doe' },
    }));
  });

  it('should correctly return pending lessons', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue([]);
    
    const { bookings } = await CalendarService.getInstructorCalendarData(mockUserId, mockStartDate, mockEndDate);
    const pendingLesson = bookings.find(b => b.status === 'pending');

    expect(pendingLesson).toBeDefined();
    expect(pendingLesson).toEqual(expect.objectContaining({
      id: 'booking2',
      status: 'pending',
      lesson: { name: 'Advanced Tricks' },
      customer: { full_name: 'Jane Smith' },
    }));
  });

  it('should correctly return cancelled lessons', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue([]);

    const { bookings } = await CalendarService.getInstructorCalendarData(mockUserId, mockStartDate, mockEndDate);
    const cancelledLesson = bookings.find(b => b.status === 'cancelled');

    expect(cancelledLesson).toBeDefined();
    expect(cancelledLesson).toEqual(expect.objectContaining({
      id: 'booking3',
      status: 'cancelled',
      lesson: { name: 'Cancelled Lesson' },
      customer: { full_name: 'No Show' },
    }));
  });

  it('should throw an error if fetching bookings fails', async () => {
    const testError = new Error('Supabase fetch failed');
    const mockSupabaseError = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: null, error: testError }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabaseError as any);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue(mockAvailability as any);

    await expect(CalendarService.getInstructorCalendarData(mockUserId, mockStartDate, mockEndDate))
      .rejects.toThrow(testError.message);
  });
});
