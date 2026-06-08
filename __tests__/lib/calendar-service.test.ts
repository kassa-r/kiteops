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

    const events = await CalendarService.getInstructorCalendarData(mockUserId, mockStartDate, mockEndDate);
    
    expect(events).toHaveLength(mockAvailability.length + mockBookings.length);
    expect(AvailabilityService.getAvailability).toHaveBeenCalledWith(mockUserId, mockStartDate, mockEndDate);
    expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
    expect(mockSupabase.eq).toHaveBeenCalledWith('instructor_id', mockUserId);
  });

  it('should correctly map availability slots to background events', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue(mockAvailability as any);

    const events = await CalendarService.getInstructorCalendarData(mockUserId, mockStartDate, mockEndDate);
    const availabilityEvent = events.find(e => e.type === 'availability');

    expect(availabilityEvent).toBeDefined();
    expect(availabilityEvent?.title).toBe('Available');
    expect(availabilityEvent?.display).toBe('background');
    expect(availabilityEvent?.backgroundColor).toBe('#ECFDF5');
    expect(availabilityEvent?.borderColor).toBe('#10B981');
    expect(availabilityEvent?.start).toEqual(new Date(mockAvailability[0].start_time));
  });

  it('should correctly map confirmed lessons with the correct color', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue([]);

    const events = await CalendarService.getInstructorCalendarData(mockUserId, mockStartDate, mockEndDate);
    const confirmedLesson = events.find(e => e.status === 'confirmed');

    expect(confirmedLesson).toBeDefined();
    expect(confirmedLesson?.title).toBe('Kite Surfing 101 - John Doe');
    expect(confirmedLesson?.backgroundColor).toBe('#4A90E2');
    expect(confirmedLesson?.borderColor).toBe('#4A90E2');
  });

  it('should correctly map pending lessons with the correct color', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue([]);
    
    const events = await CalendarService.getInstructorCalendarData(mockUserId, mockStartDate, mockEndDate);
    const pendingLesson = events.find(e => e.status === 'pending');

    expect(pendingLesson).toBeDefined();
    expect(pendingLesson?.title).toBe('Advanced Tricks - Jane Smith');
    expect(pendingLesson?.backgroundColor).toBe('#FBBF24'); // Pending color
    expect(pendingLesson?.borderColor).toBe('#FBBF24');
  });

  it('should correctly map cancelled lessons with the correct color', async () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue([]);

    const events = await CalendarService.getInstructorCalendarData(mockUserId, mockStartDate, mockEndDate);
    const cancelledLesson = events.find(e => e.status === 'cancelled');

    expect(cancelledLesson).toBeDefined();
    expect(cancelledLesson?.backgroundColor).toBe('#ef4444'); // Cancelled color
    expect(cancelledLesson?.borderColor).toBe('#ef4444');
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
