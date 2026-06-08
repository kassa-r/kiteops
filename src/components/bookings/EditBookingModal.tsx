'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ManagerBookingForm, ManagerBookingFormValues } from './ManagerBookingForm';
import { useBookingMutations } from '@/lib/hooks/useBookingMutations';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CancelBookingModal } from './CancelBookingModal';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: number;
    customer_id: string;
    instructor_id?: string | null;
    lesson_id: number;
    start_time: string;
    end_time: string;
    manager_notes?: string;
  } | null;
}

export function EditBookingModal({ isOpen, onClose, booking }: EditBookingModalProps) {
  const { updateBooking } = useBookingMutations();
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  if (!booking) return null;

  const startDate = new Date(booking.start_time);
  const endDate = new Date(booking.end_time);

  const defaultValues: Partial<ManagerBookingFormValues> = {
      customer_id: booking.customer_id,
      instructor_id: booking.instructor_id || 'unassigned',
      lesson_id: booking.lesson_id.toString(),
      date: format(startDate, 'yyyy-MM-dd'),
      start_time: format(startDate, 'HH:mm'),
      end_time: format(endDate, 'HH:mm'),
      manager_notes: booking.manager_notes,
  };

  const handleSubmit = async (values: ManagerBookingFormValues) => {
    const startDateTime = new Date(`${values.date}T${values.start_time}:00`);
    const endDateTime = new Date(`${values.date}T${values.end_time}:00`);

    const updateData = {
      id: booking.id,
      customer_id: values.customer_id,
      instructor_id: values.instructor_id === 'unassigned' ? null : values.instructor_id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      manager_notes: values.manager_notes,
      lesson_id: parseInt(values.lesson_id), 
    };

    updateBooking.mutate(updateData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Modify booking details.
          </DialogDescription>
        </DialogHeader>
        <ManagerBookingForm 
            onSubmit={handleSubmit} 
            isLoading={updateBooking.isPending} 
            defaultValues={defaultValues}
            submitLabel="Update Booking"
        />
        <div className="flex justify-start border-t pt-4 mt-4">
             <Button variant="destructive" type="button" onClick={() => setIsCancelOpen(true)}>
                Cancel Booking
            </Button>
        </div>
      </DialogContent>
    </Dialog>

    <CancelBookingModal 
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        bookingId={booking.id}
        onSuccess={onClose}
    />
    </>
  );
}