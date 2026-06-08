import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteInstructorModal } from '@/components/instructors/DeleteInstructorModal';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock ProfileService
const mockDeleteUser = vi.fn();
vi.mock('@/lib/profile-service', () => ({
  ProfileService: {
    deleteUser: (id: string) => mockDeleteUser(id),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const queryClient = new QueryClient();

describe('DeleteInstructorModal', () => {
  it('renders correctly and confirms deletion', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DeleteInstructorModal instructorId="inst-123" instructorName="John Instructor">
          <button>Delete</button>
        </DeleteInstructorModal>
      </QueryClientProvider>
    );

    // Open modal
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
    expect(screen.getByText(/John Instructor/)).toBeInTheDocument();

    // Confirm
    mockDeleteUser.mockResolvedValue(true);
    fireEvent.click(screen.getByText('Delete Instructor'));

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith('inst-123');
    });
  });
});
