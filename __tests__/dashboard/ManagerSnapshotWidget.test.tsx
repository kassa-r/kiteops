import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ManagerSnapshotWidget } from '@/components/dashboard/ManagerSnapshotWidget';

describe('ManagerSnapshotWidget', () => {
  it('renders correct stats', () => {
    const stats = {
      todayLessonCount: 10,
      pendingBookingCount: 5,
      availableInstructorsCount: 3,
    };
    render(<ManagerSnapshotWidget stats={stats} />);
    
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('Scheduled Lessons')).toBeDefined();
    
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('Pending Bookings')).toBeDefined();
    
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('Instructors Available')).toBeDefined();
  });
});
