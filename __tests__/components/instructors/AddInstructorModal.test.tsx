import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddInstructorModal } from '@/components/instructors/AddInstructorModal';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock ProfileService
const mockCreateUser = vi.fn();
vi.mock('@/lib/profile-service', () => ({
  ProfileService: {
    createUser: (data: any) => mockCreateUser(data),
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

describe('AddInstructorModal', () => {
  it('renders correctly and submits form', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AddInstructorModal>
          <button>Add Instructor</button>
        </AddInstructorModal>
      </QueryClientProvider>
    );

    // Open modal
    fireEvent.click(screen.getByText('Add Instructor'));
    expect(screen.getByText('Add New Instructor')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Instructor One' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'instructor@example.com' } });
    
    // Submit
    mockCreateUser.mockResolvedValue('inst-id');
    fireEvent.click(screen.getByText('Create Instructor'));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Instructor One',
        email: 'instructor@example.com',
        role: 'instructor'
      }));
    });
  });
});
