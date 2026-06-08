import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Supabase Client Initialization', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules(); // Clear cache to re-import db.ts
    process.env = { ...ORIGINAL_ENV }; // Copy env
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV; // Restore env
  });

  it('throws error if NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

    await expect(import('../../lib/db')).rejects.toThrow('Missing Supabase environment variables');
  });

  it('throws error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    await expect(import('../../lib/db')).rejects.toThrow('Missing Supabase environment variables');
  });

  it('exports supabase client when env vars are present', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

    const { supabase } = await import('../../lib/db');
    expect(supabase).toBeDefined();
  });
});
