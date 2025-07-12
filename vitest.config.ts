import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react'; // Required for testing React components

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Makes describe, it, expect, etc. available globally
    environment: 'jsdom', // Simulate a browser environment
    setupFiles: './vitest.setup.ts', // Optional setup file (we'll create this next)
    include: ['src/**/*.test.{ts,tsx}'], // Pattern to find test files
    // Optional: configuration for @vitest/ui
    // ui: true, 
    // open: true,
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
}); 