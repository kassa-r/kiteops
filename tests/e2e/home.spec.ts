import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/KiteOps/);
});

test('get started link', async ({ page }) => {
  await page.goto('/');

  // Expect an h1 heading with the actual text found on the page
  await expect(page.locator('h1')).toHaveText('Book Your Kite Surfing Lesson');
});
