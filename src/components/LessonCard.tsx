'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, User, Euro, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface LessonCardProps {
  title: string;
  description: string;
  price: string;
  duration: string;
  instructor: string;
  timeSlots: TimeSlot[];
  onTimeSlotClick: (slotId: string) => void;
  className?: string;
}

export function LessonCard({
  title,
  description,
  price,
  duration,
  instructor,
  timeSlots,
  onTimeSlotClick,
  className,
}: LessonCardProps) {
  return (
    <Card className={cn("flex flex-col md:flex-row overflow-hidden hover:shadow-lg transition-shadow", className)}>
      {/* Main Content Area (Left) */}
      <div className="flex-1 p-6 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-primary">
            <Wind className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground">{title}</h3>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Euro className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="sr-only">Price:</span>
            <span className="font-medium text-foreground">{price}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="sr-only">Duration:</span>
            <span className="font-medium text-foreground">{duration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="sr-only">Instructor:</span>
            <span className="font-medium text-foreground">{instructor}</span>
          </div>
        </div>
      </div>

      {/* Time Slot Area (Right) */}
      <div className="md:w-64 bg-muted/30 p-6 border-t md:border-t-0 md:border-l border-border flex flex-col gap-3">
        <h4 className="font-heading font-semibold text-sm text-foreground">Available Times:</h4>
        <div className="flex flex-col gap-2">
          {timeSlots.map((slot) => (
            <Button
              key={slot.id}
              type="button"
              variant={slot.available ? "secondary" : "ghost"}
              disabled={!slot.available}
              onClick={() => slot.available && onTimeSlotClick(slot.id)}
              className={cn(
                "w-full justify-center",
                slot.available 
                  ? "hover:bg-primary hover:text-primary-foreground transition-colors" 
                  : "opacity-50 cursor-not-allowed bg-transparent"
              )}
              aria-label={slot.available ? `Book lesson at ${slot.time}` : `Time slot ${slot.time} is unavailable`}
            >
              {slot.time}
            </Button>
          ))}
          {timeSlots.length === 0 && (
             <p className="text-sm text-muted-foreground italic">No slots available</p>
          )}
        </div>
      </div>
    </Card>
  );
}
