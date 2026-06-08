'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBookingMutations } from '@/lib/hooks/useBookingMutations';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number | null;
  onSuccess?: () => void;
}

export function CancelBookingModal({ isOpen, onClose, bookingId, onSuccess }: CancelBookingModalProps) {
  const { cancelBooking } = useBookingMutations();

  const handleCancel = () => {
    if (bookingId) {
        cancelBooking.mutate(bookingId, {
            onSuccess: () => {
                onClose();
                onSuccess?.();
            }
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={cancelBooking.isPending}>
            Keep Booking
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={cancelBooking.isPending}>
            {cancelBooking.isPending ? 'Cancelling...' : 'Yes, Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
