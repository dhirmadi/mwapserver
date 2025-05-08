# Test Environment Setup

## Overview

The MWAP server test environment is configured to run tests in isolation with mocked external dependencies. This document explains the test environment setup, configuration, and available tools.

## Environment Configuration

### Test Environment Variables (.env.test)
```env
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/mwap_test
AUTH0_DOMAIN=test.auth0.com
AUTH0_AUDIENCE=https://api.test.mwap.dev
```

These environment variables are automatically loaded during test execution. The test environment uses:
- A separate MongoDB database for testing
- Mock Auth0 configuration
- Test-specific API audience

## Test Configuration

### Vitest Configuration (vitest.config.ts)
```typescript
{
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/server.ts',
        'src/__tests__/**',
        'coverage/**',
        'dist/**',
        '**/node_modules/**'
      ]
    }
  }
}
```

Key configuration points:
- Node.js test environment
- Global test setup file
- Code coverage configuration
- Test file pattern matching

## Test Scripts

### NPM Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "coverage": "vitest run --coverage"
  }
}
```

### Manual Test Server (scripts/test-server.sh)
```bash
#!/bin/bash

# Start test server with environment setup
npm install
npm run build
npm run start &

# Capture server PID
SERVER_PID=$!

# Wait for server startup
sleep 4

# Test API endpoint
JWT_TOKEN="your-test-jwt-token-here"
curl -s -X GET http://localhost:3000/api/v1/tenants/me \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"

# Cleanup
kill $SERVER_PID
```

This script provides a way to:
- Test the server in a local environment
- Verify API endpoints manually
- Test with real JWT tokens

## Running Tests

### 1. Single Test Run
```bash
npm test
```
- Runs all tests once
- Shows test results and coverage
- Exits after completion

### 2. Watch Mode
```bash
npm run test:watch
```
- Watches for file changes
- Re-runs affected tests
- Interactive test selection

### 3. Coverage Report
```bash
npm run coverage
```
- Generates detailed coverage report
- Shows coverage metrics
- Creates HTML report

## Test Environment Features

### 1. Database Isolation
- Separate test database
- Mocked MongoDB operations
- Automatic cleanup between tests

### 2. Authentication Mocking
- Mock JWT validation
- Mock Auth0 JWKS client
- Test user and admin tokens

### 3. Time Management
- Fixed timestamp for tests
- Controlled date/time values
- Consistent temporal testing

## Best Practices

### 1. Environment Setup
- Use `.env.test` for test configuration
- Keep test environment isolated
- Mock external services

### 2. Test Data
- Use test factories
- Clean up after tests
- Maintain data isolation

### 3. Test Organization
- Group related tests
- Use descriptive names
- Follow AAA pattern

## Common Issues

### 1. Database Connection
If MongoDB connection fails:
- Verify test database URL
- Check MongoDB service
- Review connection mocks

### 2. Authentication
If auth tests fail:
- Check mock token setup
- Verify Auth0 configuration
- Review JWT validation

### 3. Test Isolation
If tests interfere:
- Reset mocks between tests
- Clear database state
- Check global state

## Debugging Tests

### 1. Watch Mode
```bash
npm run test:watch
```
- Interactive test selection
- Immediate feedback
- Filter by file pattern

### 2. Debug Logging
```typescript
// Add debug logs in tests
console.log('Debug:', value);
```

### 3. Test Filter
```bash
npm test -- tenants.service
```
- Run specific test files
- Filter by test name
- Focus on failing tests

## Continuous Integration

The test environment is designed to work in CI/CD pipelines:
- Automated test runs
- Coverage reporting
- Environment isolation

### CI Configuration
- Use Node.js CI image
- Set test environment variables
- Configure test timeouts

## Extending the Test Environment

### 1. Adding New Mocks
```typescript
// Create new mock
vi.mock('new-dependency', () => ({
  someFunction: vi.fn()
}));

// Reset in beforeEach
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 2. Custom Test Helpers
```typescript
// Add helper function
export function customTestHelper() {
  // Helper implementation
}

// Use in tests
import { customTestHelper } from '../__tests__/helpers';
```

### 3. Test Utilities
```typescript
// Add utility function
export function testUtility<T>(value: T): T {
  // Utility implementation
}
```