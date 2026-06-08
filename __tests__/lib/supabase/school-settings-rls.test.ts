
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';

// Supabase connection details from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or anonymous key is not defined in the environment variables.');
}

// Default test data to attempt to update
const DEFAULT_SETTINGS_ID = 1;
const testLessonTypes = ['Test Lesson 1', 'Test Lesson 2'];

/**
 * Creates a Supabase client authenticated as a specific user.
 * @param email The user's email.
 * @param password The user's password.
 * @returns An authenticated Supabase client.
 */
const createAuthedClient = async (email, password) => {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Failed to sign in as ${email}: ${error.message}`);
  }
  // Create a new client with the user's access token
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    },
  });
};

describe('school_settings RLS Policies', () => {
  let managerClient: SupabaseClient;
  let instructorClient: SupabaseClient;
  let anonClient: SupabaseClient;

  beforeAll(async () => {
    // Note: These test users must exist in your test database with the correct roles.
    managerClient = await createAuthedClient('manager@test.com', 'password');
    instructorClient = await createAuthedClient('instructor@test.com', 'password');
    anonClient = createClient(supabaseUrl, supabaseAnonKey);
  });

  // Test Case 1: Anonymous User
  describe('As an Anonymous User', () => {
          it('should NOT be able to read from school_settings', async () => {
          const { data, error } = await anonClient.from('school_settings').select('*');
          expect(error).not.toBeNull(); // Expect an error for unauthorized access
          expect(error?.code).toBe('PGRST301'); // Check for the specific RLS error code
          expect(data).toBeNull(); // Data should be null as access is denied
        });
    
        it('should NOT be able to update school_settings', async () => {
          const { data, error } = await anonClient
            .from('school_settings')
            .update({ lesson_types: testLessonTypes })
            .eq('id', DEFAULT_SETTINGS_ID);
          expect(error).not.toBeNull(); // Expect an error for unauthorized access
          expect(error?.code).toBe('PGRST301'); // Check for the specific RLS error code
          expect(data).toBeNull(); // Data should be null as access is denied
        });  });

  // Test Case 2: Authenticated User (non-manager)
  describe('As an Authenticated User (Instructor)', () => {
    it('should be able to read from school_settings', async () => {
      const { data, error } = await instructorClient.from('school_settings').select('*');
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.length).toBeGreaterThan(0);
    });

    it('should NOT be able to update school_settings', async () => {
      const { data, error } = await instructorClient
        .from('school_settings')
        .update({ lesson_types: testLessonTypes })
        .eq('id', DEFAULT_SETTINGS_ID)
        .select(); // Using .select() helps to see if the update happened
      expect(error).toBeNull();
      // RLS on update prevents the row from being returned.
      // If the update was successful, data would contain the updated row.
      expect(data).toEqual([]);
    });
  });

  // Test Case 3: Authenticated User (Manager)
  describe('As a Manager', () => {
    it('should be able to read from school_settings', async () => {
      const { data, error } = await managerClient.from('school_settings').select('*');
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.length).toBeGreaterThan(0);
    });

    it('should be able to update school_settings', async () => {
      // Fetch original value to restore it later
      const { data: originalData, error: fetchError } = await managerClient
        .from('school_settings')
        .select('lesson_types')
        .eq('id', DEFAULT_SETTINGS_ID)
        .single();
      expect(fetchError).toBeNull();

      const originalLessonTypes = originalData.lesson_types;

      // Perform the update
      const { data: updatedData, error: updateError } = await managerClient
        .from('school_settings')
        .update({ lesson_types: testLessonTypes })
        .eq('id', DEFAULT_SETTINGS_ID)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updatedData).not.toBeNull();
      expect(updatedData.lesson_types).toEqual(testLessonTypes);

      // Restore original value
      const { error: restoreError } = await managerClient
        .from('school_settings')
        .update({ lesson_types: originalLessonTypes })
        .eq('id', DEFAULT_SETTINGS_ID);
      
      expect(restoreError).toBeNull();
    });
  });
});
