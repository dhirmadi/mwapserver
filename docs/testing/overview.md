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
  __tests__/          → Global test helpers and setup
  utils/
    __tests__/        → Utility function tests
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

### 1. Unit Tests
- Individual function testing
- Mocked dependencies
- Fast execution
- High coverage

### 2. Integration Tests
- Component interaction testing
- Real database connections
- Auth flow testing
- API endpoint testing

### 3. Coverage Requirements
- Minimum 80% coverage
- All utilities covered
- All middleware covered
- Critical paths covered

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

### Utils
- ✅ auth.ts
- ✅ validate.ts
- ⏳ errors.ts
- ⏳ logger.ts
- ⏳ response.ts

### Middleware
- ✅ auth.ts
- ⏳ roles.ts
- ⏳ errorHandler.ts

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

describe('API Endpoints', () => {
  it('should return 401 for unauthorized request', async () => {
    const response = await request(app)
      .get('/api/protected')
      .expect(401);
    
    expect(response.body.error.code).toBe('auth/invalid-token');
  });
});
```

## Future Improvements

1. **Coverage Expansion**
   - Add more integration tests
   - Increase coverage targets
   - Add performance tests
   - Add security tests

2. **Test Automation**
   - Add CI/CD integration
   - Automated coverage checks
   - Test result reporting
   - Performance benchmarks

3. **Testing Tools**
   - Consider E2E testing
   - Add mutation testing
   - Add load testing
   - Add security scanning