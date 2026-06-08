import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerDetailsModal } from '@/components/customers/CustomerDetailsModal';
import { describe, it, expect } from 'vitest';

const mockCustomer = {
  id: 'cust-123',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-5678',
  role: 'customer' as const,
  skill_level: 'advanced',
  customer_details: {
      skill_level: 'advanced',
      phone: '555-5678'
  },
  created_at: '2023-01-01T12:00:00Z',
  experience_hours: 10,
  age: 25,
  gender: 'female',
  additional_notes: 'Loves kiting'
};

describe('CustomerDetailsModal', () => {
  it('renders customer details correctly', () => {
    render(
        <CustomerDetailsModal customer={mockCustomer}>
          <button>View Details</button>
        </CustomerDetailsModal>
    );

    // Open modal
    fireEvent.click(screen.getByText('View Details'));
    expect(screen.getByText('Customer Details')).toBeInTheDocument();

    // Check details
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-5678')).toBeInTheDocument();
    expect(screen.getByText('advanced')).toBeInTheDocument();
    expect(screen.getByText('10 hours')).toBeInTheDocument();
    expect(screen.getByText('Loves kiting')).toBeInTheDocument();
  });
});
