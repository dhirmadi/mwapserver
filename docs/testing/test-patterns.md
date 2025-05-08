# Testing Patterns Guide

## Overview

This document outlines common testing patterns and best practices for the MWAP server. These patterns ensure consistency, maintainability, and reliability across the test suite.

## Test Organization

### File Structure
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mockCollection, resetMocks } from '../__tests__/mockDb';
import { createTenant } from '../__tests__/factories';
import { authRequest, expectSuccess } from '../__tests__/helpers';
import { AUTH, ERROR_CODES } from '../__tests__/constants';

describe('Feature/Component', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('function/scenario', () => {
    it('should behave in specific way', async () => {
      // Test implementation
    });
  });
});
```

### Test Grouping
```typescript
describe('TenantService', () => {
  // Feature-level setup
  beforeEach(() => {
    resetMocks();
  });

  describe('createTenant', () => {
    // Function-level tests
    it('should create new tenant', async () => {});
    it('should validate input', async () => {});
    it('should handle errors', async () => {});
  });

  describe('updateTenant', () => {
    // Another function group
  });
});
```

## Common Test Patterns

### 1. API Endpoint Tests
```typescript
describe('POST /api/v1/tenants', () => {
  it('should create tenant with valid data', async () => {
    // Arrange
    const data = createTenant({ name: 'New Tenant' });
    mockCollection.findOne.mockResolvedValue(null);

    // Act
    const response = await authRequest(app)
      .post('/api/v1/tenants')
      .send(data);

    // Assert
    expectSuccess(response, 201);
    expect(mockCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Tenant' })
    );
  });

  it('should reject invalid data', async () => {
    // Arrange
    const data = { invalid: true };

    // Act
    const response = await authRequest(app)
      .post('/api/v1/tenants')
      .send(data);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('validation/invalid-input');
  });
});
```

### 2. Service Layer Tests
```typescript
describe('TenantService', () => {
  describe('createTenant', () => {
    it('should create tenant in database', async () => {
      // Arrange
      const data = createTenant();
      mockCollection.findOne.mockResolvedValue(null);

      // Act
      const result = await tenantService.createTenant(AUTH.USER.sub, data);

      // Assert
      expect(result).toMatchObject({
        name: data.name,
        ownerId: AUTH.USER.sub
      });
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('should throw if tenant exists', async () => {
      // Arrange
      mockCollection.findOne.mockResolvedValue({ exists: true });

      // Act & Assert
      await expect(
        tenantService.createTenant(AUTH.USER.sub, data)
      ).rejects.toThrow('Tenant already exists');
    });
  });
});
```

### 3. Middleware Tests
```typescript
describe('Authentication Middleware', () => {
  it('should pass valid token', async () => {
    // Arrange
    const req = mockRequest({
      headers: { authorization: AUTH.HEADER }
    });
    const res = mockResponse();
    const next = vi.fn();

    // Act
    await authenticateJWT()(req, res, next);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(AUTH.USER);
  });

  it('should reject invalid token', async () => {
    // Arrange
    const req = mockRequest({
      headers: { authorization: 'Bearer invalid' }
    });
    const res = mockResponse();
    const next = vi.fn();

    // Act
    await authenticateJWT()(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 401,
        code: ERROR_CODES.AUTH.INVALID_TOKEN
      })
    );
  });
});
```

### 4. Utility Function Tests
```typescript
describe('validateWithSchema', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number()
  });

  it('should validate correct data', () => {
    // Arrange
    const data = { name: 'Test', age: 25 };

    // Act
    const result = validateWithSchema(schema, data);

    // Assert
    expect(result).toEqual(data);
  });

  it('should throw for invalid data', () => {
    // Arrange
    const data = { name: 'Test', age: '25' };

    // Act & Assert
    expect(() => validateWithSchema(schema, data))
      .toThrow('validation/invalid-input');
  });
});
```

## Testing Patterns by Type

### 1. Database Operations
```typescript
describe('Database Operations', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should handle successful query', async () => {
    // Setup mock response
    mockCollection.findOne.mockResolvedValue({
      _id: 'test-id',
      name: 'Test'
    });

    // Perform operation
    const result = await service.findById('test-id');

    // Verify result
    expect(result).toMatchObject({
      _id: 'test-id',
      name: 'Test'
    });
  });

  it('should handle not found', async () => {
    // Setup mock response
    mockCollection.findOne.mockResolvedValue(null);

    // Verify error
    await expect(
      service.findById('test-id')
    ).rejects.toThrow('not found');
  });
});
```

### 2. Authentication Tests
```typescript
describe('Authentication', () => {
  it('should authenticate valid user', async () => {
    const response = await authRequest(app)
      .get('/api/v1/me')
      .set('Authorization', AUTH.HEADER);

    expectSuccess(response);
    expect(response.body.data).toMatchObject({
      sub: AUTH.USER.sub
    });
  });

  it('should reject invalid token', async () => {
    const response = await request(app)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer invalid');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe(
      ERROR_CODES.AUTH.INVALID_TOKEN
    );
  });
});
```

### 3. Validation Tests
```typescript
describe('Input Validation', () => {
  it('should validate required fields', async () => {
    const response = await authRequest(app)
      .post('/api/v1/tenants')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('validation/invalid-input');
    expect(response.body.error.details).toContain('name is required');
  });

  it('should validate field types', async () => {
    const response = await authRequest(app)
      .post('/api/v1/tenants')
      .send({
        name: 123,
        settings: 'invalid'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toContain(
      'name must be a string'
    );
  });
});
```

## Best Practices

### 1. Test Setup
- Reset mocks before each test
- Use factory functions for test data
- Keep setup minimal and focused
- Clean up after tests

### 2. Test Structure
- Follow AAA pattern (Arrange, Act, Assert)
- One assertion concept per test
- Clear test descriptions
- Group related tests

### 3. Mocking
- Mock at appropriate level
- Verify mock calls when relevant
- Provide meaningful mock responses
- Reset mocks between tests

### 4. Assertions
- Use type-safe assertions
- Check error codes and messages
- Verify response formats
- Test edge cases

## Common Pitfalls

### 1. Database State
```typescript
// ❌ Wrong: Shared state
let tenant;
beforeAll(async () => {
  tenant = await createTenant();
});

// ✅ Right: Isolated state
beforeEach(async () => {
  resetMocks();
});
```

### 2. Async Testing
```typescript
// ❌ Wrong: Missing await
it('should fail', () => {
  const promise = service.operation();
  expect(promise).rejects.toThrow();
});

// ✅ Right: Proper async testing
it('should fail', async () => {
  await expect(
    service.operation()
  ).rejects.toThrow();
});
```

### 3. Mock Verification
```typescript
// ❌ Wrong: Missing mock verification
it('should create', async () => {
  await service.create(data);
});

// ✅ Right: Verify mock calls
it('should create', async () => {
  await service.create(data);
  expect(mockCollection.insertOne).toHaveBeenCalledWith(
    expect.objectContaining(data)
  );
});
```

## Test Coverage Guidelines

### 1. Routes
- Success case
- Validation errors
- Authentication
- Authorization
- Error handling

### 2. Services
- Success operations
- Error conditions
- Edge cases
- Business logic
- Data validation

### 3. Middleware
- Success flow
- Error handling
- Edge cases
- Chain behavior

### 4. Utilities
- Normal operation
- Error conditions
- Edge cases
- Type handling