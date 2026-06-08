import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ManagerBookingForm } from '../ManagerBookingForm';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock hooks
vi.mock('@/lib/hooks/useSchoolData', () => ({
  useInstructors: () => ({ data: [{ id: 'inst-1', full_name: 'Alice Instructor' }], isLoading: false }),
  useCustomers: () => ({ data: [{ id: 'cust-1', full_name: 'Bob Customer' }], isLoading: false }),
  useLessons: () => ({ data: [{ id: 1, name: 'Kite Beginner', duration_minutes: 60 }], isLoading: false }),
}));

// Mock Pointer Events for Radix UI
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('ManagerBookingForm', () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders form fields correctly', () => {
    render(<ManagerBookingForm onSubmit={mockSubmit} />);
    expect(screen.getByText('Customer')).toBeDefined();
    expect(screen.getByText('Lesson Type')).toBeDefined();
    expect(screen.getByText('Date')).toBeDefined();
    expect(screen.getByText('Start')).toBeDefined();
    expect(screen.getByText('End')).toBeDefined();
    expect(screen.getByText('Manager Notes')).toBeDefined();
  });

  it('validates required fields', async () => {
    render(<ManagerBookingForm onSubmit={mockSubmit} />);
    
    const submitBtn = screen.getAllByRole('button', { name: /Save/i })[0];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Customer is required')).toBeDefined();
      expect(screen.getByText('Lesson type is required')).toBeDefined();
      expect(screen.getByText('Date is required')).toBeDefined();
      expect(screen.getByText('Start time is required')).toBeDefined();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data', async () => {
      const user = userEvent.setup();
      render(<ManagerBookingForm onSubmit={mockSubmit} />);
      
      // Select Customer
      const customerTrigger = screen.getAllByRole('combobox', { name: 'Customer' })[0];
      await user.click(customerTrigger);
      const customerOption = await screen.findByRole('option', { name: 'Bob Customer' });
      await user.click(customerOption);

      // Select Lesson
      const lessonTrigger = screen.getAllByRole('combobox', { name: 'Lesson Type' })[0];
      await user.click(lessonTrigger);
      const lessonOption = await screen.findByRole('option', { name: /Kite Beginner/i });
      await user.click(lessonOption);

      // Fill Date
      const dateInputs = screen.getAllByLabelText('Date');
      await user.type(dateInputs[0], '2025-12-12');

      // Fill Start Time
      const startTimeInputs = screen.getAllByLabelText('Start');
      await user.type(startTimeInputs[0], '10:00');
      
      const submitBtn = screen.getAllByRole('button', { name: /Save/i })[0];
      await user.click(submitBtn);

      await waitFor(() => {
          expect(mockSubmit).toHaveBeenCalled();
          const formData = mockSubmit.mock.calls[0][0];
          expect(formData.customer_id).toBe('cust-1');
          expect(formData.lesson_id).toBe('1');
          expect(formData.date).toBe('2025-12-12');
          expect(formData.start_time).toBe('10:00');
      });
  });

  it('updates end time automatically based on lesson duration', async () => {
      const user = userEvent.setup();
      render(<ManagerBookingForm onSubmit={mockSubmit} />);

      // Select Lesson (60 mins)
      const lessonTrigger = screen.getAllByRole('combobox', { name: 'Lesson Type' })[0];
      await user.click(lessonTrigger);
      const lessonOption = await screen.findByRole('option', { name: /Kite Beginner/i });
      await user.click(lessonOption);

      // Fill Start Time
      const startTimeInputs = screen.getAllByLabelText('Start');
      await user.type(startTimeInputs[0], '10:00');

      // Check End Time
      const endTimeInputs = screen.getAllByLabelText('End');
      const endTimeInput = endTimeInputs[0] as HTMLInputElement;
      
      await waitFor(() => {
          expect(endTimeInput.value).toBe('11:00');
      });
  });
});