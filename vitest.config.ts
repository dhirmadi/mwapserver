import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use Node.js as the default environment
    environment: 'node',
    
    // Enable ESM support
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**/*'],
    
    // Setup file for global test configuration
    setupFiles: ['tests/setupTests.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.test.ts',
      ],
    },
  },
});