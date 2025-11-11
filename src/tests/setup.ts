import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runs before all tests
beforeAll(() => {
  // Setup test environment variables
  process.env.VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
});

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Runs after all tests
afterAll(() => {
  // Cleanup any resources
});
