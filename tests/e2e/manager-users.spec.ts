import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables (URL or Service Role Key).');
}

// Use service role client for admin operations (creating manager users)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
    // Ensure profile exists and has correct role
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        role: role,
        full_name: 'Test Manager',
    });
    if (profileError) {
        console.warn('Manual profile upsert failed:', profileError);
    }
  }

  return { email, password, user: data.user };
}

test.describe('Manager User Management', () => {
  let manager: { email: string; password: string; user: any };

  test.beforeAll(async () => {
    manager = await createTestUser('manager');
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', manager.email);
    await page.fill('input[name="password"]', manager.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('Customer Management Workflow', async ({ page }) => {
    // 1. Navigate to Customers page
    await page.click('text=Customers');
    await page.waitForURL(/\/customers/);
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();

    // 2. Add New Customer
    await page.click('button:has-text("Add Customer")');
    await expect(page.getByText('Add New Customer')).toBeVisible();
    
    const newCustomerName = `Test Cust ${Date.now()}`;
    await page.fill('input[name="name"]', newCustomerName);
    await page.fill('input[name="email"]', `cust-${Date.now()}@test.com`);
    // await page.selectOption('select[name="skill_level"]', 'beginner');
    await page.click('button:has-text("Create Customer")');
    
    // Wait for modal to close and customer to appear in list
    await expect(page.getByText('Add New Customer')).not.toBeVisible();
    await expect(page.getByText(newCustomerName)).toBeVisible();

    // 3. Search for Customer
    await page.fill('input[placeholder*="Search"]', newCustomerName);
    await expect(page.getByText(newCustomerName)).toBeVisible();

    // 4. View Details
    await page.click(`tr:has-text("${newCustomerName}") button[aria-label="View details"]`);
    await expect(page.getByText('Customer Details')).toBeVisible();
    await expect(page.getByText(newCustomerName)).toBeVisible();
    // Close details modal (click outside or close button - assuming standard Dialog)
    await page.keyboard.press('Escape');

    // 5. Edit Customer
    await page.click(`tr:has-text("${newCustomerName}") button[aria-label="Edit customer"]`);
    await expect(page.getByRole('heading', { name: 'Edit Customer' })).toBeVisible();
    
    const updatedName = `${newCustomerName} Updated`;
    await page.fill('input[name="name"]', updatedName);
    await page.click('button:has-text("Save Changes")');
    
    await expect(page.getByRole('heading', { name: 'Edit Customer' })).not.toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('Instructor Management Workflow', async ({ page }) => {
    // 1. Navigate to Instructors page
    await page.click('text=Instructors');
    await page.waitForURL(/\/instructors/);
    await expect(page.getByRole('heading', { name: 'Instructors' })).toBeVisible();

    // 2. Add New Instructor
    await page.click('button:has-text("Add Instructor")');
    await expect(page.getByText('Add New Instructor')).toBeVisible();
    
    const newInstructorName = `Test Inst ${Date.now()}`;
    await page.fill('input[name="name"]', newInstructorName);
    await page.fill('input[name="email"]', `inst-${Date.now()}@test.com`);
    await page.click('button:has-text("Create Instructor")');
    
    // Debug: Check if modal closes or error appears
    try {
        await expect(page.getByText('Add New Instructor')).not.toBeVisible({ timeout: 5000 });
    } catch (e) {
        // If still visible, check for error toast
        const errorToast = page.locator('li[data-type="error"]'); // Sonner toast
        if (await errorToast.isVisible()) {
            const errorText = await errorToast.textContent();
            throw new Error(`Modal failed to close. Error toast: ${errorText}`);
        }
        // Also check if there is text "Failed to add" visible anywhere
        const failedText = await page.getByText(/Failed to add/).first().textContent().catch(() => null);
         if (failedText) {
            throw new Error(`Modal failed to close. Error text found: ${failedText}`);
        }
        throw e;
    }
    
    await expect(page.getByText(newInstructorName)).toBeVisible();

    // 3. Edit Instructor
    await page.click(`tr:has-text("${newInstructorName}") button[aria-label="Edit instructor"]`);
    await expect(page.getByRole('heading', { name: 'Edit Instructor' })).toBeVisible();
    
    const updatedName = `${newInstructorName} Updated`;
    await page.fill('input[name="name"]', updatedName);
    await page.click('button:has-text("Save Changes")');
    
    await expect(page.getByRole('heading', { name: 'Edit Instructor' })).not.toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();

    // 4. Delete Instructor
    await page.click(`tr:has-text("${updatedName}") button[aria-label="Delete instructor"]`);
    await expect(page.getByText('Are you absolutely sure?')).toBeVisible();
    await page.click('button:has-text("Delete Instructor")');
    
    await expect(page.getByText(updatedName)).not.toBeVisible();
  });
});
