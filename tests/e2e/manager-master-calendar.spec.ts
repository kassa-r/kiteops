import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser(role: 'manager') {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `manager-${uniqueId}@example.com`;
  const password = 'Password123!';
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: 'Test Manager',
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        role: role,
    });
    if (profileError) {
        console.warn('Manual profile upsert failed:', profileError);
    }
  }

  return { email, password, user: data.user };
}

test.describe('Manager Master Calendar', () => {
  let manager: { email: string; password: string; user: any };

  test.beforeAll(async () => {
    manager = await createTestUser('manager');
  });

  test.beforeEach(async ({ page }) => {
    // Mock Data Setup
    const today = new Date();
    // Ensure Monday of current week
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(9, 0, 0, 0);
    
    const startTime1 = monday.toISOString(); // Monday 9am
    const endTime1 = new Date(monday.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 11am

    const wednesday = new Date(monday);
    wednesday.setDate(wednesday.getDate() + 2);
    wednesday.setHours(14, 0, 0, 0);
    const startTime2 = wednesday.toISOString(); // Wednesday 2pm
    const endTime2 = new Date(wednesday.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 4pm

    const mockBookings = [
      {
        id: "1",
        start_time: startTime1,
        end_time: endTime1,
        status: "confirmed",
        lesson: { name: "Kite Beginner" },
        customer: { full_name: "Student One", email: "s1@test.com" },
        instructor: { full_name: "Instructor Alice", id: "inst-1" },
        instructor_id: "inst-1"
      },
      {
        id: "2",
        start_time: startTime2,
        end_time: endTime2,
        status: "confirmed",
        lesson: { name: "Wing Foil" },
        customer: { full_name: "Student Two", email: "s2@test.com" },
        instructor: { full_name: "Instructor Bob", id: "inst-2" },
        instructor_id: "inst-2"
      }
    ];

    const mockInstructors = [
      { id: "inst-1", full_name: "Instructor Alice" },
      { id: "inst-2", full_name: "Instructor Bob" }
    ];

    const mockLessonTypes = { lesson_types: ["Kite Beginner", "Wing Foil"] };

    // Setup Route Interception
    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({ json: mockInstructors });
    });

    await page.route('**/rest/v1/school_settings*', async route => {
        await route.fulfill({ json: mockLessonTypes });
    });

    await page.route('**/rest/v1/bookings*', async route => {
        const url = route.request().url();
        console.log('Intercepted bookings URL:', url);
        
        // Simplified check for instructor ID in URL
        if (url.includes('inst-1')) {
            await route.fulfill({ json: [mockBookings[0]] });
        } else if (url.includes('inst-2')) {
             await route.fulfill({ json: [mockBookings[1]] });
        } else {
             await route.fulfill({ json: mockBookings });
        }
    });

    // Mock Availability to avoid errors/noise
    await page.route('**/rest/v1/availability*', async route => {
        await route.fulfill({ json: [] });
    });


    await page.goto('/login');
    await page.fill('input[name="email"]', manager.email);
    await page.fill('input[name="password"]', manager.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should display calendar and filter events correctly', async ({ page }) => {
    await page.goto('/calendar');

    // Verify page title
    await expect(page.getByRole('heading', { name: 'Master Calendar' })).toBeVisible();

    // Verify initial state: Both bookings visible
    // Targeted booking locator based on title attribute used in ManagerCalendar.tsx
    // title={`${booking.lesson?.name} - ${booking.instructor?.full_name} (${booking.status})`}
    const kiteBooking = page.locator('div[title*="Kite Beginner"]');
    const wingBooking = page.locator('div[title*="Wing Foil"]');

    await expect(kiteBooking).toBeVisible();
    await expect(wingBooking).toBeVisible();

    // Open Filters
    await page.click('button:has(.lucide-chevron-down)');

    // 1. Filter by Instructor: Alice
    await page.click('label:has-text("Instructor Alice")'); 
    
    // Assert: Only Kite Beginner visible, Wing Foil hidden
    await expect(kiteBooking).toBeVisible();
    await expect(wingBooking).not.toBeVisible();

    // Clear Filters
    await page.click('button:has-text("Clear")');
    
    // Assert: Both visible again
    await expect(kiteBooking).toBeVisible();
    await expect(wingBooking).toBeVisible();

    // 2. Filter by Lesson Type: Wing Foil
    await page.click('label:has-text("Wing Foil")');
    
    // Assert: Only Wing Foil visible, Kite Beginner hidden
    await expect(wingBooking).toBeVisible();
    await expect(kiteBooking).not.toBeVisible();
  });
});
