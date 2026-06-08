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
async function createTestUser(role: Role = 'instructor') {
  // Use a more robust unique email generator
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `test-${uniqueId}@example.com`;
  const password = 'Password123!';
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
      },
    },
  });

  if (error) {
    console.error(`Failed to create user with role ${role}:`, error);
    throw error;
  }
  
  return { email, password, user: data.user };
}

test.describe('RBAC & RLS Security', () => {
  let userA: { email: any; password: any; user: any; };
  let userB: { email: any; password: any; user: any; };

  test.beforeAll(async () => {
    // Create users sequentially to avoid any potential rate limiting or race conditions
    userA = await createTestUser('instructor');
    userB = await createTestUser('instructor');
  });

  test('Middleware: Unauthenticated user redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Middleware: Authenticated user can access /dashboard', async ({ page }) => {
    await page.goto('/login');
    // Wait for form to be visible
    await page.waitForSelector('input[name="email"]');
    
    await page.fill('input[name="email"]', userA.email);
    await page.fill('input[name="password"]', userA.password);
    
    // Click submit and wait for navigation
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test('RLS: User A cannot update User B\'s profile', async () => {
    // Authenticate as User A
    const { data: { session } } = await supabase.auth.signInWithPassword({
        email: userA.email,
        password: userA.password
    });
    if (!session) throw new Error('Failed to login as User A');

    const clientA = createClient(supabaseUrl!, supabaseAnonKey!, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } }
    });

    // Attempt to update User B's profile
    await clientA
        .from('profiles')
        .update({ role: 'manager' }) // Try to change role
        .eq('id', userB.user!.id);

    // Verify that the update did NOT happen by checking User B's profile
    // Use the admin/service client (if we had one) or just check via userB's view or public view
    // Since we don't have a service key here easily, we can check via supabase client (anon) if profiles are visible?
    // Or check via User B's session.
    
    const { data: { session: sessionB } } = await supabase.auth.signInWithPassword({
        email: userB.email,
        password: userB.password
    });
     const clientB = createClient(supabaseUrl!, supabaseAnonKey!, {
        global: { headers: { Authorization: `Bearer ${sessionB.access_token}` } }
    });

    const { data: profileB } = await clientB
        .from('profiles')
        .select('role')
        .eq('id', userB.user!.id)
        .single();
        
    expect(profileB?.role).not.toBe('manager');
  });

  test('RLS: Instructor A cannot delete Instructor B\'s availability', async () => {
     // Setup: User B creates an availability slot
     const { data: { session: sessionB } } = await supabase.auth.signInWithPassword({
        email: userB.email,
        password: userB.password
    });
    const clientB = createClient(supabaseUrl!, supabaseAnonKey!, {
        global: { headers: { Authorization: `Bearer ${sessionB.access_token}` } }
    });
    
    const { data: availB, error: setupError } = await clientB
        .from('availability')
        .insert({
            instructor_id: userB.user!.id,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString()
        })
        .select()
        .single();
        
    expect(setupError).toBeNull();
    if (!availB) throw new Error('Failed to create availability for User B');

    // User A tries to delete it
    const { data: { session: sessionA } } = await supabase.auth.signInWithPassword({
        email: userA.email,
        password: userA.password
    });
    const clientA = createClient(supabaseUrl!, supabaseAnonKey!, {
        global: { headers: { Authorization: `Bearer ${sessionA.access_token}` } }
    });

    await clientA
        .from('availability')
        .delete()
        .eq('id', availB.id);

    // Verify it still exists
    const { data: check } = await clientB
        .from('availability')
        .select()
        .eq('id', availB.id)
        .single();
        
    expect(check).toBeTruthy();
  });
});
