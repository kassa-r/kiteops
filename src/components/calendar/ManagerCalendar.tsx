'use client';

import React from 'react';
import { addDays, startOfWeek, endOfWeek, format, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Availability } from '@/lib/availability-service';
import { ManagerBooking } from '@/lib/hooks/useManagerDashboard';

interface ManagerCalendarProps {
  bookings: ManagerBooking[];
  availability: Availability[];
  isLoading?: boolean;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAddBooking: (date: Date, timeStr: string) => void;
  onViewDetails: (booking: ManagerBooking) => void;
}

export function ManagerCalendar({ 
  bookings, 
  availability, 
  isLoading, 
  currentDate, 
  onDateChange,
  onAddBooking,
  onViewDetails
}: ManagerCalendarProps) {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const prevWeek = () => onDateChange(subWeeks(currentDate, 1));
  const nextWeek = () => onDateChange(addWeeks(currentDate, 1));

  // Simple time slots for the grid (e.g. 7am to 20pm)
  const startHour = 7;
  const endHour = 20;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

  const getEventStyle = (start: Date, end: Date) => {
    const slotStartHour = start.getHours();
    const slotStartMin = start.getMinutes();
    
    const pixelsPerHour = 48; // h-12 is 3rem = 48px
    
    const relativeStartHour = Math.max(0, slotStartHour - startHour);
    
    const top = (relativeStartHour * pixelsPerHour) + ((slotStartMin / 60) * pixelsPerHour);
    const durationHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const height = Math.max(20, durationHrs * pixelsPerHour); // Min height for visibility
    
    return { top: `${top}px`, height: `${height}px` };
  };

  if (isLoading) {
      return <div className="h-[600px] flex items-center justify-center border rounded-lg bg-background">Loading calendar...</div>;
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg shadow-sm bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold capitalize">
          {format(startDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onAddBooking(new Date(), '09:00')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Booking
            </Button>
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
                {/* Background Grid Lines (Clickable for Add) */}
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className="h-12 border-b border-dashed border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onAddBooking(d, `${hour.toString().padStart(2, '0')}:00`)}
                    title={`Click to add booking at ${hour}:00`}
                  >
                  </div>
                ))}
                
                {/* Availability Slots (Background Layer) */}
                {availability
                  .filter(slot => isSameDay(new Date(slot.start_time), d))
                  .map(slot => {
                    const start = new Date(slot.start_time);
                    const end = new Date(slot.end_time);
                    const style = getEventStyle(start, end);

                    return (
                        <div
                            key={`avail-${slot.id}`}
                            className="absolute left-1 right-1 rounded bg-gray-100/50 border border-gray-200/50 p-1 text-[10px] text-gray-500 overflow-hidden z-0 pointer-events-none"
                            style={style}
                        >
                             Avail
                        </div>
                    );
                })}

                {/* Bookings (Foreground Layer) */}
                {bookings
                  .filter(booking => isSameDay(new Date(booking.start_time), d))
                  .map(booking => {
                    const start = new Date(booking.start_time);
                    const end = new Date(booking.end_time);
                    const style = getEventStyle(start, end);
                    
                    const isConfirmed = booking.status === 'confirmed';
                    const isCancelled = booking.status.includes('cancelled');
                    
                    let bgClass = "bg-blue-50 border-blue-200 text-blue-900";
                    if (isConfirmed) bgClass = "bg-green-50 border-green-200 text-green-900";
                    if (isCancelled) bgClass = "bg-red-50 border-red-200 text-red-900 opacity-60";

                    return (
                        <div
                            key={`booking-${booking.id}`}
                            className={cn(
                                "absolute left-1 right-1 rounded border p-1 text-xs shadow-sm overflow-hidden z-10 hover:z-20 hover:shadow-md transition-all cursor-pointer",
                                bgClass
                            )}
                            style={style}
                            title={`${booking.lesson?.name || 'Lesson'} - ${booking.instructor?.full_name || 'No Instructor'} (${booking.status})`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(booking);
                            }}
                        >
                            <div className="font-semibold truncate">{booking.lesson?.name || 'Lesson'}</div>
                            <div className="text-[10px] truncate">{booking.instructor?.full_name || 'Unassigned'}</div>
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