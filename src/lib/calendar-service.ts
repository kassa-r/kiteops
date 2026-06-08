import { createClient } from '@/lib/supabase/client';
import { Availability, AvailabilityService } from './availability-service';
import { ManagerBooking } from './hooks/useManagerDashboard';

export interface InstructorCalendarData {
  bookings: ManagerBooking[];
  availability: Availability[];
}

export const CalendarService = {
  async getInstructorCalendarData(userId: string, startDate: Date, endDate: Date): Promise<InstructorCalendarData> {
    const supabase = createClient();

    // 1. Fetch Availability
    const availability = await AvailabilityService.getAvailability(userId, startDate, endDate);

    // 2. Fetch Bookings (Lessons)
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select(`
        id,
        lesson_id,
        start_time,
        end_time,
        status,
        lesson:lessons(name),
        customer:customer_id(full_name, email, phone, customer_details(skill_level)),
        instructor:instructor_id(full_name)
      `)
      .eq('instructor_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString());

    if (error) throw new Error(error.message);

    const bookings = (bookingsData as any[]).map((b) => ({
      ...b,
      lesson: Array.isArray(b.lesson) ? b.lesson[0] : b.lesson,
      customer: Array.isArray(b.customer) ? b.customer[0] : b.customer,
      instructor: Array.isArray(b.instructor) ? b.instructor[0] : b.instructor,
    })) as ManagerBooking[];


    return { bookings, availability };
  }
};
