import { renderHook, waitFor } from '@testing-library/react';
import { useBookingMutations } from '../useBookingMutations';
import { createManagerBooking, updateManagerBooking, cancelManagerBooking } from '../../booking-service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks
vi.mock('../../booking-service', () => ({
  createManagerBooking: vi.fn(),
  updateManagerBooking: vi.fn(),
  cancelManagerBooking: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock QueryClient
const invalidateQueriesMock = vi.fn();
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: invalidateQueriesMock,
    }),
    useMutation: actual.useMutation,
  };
});

// Wrapper for React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBookingMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle createBooking success', async () => {
    (createManagerBooking as any).mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useBookingMutations(), { wrapper: createWrapper() });

    result.current.createBooking.mutate({} as any);

    await waitFor(() => expect(result.current.createBooking.isSuccess).toBe(true));
    expect(createManagerBooking).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Booking created successfully');
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['manager-calendar'] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['dashboard-stats'] });
  });

  it('should handle createBooking error', async () => {
    (createManagerBooking as any).mockRejectedValue(new Error('Create failed'));
    const { result } = renderHook(() => useBookingMutations(), { wrapper: createWrapper() });

    result.current.createBooking.mutate({} as any);

    await waitFor(() => expect(result.current.createBooking.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith('Failed to create booking: Create failed');
  });

  it('should handle updateBooking success', async () => {
    (updateManagerBooking as any).mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useBookingMutations(), { wrapper: createWrapper() });

    result.current.updateBooking.mutate({} as any);

    await waitFor(() => expect(result.current.updateBooking.isSuccess).toBe(true));
    expect(updateManagerBooking).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Booking updated successfully');
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(2); // Two invalidations
  });

  it('should handle updateBooking error', async () => {
    (updateManagerBooking as any).mockRejectedValue(new Error('Update failed'));
    const { result } = renderHook(() => useBookingMutations(), { wrapper: createWrapper() });

    result.current.updateBooking.mutate({} as any);

    await waitFor(() => expect(result.current.updateBooking.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith('Failed to update booking: Update failed');
  });

  it('should handle cancelBooking success', async () => {
    (cancelManagerBooking as any).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useBookingMutations(), { wrapper: createWrapper() });

    result.current.cancelBooking.mutate(1);

    await waitFor(() => expect(result.current.cancelBooking.isSuccess).toBe(true));
    expect(cancelManagerBooking).toHaveBeenCalledWith(1, expect.anything());
    expect(toast.success).toHaveBeenCalledWith('Booking cancelled successfully');
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(2);
  });

  it('should handle cancelBooking error', async () => {
    (cancelManagerBooking as any).mockRejectedValue(new Error('Cancel failed'));
    const { result } = renderHook(() => useBookingMutations(), { wrapper: createWrapper() });

    result.current.cancelBooking.mutate(1);

    await waitFor(() => expect(result.current.cancelBooking.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith('Failed to cancel booking: Cancel failed');
  });
});
