'use client';

import React, { useState } from 'react';
import { addDays, startOfWeek, endOfWeek, format, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Availability } from '@/lib/availability-service';

interface AvailabilityCalendarProps {
  availability: Availability[];
  onAddSlot: (date: Date) => void;
  onDeleteSlot: (id: number) => void;
}

export function AvailabilityCalendar({ availability, onAddSlot, onDeleteSlot }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  // Simple time slots for the grid (e.g. 7am to 20pm)
  const startHour = 7;
  const endHour = 20;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

  return (
    <div className="flex flex-col h-[600px] border rounded-lg shadow-sm bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold capitalize">
          {format(startDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}
          </span>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 border-b divide-x min-w-[800px]">
           {/* Time Column Header */}
           <div className="p-2 text-xs font-medium text-muted-foreground text-center border-r bg-muted/20 sticky top-0 z-10">
             Time
           </div>
           {/* Day Headers */}
           {days.map((d) => (
             <div key={d.toString()} className="p-2 text-center bg-background sticky top-0 z-10">
               <div className="text-xs font-medium text-muted-foreground uppercase">{format(d, 'EEE')}</div>
               <div className={cn("text-sm font-bold h-7 w-7 rounded-full flex items-center justify-center mx-auto", isSameDay(d, new Date()) && "bg-primary text-primary-foreground")}>
                 {format(d, 'd')}
               </div>
             </div>
           ))}
        </div>
        
        {/* Time Rows */}
        <div className="grid grid-cols-8 divide-x relative min-w-[800px]">
          {/* Time Labels Column */}
          <div className="divide-y border-r bg-muted/10">
             {hours.map((hour) => (
               <div key={hour} className="h-12 text-xs text-muted-foreground p-1 text-right pr-2 sticky left-0">
                 {hour}:00
               </div>
             ))}
          </div>

          {/* Days Columns */}
          {days.map((d) => (
            <div key={d.toString()} className="relative divide-y border-r">
                {/* 
                   Click on a cell to add availability starting at that hour.
                */}
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className="h-12 border-b border-dashed border-gray-100 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => {
                        const dateWithTime = new Date(d);
                        dateWithTime.setHours(hour, 0, 0, 0);
                        onAddSlot(dateWithTime);
                    }}
                  >
                  </div>
                ))}
                
                {/* Overlay Events */}
                {availability
                  .filter(slot => isSameDay(new Date(slot.start_time), d))
                  .map(slot => {
                    const start = new Date(slot.start_time);
                    const end = new Date(slot.end_time);
                    const slotStartHour = start.getHours();
                    const slotStartMin = start.getMinutes();
                    
                    // Calculate top and height relative to the grid start hour
                    const pixelsPerHour = 48; // h-12 is 3rem = 48px
                    
                    // If start time is before grid start, truncate visually (or handle gracefully)
                    // For now assuming availability is within operational hours
                    const relativeStartHour = Math.max(0, slotStartHour - startHour);
                    
                    const top = (relativeStartHour * pixelsPerHour) + ((slotStartMin / 60) * pixelsPerHour);
                    const durationHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    const height = Math.max(20, durationHrs * pixelsPerHour); // Min height for visibility

                    return (
                        <div
                            key={slot.id}
                            className="absolute left-1 right-1 rounded border border-dashed border-emerald-500 bg-emerald-50/90 p-1 text-xs text-emerald-900 shadow-sm overflow-hidden group z-10"
                            style={{ top: `${top}px`, height: `${height}px` }}
                        >
                            <div className="font-semibold">{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-4 w-4 absolute top-0 right-0 text-emerald-700 hover:text-red-600 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSlot(slot.id);
                                }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
