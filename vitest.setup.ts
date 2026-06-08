import '@testing-library/jest-dom';
import { createClient } from '@supabase/supabase-js'
import { beforeAll, vi } from 'vitest';
import { config } from 'dotenv';
import path from 'path';

// Polyfill ResizeObserver for Radix UI
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Load environment variables for the test setup
config({ path: path.resolve(__dirname, '.env.test') }); // Adjust path to root .env.test if needed

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Ensure environment variables are set
if (!url || !serviceRoleKey) {
  // If env vars are missing, we might be in a pure unit test env. Warn and skip auth setup.
  console.warn('Supabase URL or Service Role Key is not defined. Skipping DB setup.');
} else {

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })

  async function ensureUser(email: string, role: string) {
    try {
      // Check if user already exists
      const { data: users, error: searchError } = await admin.auth.admin.listUsers();
      if (searchError) {
        console.warn('Error listing users (skipping ensureUser):', searchError.message);
        return;
      }

      const existingUser = users?.users.find(u => u.email === email);
      if (existingUser) {
        // console.log(`User ${email} already exists.`);
        return;
      }

      // Create user if not found
      const { error } = await admin.auth.admin.createUser({
        email,
        password: 'password',
        email_confirm: true,
        user_metadata: { role },
      });

      if (error && !error.message.includes('already exists')) { 
        console.warn(`Failed to create user ${email}: ${error.message}`);
      }
    } catch (err: any) {
       console.warn(`Exception in ensureUser for ${email}: ${err.message}`);
    }
  }

  // Ensure manager and instructor test users exist before tests run
  beforeAll(async () => {
    await ensureUser('manager@test.com', 'manager');
    await ensureUser('instructor@test.com', 'instructor');
  });
}
