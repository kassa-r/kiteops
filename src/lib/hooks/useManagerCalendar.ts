import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { Availability, AvailabilityService } from '@/lib/availability-service';
import { ManagerBooking } from '@/lib/hooks/useManagerDashboard';
import { useState } from 'react';

export interface ManagerCalendarFilters {
  instructorIds: string[];
  lessonTypes: string[];
}

export function useManagerCalendar() {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<ManagerCalendarFilters>({
    instructorIds: [],
    lessonTypes: [],
  });

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: ['manager-calendar-bookings', startDate.toISOString(), endDate.toISOString(), filters],
    queryFn: async (): Promise<ManagerBooking[]> => {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          lesson_id,
          customer_id,
          instructor_id,
          start_time,
          end_time,
          status,
          location,
          manager_notes,
          lesson:lessons(name),
          customer:customer_id(full_name, email, phone, customer_details(skill_level)),
          instructor:instructor_id(full_name)
        `)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())

      if (filters.instructorIds.length > 0) {
        query = query.in('instructor_id', filters.instructorIds);
      }

      if (filters.lessonTypes.length > 0) {
        query = query.not('lesson', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      interface DBBooking {
        id: number;
        start_time: string;
        end_time: string;
        status: string;
        manager_notes?: string;
        location?: string;
        lesson: any;
        customer: any;
        instructor: any;
        lesson_id: number;
        customer_id: string;
        instructor_id: string | null;
      }

      let result = (data as unknown as DBBooking[]).map((b) => ({
        id: b.id,
        lesson_id: b.lesson_id,
        customer_id: b.customer_id,
        instructor_id: b.instructor_id,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status,
        manager_notes: b.manager_notes,
        location: b.location,
        lesson: Array.isArray(b.lesson) ? b.lesson[0] : b.lesson,
        customer: Array.isArray(b.customer) ? b.customer[0] : b.customer,
        instructor: Array.isArray(b.instructor) ? b.instructor[0] : b.instructor,
      }));

      // JS Filter for lesson types
      if (filters.lessonTypes.length > 0) {
        result = result.filter(b => b.lesson && filters.lessonTypes.includes(b.lesson.name));
      }

      return result;
    },
  });

  const { data: availability, isLoading: availabilityLoading, error: availabilityError } = useQuery({
    queryKey: ['manager-calendar-availability', startDate.toISOString(), endDate.toISOString(), filters.instructorIds],
    queryFn: async (): Promise<Availability[]> => {
      return AvailabilityService.getBatchAvailability(
        filters.instructorIds.length > 0 ? filters.instructorIds : null,
        startDate,
        endDate
      );
    },
  });

  return {
    bookings: bookings || [],
    availability: availability || [],
    isLoading: bookingsLoading || availabilityLoading,
    error: bookingsError || availabilityError,
    currentDate,
    setCurrentDate,
    filters,
    setFilters,
  };
}
