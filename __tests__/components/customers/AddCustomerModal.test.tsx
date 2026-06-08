import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
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

describe('AddCustomerModal', () => {
  it('renders correctly and submits form', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AddCustomerModal>
          <button>Open Modal</button>
        </AddCustomerModal>
      </QueryClientProvider>
    );

    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByText('Add New Customer')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test Customer' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    
    // Submit
    mockCreateUser.mockResolvedValue('new-id');
    fireEvent.click(screen.getByText('Create Customer'));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Customer',
        email: 'test@example.com',
        role: 'customer'
      }));
    });
  });
});
