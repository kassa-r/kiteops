import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { WeatherParamsForm } from '@/components/settings/WeatherParamsForm';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the hook
const mutateMock = vi.fn();
vi.mock('@/lib/hooks/useSchoolSettings', () => ({
  useUpdateSchoolSettings: () => ({
    mutate: mutateMock,
    isPending: false,
  }),
}));

describe('WeatherParamsForm', () => {
  beforeEach(() => {
    mutateMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders with default values', () => {
    render(<WeatherParamsForm />);
    expect(screen.getByLabelText(/Min Wind Speed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Max Wind Speed/i)).toBeInTheDocument();
  });

  it('renders with initial data', () => {
    const initialData = {
      min_wind_speed: 12,
      max_wind_speed: 25,
      allow_precipitation: true,
      preferred_wind_directions: ['N', 'S'],
    };
    render(<WeatherParamsForm initialData={initialData} />);
    
    expect(screen.getByLabelText(/Min Wind Speed/i)).toHaveValue(12);
    expect(screen.getByLabelText(/Max Wind Speed/i)).toHaveValue(25);
    // Checkbox check
    expect(screen.getByRole('checkbox', { name: /Allow Precipitation/i })).toBeChecked();
    // Directions check
    expect(screen.getByLabelText(/Preferred Wind Directions/i)).toHaveValue('N, S');
  });

  it('validates min <= max', async () => {
    render(<WeatherParamsForm />);
    
    fireEvent.input(screen.getByLabelText(/Min Wind Speed/i), { target: { value: '40' } });
    fireEvent.input(screen.getByLabelText(/Max Wind Speed/i), { target: { value: '30' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(screen.getByText(/Minimum wind speed cannot be greater than maximum wind speed/i)).toBeInTheDocument();
    });
    
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('submits valid data', async () => {
    render(<WeatherParamsForm />);
    
    fireEvent.input(screen.getByLabelText(/Min Wind Speed/i), { target: { value: '15' } });
    fireEvent.input(screen.getByLabelText(/Max Wind Speed/i), { target: { value: '25' } });
    fireEvent.input(screen.getByLabelText(/Preferred Wind Directions/i), { target: { value: 'W, NW' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith({
        weather_api_thresholds: {
          min_wind_speed: 15,
          max_wind_speed: 25,
          allow_precipitation: false,
          preferred_wind_directions: ['W', 'NW'],
        },
      });
    });
  });
});
