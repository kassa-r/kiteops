import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

export interface ManagerDashboardStats {
  todayLessonCount: number;
  pendingBookingCount: number;
  availableInstructorsCount: number;
  weatherConflictCount: number;
}

export interface ManagerBooking {
  id: number;
  lesson_id: number;
  start_time: string;
  end_time: string;
  status: string;
  lesson: { name: string } | null;
  customer_id: string;
  customer: {
    full_name: string;
    email: string;
    phone?: string; // Phone is now directly on customer (profile)
    customer_details: {
        skill_level?: string;
        age?: number;
        gender?: string;
        experience_hours?: number;
        additional_notes?: string;
    } | null;
  } | null;
  instructor_id: string | null;
  instructor: { full_name: string } | null;
  manager_notes?: string;
  location?: string;
}

export interface ConflictedBooking extends ManagerBooking {
  weather_data: Record<string, any> | null;
}

interface RawManagerBooking {
  id: number;
  lesson_id: number;
  customer_id: string;
  instructor_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
  manager_notes?: string;
  location?: string;
  lesson: { name: string } | { name: string }[] | null;
  customer: {
    full_name: string;
    email: string;
    phone?: string; // Phone is now directly on customer (profile)
    customer_details: {
        skill_level?: string;
        age?: number;
        gender?: string;
        experience_hours?: number;
        additional_notes?: string;
    } | null;
  } | any[] | null;
  instructor: { full_name: string } | { full_name: string }[] | null;
}

export function useManagerDashboard() {
  const supabase = createClient();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['manager-dashboard-stats'],
    queryFn: async (): Promise<ManagerDashboardStats> => {
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      // 1. Today's Lesson Count
      const { count: todayLessonCount, error: todayError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', todayStart)
        .lte('start_time', todayEnd)
        .neq('status', 'cancelled');

      if (todayError) throw todayError;

      // 2. Pending Booking Count
      const { count: pendingBookingCount, error: pendingError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // 3. Available Instructors Count (Unique instructors with slots today)
      // Note: head: true with distinct is not directly supported in simple count
      // We'll fetch instructor_ids and count unique in JS for now or use a raw query if performance needed.
      // For now, simpler approach: fetch availability slots overlapping today.
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('instructor_id')
        .gte('end_time', todayStart)
        .lte('start_time', todayEnd);

      if (availabilityError) throw availabilityError;
      
      const uniqueInstructors = new Set(availabilityData.map(a => a.instructor_id));
      const availableInstructorsCount = uniqueInstructors.size;

      // 4. Weather Conflict Count
      // Checking for 'pending_weather_check' status or similar indicators
      const { count: weatherConflictCount, error: conflictError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_weather_check');

      if (conflictError) throw conflictError;

      return {
        todayLessonCount: todayLessonCount || 0,
        pendingBookingCount: pendingBookingCount || 0,
        availableInstructorsCount: availableInstructorsCount || 0,
        weatherConflictCount: weatherConflictCount || 0,
      };
    },
  });

  const { data: upcomingLessons, isLoading: lessonsLoading, error: lessonsError } = useQuery({
    queryKey: ['manager-upcoming-lessons'],
    queryFn: async (): Promise<ManagerBooking[]> => {
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      const { data, error } = await supabase
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
        .gte('start_time', todayStart)
        .lte('start_time', todayEnd)
        .order('start_time', { ascending: true });

      if (error) throw error;

      return (data as any[]).map((b) => ({
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
    },
  });

  return { 
    stats, 
    upcomingLessons,
    isLoading: statsLoading || lessonsLoading, 
    error: statsError || lessonsError 
  };
}

export function useResolutionCenterData() {
  const supabase = createClient();

  const { data: conflictedBookings, isLoading, error } = useQuery({
    queryKey: ['conflicted-bookings'],
    queryFn: async (): Promise<ConflictedBooking[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          lesson_id,
          customer_id,
          instructor_id,
          start_time,
          end_time,
          status,
          weather_data,
          lesson:lessons(name),
          customer:customer_id(full_name, email, phone, customer_details(skill_level)),
          instructor:instructor_id(full_name)
        `)
        .eq('status', 'pending_weather_check')
        .order('start_time', { ascending: true });

      if (error) throw error;

      return (data as any[]).map((b) => ({
        id: b.id,
        lesson_id: b.lesson_id,
        customer_id: b.customer_id,
        instructor_id: b.instructor_id,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status,
        weather_data: b.weather_data,
        lesson: Array.isArray(b.lesson) ? b.lesson[0] : b.lesson,
        customer: Array.isArray(b.customer) ? b.customer[0] : b.customer,
        instructor: Array.isArray(b.instructor) ? b.instructor[0] : b.instructor,
      }));
    },
  });

  return {
    conflictedBookings,
    isLoading,
    error,
  };
}
