import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser(role: 'manager' | 'instructor') {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `${role}-${uniqueId}@example.com`;
  const password = 'Password123!';
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
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

test.describe('Calendar Role Views', () => {
  let manager: { email: string; password: string; user: any };
  let instructor: { email: string; password: string; user: any };

  test.beforeAll(async () => {
    manager = await createTestUser('manager');
    instructor = await createTestUser('instructor');
  });

  test('Manager sees Master Calendar', async ({ page }) => {
    // Login as Manager
    await page.goto('/login');
    await page.fill('input[name="email"]', manager.email);
    await page.fill('input[name="password"]', manager.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: 'Master Calendar' })).toBeVisible();
    await expect(page.getByText('View all school activities')).toBeVisible();
    
    // Check for manager-specific filter components
    await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible();
  });

  test('Instructor sees My Calendar', async ({ page }) => {
    // Login as Instructor
    await page.goto('/login');
    await page.fill('input[name="email"]', instructor.email);
    await page.fill('input[name="password"]', instructor.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: 'My Calendar' })).toBeVisible();
    
    // Check for instructor-specific buttons
    await expect(page.getByRole('button', { name: 'Add Availability' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Block Time' })).toBeVisible();
    
    // Check FullCalendar is loaded (looking for typical class names)
    await expect(page.locator('.fc-timegrid')).toBeVisible();
    
    // Verify Views
    await expect(page.getByTitle('Month view')).toBeVisible();
    await expect(page.getByTitle('Week view')).toBeVisible();
    await expect(page.getByTitle('Day view')).toBeVisible();
    await expect(page.getByTitle('List view')).toBeVisible();
  });
  
  test('Instructor can open Add Availability modal', async ({ page }) => {
     // Reuse instructor session
    await page.goto('/login');
    await page.fill('input[name="email"]', instructor.email);
    await page.fill('input[name="password"]', instructor.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    await page.goto('/calendar');
    await page.click('button:has-text("Add Availability")');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Availability' })).toBeVisible();
  });
});
