import { useQuery } from '@tanstack/react-query';
import { CalendarService } from '@/lib/calendar-service';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { endOfWeek, startOfWeek } from 'date-fns';

export function useInstructorCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: role } = useUserRole();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['instructor-calendar', userId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
        if (!userId) return { bookings: [], availability: [] };
        return CalendarService.getInstructorCalendarData(userId, startDate, endDate);
    },
    enabled: !!userId && role === 'instructor',
  });

  return {
    bookings: data?.bookings || [],
    availability: data?.availability || [],
    isLoading,
    error,
    currentDate,
    setCurrentDate,
    refetch
  };
}
