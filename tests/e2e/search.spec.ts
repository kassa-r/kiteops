import { test, expect } from '@playwright/test';

test.describe('Lesson Search', () => {
  test('should allow searching for lessons', async ({ page }) => {
    // Mock API response
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    await page.route('**/functions/v1/get-available-lessons*', async route => {
        const url = new URL(route.request().url());
        if (url.searchParams.get('date') === '2099-01-01') {
            await route.fulfill({ json: [] });
        } else {
            await route.fulfill({
                json: [{
                    start_time: `${dateStr}T10:00:00Z`,
                    end_time: `${dateStr}T11:00:00Z`,
                    available_slots: 1,
                    lesson_id: 1,
                    lesson_name: 'Private Lesson',
                    price: 100,
                    duration: 60
                }]
            });
        }
    });

    // Go to home page
    await page.goto('/');

    // Check header
    await expect(page.getByRole('heading', { name: 'Book Your Kite Surfing Lesson' })).toBeVisible();

    // Select Date
    await page.getByLabel('Date').fill(dateStr);

    // Check Results
    await expect(page.getByText('Private Lesson')).toBeVisible();
    await expect(page.getByText('60 minute session')).toBeVisible();
    await expect(page.getByText('€100')).toBeVisible();
    await expect(page.getByRole('button', { name: /\d{2}:\d{2}/ })).toBeVisible(); 

    // Test No Results
    await page.getByLabel('Date').fill('2099-01-01');
    await expect(page.getByText('No lessons available')).toBeVisible();
  });
});
