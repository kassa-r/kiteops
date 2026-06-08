import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResolutionCenter from '../ResolutionCenter';
import * as useResolutionCenterData from '@/lib/hooks/useManagerDashboard';
import { describe, it, expect, vi } from 'vitest';

// Mock the hook
vi.mock('@/lib/hooks/useManagerDashboard', () => ({
  useResolutionCenterData: vi.fn(),
}));

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ResolutionCenter', () => {
  it('renders loading state initially', () => {
    (useResolutionCenterData.useResolutionCenterData as jest.Mock).mockReturnValue({
      conflictedBookings: [],
      isLoading: true,
      error: null,
    });

    render(<ResolutionCenter />, { wrapper });

    expect(screen.getByText('Resolution Center')).toBeInTheDocument();
    // JSDOM doesn't render visual styles, so we can't count skeletons reliably.
    // Let's check for the presence of the container.
    const container = screen.getByText('Resolution Center').parentElement;
    expect(container?.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('renders error state', () => {
    (useResolutionCenterData.useResolutionCenterData as jest.Mock).mockReturnValue({
      conflictedBookings: [],
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    render(<ResolutionCenter />, { wrapper });

    expect(screen.getByText('Error fetching data: Failed to fetch')).toBeInTheDocument();
  });

  it('renders no conflicts message', () => {
    (useResolutionCenterData.useResolutionCenterData as jest.Mock).mockReturnValue({
      conflictedBookings: [],
      isLoading: false,
      error: null,
    });

    render(<ResolutionCenter />, { wrapper });

    expect(screen.getByText('No weather-related conflicts to resolve at this time.')).toBeInTheDocument();
  });

  it('renders a list of conflicted bookings', async () => {
    const mockBookings = [
      {
        id: 1,
        lesson: { name: 'Kite Surfing 101' },
        customer: { full_name: 'John Doe' },
        instructor: { full_name: 'Jane Smith' },
        start_time: new Date().toISOString(),
        weather_data: { wind_speed: { conflict: true, value: 5, unit: 'knots', threshold: 10 } },
      },
    ];
    (useResolutionCenterData.useResolutionCenterData as jest.Mock).mockReturnValue({
      conflictedBookings: mockBookings,
      isLoading: false,
      error: null,
    });

    render(<ResolutionCenter />, { wrapper });
    
    await waitFor(() => {
        expect(screen.getByText('Kite Surfing 101')).toBeInTheDocument();
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
        expect(screen.getByText(/wind speed: 5 knots/)).toBeInTheDocument();
    });
  });
});
