'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInstructors, useLessons, useCustomers } from '@/lib/hooks/useSchoolData';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const formSchema = z.object({
  customer_id: z.string().min(1, { message: 'Customer is required' }),
  
  // New Customer Fields
  new_customer_name: z.string().optional(),
  new_customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  new_customer_phone: z.string().optional(),
  new_customer_skill_level: z.string().optional(),
  new_customer_age: z.string().optional(),
  new_customer_gender: z.string().optional(),
  new_customer_experience: z.string().optional(),

  instructor_id: z.string().optional(),
  lesson_id: z.string().min(1, { message: 'Lesson type is required' }),
  date: z.string().min(1, { message: 'Date is required' }),
  start_time: z.string().min(1, { message: 'Start time is required' }),
  end_time: z.string().min(1, { message: 'End time is required' }),
  manager_notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.customer_id === 'new') {
    if (!data.new_customer_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name is required for new customer",
        path: ["new_customer_name"],
      });
    }
    if (!data.new_customer_email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required for new customer",
        path: ["new_customer_email"],
      });
    }
  }
});

export type ManagerBookingFormValues = z.infer<typeof formSchema>;

interface ManagerBookingFormProps {
  defaultValues?: Partial<ManagerBookingFormValues>;
  onSubmit: (values: ManagerBookingFormValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ManagerBookingForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Save' }: ManagerBookingFormProps) {
  const { data: instructors } = useInstructors();
  const { data: customers } = useCustomers();
  const { data: lessons } = useLessons();

  const form = useForm<ManagerBookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        customer_id: '',
        instructor_id: 'unassigned', 
        lesson_id: '',
        date: '',
        start_time: '',
        end_time: '',
        manager_notes: '',
        new_customer_name: '',
        new_customer_email: '',
        new_customer_phone: '',
        new_customer_skill_level: '',
        new_customer_gender: '',
        new_customer_age: '',
        new_customer_experience: '',
        ...defaultValues
    },
  });

  const watchCustomerId = form.watch('customer_id');
  const isNewCustomer = watchCustomerId === 'new';

  // Auto-calculate end time if lesson changes
  const watchLessonId = form.watch('lesson_id');
  const watchStartTime = form.watch('start_time');

  useEffect(() => {
    if (watchLessonId && watchStartTime && lessons) {
        const lesson = lessons.find(l => l.id.toString() === watchLessonId);
        if (lesson) {
            const [hours, minutes] = watchStartTime.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes);
            date.setMinutes(date.getMinutes() + lesson.duration_minutes);
            const endHours = date.getHours().toString().padStart(2, '0');
            const endMinutes = date.getMinutes().toString().padStart(2, '0');
            form.setValue('end_time', `${endHours}:${endMinutes}`);
        }
    }
  }, [watchLessonId, watchStartTime, lessons, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="new" className="font-semibold text-primary">+ New Customer</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isNewCustomer && (
          <div className="p-4 border rounded-md bg-muted/20 space-y-4">
            <h4 className="text-sm font-semibold">New Customer Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="new_customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="new_customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="new_customer_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="new_customer_skill_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-3 gap-4">
               <FormField
                control={form.control}
                name="new_customer_age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="new_customer_gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="new_customer_experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exp (hrs)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="lesson_id"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Lesson Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select lesson" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {lessons?.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id.toString()}>
                        {lesson.name} ({lesson.duration_minutes}m)
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="instructor_id"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Instructor (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "unassigned"}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Assign instructor" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {instructors?.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.full_name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-3 gap-4">
             <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Start</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>End</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="manager_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manager Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Internal notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitLabel}
            </Button>
        </div>
      </form>
    </Form>
  );
}