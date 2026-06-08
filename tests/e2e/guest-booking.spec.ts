import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Conditional Supabase client - only if key is available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

test('guest booking flow', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  // Setup Mocks FIRST
  await page.route('**/functions/v1/get-available-lessons*', async route => {
    const json = [
      {
        start_time: `${dateStr}T10:00:00Z`,
        available_slots: 5,
        lesson_id: 1,
        lesson_name: 'Test Kitesurfing Lesson',
        price: 150,
        duration: 180
      }
    ];
    await route.fulfill({ json });
  });

  await page.route('**/functions/v1/create-booking', async route => {
    await route.fulfill({ 
      status: 200, 
      contentType: 'application/json',
      body: JSON.stringify({ 
        success: true,
        booking_reference: 'TEST-REF-123',
        instructor_name: 'Mock Instructor'
      }) 
    });
  });
  
  // 1. Go to the home page where LessonSearch is mounted
  await page.goto('/');

  // Set a date in the future (e.g., tomorrow)
  await page.fill('input[type="date"]', dateStr);
  
  // Verify the card appears
  await expect(page.locator('text=Test Kitesurfing Lesson')).toBeVisible();

  // 2. Click an available time slot
  // Button text should be "10:00" (derived from start_time formatted)
  // Note: format in LessonSearch uses local time. 
  // If test runs in UTC, it might vary.
  // But we can look for the button inside the card.
  
  const slotButton = page.locator('button[aria-label^="Book lesson"]');
  await expect(slotButton).toBeVisible();
  await expect(slotButton).toBeEnabled();
  
  await slotButton.click();

  // 3. Verify the modal is open
  await expect(page.locator('h2:has-text("Book Test Kitesurfing Lesson")')).toBeVisible();

  const testEmail = `test.user.${Date.now()}@example.com`;

  // 4. Fill out the form
  await page.fill('input[name="fullName"]', 'Test User');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="phone"]', '1234567890');
  await page.check('button[role="checkbox"]'); // Radix Checkbox is a button

  // 5. Submit the form
  await page.click('button:has-text("Book Lesson")');

  // 6. Verify success message
  await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
  await expect(page.locator('text=TEST-REF-123')).toBeVisible();
  await expect(page.locator('text=Mock Instructor')).toBeVisible();

  // 7. DB Verification (Optional)
  if (supabaseAdmin) {
    // We mocked the write, so DB won't be updated. 
    // If we want E2E, we shouldn't mock the write.
    // But since we mocked the write, we skip DB check.
    console.log('Skipping DB check due to mocked API');
  }
});