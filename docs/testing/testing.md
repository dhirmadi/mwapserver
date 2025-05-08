# Testing Documentation

## Current Test Status

### Overview
- Total Tests: 75
- Passing Tests: 66
- Failing Tests: 9
- Test Files: 13 (10 passing, 3 failing)
- Test Coverage: Improved
  * Config files now at 100% coverage
  * Overall statement coverage increased to 81.25%

### Known Issues

#### 1. Authentication Tests
- Auth middleware mock not properly handling JWT tokens
- JWKS client mock not being called as expected
- Route tests failing with 401 Unauthorized
- Token validation needs to be properly mocked

#### 2. Service Layer Tests
- Update operations returning incorrect response structure
- MongoDB findOneAndUpdate responses not properly handled
- Superadmin collection access not properly mocked
- Tenant object structure inconsistencies

#### 3. Route Tests
- Authentication failures in route tests
- Error handling middleware not properly integrated
- Validation error responses not consistent

### Test Structure

#### 1. Unit Tests
- `/src/utils/__tests__/`: Utility function tests
  - auth.test.ts
  - logger.test.ts
  - response.test.ts
  - validate.test.ts

- `/src/middleware/__tests__/`: Middleware tests
  - auth.test.ts
  - errorHandler.test.ts
  - roles.test.ts

- `/src/config/__tests__/`: Configuration tests
  - env.test.ts
  - auth0.test.ts
  - db.test.ts

#### 2. Feature Tests
- `/src/features/tenants/__tests__/`: Tenant feature tests
  - tenants.service.test.ts
  - tenants.controller.test.ts
  - tenants.routes.test.ts

### Test Environment Setup

#### Mock Infrastructure
1. Configuration Mocks
   ```typescript
   // Environment mock
   vi.mock('../env.js', () => ({
     env: {
       NODE_ENV: 'test',
       PORT: 3001,
       MONGODB_URI: 'mongodb://localhost:27017/test',
       AUTH0_DOMAIN: 'test.auth0.com',
       AUTH0_AUDIENCE: 'https://api.test.com'
     }
   }));

   // JWKS client mock
   vi.mock('jwks-rsa', () => ({
     JwksClient: vi.fn().mockImplementation(() => ({
       getSigningKey: vi.fn()
     }))
   }));

   // MongoDB client mock
   vi.mock('mongodb', () => ({
     MongoClient: vi.fn().mockImplementation(() => ({
       connect: vi.fn(),
       db: vi.fn(),
       close: vi.fn()
     }))
   }));
   ```

2. Database Mocks
   ```typescript
   // Example of current mock structure
   const mockCollection = {
     findOne: vi.fn(),
     find: vi.fn(),
     insertOne: vi.fn(),
     updateOne: vi.fn(),
     findOneAndUpdate: vi.fn(),
     deleteOne: vi.fn(),
     deleteMany: vi.fn()
   };
   ```

2. Authentication Mocks
   ```typescript
   // Example of current auth mock
   vi.mock('../middleware/auth', () => ({
     authenticateJWT: () => (req, res, next) => {
       req.user = { sub: 'auth0|123', email: 'test@example.com' };
       next();
     }
   }));
   ```

3. Response Mocks
   ```typescript
   // Example of current response structure
   mockCollection.findOneAndUpdate.mockResolvedValue({
     value: {
       _id: new ObjectId(),
       name: 'Test',
       // ... other fields
     }
   });
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run specific test file
npm test path/to/test.ts

# Watch mode
npm run test:watch
```

### Writing Tests

#### Service Tests
```typescript
// Example service test structure
describe('ServiceName', () => {
  let service: ServiceType;
  
  beforeEach(() => {
    service = new ServiceType();
    // Reset mocks
    vi.clearAllMocks();
    // Setup default mock behavior
    mockCollection.findOne.mockResolvedValue(null);
    // ... other mock setups
  });

  describe('methodName', () => {
    it('should handle successful case', async () => {
      // Arrange: Setup test data and mocks
      const testData = { /* ... */ };
      mockCollection.findOne.mockResolvedValueOnce(testData);

      // Act: Call the method
      const result = await service.method();

      // Assert: Verify the result
      expect(result).toEqual(expected);
      expect(mockCollection.findOne).toHaveBeenCalledWith(/* ... */);
    });
  });
});
```

#### Route Tests
```typescript
// Example route test structure
describe('Route Name', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/resource', routes);
    app.use(errorHandler);
  });

  describe('HTTP Method /path', () => {
    it('should handle successful request', async () => {
      // Arrange: Setup test data
      const testData = { /* ... */ };
      mockCollection.findOne.mockResolvedValue(testData);

      // Act: Make request
      const response = await request(app)
        .post('/api/v1/resource')
        .set('Authorization', 'Bearer test-token')
        .send(testData);

      // Assert: Check response
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(expected);
    });
  });
});
```

### Current Test Issues and Solutions

#### 1. Authentication Mock Issues
Problem:
```typescript
// Current implementation
authenticateJWT: () => (req, res, next) => {
  req.user = { sub: 'auth0|123', email: 'test@example.com' };
  next();
}
```

Required Changes:
```typescript
// Needed implementation
authenticateJWT: () => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || token !== 'test-token') {
    return res.status(401).json({
      success: false,
      error: { code: 'auth/invalid-token' }
    });
  }
  req.user = { sub: 'auth0|123', email: 'test@example.com' };
  next();
}
```

#### 2. MongoDB Response Structure Issues
Problem:
```typescript
// Current implementation
mockCollection.findOneAndUpdate.mockResolvedValue({
  value: updatedDoc
});
```

Required Changes:
```typescript
// Service layer needs to handle
const result = await collection.findOneAndUpdate(/* ... */);
return result.value; // Extract value before returning
```

#### 3. Superadmin Collection Access Issues
Problem:
```typescript
// Current implementation
mockCollection.collection('superadmins')
```

Required Changes:
```typescript
// Need separate mock
const mockSuperadminsCollection = {
  findOne: vi.fn()
};

db.collection = vi.fn((name) => {
  if (name === 'superadmins') return mockSuperadminsCollection;
  return mockCollection;
});
```

### Best Practices

1. Mocking
   - Reset mocks in beforeEach
   - Use specific mock implementations
   - Mock at appropriate levels
   - Verify mock calls

2. Test Organization
   - Group related tests
   - Use descriptive names
   - Follow AAA pattern
   - Keep tests focused

3. Error Handling
   - Test error paths
   - Verify error messages
   - Check status codes
   - Test edge cases

4. Authentication
   - Test with/without tokens
   - Test invalid tokens
   - Test different roles
   - Verify permissions

### Future Improvements

1. Test Coverage
   - Add missing test cases
   - Improve error coverage
   - Add integration tests

2. Mock Infrastructure
   - Standardize mocks
   - Improve reliability
   - Add validation

3. Test Organization
   - Refactor setup code
   - Improve isolation
   - Add categories

4. Documentation
   - Add inline docs
   - Document patterns
   - Add examples