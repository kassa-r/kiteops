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

test.describe('Manager Dashboard', () => {
  let manager: { email: string; password: string; user: any };

  test.beforeAll(async () => {
    manager = await createTestUser('manager');
  });

  test('Manager login and dashboard visibility', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', manager.email);
    await page.fill('input[name="password"]', manager.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Check Title
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Manager Dashboard', { timeout: 15000 });

    // Check Widgets
    await expect(page.getByText("Today's Snapshot")).toBeVisible();
    await expect(page.getByText('Scheduled Lessons')).toBeVisible();
    await expect(page.getByText('Pending Bookings')).toBeVisible();
    await expect(page.getByText('Instructors Available')).toBeVisible();
    
    await expect(page.getByText('Upcoming Lessons')).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();
    
    // Check Quick Action Links
    await expect(page.getByRole('link', { name: 'View Full Calendar' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add Booking' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Manage Instructors' })).toBeVisible();
  });
});
