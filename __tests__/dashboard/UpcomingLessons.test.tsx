import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UpcomingLessons } from '@/components/dashboard/UpcomingLessons';

describe('UpcomingLessons', () => {
  it('renders list correctly', () => {
    const lessons = [
      { id: 1, start_time: '2023-10-10T10:00:00Z', end_time: '2023-10-10T11:00:00Z', status: 'confirmed', lesson: { name: 'Kite Intro' }, profiles: { full_name: 'John Doe', email: 'john@example.com' } }
    ];
    render(<UpcomingLessons lessons={lessons as any} />);
    expect(screen.getByText('Kite Intro')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
  });

  it('renders empty state', () => {
    render(<UpcomingLessons lessons={[]} />);
    expect(screen.getByText(/No upcoming lessons/)).toBeDefined();
  });
});
