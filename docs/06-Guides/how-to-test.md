# Testing Guide

This comprehensive guide covers testing strategies, setup, and best practices for the MWAP platform.

## 🧪 Testing Philosophy

MWAP uses **[Vitest](https://vitest.dev/)** for unit and service-level testing, aligned with these principles:

- ✅ **Pure ESM support** (no CommonJS)
- ✅ **Centralized test organization** in `tests/` folder
- ✅ **Simple mocks** for MongoDB and Auth0 (no DB containers)
- ✅ **Focused testing** for service logic, middleware, and schema validation
- ✅ **Type-safe testing** with TypeScript throughout

## 📁 Test Structure

```
tests/
├── setupTests.ts          # Global test configuration
├── utils/                 # Utility function tests
│   ├── auth.test.ts      # Authentication utilities
│   ├── validate.test.ts  # Validation utilities
│   └── errors.test.ts    # Error handling
└── features/              # Feature-specific tests
    ├── tenants/          # Tenant module tests
    ├── projects/         # Project module tests
    ├── cloud-providers/  # Cloud provider tests
    └── oauth/            # OAuth flow tests
```

## 🚀 Quick Start

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --grep "validation"
```

### Test Configuration

The test configuration is defined in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts'
      ]
    }
  }
});
```

## 🧩 Current Test Coverage

### ✅ Implemented Tests

**Core Layer Tests:**
- `utils/validate.ts`: Schema validation utilities
- `utils/auth.ts`: Token handling utilities  
- `utils/errors.ts`: Custom error classes

**Test Examples:**
```typescript
// utils/validate.test.ts
describe('Schema Validation', () => {
  it('should validate tenant creation schema', () => {
    const validData = {
      name: 'Test Tenant',
      description: 'A test tenant'
    };
    
    const result = CreateTenantSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid tenant data', () => {
    const invalidData = {
      name: '', // Empty name should fail
    };
    
    const result = CreateTenantSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

### ⏳ Planned Tests (Phase 8)

**Features Layer Tests:**
- Tenant service operations
- Project management logic
- Cloud integration workflows
- OAuth token handling
- File management operations

## 🛠️ Testing Strategies

### 1. Unit Testing

**Focus Areas:**
- Pure functions and utilities
- Schema validation logic
- Error handling mechanisms
- Data transformation functions

**Example Unit Test:**
```typescript
// tests/utils/auth.test.ts
import { extractUserIdFromToken, validateTokenFormat } from '../../src/utils/auth';

describe('Auth Utilities', () => {
  describe('extractUserIdFromToken', () => {
    it('should extract user ID from valid JWT payload', () => {
      const mockPayload = {
        sub: 'auth0|123456789',
        email: 'test@example.com'
      };
      
      const userId = extractUserIdFromToken(mockPayload);
      expect(userId).toBe('auth0|123456789');
    });
    
    it('should throw error for missing sub claim', () => {
      const mockPayload = {
        email: 'test@example.com'
      };
      
      expect(() => extractUserIdFromToken(mockPayload))
        .toThrow('Missing user ID in token');
    });
  });
});
```

### 2. Service Testing

**Approach:**
- Mock external dependencies (database, Auth0, cloud APIs)
- Test business logic in isolation
- Verify error handling and edge cases

**Service Test Example:**
```typescript
// tests/features/tenants/tenants.service.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TenantService } from '../../../src/features/tenants/tenants.service';
import { MockCollection, MockAuditLogger } from '../../utils/mocks';

describe('TenantService', () => {
  let service: TenantService;
  let mockCollection: MockCollection;
  let mockAuditLogger: MockAuditLogger;
  
  beforeEach(() => {
    mockCollection = new MockCollection();
    mockAuditLogger = new MockAuditLogger();
    service = new TenantService(mockCollection, mockAuditLogger);
  });
  
  describe('createTenant', () => {
    it('should create a new tenant successfully', async () => {
      const tenantData = {
        name: 'Test Tenant',
        description: 'A test tenant'
      };
      const userId = 'auth0|123456789';
      
      mockCollection.insertOne.mockResolvedValue({
        insertedId: 'tenant-id-123'
      });
      
      const result = await service.createTenant(tenantData, userId);
      
      expect(result).toMatchObject({
        name: 'Test Tenant',
        description: 'A test tenant',
        ownerId: userId
      });
      
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        'tenant_created',
        userId,
        'tenant-id-123'
      );
    });
  });
});
```

### 3. Integration Testing

**Scope:**
- API endpoint testing
- Database integration
- Authentication flows
- Cross-feature interactions

**Integration Test Example:**
```typescript
// tests/features/tenants/tenants.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../src/app';
import { setupTestDb, cleanupTestDb } from '../../utils/db';
import { generateTestToken } from '../../utils/auth';

describe('Tenants API Integration', () => {
  let testToken: string;
  
  beforeAll(async () => {
    await setupTestDb();
    testToken = generateTestToken({ sub: 'test-user-123' });
  });
  
  afterAll(async () => {
    await cleanupTestDb();
  });
  
  describe('POST /api/v1/tenants', () => {
    it('should create a new tenant', async () => {
      const tenantData = {
        name: 'Integration Test Tenant',
        description: 'Created during integration testing'
      };
      
      const response = await request(app)
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${testToken}`)
        .send(tenantData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        success: true,
        data: {
          name: tenantData.name,
          description: tenantData.description,
          ownerId: 'test-user-123'
        }
      });
    });
  });
});
```

## 🎭 Mocking Strategies

### Database Mocking

```typescript
// tests/utils/mocks/db.mock.ts
export class MockCollection<T> {
  private data: T[] = [];
  
  findOne = vi.fn();
  find = vi.fn();
  insertOne = vi.fn();
  updateOne = vi.fn();
  deleteOne = vi.fn();
  
  // Helper methods for test setup
  setMockData(data: T[]) {
    this.data = data;
    this.find.mockResolvedValue(data);
  }
  
  clearMockData() {
    this.data = [];
    vi.clearAllMocks();
  }
}
```

### Auth0 Mocking

```typescript
// tests/utils/mocks/auth.mock.ts
export const mockJwtPayload = {
  sub: 'auth0|test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
};

export const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.auth = mockJwtPayload;
  next();
};

export function generateTestToken(payload: Partial<typeof mockJwtPayload> = {}) {
  return jwt.sign(
    { ...mockJwtPayload, ...payload },
    'test-secret',
    { algorithm: 'HS256' }
  );
}
```

### Cloud Provider Mocking

```typescript
// tests/utils/mocks/cloudProvider.mock.ts
export class MockCloudProvider {
  listFiles = vi.fn();
  downloadFile = vi.fn();
  uploadFile = vi.fn();
  
  constructor() {
    this.listFiles.mockResolvedValue([
      {
        id: 'file-1',
        name: 'test-file.txt',
        type: 'text/plain',
        size: 1024
      }
    ]);
  }
}
```

## 📊 Test Coverage Goals

### Current Coverage
- **Utils**: 90%+ coverage
- **Schemas**: 100% coverage (validation tests)
- **Middleware**: 80%+ coverage

### Target Coverage (Phase 8)
- **Overall**: 85%+ code coverage
- **Services**: 90%+ coverage
- **Controllers**: 80%+ coverage
- **Critical Paths**: 100% coverage

### Coverage Reporting

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

## 🔧 Test Utilities

### Test Database Setup

```typescript
// tests/utils/db.ts
import { MongoClient, Db } from 'mongodb';

let testClient: MongoClient;
let testDb: Db;

export async function setupTestDb() {
  testClient = await MongoClient.connect(process.env.TEST_MONGODB_URI!);
  testDb = testClient.db('mwap-test');
  
  // Clear existing test data
  await testDb.collection('tenants').deleteMany({});
  await testDb.collection('projects').deleteMany({});
  await testDb.collection('users').deleteMany({});
}

export async function cleanupTestDb() {
  if (testClient) {
    await testClient.close();
  }
}

export function getTestDb() {
  return testDb;
}
```

### Test Data Factories

```typescript
// tests/utils/factories.ts
export function createTestTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'test-tenant-123',
    name: 'Test Tenant',
    description: 'A tenant for testing',
    ownerId: 'auth0|test-user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    ...overrides
  };
}

export function createTestProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-project-123',
    name: 'Test Project',
    description: 'A project for testing',
    tenantId: 'test-tenant-123',
    projectTypeId: 'test-project-type-123',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    ...overrides
  };
}
```

## 🚨 Testing Best Practices

### 1. Test Organization

- **Group related tests** using `describe` blocks
- **Use descriptive test names** that explain the expected behavior
- **Follow AAA pattern**: Arrange, Act, Assert
- **Keep tests focused** on single behaviors

### 2. Mock Management

- **Mock at the lowest level** possible
- **Verify mock interactions** when behavior matters
- **Reset mocks** between tests
- **Use type-safe mocks** with TypeScript

### 3. Test Data

- **Use factories** for consistent test data generation
- **Avoid hardcoded values** where possible
- **Clean up test data** after tests
- **Isolate tests** from each other

### 4. Async Testing

```typescript
// Good: Proper async/await usage
it('should create tenant asynchronously', async () => {
  const result = await tenantService.create(testData);
  expect(result).toBeDefined();
});

// Good: Testing promise rejections
it('should reject invalid tenant data', async () => {
  await expect(tenantService.create(invalidData))
    .rejects
    .toThrow('Validation failed');
});
```

### 5. Error Testing

```typescript
// Test error conditions explicitly
it('should handle database connection errors', async () => {
  mockCollection.insertOne.mockRejectedValue(new Error('Connection failed'));
  
  await expect(tenantService.create(testData))
    .rejects
    .toThrow('Connection failed');
});
```

## 🔄 Continuous Integration

### GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run type-check && npm run lint && npm test"
    }
  }
}
```

## 🎯 Testing Roadmap

### Phase 8 Goals

1. **Complete Service Testing**
   - Implement tests for all service classes
   - Mock external dependencies
   - Achieve 90%+ service coverage

2. **Integration Test Suite**
   - End-to-end API testing
   - Database integration tests
   - OAuth flow testing

3. **Performance Testing**
   - Load testing for critical endpoints
   - Memory leak detection
   - Response time benchmarks

4. **Security Testing**
   - Authentication bypass attempts
   - Authorization boundary testing
   - Input validation security tests

### Future Enhancements

- **E2E Testing**: Browser-based testing with Playwright
- **Contract Testing**: API contract validation
- **Chaos Engineering**: Fault injection testing
- **Property-Based Testing**: Generative test cases

---
*This testing guide provides the foundation for maintaining high code quality and reliability in the MWAP platform.*