import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SnapshotWidget } from '@/components/dashboard/SnapshotWidget';

describe('SnapshotWidget', () => {
  it('renders correct counts', () => {
    const stats = { todayLessonCount: 5, pendingBookingCount: 2 };
    render(<SnapshotWidget stats={stats} />);
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText(/Pending/)).toBeDefined();
    expect(screen.getByText('2 Pending')).toBeDefined();
  });
});
