import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';

// Mock the hook
vi.mock('@/lib/hooks/useManagerDashboard', () => ({
  useManagerDashboard: () => ({
    stats: {
      todayLessonCount: 10,
      pendingBookingCount: 5,
      availableInstructorsCount: 3,
      weatherConflictCount: 1, // Mock with 1 to test rendering
    },
    upcomingLessons: [
        {
            id: 1,
            start_time: '2023-01-01T10:00:00Z',
            end_time: '2023-01-01T11:00:00Z',
            status: 'confirmed',
            lesson: { name: 'Test Lesson' },
            customer: { full_name: 'Test Student', email: 'test@example.com' },
            instructor: { full_name: 'Test Instructor' },
        }
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('ManagerDashboard', () => {
  it('renders the dashboard title and widgets', () => {
    render(<ManagerDashboard />);
    
    expect(screen.getByRole('heading', { name: 'Manager Dashboard' })).toBeDefined();
    
    // Check if SnapshotWidget content is rendered
    expect(screen.getByText("Today's Snapshot")).toBeDefined();
    expect(screen.getByText('10')).toBeDefined(); // From mock
    
    // Resolution center should show up because mock has 1 conflict
        expect(screen.getByText('Resolution Center')).toBeDefined();
        
        // Check upcoming lessons
        expect(screen.getByText('Upcoming Lessons (Today)')).toBeDefined();
        expect(screen.getByText('Test Lesson')).toBeDefined();
        
        expect(screen.getByText('Quick Actions')).toBeDefined();
  });
});