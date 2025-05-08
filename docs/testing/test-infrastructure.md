# Test Infrastructure Guide

## Overview

The MWAP server uses Vitest as its testing framework with a comprehensive mocking infrastructure for MongoDB, Auth0, and JWT validation. The test infrastructure is designed to provide consistent, isolated, and maintainable tests.

## Core Components

### 1. Database Mocking
- MongoDB operations are fully mocked using typed collections
- In-memory storage simulates database state
- Automatic ObjectId generation and handling
- Collection-specific mock implementations

### 2. Authentication Mocking
- JWT validation is mocked for test tokens
- Auth0 JWKS client is mocked
- Standard test users and admin tokens
- Authentication middleware mocking

### 3. Test Utilities
- Factory functions for test data creation
- Request helpers for authentication
- Response verification helpers
- Type-safe mock collection management

## Test Setup

### MongoDB Mocking
```typescript
import { mockCollection, mockDb, resetMocks } from '../__tests__/mockDb';

// Collections are automatically mocked
const collection = mockDb.collection('tenants');

// Reset all mocks between tests
beforeEach(() => {
  resetMocks();
});
```

### Authentication Constants
```typescript
import { AUTH } from '../__tests__/constants';

// Standard test tokens
const userToken = AUTH.TOKEN;        // 'test-token'
const userHeader = AUTH.HEADER;      // 'Bearer test-token'

// Standard test users
const user = AUTH.USER;             // { sub: 'auth0|123', email: 'test@example.com' }
const admin = AUTH.ADMIN;           // { sub: 'auth0|admin', email: 'admin@example.com' }
```

## Test Factories

### Tenant Factory
```typescript
import { createTenant, createTenants } from '../__tests__/factories';

// Create single tenant
const tenant = createTenant({
  name: 'Custom Tenant',
  settings: { maxProjects: 50 }
});

// Create multiple tenants
const tenants = createTenants(3);
```

### Superadmin Factory
```typescript
import { createSuperadmin } from '../__tests__/factories';

// Create superadmin with default admin ID
const admin = createSuperadmin();

// Create superadmin with custom ID
const customAdmin = createSuperadmin('custom-user-id');
```

## Request Helpers

### Authentication Helpers
```typescript
import { authRequest, adminRequest } from '../__tests__/helpers';

// Regular user request (uses AUTH.TOKEN)
const response = await authRequest(app)
  .get('/api/v1/tenants')
  .send(data);

// Admin request (uses AUTH.ADMIN.sub)
const response = await adminRequest(app)
  .delete('/api/v1/tenants/123')
  .send(data);
```

### Response Verification
```typescript
import { expectSuccess, expectError } from '../__tests__/helpers';
import { ERROR_CODES } from '../__tests__/constants';

// Verify success response
expectSuccess(response, 201);

// Verify error response
expectError(response, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
```

## Mock Collection API

### MongoDB Mocking

#### ObjectId Mocking
```typescript
import { ObjectId } from '../__tests__/mockDb';

// Create new ObjectId
const id = new ObjectId();  // creates with default 'mock-id'
const id2 = new ObjectId('custom-id');  // creates with custom ID

// ObjectId methods
id.toString();     // returns 'mock-id'
id.toHexString();  // returns 'mock-id'
id.equals(id2);    // returns true if IDs match
```

#### Collection Operations
```typescript
import { mockCollection } from '../__tests__/mockDb';

// Setup mock responses
mockCollection.findOne.mockResolvedValue(tenant);
mockCollection.find.mockReturnValue({ toArray: () => Promise.resolve([tenant]) });
mockCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });
mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
```

### Smart Defaults
The mock collections come with smart defaults:
- `findOne`: Returns null by default
- `find`: Returns empty array by default
- `insertOne`: Generates mock ObjectId
- `updateOne`: Returns modifiedCount: 1
- `deleteOne`: Returns deletedCount: 1

## Best Practices

### 1. Test Organization
```typescript
describe('TenantService', () => {
  beforeEach(() => {
    resetMocks();  // Reset all mocks before each test
  });

  describe('createTenant', () => {
    it('should create new tenant', async () => {
      // Arrange: Setup test data and mocks
      const data = createTenant({ name: 'New Tenant' });
      mockCollection.findOne.mockResolvedValue(null);

      // Act: Execute the test
      const response = await authRequest(app)
        .post('/api/v1/tenants')
        .send(data);

      // Assert: Verify the results
      expectSuccess(response, 201);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Tenant' })
      );
    });
  });
});
```

### 2. Mock Management
- Always reset mocks in `beforeEach`
- Use typed mock collections
- Provide meaningful mock implementations
- Verify mock calls when relevant

### 3. Test Data
- Use factories for consistent test data
- Override only necessary fields
- Use constants for standard values
- Clean up test data after each test

### 4. Error Testing
```typescript
it('should handle not found error', async () => {
  // Setup mock to return null (not found)
  mockCollection.findOne.mockResolvedValue(null);

  // Make request
  const response = await authRequest(app)
    .get('/api/v1/tenants/123');

  // Verify error response
  expectError(response, 404, 'tenant/not-found');
});
```

## Common Issues & Solutions

### 1. ObjectId Handling
```typescript
// Convert string to ObjectId
import { toObjectId } from '../__tests__/helpers';
const id = toObjectId('123');

// Mock ObjectId in queries
mockCollection.findOne.mockImplementation(({ _id }) => {
  const idStr = _id.toString();
  return idStr === '123' ? tenant : null;
});
```

### 2. Date Handling
```typescript
// Use fixed date in tests
beforeEach(() => {
  vi.setSystemTime(new Date('2025-05-08T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});
```

### 3. Authentication Issues
```typescript
// Test invalid token
const response = await request(app)
  .get('/api/v1/tenants')
  .set('Authorization', 'Bearer invalid-token');

expectError(response, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
```

## Test Coverage Requirements

1. **API Routes**
   - Success cases
   - Error cases
   - Authentication/authorization
   - Input validation

2. **Services**
   - Business logic
   - Data access
   - Error handling
   - Edge cases

3. **Middleware**
   - Authentication
   - Error handling
   - Request processing
   - Response formatting