# Test Infrastructure Guide

## Overview

The MWAP server uses a standardized test infrastructure to maintain consistency and reduce duplication.

## Test Factories

### Tenant Factory
```typescript
import { createTenant } from '../__tests__/factories';

// Create default tenant
const tenant = createTenant();

// Create tenant with overrides
const customTenant = createTenant({
  name: 'Custom Name',
  settings: {
    maxProjects: 50
  }
});

// Create multiple tenants
const tenants = createTenants(3);
```

### Superadmin Factory
```typescript
import { createSuperadmin } from '../__tests__/factories';

// Create superadmin
const admin = createSuperadmin();

// Create custom superadmin
const customAdmin = createSuperadmin('custom-user-id');
```

## Test Helpers

### Authentication Helpers
```typescript
import { authRequest, adminRequest } from '../__tests__/helpers';

// Make authenticated request
const response = await authRequest(app)
  .get('/api/resource')
  .send(data);

// Make admin request
const response = await adminRequest(app)
  .delete('/api/resource')
  .send(data);
```

### Response Verification
```typescript
import { expectSuccess, expectError } from '../__tests__/helpers';

// Verify success response
expectSuccess(response, 201);

// Verify error response
expectError(response, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
```

## Test Setup & Cleanup

### Global Setup
```typescript
// In src/__tests__/setup.ts
beforeEach(() => {
  // Reset all mocks
  resetMocks();
  vi.clearAllMocks();
  
  // Reset dates to known value
  vi.setSystemTime(new Date('2025-05-08T12:00:00Z'));
});
```

### Global Cleanup
```typescript
// In src/__tests__/setup.ts
afterEach(() => {
  // Clear mocks
  vi.clearAllMocks();
  vi.useRealTimers();
  
  // Clear test data
  mockCollection.deleteMany({});
  mockSuperadminsCollection.deleteMany({});
});
```

## Best Practices

1. Use Factories
   - Create test data with factories
   - Override only what's needed
   - Maintain data consistency

2. Use Helpers
   - Use auth helpers for requests
   - Use verification helpers
   - Keep tests DRY

3. Test Cleanup
   - Clean up after each test
   - Reset mocks properly
   - Maintain test isolation

## Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { createTenant } from '../__tests__/factories';
import { authRequest, expectSuccess } from '../__tests__/helpers';

describe('Tenant API', () => {
  it('should create tenant', async () => {
    // Create test data
    const data = createTenant({
      name: 'New Tenant'
    });

    // Setup mocks
    mockCollection.findOne.mockResolvedValue(null);
    mockCollection.insertOne.mockResolvedValue({ 
      insertedId: data._id 
    });

    // Make request
    const response = await authRequest(app)
      .post('/api/v1/tenants')
      .send(data);

    // Verify response
    expectSuccess(response, 201);
    expect(response.body).toMatchObject({
      name: data.name
    });
  });
});
```

## Common Patterns

1. Test Data Setup
```typescript
// Create test data
const tenant = createTenant();
const admin = createSuperadmin();

// Setup mocks
mockCollection.findOne.mockResolvedValue(tenant);
mockSuperadminsCollection.findOne.mockResolvedValue(admin);
```

2. Request Making
```typescript
// Regular user request
const response = await authRequest(app).get('/api/resource');

// Admin request
const response = await adminRequest(app).delete('/api/resource');
```

3. Response Verification
```typescript
// Success cases
expectSuccess(response);
expect(response.body).toMatchObject({...});

// Error cases
expectError(response, 404, ERROR_CODES.NOT_FOUND);
```

## Tips

1. Keep Tests Clean
   - Use factories for data
   - Use helpers for common operations
   - Follow standard patterns

2. Maintain Isolation
   - Clean up after tests
   - Reset mocks properly
   - Don't share state

3. Write Clear Tests
   - Use descriptive names
   - Follow AAA pattern
   - Keep tests focused