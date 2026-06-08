import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { LessonCard, TimeSlot } from '@/components/LessonCard';

describe('LessonCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockTimeSlots: TimeSlot[] = [
    { id: '1', time: '09:00', available: true },
    { id: '2', time: '12:00', available: false },
    { id: '3', time: '15:00', available: true },
  ];

  const defaultProps = {
    title: 'Beginner Kitesurfing',
    description: 'Learn the basics of kitesurfing.',
    price: '€150',
    duration: '3h',
    instructor: 'Alex Smith',
    timeSlots: mockTimeSlots,
    onTimeSlotClick: vi.fn(),
  };

  it('renders lesson details correctly', () => {
    render(<LessonCard {...defaultProps} />);
    
    expect(screen.getByText('Beginner Kitesurfing')).toBeDefined();
    expect(screen.getByText('Learn the basics of kitesurfing.')).toBeDefined();
    expect(screen.getByText('€150')).toBeDefined();
    expect(screen.getByText('3h')).toBeDefined();
    expect(screen.getByText('Alex Smith')).toBeDefined();
  });

  it('renders time slots correctly', () => {
    render(<LessonCard {...defaultProps} />);
    
    expect(screen.getByText('09:00')).toBeDefined();
    expect(screen.getByText('12:00')).toBeDefined();
    expect(screen.getByText('15:00')).toBeDefined();
  });

  it('calls onTimeSlotClick when an available slot is clicked', () => {
    render(<LessonCard {...defaultProps} />);
    
    const slotButton = screen.getByText('09:00');
    fireEvent.click(slotButton);
    
    expect(defaultProps.onTimeSlotClick).toHaveBeenCalledWith('1');
  });

  it('does not call onTimeSlotClick when an unavailable slot is clicked', () => {
    render(<LessonCard {...defaultProps} />);
    
    const slotButton = screen.getByText('12:00');
    fireEvent.click(slotButton);
    
    expect(defaultProps.onTimeSlotClick).not.toHaveBeenCalled();
    expect(slotButton.hasAttribute('disabled')).toBe(true);
  });

  it('shows empty state message when no time slots are provided', () => {
    render(<LessonCard {...defaultProps} timeSlots={[]} />);
    
    expect(screen.getByText('No slots available')).toBeDefined();
  });

  it('renders with correct accessibility attributes', () => {
    render(<LessonCard {...defaultProps} />);

    const availableSlot = screen.getByText('09:00');
    const unavailableSlot = screen.getByText('12:00');

    expect(availableSlot.getAttribute('aria-label')).toBe('Book lesson at 09:00');
    expect(unavailableSlot.getAttribute('aria-label')).toBe('Time slot 12:00 is unavailable');
  });
});
