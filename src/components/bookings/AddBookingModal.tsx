'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ManagerBookingForm, ManagerBookingFormValues } from './ManagerBookingForm';
import { useBookingMutations } from '@/lib/hooks/useBookingMutations';

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultTime?: string;
  defaultInstructorId?: string;
}

export function AddBookingModal({ isOpen, onClose, defaultDate, defaultTime, defaultInstructorId }: AddBookingModalProps) {
  const { createBooking } = useBookingMutations();
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (values: ManagerBookingFormValues) => {
    // Combine date and time to ISO strings
    const startDateTime = new Date(`${values.date}T${values.start_time}:00`);
    const endDateTime = new Date(`${values.date}T${values.end_time}:00`);

    const isNewCustomer = values.customer_id === 'new';

    const bookingData = {
      customer_id: isNewCustomer ? undefined : values.customer_id,
      instructor_id: values.instructor_id === 'unassigned' ? null : values.instructor_id,
      lesson_id: parseInt(values.lesson_id),
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      manager_notes: values.manager_notes,
      new_customer: isNewCustomer ? {
          full_name: values.new_customer_name!,
          email: values.new_customer_email!,
          phone: values.new_customer_phone,
          skill_level: values.new_customer_skill_level,
          age: values.new_customer_age && !isNaN(Number(values.new_customer_age)) ? Number(values.new_customer_age) : undefined,
          gender: values.new_customer_gender,
          experience_hours: values.new_customer_experience && !isNaN(Number(values.new_customer_experience)) ? Number(values.new_customer_experience) : undefined,
      } : undefined
    };

    createBooking.mutate(bookingData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Booking</DialogTitle>
          <DialogDescription>
            Manually create a booking for a customer.
          </DialogDescription>
        </DialogHeader>
        <ManagerBookingForm 
            onSubmit={handleSubmit} 
            isLoading={createBooking.isPending} 
            defaultValues={{
                date: defaultDate || today,
                start_time: defaultTime || '09:00',
                instructor_id: defaultInstructorId,
            }}
        />
      </DialogContent>
    </Dialog>
  );
}
