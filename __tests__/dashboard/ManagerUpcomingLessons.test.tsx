import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ManagerUpcomingLessons } from '@/components/dashboard/ManagerUpcomingLessons';
import { ManagerBooking } from '@/lib/hooks/useManagerDashboard';

describe('ManagerUpcomingLessons', () => {
  it('renders empty state when no lessons', () => {
    render(<ManagerUpcomingLessons lessons={[]} />);
    expect(screen.getByText('No lessons scheduled for today.')).toBeDefined();
  });

  it('renders lessons correctly', () => {
    const lessons: ManagerBooking[] = [
      {
        id: 1,
        start_time: '2023-01-01T10:00:00Z',
        end_time: '2023-01-01T11:00:00Z',
        status: 'confirmed',
        lesson: { name: 'Kite Surfing 101' },
        customer: { full_name: 'John Doe', email: 'john@example.com' },
        instructor: { full_name: 'Jane Smith' },
      },
    ];

    render(<ManagerUpcomingLessons lessons={lessons} />);
    
    expect(screen.getByText('Kite Surfing 101')).toBeDefined();
    expect(screen.getByText('Instructor: Jane Smith')).toBeDefined();
    expect(screen.getByText('Student: John Doe')).toBeDefined();
    expect(screen.getByText('confirmed')).toBeDefined();
  });
});
