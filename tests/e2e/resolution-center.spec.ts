import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for E2E tests.');
}

// Use the service role key for admin operations
const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey);

async function createTestUser(role: 'manager' | 'instructor' | 'customer') {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `${role}-${uniqueId}@example.com`;
  const password = 'Password123!';
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    },
  });

  if (error) throw error;
  
  // Also insert into profiles table
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: data.user.id,
    role: role,
    full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
  });

  if (profileError) throw profileError;

  return { email, password, user: data.user };
}

async function createTestData(manager: any) {
    const instructor = await createTestUser('instructor');
    const customer = await createTestUser('customer');

    const { data: lesson, error: lessonError } = await supabaseAdmin.from('lessons').insert({
        name: 'E2E Test Lesson',
        description: 'A lesson for E2E testing',
        duration: 60,
        price: 100,
        school_id: manager.user.user_metadata.school_id, // Assuming manager has a school_id
    }).select().single();

    if (lessonError) throw lessonError;

    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 2);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const { data: booking, error: bookingError } = await supabaseAdmin.from('bookings').insert({
        customer_id: customer.user.id,
        instructor_id: instructor.user.id,
        lesson_id: lesson.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending_weather_check',
        school_id: manager.user.user_metadata.school_id,
        weather_data: {
            wind_speed: {
                value: 5,
                unit: 'knots',
                threshold: 10,
                conflict: true
            }
        }
    }).select().single();

    if (bookingError) throw bookingError;

    return { booking, lesson, customer, instructor };
}


test.describe('Resolution Center', () => {
  let manager: { email: string; password: string; user: any };
  let testData: any;

  test.beforeAll(async () => {
    manager = await createTestUser('manager');
    testData = await createTestData(manager);
  });

  test('Manager can view and navigate to the resolution center', async ({ page }) => {
    // 1. Login as manager
    await page.goto('/login');
    await page.fill('input[name="email"]', manager.email);
    await page.fill('input[name="password"]', manager.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // 2. Verify WeatherConflictCard is visible
    const conflictCard = page.locator('text=Resolution Center');
    await expect(conflictCard).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Lessons Need Review')).toBeVisible();

    // 3. Click the review button
    await page.getByRole('link', { name: 'Review Lessons' }).click();

    // 4. Verify navigation to the resolution center
    await page.waitForURL(/\/resolution-center/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Resolution Center');

    // 5. Assert the conflicted lesson is visible
    await expect(page.getByText(testData.lesson.name)).toBeVisible();
    await expect(page.getByText(`Customer: Test Customer`)).toBeVisible();
    await expect(page.getByText(`Instructor: Test Instructor`)).toBeVisible();
    await expect(page.getByText(/wind speed: 5 knots/)).toBeVisible();
  });

  // Cleanup test data after all tests
  test.afterAll(async () => {
      if(testData && testData.booking) {
        await supabaseAdmin.from('bookings').delete().eq('id', testData.booking.id);
      }
      if(testData && testData.lesson) {
        await supabaseAdmin.from('lessons').delete().eq('id', testData.lesson.id);
      }
      if(manager) {
        await supabaseAdmin.auth.admin.deleteUser(manager.user.id);
      }
       if(testData && testData.customer) {
        await supabaseAdmin.auth.admin.deleteUser(testData.customer.user.id);
      }
       if(testData && testData.instructor) {
        await supabaseAdmin.auth.admin.deleteUser(testData.instructor.user.id);
      }
  });
});
