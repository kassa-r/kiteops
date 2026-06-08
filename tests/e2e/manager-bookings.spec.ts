import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mock user creation
async function createTestUser(role: 'manager') {
  if (!supabaseUrl || !supabaseAnonKey) {
      return { email: 'mock@manager.com', password: 'mock-password' };
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
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

  if (error) console.warn("SignUp error:", error);

  if (data?.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        role: role,
    });
    if (profileError) console.warn('Manual profile upsert failed:', profileError);
  }

  return { email, password, user: data?.user };
}

test.describe('Manager Booking Management', () => {
  let manager: { email: string; password: string; user?: any };

  test.beforeAll(async () => {
    manager = await createTestUser('manager');
  });

  test.beforeEach(async ({ page }) => {
    // Dynamic Mock Store
    const bookings = [
        {
            id: 1,
            customer_id: 'cust-1',
            instructor_id: 'inst-1',
            lesson_id: 1,
            start_time: new Date().toISOString(), // Today
            end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            status: 'confirmed',
            lesson: { name: 'Kite Beginner' },
            customer: { full_name: 'Customer One', email: 'c1@test.com' },
            instructor: { full_name: 'Instructor Alice' }
        }
    ];

    const mockCustomers = [
        { id: 'cust-1', full_name: 'Customer One', email: 'c1@test.com' }
    ];
    const mockInstructors = [
        { id: 'inst-1', full_name: 'Instructor Alice' }
    ];
    const mockLessons = [
        { id: 1, name: 'Kite Beginner', duration_minutes: 120 },
        { id: 2, name: 'Wing Foil', duration_minutes: 60 }
    ];

    // Mock Backend Routes
    await page.route('**/rest/v1/profiles*', async route => {
        const url = route.request().url();
        if (url.includes('role=eq.customer')) {
            await route.fulfill({ json: mockCustomers });
        } else if (url.includes('role=eq.instructor')) {
             await route.fulfill({ json: mockInstructors });
        } else {
             await route.fulfill({ json: [] });
        }
    });

    await page.route('**/rest/v1/lessons*', async route => {
        await route.fulfill({ json: mockLessons });
    });
    
    // Mock bookings list (GET)
    await page.route('**/rest/v1/bookings*', async route => {
        if (route.request().method() === 'GET') {
            // Return only non-cancelled bookings
            const activeBookings = bookings.filter(b => b.status !== 'cancelled');
            await route.fulfill({ json: activeBookings });
        } else {
            await route.continue();
        }
    });

    // Mock booking-service Edge Function (POST, PUT, DELETE)
    await page.route('**/functions/v1/booking-service', async route => {
        const method = route.request().method();
        const body = route.request().postDataJSON();
        
        console.log(`Mocking booking-service ${method}`, body);

        if (method === 'POST') {
             const newBooking = { 
                 id: Math.floor(Math.random() * 10000) + 100, 
                 ...body, 
                 status: 'confirmed',
                 lesson: mockLessons.find(l => l.id == body.lesson_id),
                 customer: mockCustomers.find(c => c.id == body.customer_id),
                 instructor: mockInstructors.find(i => i.id == body.instructor_id) || null
             };
             bookings.push(newBooking);
             await route.fulfill({ status: 201, json: newBooking });
        } else if (method === 'PUT') {
             const index = bookings.findIndex(b => b.id === body.id);
             if (index !== -1) {
                 bookings[index] = { ...bookings[index], ...body };
                 await route.fulfill({ status: 200, json: bookings[index] });
             } else {
                 await route.fulfill({ status: 404 });
             }
        } else if (method === 'DELETE') {
             // Handle ID from query param or body
             const url = new URL(route.request().url());
             const idParam = url.searchParams.get('id');
             const id = idParam ? parseInt(idParam) : body?.id;

             const index = bookings.findIndex(b => b.id === id);
             if (index !== -1) {
                 bookings[index].status = 'cancelled';
                 await route.fulfill({ status: 200, json: { success: true, booking: bookings[index] } });
             } else {
                 await route.fulfill({ status: 404 });
             }
        } else {
             await route.continue();
        }
    });
    
    // Mock availability
    await page.route('**/rest/v1/availability*', async route => {
        await route.fulfill({ json: [] });
    });

    // Perform Login
    await page.goto('/login');
    await page.fill('input[name="email"]', manager.email);
    await page.fill('input[name="password"]', manager.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should allow manager to create, edit, and cancel a booking', async ({ page }) => {
    await page.goto('/calendar');

    // 1. Create Booking
    await page.click('button:has-text("Add Booking")');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select Customer
    await page.click('button[role="combobox"]:has-text("Select a customer")');
    await page.click('div[role="option"]:has-text("Customer One")');

    // Select Lesson
    await page.click('button[role="combobox"]:has-text("Select lesson")');
    await page.click('div[role="option"]:has-text("Kite Beginner")');

    // Select Instructor
    await page.click('button[role="combobox"]:has-text("Unassigned")');
    await page.click('div[role="option"]:has-text("Instructor Alice")');

    // Fill Date/Time
    await page.fill('input[type="date"]', '2025-12-25');
    await page.fill('input[name="start_time"]', '10:00');
    // Note: In E2E, the useEffect for time calculation works because React runs in browser
    
    await page.fill('textarea[name="manager_notes"]', 'New E2E Booking');
    await page.click('button:has-text("Save")');

    // Expect dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Booking created successfully')).toBeVisible();

    // Visual Verification
    await expect(page.getByText('New E2E Booking')).toBeVisible();
    
    // 2. Edit Booking
    // Find the booking we just created (or the default one)
    const bookingEl = page.locator('div[title*="Kite Beginner"]').first();
    await bookingEl.click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Edit Booking')).toBeVisible();
    
    // Change Note
    await page.fill('textarea[name="manager_notes"]', 'Updated Note E2E');
    await page.click('button:has-text("Update Booking")');
    
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Booking updated successfully')).toBeVisible();

    // Visual Verification
    await expect(page.getByText('Updated Note E2E')).toBeVisible();

    // 3. Cancel Booking
    // Re-open the booking
    await bookingEl.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click Cancel Booking (Red button)
    await page.click('button:has-text("Cancel Booking")');
    
    // Verify Confirmation Dialog
    await expect(page.getByText('Are you sure you want to cancel this booking?')).toBeVisible();
    
    // Confirm
    await page.click('button:has-text("Yes, Cancel")');
    
    await expect(page.getByText('Booking cancelled successfully')).toBeVisible();
    
    // Visual Verification: Booking should disappear
    await expect(page.getByText('Updated Note E2E')).not.toBeVisible();
  });
});