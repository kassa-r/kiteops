'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { LessonCard } from '@/components/LessonCard';
import { toast } from "sonner"
import { useState } from 'react';

export default function TestUIPage() {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto bg-background text-foreground font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-primary">UX Patterns Verification</h1>
        <Button onClick={() => toast.success("Success!", { description: "This is a success toast notification." })}>
          Trigger Success Toast
        </Button>
      </div>

      {/* Lesson Card Verification */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">Custom Component: Lesson Card</h2>
        <LessonCard
          title="Beginner Kitesurfing"
          description="3-hour intro course with certified IKO instructor"
          price="€150"
          duration="3h"
          instructor="Alex Smith"
          timeSlots={[
            { id: '1', time: '09:00', available: true },
            { id: '2', time: '13:00', available: false },
            { id: '3', time: '16:00', available: true },
          ]}
          onTimeSlotClick={(id) => toast(`Selected time slot: ${id}`)}
        />
      </section>

      {/* Button Hierarchy */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">Button Hierarchy</h2>
        <div className="flex flex-wrap gap-4 p-6 border rounded-lg bg-card">
          <Button variant="default">Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
          <Button variant="outline">Outline Action</Button>
          <Button variant="ghost">Tertiary (Ghost)</Button>
          <Button variant="link">Link Action</Button>
          <Button variant="destructive">Destructive Action</Button>
        </div>
      </section>

      {/* Form Patterns */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">Form Patterns</h2>
        <Card className="max-w-md">
            <CardHeader>
                <CardTitle>Example Form</CardTitle>
                <CardDescription>Testing label placement and inputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Email Address <span className="text-destructive">*</span>
                    </label>
                    <Input id="email" placeholder="name@example.com" />
                    <p className="text-sm text-muted-foreground">We&apos;ll never share your email.</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full">Submit</Button>
            </CardFooter>
        </Card>
      </section>
      
      {/* Modal Patterns */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">Modal Patterns</h2>
        <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p>You can add more content here.</p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
                <Button type="submit">Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </section>
    </div>
  );
}