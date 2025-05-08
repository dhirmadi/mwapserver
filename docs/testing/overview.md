# 🧪 MWAP Testing Documentation

## Overview
This document outlines the testing strategy and implementation for the MWAP backend server.

## Testing Stack
- **Test Runner**: Vitest
- **Coverage Tool**: @vitest/coverage-v8
- **HTTP Testing**: Supertest
- **Mocking**: Vitest built-in mocking

## Test Structure
```
src/
  __tests__/          → Global test infrastructure
    constants.ts      → Standard test constants
    factories.ts      → Test data factories
    helpers.ts        → Test helpers
    mockDb.ts         → Database mocking
    mockAuth.ts       → Authentication mocking
    setup.ts          → Test setup and teardown
    app.test.ts       → Core app tests
  utils/
    __tests__/        → Utility function tests
      errors.test.ts  → Error constructor tests
      auth.test.ts    → Auth utility tests
  middleware/
    __tests__/        → Middleware tests
  features/
    {domain}/
      __tests__/      → Domain-specific tests
```

## Running Tests

### Basic Test Run
```bash
npm run test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run coverage
```

## Test Categories

### 1. Core Tests
- App setup and configuration
- Error handling
- Security middleware
- Health checks

### 2. Unit Tests
- Error constructors
- Utility functions
- Individual components
- High coverage

### 3. Integration Tests
- API endpoints
- Authentication flow
- Database operations
- Error handling

### 4. Coverage Requirements
- Core (app.ts, errors): 100%
- Utils and Middleware: > 90%
- Features: > 80%
- Overall: > 80%

## Testing Standards

### 1. File Naming
- Test files end in `.test.ts`
- One test file per source file
- Clear, descriptive test names

### 2. Test Structure
```typescript
describe('Component/Feature', () => {
  describe('function/scenario', () => {
    it('should behave in specific way', () => {
      // Test code
    });
  });
});
```

### 3. Mocking
- Mock external services
- Mock database calls
- Mock file system
- Clear mock cleanup

### 4. Assertions
- Clear assertion messages
- One concept per test
- Comprehensive edge cases
- Error case testing

## Current Test Coverage

### Utils (94.78% coverage)
- ✅ auth.ts (100%)
- ✅ validate.ts (83.33%)
- ✅ errors.ts (88.88%)
- ✅ logger.ts (100%)
- ✅ response.ts (100%)

### Middleware (100% coverage)
- ✅ auth.ts (100%, 50% branch)
- ✅ roles.ts (100%)
- ✅ errorHandler.ts (100%)

### Features
#### Tenants Domain (90%+ coverage)
- ✅ tenants.routes.ts
- ✅ tenants.controller.ts
- ✅ tenants.service.ts
- ✅ tenant.schema.ts

### Config (100% coverage)
- ✅ env.ts (100%)
- ✅ auth0.ts (100%)
- ✅ db.ts (100%)

### App
- ❌ app.ts (0%)

## Best Practices

1. **Test Organization**
   - Group related tests
   - Clear test descriptions
   - Proper setup and teardown
   - Isolated test cases

2. **Mocking**
   - Mock at appropriate level
   - Reset mocks between tests
   - Verify mock calls
   - Mock external services

3. **Assertions**
   - Use type-safe assertions
   - Test edge cases
   - Verify error conditions
   - Check response formats

4. **Coverage**
   - Track coverage metrics
   - Cover edge cases
   - Test error paths
   - Test async operations

## Example Tests

### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { validateWithSchema } from '../validate';
import { z } from 'zod';

describe('validateWithSchema', () => {
  const schema = z.object({
    name: z.string()
  });

  it('should validate correct data', () => {
    const result = validateWithSchema(schema, { name: 'test' });
    expect(result).toEqual({ name: 'test' });
  });

  it('should throw for invalid data', () => {
    expect(() => {
      validateWithSchema(schema, { name: 123 });
    }).toThrow();
  });
});
```

### Integration Test Example
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { TenantService } from '../features/tenants/tenants.service';

describe('Tenant API Endpoints', () => {
  const userId = 'auth0|123';

  beforeEach(async () => {
    // Clear test data
    await db.collection('tenants').deleteMany({});
  });

  it('should create a new tenant', async () => {
    const response = await request(app)
      .post('/api/v1/tenants')
      .send({
        name: 'Test Tenant',
        settings: {
          allowPublicProjects: true,
          maxProjects: 20
        }
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Test Tenant',
      settings: {
        allowPublicProjects: true,
        maxProjects: 20
      }
    });
  });

  it('should return 409 if tenant already exists', async () => {
    // Create initial tenant
    await new TenantService().createTenant(userId, {
      name: 'Test Tenant',
      settings: {
        allowPublicProjects: false,
        maxProjects: 10
      }
    });

    // Try to create another tenant
    const response = await request(app)
      .post('/api/v1/tenants')
      .send({
        name: 'Another Tenant',
        settings: {
          allowPublicProjects: true,
          maxProjects: 20
        }
      })
      .expect(409);

    expect(response.body.error.code).toBe('tenant/already-exists');
  });
});
```

## Future Improvements

1. **Coverage Expansion**
   - ✅ Added comprehensive tests for config files (auth0.ts, db.ts, env.ts)
   - Add tests for app.ts setup and middleware integration
   - Improve branch coverage in auth middleware
   - Add performance tests for database operations

2. **Test Automation**
   - Add CI/CD integration with GitHub Actions
   - Add pre-commit hooks for test execution
   - Implement automated coverage reporting
   - Add performance benchmarking for API endpoints

3. **Testing Tools**
   - Add E2E tests for complete user flows
   - Implement mutation testing with Stryker
   - Add load testing with Artillery
   - Integrate security scanning with OWASP ZAP

4. **Domain Coverage**
   - Add tests for upcoming Project domain
   - Add tests for CloudProvider integrations
   - Add tests for virtual file operations
   - Add tests for tenant isolation