import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ManagerCalendar } from '../ManagerCalendar';
import { ManagerBooking } from '@/lib/hooks/useManagerDashboard';
import { Availability } from '@/lib/availability-service';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="chevron-left" />,
  ChevronRight: () => <span data-testid="chevron-right" />,
}));

describe('ManagerCalendar', () => {
  afterEach(() => {
    cleanup();
  });

  const mockDate = new Date('2025-12-01T10:00:00Z'); // Monday Dec 1st 2025 (approx)
  // Ensure Monday start: Dec 1 2025 is a Monday.
  
  const mockBookings: ManagerBooking[] = [
    {
      id: 1,
      start_time: '2025-12-01T09:00:00Z',
      end_time: '2025-12-01T11:00:00Z',
      status: 'confirmed',
      lesson: { name: 'Kite Basics' },
      customer: { full_name: 'John Doe', email: 'john@example.com' },
      instructor: { full_name: 'Instructor Mike' },
    },
  ];

  const mockAvailability: Availability[] = [
    {
      id: 1,
      instructor_id: 'inst-1',
      start_time: '2025-12-01T08:00:00Z',
      end_time: '2025-12-01T12:00:00Z',
      recurrence_rule: null,
    },
  ];

  it('renders correctly with events', () => {
    const onDateChange = vi.fn();
    render(
      <ManagerCalendar
        bookings={mockBookings}
        availability={mockAvailability}
        currentDate={mockDate}
        onDateChange={onDateChange}
      />
    );

    // Check for month header
    expect(screen.getByText(/December 2025/i)).toBeDefined();

    // Check for booking
    expect(screen.getByText('Kite Basics')).toBeDefined();
    expect(screen.getByText('Instructor Mike')).toBeDefined();

    // Check for availability
    expect(screen.getAllByText('Avail')).toHaveLength(1);
  });

  it('navigates weeks', () => {
    const onDateChange = vi.fn();
    render(
      <ManagerCalendar
        bookings={[]}
        availability={[]}
        currentDate={mockDate}
        onDateChange={onDateChange}
      />
    );

    fireEvent.click(screen.getByTestId('chevron-right'));
    expect(onDateChange).toHaveBeenCalled();
  });
});
