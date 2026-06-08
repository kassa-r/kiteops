'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LessonCard } from '@/components/LessonCard';
import { BookingForm } from '@/components/BookingForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface AvailabilityResult {
  start_time: string;
  available_slots: number;
  lesson_id: number;
  lesson_name: string;
  price: number;
  duration: number;
}

interface GroupedLesson {
  lesson_id: number;
  lesson_name: string;
  price: number;
  duration: number;
  slots: AvailabilityResult[];
}

export function LessonSearch() {
  const [date, setDate] = useState<string>('');
  const [skill, setSkill] = useState<string>('');
  const [lessonType, setLessonType] = useState<string>('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<GroupedLesson | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const fetchLessons = async () => {
    if (!date) return [];
    
    const params = new URLSearchParams();
    params.append('date', date);
    if (skill && skill !== 'all') params.append('skill_level', skill);
    if (lessonType && lessonType !== 'all') params.append('lesson_type', lessonType);

    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-available-lessons?${params.toString()}`;
    const res = await fetch(functionUrl, {
       headers: {
         'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
       }
    });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch');
    }
    return res.json() as Promise<AvailabilityResult[]>;
  };

  const { data: rawLessons, isLoading, error } = useQuery({
    queryKey: ['available-lessons', date, skill, lessonType],
    queryFn: fetchLessons,
    enabled: !!date,
  });

  // Group lessons
  const groupedLessons: GroupedLesson[] = [];
  if (rawLessons) {
      const groups = new Map<number, GroupedLesson>();
      rawLessons.forEach(slot => {
          if (!groups.has(slot.lesson_id)) {
              groups.set(slot.lesson_id, {
                  lesson_id: slot.lesson_id,
                  lesson_name: slot.lesson_name,
                  price: slot.price,
                  duration: slot.duration,
                  slots: []
              });
          }
          groups.get(slot.lesson_id)!.slots.push(slot);
      });
      groupedLessons.push(...Array.from(groups.values()));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
           <Label htmlFor="date">Date</Label>
           <Input 
             id="date"
             type="date" 
             value={date} 
             onChange={(e) => setDate(e.target.value)}
             className="w-full"
           />
        </div>
        
        <div className="space-y-2">
           <Label>Skill Level</Label>
           <Select value={skill} onValueChange={setSkill}>
             <SelectTrigger aria-label="Skill Level">
               <SelectValue placeholder="Select level" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Levels</SelectItem>
               <SelectItem value="beginner">Beginner</SelectItem>
               <SelectItem value="intermediate">Intermediate</SelectItem>
               <SelectItem value="advanced">Advanced</SelectItem>
             </SelectContent>
           </Select>
        </div>

        <div className="space-y-2">
           <Label htmlFor="lesson-type">Lesson Type</Label>
           <Input 
             id="lesson-type"
             placeholder="Search by name..." 
             value={lessonType} 
             onChange={(e) => setLessonType(e.target.value)}
           />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="sr-only">Loading...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            Error loading lessons. Please try again.
          </div>
        )}

        {!isLoading && rawLessons && rawLessons.length === 0 && date && (
          <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
            No lessons available for this date. Try another day.
          </div>
        )}

        {!isLoading && groupedLessons.length > 0 && (
          <div className="grid gap-6">
            {groupedLessons.map((group) => (
              <LessonCard 
                key={group.lesson_id}
                title={group.lesson_name}
                description={`${group.duration} minute session`}
                price={`€${group.price}`} 
                duration={`${group.duration} min`}
                instructor="Certified Instructor" 
                timeSlots={group.slots.map(s => ({
                    id: s.start_time, 
                    time: format(new Date(s.start_time), 'HH:mm'),
                    available: true
                }))}
                onTimeSlotClick={(slotId) => {
                  setSelectedLesson(group);
                  setSelectedSlotId(slotId);
                  setIsBookingModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        {selectedLesson && selectedSlotId && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Book {selectedLesson.lesson_name} at {format(new Date(selectedSlotId), 'HH:mm')}</DialogTitle>
              <DialogDescription>
                Provide your contact details to finalize your booking.
              </DialogDescription>
            </DialogHeader>
            <BookingForm 
              lessonId={selectedLesson.lesson_id}
              lessonName={selectedLesson.lesson_name}
              slotId={selectedSlotId}
              onClose={() => setIsBookingModalOpen(false)}
            />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}