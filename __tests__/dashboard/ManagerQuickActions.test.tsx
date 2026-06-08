import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ManagerQuickActions } from '@/components/dashboard/ManagerQuickActions';

describe('ManagerQuickActions', () => {
  it('renders quick action buttons', () => {
    render(<ManagerQuickActions />);
    
    expect(screen.getByRole('link', { name: /View Full Calendar/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Add Booking/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Manage Instructors/i })).toBeDefined();
  });
});
