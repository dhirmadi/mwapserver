# MWAP Server Testing Documentation

## Current Test Status

### Test Coverage Summary (as of last test run)
- Overall Coverage: 12.16%
- Total Test Files: 2
- Total Tests: 4
- Pass Rate: 100%

### Coverage Breakdown

#### High Coverage (>75%)
- ✅ `utils/auth.ts`: 100%
- ✅ `utils/constants.ts`: 100%
- ✅ `utils/errors.ts`: 76.66%

#### Low/No Coverage (0-75%)
- ❌ `utils/validate.ts`: 43.75%
- ❌ `utils/response.ts`: 0%
- ❌ `utils/logger.ts`: 0%
- ❌ Features Layer: 0%
- ❌ Middleware: 0%
- ❌ Configuration: 0%
- ❌ Server Setup: 0%

### Implemented Tests

1. **Auth Utils** (`tests/utils/auth.test.ts`)
   ```typescript
   describe('getUserFromToken', () => {
     ✓ should return user data from request auth
     ✓ should throw AuthError if no token provided
     ✓ should throw AuthError if token is invalid
   });
   ```

2. **Validation Utils** (`tests/utils/validate.test.ts`)
   ```typescript
   describe('validateWithSchema', () => {
     ✓ should validate data against a schema
   });
   ```

## Testing Roadmap

### 1. Core Layer Coverage (Priority: High)

#### Utils Layer
- [ ] Response Utils
  ```typescript
  // tests/utils/response.test.ts
  describe('jsonResponse', () => {
    it('should format successful response')
    it('should handle error responses')
    it('should support pagination')
  });
  ```

- [ ] Logger Utils
  ```typescript
  // tests/utils/logger.test.ts
  describe('Logger', () => {
    it('should log info messages')
    it('should log error messages')
    it('should log audit events')
  });
  ```

#### Error Handling
- [ ] Custom Error Classes
  ```typescript
  // tests/utils/errors.test.ts
  describe('ApiError', () => {
    it('should format error response')
    it('should include error code')
  });
  ```

### 2. Features Layer (Priority: High)

#### Prerequisites
1. Dependency Injection
   ```typescript
   // src/features/tenants/tenants.service.ts
   export class TenantService {
     constructor(
       private db: Database,
       private logger: Logger,
       private auth: Auth
     ) {}
   }
   ```

2. Test Data Factories
   ```typescript
   // tests/factories/tenant.factory.ts
   export const createTenant = (overrides = {}) => ({
     _id: new ObjectId(),
     name: 'Test Tenant',
     ...overrides
   });
   ```

#### Test Implementation
- [ ] Tenant Service Tests
  ```typescript
  // tests/features/tenants/tenants.service.test.ts
  describe('TenantService', () => {
    describe('createTenant', () => {
      it('should create new tenant')
      it('should validate tenant data')
      it('should prevent duplicate names')
    });
  });
  ```

### 3. Integration Layer (Priority: Medium)

#### Test Infrastructure
1. Test Database
   ```typescript
   // tests/setup/database.ts
   export class TestDatabase {
     async start() {
       this.mongod = await MongoMemoryServer.create();
       // Setup code...
     }
   }
   ```

2. Auth Mock Server
   ```typescript
   // tests/setup/auth.ts
   export class MockAuthServer {
     async start() {
       // Setup mock JWKS endpoint
     }
   }
   ```

#### API Tests
- [ ] Tenant API Tests
  ```typescript
  // tests/integration/tenant.api.test.ts
  describe('Tenant API', () => {
    it('should create tenant')
    it('should require authentication')
    it('should validate input')
  });
  ```

## Known Issues and Blockers

### 1. Technical Debt
- Tight coupling with MongoDB
- Direct Auth0 dependency
- Global state usage

### 2. Missing Infrastructure
- No test database setup
- No auth mocking
- No integration test environment

### 3. Coverage Gaps
- Features layer untested
- Integration points uncovered
- Error cases not verified

## Test Implementation Guidelines

### 1. Unit Tests
```typescript
// Example unit test structure
describe('Component', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    // Initialize test data
  });

  // Happy path
  it('should handle valid input', () => {
    // Arrange
    const input = createValidInput();
    // Act
    const result = component.process(input);
    // Assert
    expect(result).toEqual(expected);
  });

  // Error cases
  it('should handle invalid input', () => {
    // Arrange
    const input = createInvalidInput();
    // Act & Assert
    expect(() => component.process(input))
      .toThrow(ValidationError);
  });
});
```

### 2. Integration Tests
```typescript
// Example integration test structure
describe('API Integration', () => {
  // Global setup
  beforeAll(async () => {
    await testDb.start();
    await mockAuth.start();
  });

  // Test cleanup
  afterEach(async () => {
    await testDb.cleanup();
  });

  // Global teardown
  afterAll(async () => {
    await testDb.stop();
    await mockAuth.stop();
  });

  // Test cases
  it('should handle complete workflow', async () => {
    // Setup test data
    const tenant = await createTestTenant();
    
    // Execute workflow
    const response = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send(tenant);
    
    // Verify results
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: tenant.name
    });
  });
});
```

## Best Practices

### 1. Test Organization
- Group tests by feature/component
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Test Data
- Use factories for test data
- Clean up between tests
- Use realistic but minimal datasets

### 3. Mocking
- Mock at the lowest level possible
- Verify mock interactions
- Keep mocks simple and focused

### 4. Coverage Goals
- Core Layer: 90%+
- Features Layer: 80%+
- Integration Layer: 70%+

## Next Steps

### Immediate Actions
1. Set up test database configuration
2. Create basic mock implementations
3. Add tests for response and logger utils

### Short-term Goals
1. Increase core layer coverage
2. Add basic validation tests
3. Implement mock-based tests

### Long-term Goals
1. Implement dependency injection
2. Set up integration test suite
3. Add E2E test coverage

## Contributing

### Adding New Tests
1. Check existing test coverage
2. Follow test organization guidelines
3. Use provided test utilities
4. Update documentation

### Updating Tests
1. Maintain existing patterns
2. Update related tests
3. Verify coverage
4. Update documentation

## Resources

### Documentation
- [Testing Strategy](./TESTING.md)
- [Integration Testing](./INTEGRATION_TESTING.md)

### Tools
- [Vitest Documentation](https://vitest.dev/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [SuperTest](https://github.com/visionmedia/supertest)