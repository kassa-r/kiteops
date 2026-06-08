import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

export interface DashboardStats {
  todayLessonCount: number;
  pendingBookingCount: number;
  // availableHours: number; // To be implemented later if needed
}

// Represents the clean, transformed data shape used within the application
export interface Booking {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  lesson: {
    name: string;
  } | null; // Allow null for robustness
  profiles: { 
    full_name: string;
    email: string;
  } | null; // Allow null for robustness
}

// Represents the raw data shape returned by the Supabase query
interface RawBooking {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  lesson: { name: string }[]; // Supabase returns this as an array
  profiles: { full_name: string; email: string }[]; // Supabase returns this as an array
}


export function useInstructorDashboard(instructorId?: string) {
  const supabase = createClient();

  // Query for stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', instructorId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!instructorId) return { todayLessonCount: 0, pendingBookingCount: 0 };

      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      // 1. Today's Lessons Count
      const { count: todayCount, error: todayError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .gte('start_time', todayStart)
        .lte('start_time', todayEnd)
        .neq('status', 'cancelled');

      if (todayError) throw todayError;

      // 2. Pending Bookings Count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      return {
        todayLessonCount: todayCount || 0,
        pendingBookingCount: pendingCount || 0,
      };
    },
    enabled: !!instructorId,
  });

  // Query for Upcoming Lessons (Today and Tomorrow)
  const { data: upcomingLessons, isLoading: lessonsLoading, error: lessonsError } = useQuery<RawBooking[], Error, Booking[]>({
    queryKey: ['upcoming-lessons', instructorId],
    queryFn: async () => {
      if (!instructorId) return [];

      const todayStart = startOfDay(new Date()).toISOString();
      const tomorrowEnd = endOfDay(addDays(new Date(), 1)).toISOString();

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          lesson:lessons(name),
          profiles:customer_id(full_name, email)
        `)
        .eq('instructor_id', instructorId)
        .gte('start_time', todayStart)
        .lte('start_time', tomorrowEnd)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Upcoming Lessons Query Error:', error);
        throw error;
      }
      return data as RawBooking[];
    },
    // Use the `select` option to transform the raw Supabase data into the desired shape
    select: (data: RawBooking[]) => data.map(b => ({
      ...b,
      lesson: b.lesson?.[0] || null,
      profiles: b.profiles?.[0] || null,
    })),
    enabled: !!instructorId,
  });

  return {
    stats,
    upcomingLessons,
    isLoading: statsLoading || lessonsLoading,
    error: lessonsError,
  };
}
