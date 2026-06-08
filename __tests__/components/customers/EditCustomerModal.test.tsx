import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
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

const mockCustomer = {
  id: 'cust-123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  role: 'customer' as const,
  skill_level: 'beginner',
  customer_details: {
      skill_level: 'beginner',
      phone: '555-1234'
  }
};

describe('EditCustomerModal', () => {
  it('renders correctly and submits updates', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EditCustomerModal customer={mockCustomer}>
          <button>Edit Customer</button>
        </EditCustomerModal>
      </QueryClientProvider>
    );

    // Open modal
    fireEvent.click(screen.getByText('Edit Customer'));
    expect(screen.getByRole('heading', { name: 'Edit Customer' })).toBeInTheDocument();

    // Check defaults
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();

    // Update form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Updated' } });
    
    // Submit
    mockUpdateUser.mockResolvedValue({ ...mockCustomer, name: 'John Updated' });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith('cust-123', expect.objectContaining({
        name: 'John Updated'
      }));
    });
  });
});
