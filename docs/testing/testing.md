# MWAP Server Testing Documentation

## Overview

The MWAP server uses Vitest as its testing framework, providing a comprehensive test suite that covers unit tests, integration tests, and API endpoint tests. The testing infrastructure is designed to be maintainable, efficient, and developer-friendly.

## Test Structure

```
src/
├── __tests__/                 # Global test setup and utilities
│   ├── setup.ts              # Global test configuration
│   ├── mockDb.ts             # Database mocking utilities
│   ├── mockAuth.ts           # Authentication mocking
│   ├── factories.ts          # Test data factories
│   ├── helpers.ts            # Common test helpers
│   └── constants.ts          # Test constants
├── features/
│   └── tenants/
│       └── __tests__/        # Feature-specific tests
│           ├── tenants.routes.test.ts
│           ├── tenants.service.test.ts
│           └── tenants.controller.test.ts
└── utils/
    └── __tests__/           # Utility function tests
```

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
        // ... other exclusions
      ]
    }
  }
}
```

## Running Tests

Available npm scripts:
- `npm test`: Run all tests once
- `npm run test:watch`: Run tests in watch mode
- `npm run coverage`: Generate test coverage report

## Test Environment

### Global Setup
- Tests run in Node.js environment
- MongoDB is mocked for all database operations
- Auth0 JWKS client is mocked for authentication
- System time is set to a fixed value for consistent testing
- Environment variables are pre-configured for testing

### Mocking Infrastructure
1. **Database Mocking**
   - MongoDB operations are mocked via `mockDb.ts`
   - Collections are simulated with in-memory arrays
   - ObjectId generation is mocked for consistency

2. **Authentication Mocking**
   - Auth0 JWT verification is mocked
   - JWKS client returns a mock public key
   - Test tokens are provided for different user roles

## Test Utilities

### Test Factories
```typescript
// Create test tenant
const tenant = createTenant({
  name: 'Test Tenant',
  settings: { maxProjects: 10 }
});

// Create test superadmin
const admin = createSuperadmin('custom-id');
```

### Request Helpers
```typescript
// Authenticated request
const response = await authRequest(app)
  .get('/api/v1/resource')
  .send(data);

// Admin request
const response = await adminRequest(app)
  .post('/api/v1/resource')
  .send(data);
```

### Response Assertions
```typescript
// Success response
expectSuccess(response, 201);

// Error response
expectError(response, 404, ERROR_CODES.NOT_FOUND);
```

## Best Practices

1. **Test Organization**
   - Group tests by feature/module
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Test Data**
   - Use factories to create test data
   - Avoid hardcoded values
   - Clean up test data after each test

3. **Mocking**
   - Mock external dependencies
   - Reset mocks between tests
   - Use meaningful mock implementations

4. **Coverage**
   - Aim for high test coverage
   - Focus on critical paths
   - Include error scenarios

## Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { createTenant } from '../__tests__/factories';
import { authRequest, expectSuccess } from '../__tests__/helpers';

describe('Tenant API', () => {
  it('should create new tenant', async () => {
    // Arrange
    const data = createTenant({
      name: 'New Tenant'
    });

    // Act
    const response = await authRequest(app)
      .post('/api/v1/tenants')
      .send(data);

    // Assert
    expectSuccess(response, 201);
    expect(response.body).toMatchObject({
      name: data.name
    });
  });
});
```

## Test Coverage

The test suite provides coverage for:
- API Routes and Controllers
- Service Layer Logic
- Middleware Functions
- Utility Functions
- Error Handling
- Authentication/Authorization
- Request Validation

## Debugging Tests

1. **Watch Mode**
   ```bash
   npm run test:watch
   ```

2. **Filtering Tests**
   ```bash
   npm test -- tenants.routes
   ```

3. **Coverage Report**
   ```bash
   npm run coverage
   ```

## Common Issues and Solutions

1. **Async Test Timeouts**
   - Increase timeout in test config
   - Check for unresolved promises

2. **Mock Reset Issues**
   - Ensure `beforeEach` resets all mocks
   - Use `vi.clearAllMocks()`

3. **Database State Issues**
   - Reset mock collections between tests
   - Use isolated test data

## Contributing

When adding new tests:
1. Follow existing patterns and conventions
2. Use provided test utilities and helpers
3. Ensure proper cleanup after tests
4. Update test documentation if adding new patterns
5. Verify test coverage remains high