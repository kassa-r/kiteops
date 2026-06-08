import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BookingSuccess } from '../../components/booking/BookingSuccess';

// Mock UI components to avoid Radix Context issues
vi.mock('@/components/ui/dialog', () => ({
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
}));

describe('BookingSuccess', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    bookingReference: 'REF-12345',
    lessonName: 'Private Kitesurfing',
    startTime: '2025-08-24T10:00:00Z',
    onClose: vi.fn(),
  };

  it('renders confirmation message and reference number', () => {
    render(<BookingSuccess {...defaultProps} />);
    
    expect(screen.getByText('Booking Confirmed!')).toBeDefined();
    expect(screen.getByText('REF-12345')).toBeDefined();
    expect(screen.getByText('Private Kitesurfing')).toBeDefined();
  });

  it('renders default location if not provided', () => {
    render(<BookingSuccess {...defaultProps} />);
    expect(screen.getByText('Sandy Point Beach')).toBeDefined();
  });

  it('renders instructor name if provided', () => {
    render(<BookingSuccess {...defaultProps} instructorName="Alex" />);
    expect(screen.getByText('Alex')).toBeDefined();
  });

  it('renders placeholder if instructor not provided', () => {
    render(<BookingSuccess {...defaultProps} />);
    expect(screen.getByText('Instructor Assigned Soon')).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    render(<BookingSuccess {...defaultProps} />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('copies reference to clipboard when copy button is clicked', async () => {
    const writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<BookingSuccess {...defaultProps} />);
    
    const copyButton = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith('REF-12345');
  });
});
