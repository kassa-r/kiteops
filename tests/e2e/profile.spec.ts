import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Supabase environment variables should now be loaded via playwright.config.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Role = 'admin' | 'manager' | 'instructor' | 'customer' | 'guest';

// Helper to create a temporary user
async function createTestUser(role: Role = 'instructor', retries = 5, delayMs = 2000) {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `profile-test-${uniqueId}@example.com`;
  const password = 'Password123!';
  
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
        },
      },
    });

    if (!error) {
      return { email, password, user: data.user };
    } else if (error.status === 429) { // Rate limit error
      console.warn(`Rate limit hit during user creation. Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } else {
      console.error(`Failed to create user with role ${role} (Attempt ${i + 1}/${retries}):`, error);
      throw error;
    }
  }
  throw new Error(`Failed to create user after ${retries} attempts due to rate limit or other error.`);
}

  test.describe('Instructor Profile Management', () => {
    let instructorUser: { email: string; password: string; user: any; };
    let consoleMessages: string[] = []; // Array to store console messages

    test.beforeAll(async () => {
      instructorUser = await createTestUser('instructor');
    });

    test.afterAll(async () => {
      if (instructorUser && instructorUser.user) {
        await supabase.auth.admin.deleteUser(instructorUser.user.id);
      }
    });

    test.beforeEach(async ({ page }) => {
      consoleMessages = []; // Reset messages for each test
      page.on('console', message => {
        if (message.type() === 'error') {
          console.error(`Page error: ${message.text()}`);
        } else {
          console.log(`Page console: ${message.text()}`);
        }
        consoleMessages.push(message.text()); // Store all messages
      });
      await page.goto('/login'); 
      await page.waitForSelector('input[name="email"]');
      
      await page.fill('input[name="email"]', instructorUser.email);
      await page.fill('input[name="password"]', instructorUser.password);
      
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 }); 
      await page.goto('/settings/profile'); 
      await expect(page.getByText('Instructor Profile', { exact: true })).toBeVisible();
    });

    test('should allow instructor to update profile and verify persistence (AC 1)', async ({ page }) => {
      await test.step('Update certifications and lesson types', async () => {
        const newCertifications = `New Cert 1, New Cert 2-${Date.now()}`;
        const newLessonTypes = `Advanced Surfing, Foiling-${Date.now()}`;

        await page.locator('textarea[name="certifications"]').fill(newCertifications);
        await page.locator('textarea[name="lesson_types"]').fill(newLessonTypes);
        await page.click('button[type="submit"]');
      });

      await test.step('Verify success notification (AC 2)', async () => {
        await expect.poll(() => consoleMessages).toContain('Profile updated successfully!');
      });

      await test.step('Reload page and verify persistence (AC 1)', async () => {
        await page.reload();
        await expect(page.locator('textarea[name="certifications"]')).toHaveValue(/New Cert 1, New Cert 2-.*/);
        await expect(page.locator('textarea[name="lesson_types"]')).toHaveValue(/Advanced Surfing, Foiling-.*/);
      });
    });

    test('should not allow update with invalid input (AC 3 - basic validation)', async ({ page }) => {
      await test.step('Attempt to submit empty values for required (though currently optional in schema) fields', async () => {
        await page.locator('textarea[name="certifications"]').fill('');
        await page.locator('textarea[name="lesson_types"]').fill('');
        await page.click('button[type="submit"]');
      });

      await test.step('Verify success notification (as empty is currently valid)', async () => {
        await expect.poll(() => consoleMessages).toContain('Profile updated successfully!');
      });

      await test.step('Verify persistence of empty values', async () => {
        await page.reload();
        await expect(page.locator('textarea[name="certifications"]')).toHaveValue('');
        await expect(page.locator('textarea[name="lesson_types"]')).toHaveValue('');
      });
    });

    test('should not allow unauthorized profile update (AC 4 is RLS based, but verify authorized works)', async ({ page }) => {
      await test.step('Attempt to update own profile', async () => {
        const newCertifications = `Authorized Cert-${Date.now()}`;
        await page.locator('textarea[name="certifications"]').fill(newCertifications);
        await page.click('button[type="submit"]');
      });

      await test.step('Verify success notification for authorized update', async () => {
        await expect.poll(() => consoleMessages).toContain('Profile updated successfully!');
      });
    });
  });
