import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { calculateSlots } from "../../supabase/functions/get-available-lessons/logic.ts";

Deno.test("calculateSlots - Basic availability", () => {
  const lessons = [{ id: 1, name: "Lesson", duration_minutes: 60, price: 100 }];
  const instructorLessons = [{ instructor_id: "inst1", lesson_id: 1 }];
  const availabilities = [{ 
    instructor_id: "inst1", 
    start_time: "2025-12-10T09:00:00Z", 
    end_time: "2025-12-10T12:00:00Z" 
  }];
  const bookings: any[] = [];
  const startOfDay = "2025-12-10T00:00:00Z";
  const endOfDay = "2025-12-10T23:59:59Z";

  const results = calculateSlots(lessons, instructorLessons, availabilities, bookings, startOfDay, endOfDay);
  
  // 9-10, 9:30-10:30, 10-11, 10:30-11:30, 11-12
  // Total 5 slots
  assertEquals(results.length, 5);
  assertEquals(results[0].start_time, "2025-12-10T09:00:00.000Z");
});

Deno.test("calculateSlots - With booking overlap", () => {
  const lessons = [{ id: 1, name: "Lesson", duration_minutes: 60, price: 100 }];
  const instructorLessons = [{ instructor_id: "inst1", lesson_id: 1 }];
  const availabilities = [{ 
    instructor_id: "inst1", 
    start_time: "2025-12-10T09:00:00Z", 
    end_time: "2025-12-10T12:00:00Z" 
  }];
  // Booking from 10:00 to 11:00
  const bookings = [{
      instructor_id: "inst1",
      start_time: "2025-12-10T10:00:00Z",
      end_time: "2025-12-10T11:00:00Z"
  }];
  const startOfDay = "2025-12-10T00:00:00Z";
  const endOfDay = "2025-12-10T23:59:59Z";

  const results = calculateSlots(lessons, instructorLessons, availabilities, bookings, startOfDay, endOfDay);
  
  // 9:00-10:00 (OK - ends at start of booking)
  // 9:30-10:30 (Clash)
  // 10:00-11:00 (Clash)
  // 10:30-11:30 (Clash)
  // 11:00-12:00 (OK - starts at end of booking)
  
  // Actually, let's trace overlap logic:
  // Slot 9:00-10:00 vs Booking 10:00-11:00 -> No overlap (SlotEnd <= BookingStart)
  // Slot 9:30-10:30 vs Booking 10:00-11:00 -> Overlap
  // Slot 11:00-12:00 vs Booking 10:00-11:00 -> No overlap (SlotStart >= BookingEnd)

  const slots = results.map(r => r.start_time);
  assertEquals(slots.includes("2025-12-10T09:00:00.000Z"), true);
  assertEquals(slots.includes("2025-12-10T09:30:00.000Z"), false);
  assertEquals(slots.includes("2025-12-10T11:00:00.000Z"), true);
});

Deno.test("calculateSlots - Multiple instructors aggregate", () => {
  const lessons = [{ id: 1, name: "Lesson", duration_minutes: 60, price: 100 }];
  const instructorLessons = [
      { instructor_id: "inst1", lesson_id: 1 },
      { instructor_id: "inst2", lesson_id: 1 }
  ];
  const availabilities = [
      { instructor_id: "inst1", start_time: "2025-12-10T09:00:00Z", end_time: "2025-12-10T10:00:00Z" },
      { instructor_id: "inst2", start_time: "2025-12-10T09:00:00Z", end_time: "2025-12-10T10:00:00Z" }
  ];
  const bookings: any[] = [];
  const startOfDay = "2025-12-10T00:00:00Z";
  const endOfDay = "2025-12-10T23:59:59Z";

  const results = calculateSlots(lessons, instructorLessons, availabilities, bookings, startOfDay, endOfDay);

  // Both have 9:00-10:00 available. Should show 2 available slots for that time.
  assertEquals(results.length, 1);
  assertEquals(results[0].available_slots, 2);
});
