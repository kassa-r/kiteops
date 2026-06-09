import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Enable global APIs like expect, describe, it
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**', 'tests/e2e/**', 'tests/integration/**', 'tests/unit/**', 'supabase/functions/**/__tests__/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@supabase_functions': path.resolve(__dirname, './supabase/functions'),
    },
    tsconfig: './tsconfig.vitest.json',
  },
});