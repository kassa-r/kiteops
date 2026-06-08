import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

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
        full_name: 'Test Manager Settings',
      },
    },
  });

  if (error) throw error;
  
  // Ensure profile role is set (trigger might handle it but explicit is safer for tests)
  if (data.user) {
    await supabase.from('profiles').upsert({ id: data.user.id, role });
  }

  return { email, password, user: data.user };
}

test.describe('Manager Settings', () => {
  let manager: { email: string; password: string };

  test.beforeAll(async () => {
    manager = await createTestUser('manager');
  });

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', manager.email);
    await page.fill('input[name="password"]', manager.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Navigate to Settings (assuming link exists or go directly)
    await page.goto('/settings');
  });

  test('Update weather parameters', async ({ page }) => {
    await expect(page.getByText('Weather Parameters')).toBeVisible();
    
    // Change values
    const minInput = page.getByLabel('Min Wind Speed');
    const maxInput = page.getByLabel('Max Wind Speed');
    
    await minInput.fill('15');
    await maxInput.fill('25');
    
    await page.click('button:has-text("Save Weather Settings")');
    
    // Check toast
    await expect(page.getByText('School settings updated successfully')).toBeVisible();
    
    // Reload to verify persistence
    await page.reload();
    await expect(minInput).toHaveValue('15');
    await expect(maxInput).toHaveValue('25');
  });

  test('Add and Deactivate Lesson Type', async ({ page }) => {
    await expect(page.getByText('Lesson Types')).toBeVisible();
    
    // Add new type
    await page.click('button:has-text("Add New Lesson Type")');
    await expect(page.getByRole('dialog')).toBeVisible();
    
    const name = `Kite Test ${Date.now()}`;
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="default_duration_minutes"]', '90');
    await page.fill('input[name="price"]', '100');
    
    await page.click('button:has-text("Add Lesson Type")');
    
    // Verify added
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText('Active', { exact: true }).last()).toBeVisible();

    // Deactivate
    // Find the checkbox for this item. 
    // Since names are unique enough, we can find the row.
    const row = page.getByText(name).locator('..').locator('..').locator('..'); // Traverse up to container
    const activeCheckbox = row.getByRole('checkbox');
    
    await activeCheckbox.click(); // Toggle off
    
    await expect(page.getByText('School settings updated successfully')).toBeVisible();
    
    // Check label changes to Inactive
    await expect(row.getByText('Inactive')).toBeVisible();
  });

  test('Upload school logo', async ({ page }) => {
    await expect(page.getByText('Branding')).toBeVisible();

    // Create a dummy file to upload
    const fileContent = 'dummy content';
    const fileName = 'test-logo.png';
    const mimeType = 'image/png';

    // Set the file input
    await page.getByLabel('School Logo').setInputFiles({
      name: fileName,
      mimeType: mimeType,
      buffer: Buffer.from(fileContent),
    });

    // Click the upload button
    await page.click('button:has-text("Upload Logo")');

    // Check for success toast
    await expect(page.getByText('School logo uploaded successfully')).toBeVisible();

    // Optional: Verify the image is now displayed
    // This requires knowing the structure of the rendered image.
    // For example:
    await expect(page.locator('img[alt="School Logo"]')).toHaveAttribute('src', /.*\.png/);
  });
});
