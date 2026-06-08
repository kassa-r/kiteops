'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lesson } from '@/lib/lesson-service';
import { useState } from 'react';

const lessonTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(), // Allow null
  duration_minutes: z.coerce.number().min(15, 'Duration must be at least 15 minutes'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
});

interface AddLessonTypeModalProps {
  onAdd: (data: Omit<Lesson, 'id' | 'active'>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddLessonTypeModal({ onAdd, open, onOpenChange }: AddLessonTypeModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const show = isControlled ? open : internalOpen;
  const setShow = isControlled ? onOpenChange : setInternalOpen;

  const form = useForm<z.infer<typeof lessonTypeSchema>>({
    resolver: zodResolver(lessonTypeSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      duration_minutes: 60,
      price: 0,
    },
  });

  function onSubmit(values: z.infer<typeof lessonTypeSchema>) {
    onAdd({
      ...values,
      description: values.description || null,
    });
    form.reset();
    if (setShow) setShow(false);
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogTrigger asChild>
        <Button>Add New Lesson Type</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Lesson Type</DialogTitle>
          <DialogDescription>
            Create a new lesson type offering.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Kite Beginner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Short description" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit">Add Lesson Type</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
