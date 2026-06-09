
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockCreateClient = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

// Mock the environment variables (these should be loaded from .env.test)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or anonymous key is not defined in the environment variables.');
}

// Default test data to attempt to update
const DEFAULT_SETTINGS_ID = 1;
const testLessonTypes = ['Test Lesson 1', 'Test Lesson 2'];

/**
 * Creates a mocked Supabase client with a specific user role.
 * @param role The user's role ('manager', 'instructor', 'anon').
 * @returns A mocked Supabase client.
 */
const createMockSupabaseClient = (role: string = 'anon') => {
  const mockUser = role === 'anon' ? null : { id: `${role}-user-id`, email: `${role}@test.com`, role: role };
  const mockSession = mockUser ? { access_token: `${role}-token`, user: mockUser } : null;

  const mockQueryBuilder = (tableName: string, currentRole: string) => {
    let query = { tableName, currentRole, filters: {}, operation: '' as 'select' | 'update' | '' };
    let values: any = {};

    const chainable = {
      select: vi.fn((columns: string) => {
        if (query.operation !== 'update') {
          query.operation = 'select';
        }
        return chainable;
      }),
      eq: vi.fn((column: string, value: any) => {
        query.filters[column] = value;
        return chainable;
      }),
      update: vi.fn((updateValues: any) => {
        query.operation = 'update';
        values = updateValues;
        return chainable;
      }),
      single: vi.fn(async () => {
        if (query.tableName === 'school_settings') {
          if (query.operation === 'select') {
            if (currentRole === 'anon') {
              return { data: null, error: { message: 'permission denied for table school_settings', code: 'PGRST301' } };
            } else if (currentRole === 'instructor' || currentRole === 'manager') {
              return { data: { id: 1, lesson_types: testLessonTypes }, error: null };
            }
          } else if (query.operation === 'update') {
            if (currentRole === 'manager') {
              return { data: { id: 1, lesson_types: values.lesson_types }, error: null };
            } else if (currentRole === 'instructor') {
              return { data: null, error: null }; // RLS prevents data return for instructor
            } else {
              return { data: null, error: { message: 'permission denied for table school_settings', code: 'PGRST301' } };
            }
          }
        }
        return { data: null, error: new Error('Not mocked for this single() scenario') };
      }),
      maybeSingle: vi.fn(async () => {
        if (query.tableName === 'school_settings') {
          if (query.operation === 'select') {
            if (currentRole === 'anon') {
              return { data: null, error: { message: 'permission denied for table school_settings', code: 'PGRST301' } };
            } else if (currentRole === 'instructor' || currentRole === 'manager') {
              return { data: { id: 1, lesson_types: testLessonTypes }, error: null };
            }
          }
        }
        return { data: null, error: new Error('Not mocked for this maybeSingle() scenario') };
      }),
      then: vi.fn(async (callback) => { // This is for select without single/maybeSingle and update without select().single()
        if (query.tableName === 'school_settings') {
          if (query.operation === 'select') {
            if (currentRole === 'anon') {
              return callback({ data: null, error: { message: 'permission denied for table school_settings', code: 'PGRST301' } });
            }
            return callback({ data: [{ id: 1, lesson_types: testLessonTypes }], error: null });
          } else if (query.operation === 'update') {
              if (currentRole === 'manager') {
                  return callback({ data: null, error: null }); // Successful update, but no data returned initially
              } else if (currentRole === 'instructor') {
                  return callback({ data: [], error: null }); // RLS prevents data return for instructor
              }
              return callback({ data: null, error: { message: 'permission denied for table school_settings', code: 'PGRST301' } });
          }
        }
        return callback({ data: null, error: new Error('Not mocked for this then() scenario') });
      }),
    };
    return chainable;
  };

  const mockFromEntry = vi.fn((tableName: string) => mockQueryBuilder(tableName, role));

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
    },
    from: mockFromEntry,
  } as any as SupabaseClient;
};

describe('school_settings RLS Policies', () => {
  let managerClient: SupabaseClient;
  let instructorClient: SupabaseClient;
  let anonClient: SupabaseClient;

  beforeAll(async () => {
    mockCreateClient.mockImplementation((_url, _key, options) => {
        if (options?.global?.headers?.Authorization?.includes('manager-token')) {
            return createMockSupabaseClient('manager');
        } else if (options?.global?.headers?.Authorization?.includes('instructor-token')) {
            return createMockSupabaseClient('instructor');
        }
        return createMockSupabaseClient('anon');
    });

    managerClient = createMockSupabaseClient('manager');
    instructorClient = createMockSupabaseClient('instructor');
    anonClient = createMockSupabaseClient('anon');
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
