'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lesson } from '@/lib/lesson-service';
import { useEffect } from 'react';

const lessonTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  duration_minutes: z.coerce.number().min(15, 'Duration must be at least 15 minutes'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
});

interface EditLessonTypeModalProps {
  lessonType: Lesson | null;
  onSave: (id: number, data: Partial<Lesson>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLessonTypeModal({ lessonType, onSave, open, onOpenChange }: EditLessonTypeModalProps) {
  const form = useForm<z.infer<typeof lessonTypeSchema>>({
    resolver: zodResolver(lessonTypeSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      duration_minutes: 60,
      price: 0,
    },
  });

  useEffect(() => {
    if (lessonType) {
      form.reset({
        name: lessonType.name,
        description: lessonType.description || '',
        duration_minutes: lessonType.duration_minutes,
        price: lessonType.price,
      });
    }
  }, [lessonType, form]);

  function onSubmit(values: z.infer<typeof lessonTypeSchema>) {
    if (lessonType) {
      onSave(lessonType.id, {
        ...values,
        description: values.description || null,
      });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Lesson Type</DialogTitle>
          <DialogDescription>
            Modify lesson type details.
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
                    <Input {...field} />
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
                    <Input {...field} value={field.value || ''} />
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
            <Button type="submit">Save Changes</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
