
export interface Lesson {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
}

export interface InstructorLesson {
  instructor_id: string;
  lesson_id: number;
}

export interface TimeRange {
  instructor_id: string;
  start_time: string;
  end_time: string;
}

export interface SlotResult {
  start_time: string;
  available_slots: number;
  lesson_id: number;
  lesson_name: string;
  price: number;
  duration: number;
}

export function calculateSlots(
  lessons: Lesson[],
  instructorLessons: InstructorLesson[],
  availabilities: TimeRange[],
  bookings: TimeRange[],
  startOfDay: string,
  endOfDay: string
): SlotResult[] {
  const results: SlotResult[] = [];

  for (const lesson of lessons) {
    const durationMs = lesson.duration_minutes * 60 * 1000;
    const relevantInstructors = instructorLessons
      .filter(il => il.lesson_id === lesson.id)
      .map(il => il.instructor_id);

    const allSlots: { start_time: string; end_time: string; instructor_id: string }[] = [];

    for (const instrId of relevantInstructors) {
      const instrAvail = availabilities.filter(a => a.instructor_id === instrId) || [];
      const instrBookings = bookings.filter(b => b.instructor_id === instrId) || [];

      for (const avail of instrAvail) {
        let slotStart = new Date(Math.max(new Date(avail.start_time).getTime(), new Date(startOfDay).getTime()));
        const availEnd = new Date(Math.min(new Date(avail.end_time).getTime(), new Date(endOfDay).getTime()));

        while (slotStart.getTime() + durationMs <= availEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + durationMs);

          // Check collision
          const isBooked = instrBookings.some(b => {
            const bStart = new Date(b.start_time).getTime();
            const bEnd = new Date(b.end_time).getTime();
            // Overlap logic: (StartA < EndB) and (EndA > StartB)
            return (slotStart.getTime() < bEnd && slotEnd.getTime() > bStart);
          });

          if (!isBooked) {
            allSlots.push({
              start_time: slotStart.toISOString(),
              end_time: slotEnd.toISOString(),
              instructor_id: instrId
            });
          }

          // Step by the lesson duration
          slotStart = new Date(slotEnd.getTime());
        }
      }
    }

    // De-dupe slots by time and aggregate
    const uniqueTimes = new Map<string, SlotResult>();

    allSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));

    for (const s of allSlots) {
      const key = s.start_time;
      if (!uniqueTimes.has(key)) {
        uniqueTimes.set(key, {
          start_time: s.start_time,
          available_slots: 1,
          lesson_id: lesson.id,
          lesson_name: lesson.name,
          price: lesson.price,
          duration: lesson.duration_minutes
        });
      } else {
        uniqueTimes.get(key)!.available_slots++;
      }
    }

    results.push(...Array.from(uniqueTimes.values()));
  }
  
  return results;
}
