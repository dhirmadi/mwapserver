# MWAP Testing Guide

This comprehensive guide covers testing strategies, setup, implementation, and best practices for the MWAP platform.

## 🧪 Testing Philosophy

MWAP uses **[Vitest](https://vitest.dev/)** for unit and service-level testing, aligned with these core principles:

- ✅ **Pure ESM support** (no CommonJS)
- ✅ **Centralized test organization** in `tests/` folder
- ✅ **Simple mocks** for MongoDB and Auth0 (no DB containers)
- ✅ **Focused testing** for service logic, middleware, and schema validation
- ✅ **Type-safe testing** with TypeScript throughout

### Testing Approach

#### Minimal and Meaningful Testing
- Test services, guards, and validations where business logic resides
- Avoid testing trivial getters/setters
- Focus on edge cases and error conditions
- Prioritize integration points and critical paths

#### ESM-Only Architecture
- No CommonJS or Jest artifacts allowed
- Use Vitest for pure ESM compatibility
- Leverage native ES modules throughout test suite
- Maintain consistency with production ESM usage

#### Thin Controller, Fat Service Pattern
- Controllers should be thin layers with minimal logic to test
- Service logic is isolated and thoroughly testable
- Business rules are concentrated in service classes
- Validation logic is centralized and unit testable

#### Mocks Over Containers
- Use simple mocks for external dependencies
- No test databases or Auth0 sandboxes
- Mock at the service boundary level
- Keep test setup lightweight and fast

## 📁 Test Structure

```
tests/
├── setupTests.ts          # Global test configuration
├── factories/             # Test data factories
│   ├── tenant.factory.ts  # Tenant test data
│   ├── project.factory.ts # Project test data
│   └── user.factory.ts    # User test data
├── setup/                 # Test infrastructure
│   ├── environment.ts     # Test environment management
│   ├── database.ts        # Test database setup
│   └── auth.ts            # Auth mocking setup
├── utils/                 # Utility function tests
│   ├── auth.test.ts       # Authentication utilities
│   ├── validate.test.ts   # Validation utilities
│   ├── response.test.ts   # Response formatting
│   ├── logger.test.ts     # Logging utilities
│   └── errors.test.ts     # Error handling
├── features/              # Feature-specific tests
│   ├── tenants/           # Tenant module tests
│   ├── projects/          # Project module tests
│   ├── cloud-providers/   # Cloud provider tests
│   └── oauth/             # OAuth flow tests
└── integration/           # Integration tests
    ├── api/               # API integration tests
    ├── auth/              # Authentication integration
    └── database/          # Database integration
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

# Run tests for specific feature
npm test -- features/tenants

# Run integration tests only
npm test -- integration/
```

### Test Configuration

```typescript
// tests/setupTests.ts
import { vi } from 'vitest';

// Global test setup
beforeEach(() => {
  // Clear all mocks between tests
  vi.clearAllMocks();
  
  // Reset environment
  process.env.NODE_ENV = 'test';
});

// Global test teardown
afterEach(() => {
  // Cleanup any test state
  vi.restoreAllMocks();
});
```

## 🎯 Coverage Targets

- **Core Utils**: 90%+ coverage
- **Service Layer**: 80%+ coverage  
- **Middleware**: 85%+ coverage
- **Overall**: 80%+ coverage

### Current Coverage Status
```
Overall Coverage: 12.16% (Target: 80%)
- ✅ utils/auth.ts: 100%
- ✅ utils/constants.ts: 100%
- ✅ utils/errors.ts: 76.66%
- ❌ utils/validate.ts: 43.75%
- ❌ utils/response.ts: 0%
- ❌ utils/logger.ts: 0%
- ❌ Features Layer: 0%
- ❌ Middleware: 0%
```

## 🔧 Unit Testing

### Test Data Factories

```typescript
// tests/factories/tenant.factory.ts
import { ObjectId } from 'mongodb';
import type { Tenant } from '../../src/schemas/tenant.schema';

export function createTenantData(overrides = {}): Tenant {
  return {
    _id: new ObjectId(),
    name: 'Test Tenant',
    ownerId: 'auth0|test-user',
    settings: {
      allowPublicProjects: false,
      maxProjects: 10
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    ...overrides
  };
}

export function createMultipleTenants(count: number): Tenant[] {
  return Array.from({ length: count }, (_, i) => 
    createTenantData({ name: `Test Tenant ${i + 1}` })
  );
}
```

### Service Testing Examples

```typescript
// tests/features/tenants/tenants.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantService } from '../../../src/features/tenants/tenants.service';
import { createTenantData } from '../../factories/tenant.factory';
import { ValidationError, NotFoundError } from '../../../src/utils/errors';

describe('TenantService', () => {
  let tenantService: TenantService;
  let mockDb: any;

  beforeEach(() => {
    // Mock database
    mockDb = {
      collection: vi.fn().mockReturnValue({
        findOne: vi.fn(),
        insertOne: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn()
      })
    };

    tenantService = new TenantService(mockDb);
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      // Arrange
      const tenantData = createTenantData();
      const userId = 'auth0|test-user';
      
      mockDb.collection().findOne.mockResolvedValue(null); // No existing tenant
      mockDb.collection().insertOne.mockResolvedValue({ insertedId: tenantData._id });

      // Act
      const result = await tenantService.create(tenantData, userId);

      // Assert
      expect(result).toMatchObject({
        name: tenantData.name,
        ownerId: userId
      });
      expect(mockDb.collection().insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: tenantData.name,
          ownerId: userId
        })
      );
    });

    it('should throw ValidationError for duplicate name', async () => {
      // Arrange
      const tenantData = createTenantData();
      const userId = 'auth0|test-user';
      
      mockDb.collection().findOne.mockResolvedValue({ name: tenantData.name });

      // Act & Assert
      await expect(tenantService.create(tenantData, userId))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('findById', () => {
    it('should return tenant when found', async () => {
      // Arrange
      const tenant = createTenantData();
      mockDb.collection().findOne.mockResolvedValue(tenant);

      // Act
      const result = await tenantService.findById(tenant._id.toString());

      // Assert
      expect(result).toEqual(tenant);
      expect(mockDb.collection().findOne).toHaveBeenCalledWith({
        _id: tenant._id
      });
    });

    it('should return null when not found', async () => {
      // Arrange
      mockDb.collection().findOne.mockResolvedValue(null);

      // Act
      const result = await tenantService.findById('nonexistent-id');

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

### Utility Testing Examples

```typescript
// tests/utils/auth.test.ts
import { describe, it, expect } from 'vitest';
import { getUserFromToken } from '../../src/utils/auth';
import { AuthError } from '../../src/utils/errors';

describe('getUserFromToken', () => {
  it('should return user data from request auth', () => {
    // Arrange
    const mockRequest = {
      auth: {
        sub: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    // Act
    const result = getUserFromToken(mockRequest as any);

    // Assert
    expect(result).toEqual(mockRequest.auth);
  });

  it('should throw AuthError if no auth provided', () => {
    // Arrange
    const mockRequest = {};

    // Act & Assert
    expect(() => getUserFromToken(mockRequest as any))
      .toThrow(AuthError);
  });
});
```

### Validation Testing

```typescript
// tests/utils/validate.test.ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateWithSchema } from '../../src/utils/validate';
import { ValidationError } from '../../src/utils/errors';

describe('validateWithSchema', () => {
  const testSchema = z.object({
    name: z.string().min(3),
    email: z.string().email()
  });

  it('should validate valid data', () => {
    // Arrange
    const validData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    // Act
    const result = validateWithSchema(testSchema, validData);

    // Assert
    expect(result).toEqual(validData);
  });

  it('should throw ValidationError for invalid data', () => {
    // Arrange
    const invalidData = {
      name: 'Jo', // Too short
      email: 'invalid-email'
    };

    // Act & Assert
    expect(() => validateWithSchema(testSchema, invalidData))
      .toThrow(ValidationError);
  });
});
```

## 🔗 Integration Testing

### Test Environment Setup

```typescript
// tests/setup/environment.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import express from 'express';

export class TestEnvironment {
  private mongod: MongoMemoryServer;
  private client: MongoClient;
  private db: Db;
  private auth: MockAuthServer;
  private app: express.Application;
  private server: any;

  async start() {
    // Start test database
    this.mongod = await MongoMemoryServer.create();
    const uri = this.mongod.getUri();
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db();

    // Start mock Auth0 server
    this.auth = new MockAuthServer();
    const authPort = await this.auth.start();

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = uri;
    process.env.AUTH0_DOMAIN = `localhost:${authPort}`;
    process.env.AUTH0_AUDIENCE = 'https://test.api';

    // Start app server
    const { app } = await import('../../src/app');
    this.app = app;
    await new Promise((resolve) => {
      this.server = this.app.listen(0, resolve);
    });
  }

  async stop() {
    await this.server?.close();
    await this.client?.close();
    await this.mongod?.stop();
    await this.auth?.stop();
  }

  async cleanup() {
    const collections = await this.db.collections();
    await Promise.all(collections.map(c => c.deleteMany({})));
  }

  getApp() {
    return this.app;
  }

  getPort() {
    return this.server.address()?.port;
  }

  createAuthToken(payload: any) {
    return this.auth.createToken(payload);
  }

  async seedTestData() {
    const tenant = createTenantData();
    await this.db.collection('tenants').insertOne(tenant);
    return { tenant };
  }
}
```

### Mock Auth0 Server

```typescript
// tests/setup/auth.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import { generateKeyPairSync } from 'crypto';

export class MockAuthServer {
  private app: express.Application;
  private server: any;
  private keys: any;

  constructor() {
    this.app = express();
    
    // Generate test keys
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    this.keys = {
      private: privateKey,
      public: publicKey,
      kid: 'test-key-1'
    };

    this.setupRoutes();
  }

  private setupRoutes() {
    // Mock JWKS endpoint
    this.app.get('/.well-known/jwks.json', (req, res) => {
      res.json({
        keys: [{
          kid: this.keys.kid,
          kty: 'RSA',
          use: 'sig',
          x5c: [Buffer.from(this.keys.public).toString('base64')]
        }]
      });
    });
  }

  async start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = this.app.listen(0, () => {
        resolve(this.server.address().port);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server?.close(resolve);
    });
  }

  createToken(payload: any) {
    return jwt.sign(payload, this.keys.private, {
      algorithm: 'RS256',
      keyid: this.keys.kid,
      expiresIn: '1h'
    });
  }
}
```

### API Integration Tests

```typescript
// tests/integration/api/tenants.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { TestEnvironment } from '../../setup/environment';

describe('Tenant API Integration', () => {
  let env: TestEnvironment;
  let authToken: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.start();
    
    // Create test auth token
    authToken = env.createAuthToken({
      sub: 'test-user',
      email: 'test@example.com',
      name: 'Test User'
    });
  });

  afterAll(async () => {
    await env.stop();
  });

  beforeEach(async () => {
    await env.cleanup();
  });

  describe('POST /api/v1/tenants', () => {
    it('should create a new tenant', async () => {
      // Arrange
      const tenantData = {
        name: 'Test Tenant',
        settings: {
          allowPublicProjects: true,
          maxProjects: 20
        }
      };

      // Act
      const response = await request(env.getApp())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tenantData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: tenantData.name,
        settings: tenantData.settings
      });
    });

    it('should reject unauthenticated requests', async () => {
      // Act
      const response = await request(env.getApp())
        .post('/api/v1/tenants')
        .send({ name: 'Test Tenant' });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      // Act
      const response = await request(env.getApp())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation/invalid-input');
    });
  });

  describe('GET /api/v1/tenants/me', () => {
    it('should return user tenant', async () => {
      // Arrange
      const { tenant } = await env.seedTestData();

      // Act
      const response = await request(env.getApp())
        .get('/api/v1/tenants/me')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: tenant.name
      });
    });
  });
});
```

## 📊 Test Coverage and Reporting

### Coverage Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    environment: 'node',
    setupFiles: ['tests/setupTests.ts']
  }
});
```

### Running Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html

# Coverage with threshold enforcement
npm run test:coverage -- --reporter=verbose
```

## 📋 Testing Standards

### Test Structure
- Use descriptive test names that explain expected behavior
- Follow AAA pattern: Arrange, Act, Assert
- Group related tests using `describe` blocks
- Keep tests focused on single behaviors

### Test Data Management
- Use factory functions for consistent test data generation
- Avoid hardcoded values where possible
- Clean up test data after tests
- Isolate tests from each other

### Async Testing
```typescript
// Proper async/await usage
it('should create tenant asynchronously', async () => {
  const result = await tenantService.create(testData);
  expect(result).toBeDefined();
});

// Testing promise rejections
it('should reject invalid tenant data', async () => {
  await expect(tenantService.create(invalidData))
    .rejects
    .toThrow('Validation failed');
});
```

### Error Testing
- Test error conditions explicitly
- Verify proper error types and messages
- Test edge cases and boundary conditions
- Ensure graceful error handling

### Mocking Best Practices
```typescript
// Mock external dependencies
const mockDatabase = {
  collection: vi.fn().mockReturnValue({
    findOne: vi.fn(),
    insertOne: vi.fn(),
    updateOne: vi.fn()
  })
};

// Verify mock interactions
expect(mockDatabase.collection).toHaveBeenCalledWith('tenants');
expect(mockDatabase.collection().findOne).toHaveBeenCalledWith({
  _id: expect.any(ObjectId)
});
```

## 🔄 Implementation Roadmap

### Phase 1: Core Foundation (Current)
- ✅ Testing infrastructure setup
- ✅ Basic utility tests (auth, errors)
- 🔄 Complete utility test coverage
- 🔄 Mock implementations

### Phase 2: Service Layer Testing
- Service class unit tests
- Business logic validation
- Error handling verification
- Mock database interactions

### Phase 3: Integration Testing
- API endpoint tests
- Database integration tests
- Authentication flow tests
- End-to-end workflows

### Phase 4: Advanced Testing
- Performance testing
- Security testing
- Load testing
- Error boundary testing

## 🛠️ Tools and Libraries

### Core Testing Stack
- **[Vitest](https://vitest.dev/)**: Test runner and assertion library
- **[Supertest](https://github.com/visionmedia/supertest)**: HTTP assertion library
- **[MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)**: In-memory MongoDB
- **[@vitest/coverage-v8](https://vitest.dev/guide/coverage.html)**: Coverage reporting

### Additional Tools
- **[MSW](https://mswjs.io/)**: API mocking (for external services)
- **[Faker.js](https://fakerjs.dev/)**: Test data generation
- **[Zod](https://zod.dev/)**: Schema validation testing

## 🚀 Contributing to Tests

### Adding New Tests
1. Check existing test coverage
2. Follow test organization guidelines
3. Use provided test utilities and factories
4. Update documentation
5. Ensure tests pass in CI

### Test Review Checklist
- [ ] Tests follow naming conventions
- [ ] Tests are focused and isolated
- [ ] Tests use appropriate mocks
- [ ] Error cases are covered
- [ ] Tests are documented where complex

### Best Practices
1. **Keep tests simple and readable**
2. **Avoid test duplication**
3. **Mock at the right level**
4. **Test behavior, not implementation**
5. **Maintain test performance**

---
*This comprehensive testing guide provides everything needed to implement, maintain, and extend the MWAP testing suite. For specific implementation details, refer to the examples and patterns provided.* 