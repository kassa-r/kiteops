'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AvailabilityService } from "@/lib/availability-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect } from "react";
import { format } from "date-fns";

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  recurrence: z.enum(["none", "weekly"]),
}).refine((data) => {
  const start = new Date(`${data.date}T${data.start_time}`);
  const end = new Date(`${data.date}T${data.end_time}`);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["end_time"],
});

interface AddAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  instructorId: string;
}

export function AddAvailabilityDialog({ open, onOpenChange, defaultDate, instructorId }: AddAvailabilityDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '',
      start_time: defaultDate ? format(defaultDate, 'HH:mm') : '',
      end_time: '',
      recurrence: "none",
    },
  });

  // Update default values when defaultDate changes or dialog opens
  useEffect(() => {
    if (open && defaultDate) {
      form.reset({
        date: format(defaultDate, 'yyyy-MM-dd'),
        start_time: format(defaultDate, 'HH:mm'),
        end_time: '', // User must select end time
        recurrence: "none",
      });
    }
  }, [open, defaultDate, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const start = new Date(`${values.date}T${values.start_time}`);
      const end = new Date(`${values.date}T${values.end_time}`);
      
      // Handle recurrence
      let recurrence_rule = null;
      if (values.recurrence === 'weekly') {
        recurrence_rule = 'FREQ=WEEKLY'; // Simple representation
      }

      await AvailabilityService.createAvailability({
        instructor_id: instructorId,
        start_time: start,
        end_time: end,
        recurrence_rule,
      });
    },
    onSuccess: () => {
      toast.success("Availability added successfully");
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      onOpenChange(false);
      form.reset(); // Reset form after success
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Availability</DialogTitle>
          <DialogDescription>
            Set a time slot when you are available to teach.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
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
                    <FormLabel>End Time</FormLabel>
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
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recurrence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Does not repeat</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Repeat this slot every week?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Availability"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
