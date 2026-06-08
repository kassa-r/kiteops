import { test, expect } from '@playwright/test';

test('secure booking link flow', async ({ page }) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  const mockToken = '123e4567-e89b-12d3-a456-426614174000';
  const mockRef = 'KO-2025-1234';

  // 1. Mock availability
  await page.context().route('**/functions/v1/get-available-lessons*', async route => {
    await route.fulfill({
      json: [{
        start_time: `${dateStr}T10:00:00Z`,
        available_slots: 5,
        lesson_id: 1,
        lesson_name: 'Secure Link Test Lesson',
        price: 150,
        duration: 180
      }]
    });
  });

  // 2. Mock create-booking response to include secure_token
  await page.context().route('**/functions/v1/create-booking', async route => {
    await route.fulfill({ 
      status: 200, 
      contentType: 'application/json',
      body: JSON.stringify({ 
        success: true,
        booking_reference: mockRef,
        secure_token: mockToken,
        instructor_name: 'Secure Instructor'
      }) 
    });
  });

  // 3. Mock get-booking-by-token response for the secure page
  await page.context().route(`**/functions/v1/get-booking-by-token`, async route => {
    const postData = route.request().postDataJSON();
    
    if (postData.token === mockToken) {
       await route.fulfill({
        status: 200,
        json: {
            success: true,
            data: {
                booking_reference: mockRef,
                start_time: `${dateStr}T10:00:00Z`,
                status: 'confirmed',
                instructor_name: 'Secure Instructor',
                location: 'Test Beach',
                lessons: {
                    name: 'Secure Link Test Lesson',
                    duration_minutes: 180
                }
            }
        }
       });
    } else {
        await route.fulfill({
            status: 404,
            json: { error: 'Invalid or expired token' }
        });
    }
  });
  
  // --- Start Flow ---

  // 1. Go to Home
  await page.goto('/');
  await page.fill('input[type="date"]', dateStr);
  await page.click('button[aria-label^="Book lesson"]');

  // 2. Fill Form
  await page.fill('input[name="fullName"]', 'Secure User');
  await page.fill('input[name="email"]', 'secure@example.com');
  await page.fill('input[name="phone"]', '1234567890');
  await page.check('button[role="checkbox"]');
  await page.click('button:has-text("Book Lesson")');

  // 3. Verify Success Modal and Link
  await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
  const viewLink = page.locator('text=View Booking Details');
  await expect(viewLink).toBeVisible();

  // 4. Click Link
  const [newPage] = await Promise.all([
    page.context().waitForEvent('page'),
    viewLink.click(),
  ]);

  await newPage.waitForLoadState();
  
  // 5. Verify Details on New Page
  await expect(newPage.locator('text=Booking Details')).toBeVisible();
  await expect(newPage.locator(`text=${mockRef}`)).toBeVisible();
  await expect(newPage.locator('text=Secure Instructor')).toBeVisible();
  await expect(newPage.locator('text=Test Beach')).toBeVisible();
});

test('invalid secure token shows error', async ({ page }) => {
    // Mock get-booking-by-token to fail
    await page.context().route(`**/functions/v1/get-booking-by-token`, async route => {
        await route.fulfill({
            status: 404,
            json: { error: 'Invalid or expired token' }
        });
    });

    await page.goto('/booking/invalid-uuid-token');
    
    // Verify Error Alert
    await expect(page.locator('text=Error')).toBeVisible();
    await expect(page.locator('text=Invalid or expired token')).toBeVisible();
    await expect(page.locator('button:has-text("Return Home")')).toBeVisible();
});
