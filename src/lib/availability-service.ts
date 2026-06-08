import { createClient } from '@/lib/supabase/client';
import { addWeeks, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

export type Availability = {
  id: number;
  instructor_id: string;
  start_time: string;
  end_time: string;
  recurrence_rule: string | null;
};

export const AvailabilityService = {
  async getAvailability(instructorId: string, startDate: Date, endDate: Date): Promise<Availability[]> {
    const supabase = createClient();
    
    // Fetch ALL slots for this instructor that started before the end of the requested view
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('instructor_id', instructorId)
      .lte('start_time', endDate.toISOString());

    if (error) throw new Error(error.message);

    const allSlots = data as Availability[];
    
    // Filter one-time slots that fall within the requested range
    const oneTime = allSlots.filter(s => 
        !s.recurrence_rule && 
        s.start_time >= startDate.toISOString() && 
        s.end_time <= endDate.toISOString()
    );

    // Filter recurring slots
    const recurring = allSlots.filter(s => !!s.recurrence_rule);

    const expanded: Availability[] = [...oneTime];

    // Expand recurring slots
    if (recurring.length > 0) {
      recurring.forEach(slot => {
        if (slot.recurrence_rule === 'WEEKLY' || slot.recurrence_rule === 'FREQ=WEEKLY') {
          let currentStart = new Date(slot.start_time);
          let currentEnd = new Date(slot.end_time);
          
          // Safety break
          let safety = 0;
          while (isBefore(currentStart, endDate) && safety < 1000) {
            safety++;
            
            // Check if this instance falls within the requested window
            if (currentStart < endDate && currentEnd > startDate) {
                expanded.push({
                    ...slot,
                    start_time: currentStart.toISOString(),
                    end_time: currentEnd.toISOString(),
                });
            }
            
            // Advance one week
            currentStart = addWeeks(currentStart, 1);
            currentEnd = addWeeks(currentEnd, 1);
          }
        }
      });
    }

    return expanded;
  },

  async getBatchAvailability(instructorIds: string[] | null, startDate: Date, endDate: Date): Promise<Availability[]> {
    const supabase = createClient();
    
    let query = supabase
      .from('availability')
      .select('*')
      .lte('start_time', endDate.toISOString());

    if (instructorIds && instructorIds.length > 0) {
      query = query.in('instructor_id', instructorIds);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const allSlots = data as Availability[];
    
    // Filter one-time slots that fall within the requested range
    const oneTime = allSlots.filter(s => 
        !s.recurrence_rule && 
        s.start_time >= startDate.toISOString() && 
        s.end_time <= endDate.toISOString()
    );

    // Filter recurring slots
    const recurring = allSlots.filter(s => !!s.recurrence_rule);

    const expanded: Availability[] = [...oneTime];

    // Expand recurring slots
    if (recurring.length > 0) {
      recurring.forEach(slot => {
        if (slot.recurrence_rule === 'WEEKLY' || slot.recurrence_rule === 'FREQ=WEEKLY') {
          let currentStart = new Date(slot.start_time);
          let currentEnd = new Date(slot.end_time);
          
          // Safety break
          let safety = 0;
          while (isBefore(currentStart, endDate) && safety < 1000) {
            safety++;
            
            // Check if this instance falls within the requested window
            if (currentStart < endDate && currentEnd > startDate) {
                expanded.push({
                    ...slot,
                    start_time: currentStart.toISOString(),
                    end_time: currentEnd.toISOString(),
                });
            }
            
            // Advance one week
            currentStart = addWeeks(currentStart, 1);
            currentEnd = addWeeks(currentEnd, 1);
          }
        }
      });
    }

    return expanded;
  },

  async createAvailability(data: { instructor_id: string; start_time: Date; end_time: Date; recurrence_rule?: string | null }): Promise<void> {
    const supabase = createClient();

    // Overlap check
    const { data: overlapping, error: overlapError } = await supabase
      .from('availability')
      .select('id')
      .eq('instructor_id', data.instructor_id)
      .lt('start_time', data.end_time.toISOString())
      .gt('end_time', data.start_time.toISOString());
    
    if (overlapError) {
      throw new Error(overlapError.message);
    }

    if (overlapping && overlapping.length > 0) {
      throw new Error('Overlapping availability slot detected.');
    }

    const { error } = await supabase
      .from('availability')
      .insert({
        instructor_id: data.instructor_id,
        start_time: data.start_time.toISOString(),
        end_time: data.end_time.toISOString(),
        recurrence_rule: data.recurrence_rule || null,
      });

    if (error) {
      throw new Error(error.message);
    }
  },

  async deleteAvailability(id: number): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },
};
