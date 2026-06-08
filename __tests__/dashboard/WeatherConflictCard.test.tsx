import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WeatherConflictCard } from '@/components/dashboard/WeatherConflictCard';

describe('WeatherConflictCard', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(<WeatherConflictCard conflictCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when conflicts exist', () => {
    render(<WeatherConflictCard conflictCount={3} />);
    
    expect(screen.getByText('Resolution Center')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('Lessons Need Review')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Review Lessons' })).toBeDefined();
  });
});
