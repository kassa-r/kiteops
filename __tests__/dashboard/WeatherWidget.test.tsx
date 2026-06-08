import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WeatherWidget } from '@/components/dashboard/WeatherWidget';
import * as ReactQuery from '@tanstack/react-query';

// Mock useQuery
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({}),
}));

describe('WeatherWidget', () => {
  it('handles loading state', () => {
    (ReactQuery.useQuery as any).mockReturnValue({ isLoading: true });
    render(<WeatherWidget />);
  });

  it('handles error state', () => {
    (ReactQuery.useQuery as any).mockReturnValue({ isLoading: false, error: true });
    render(<WeatherWidget />);
    expect(screen.getByText('Unavailable')).toBeDefined();
  });

  it('renders weather data', () => {
    const mockWeather = {
      current: {
        temp: 25,
        weather: [{ description: 'sunny' }],
        wind_speed: 10,
        wind_deg: 180,
      }
    };
    (ReactQuery.useQuery as any).mockReturnValue({ isLoading: false, data: mockWeather });
    render(<WeatherWidget />);
    expect(screen.getByText('25°C')).toBeDefined();
    expect(screen.getByText('sunny')).toBeDefined();
    expect(screen.getByText(/10 m\/s/)).toBeDefined();
  });
});
