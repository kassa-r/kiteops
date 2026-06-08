'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { createBooking, Booking } from '@/lib/booking-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookingSuccess } from '@/components/booking/BookingSuccess';

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: 'Full name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().min(10, {
    message: 'Phone number must be at least 10 digits.',
  }),
  policy: z.boolean().refine((val) => val, {
    message: 'You must accept the policies to continue.',
  }),
});

interface BookingResponse {
  success: boolean;
  booking_reference: string;
  instructor_name?: string;
  secure_token?: string;
}

export function BookingForm({
  lessonId,
  lessonName,
  slotId,
  onClose,
}: {
  lessonId: number;
  lessonName: string;
  slotId: string;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingData, setBookingData] = useState<BookingResponse | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      policy: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setSubmissionError(null);
    setIsSuccess(false);
    setBookingData(null);

    const booking: Booking = {
      lesson_id: lessonId,
      lesson_name: lessonName,
      start_time: slotId,
      customer_info: {
        name: values.fullName,
        email: values.email,
        phone: values.phone,
      },
    };

    try {
      const response: BookingResponse = await createBooking(booking);
      
      // DEBUG: Log the entire response from the service
      console.log("Response from createBooking service:", response);

      if (response.success) {
        setBookingData(response);
        setIsSuccess(true);
        form.reset();
      } else {
        throw new Error('Booking failed. Please try again.');
      }
    } catch (error) {
      if (error instanceof Error) {
        setSubmissionError(error.message);
      } else {
        setSubmissionError('An unknown error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess && bookingData) {
    return (
      <BookingSuccess
        bookingReference={bookingData.booking_reference}
        lessonName={lessonName}
        startTime={slotId}
        instructorName={bookingData.instructor_name}
        secureToken={bookingData.secure_token}
        onClose={onClose}
      />
    );
  }

  if (isSuccess) {
     // Fallback if bookingData is missing for some reason
    return (
      <Alert variant="default">
        <AlertTitle>Booking Successful!</AlertTitle>
        <AlertDescription>
          Your lesson has been booked. Please check your email for a confirmation.
        </AlertDescription>
         <div className="mt-4 flex justify-end">
            <Button onClick={onClose} variant="outline" size="sm">Close</Button>
         </div>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="john.doe@example.com"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="123-456-7890"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="policy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I accept the cancellation and rebooking policies
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        {submissionError && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{submissionError}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Booking...' : 'Book Lesson'}
        </Button>
      </form>
    </Form>
  );
}
