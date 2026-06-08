import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser(role: 'instructor' | 'manager' = 'instructor') {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `test-${uniqueId}@example.com`;
  const password = 'Password123!';
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: 'Test Instructor',
      },
    },
  });

  if (error) throw error;

  // Ensure profile exists (robustness against trigger latency/failures)
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

test.describe('Instructor Dashboard', () => {
  let instructor: { email: string; password: string; user: any };

  test.beforeAll(async () => {
    instructor = await createTestUser('instructor');
  });

  test('Instructor login and dashboard visibility', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', instructor.email);
    await page.fill('input[name="password"]', instructor.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/\/dashboard/);
    
    // Check for Error state first
    if (await page.getByText('Error loading dashboard').isVisible()) {
        const errorText = await page.locator('pre').textContent();
        console.error('Dashboard Error:', errorText);
        throw new Error('Dashboard failed to load: ' + errorText);
    }

    // Check for Access Restricted
    if (await page.getByText('Access Restricted').isVisible()) {
         throw new Error('Access Restricted: User role not recognized');
    }

    // Check Title - allowing 'Dashboard' or 'Instructor Dashboard' depending on impl
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dashboard', { timeout: 15000 });

    // Check Widgets
    await expect(page.getByText("Today's Snapshot")).toBeVisible();
    await expect(page.getByText('Local Conditions')).toBeVisible();
    await expect(page.getByText('Upcoming Lessons', { exact: true })).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();
  });

  test('Responsive layout (Mobile)', async ({ page }) => {
    // Login again since state might not persist across tests unless storageState is used
    await page.goto('/login');
    await page.fill('input[name="email"]', instructor.email);
    await page.fill('input[name="password"]', instructor.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.setViewportSize({ width: 375, height: 812 });
    
    // Ensure widgets stack
    await expect(page.getByText("Today's Snapshot")).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();
  });
});
