import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditInstructorModal } from '@/components/instructors/EditInstructorModal';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock ProfileService
const mockUpdateUser = vi.fn();
vi.mock('@/lib/profile-service', () => ({
  ProfileService: {
    updateUser: (id: string, data: any) => mockUpdateUser(id, data),
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

const mockInstructor = {
  id: 'inst-123',
  name: 'Instructor Edit',
  email: 'inst@example.com',
  phone: '555-9999',
  role: 'instructor' as const,
  instructor_details: {
      certifications: ['IKO Level 1'],
      lesson_types: ['Beginner']
  }
};

describe('EditInstructorModal', () => {
  it('renders correctly and submits updates', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EditInstructorModal instructor={mockInstructor}>
          <button>Edit Instructor</button>
        </EditInstructorModal>
      </QueryClientProvider>
    );

    // Open modal
    fireEvent.click(screen.getByText('Edit Instructor'));
    expect(screen.getByRole('heading', { name: 'Edit Instructor' })).toBeInTheDocument();

    // Check defaults
    expect(screen.getByDisplayValue('Instructor Edit')).toBeInTheDocument();
    
    // Update form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Instructor Updated' } });
    
    // Submit
    mockUpdateUser.mockResolvedValue({ ...mockInstructor, name: 'Instructor Updated' });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith('inst-123', expect.objectContaining({
        name: 'Instructor Updated'
      }));
    });
  });
});
