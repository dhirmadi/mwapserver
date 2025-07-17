# Integration Testing Strategy

## Current Integration Points

1. **Database Integration**
   - MongoDB connection and operations
   - Connection lifecycle management
   - Error handling and reconnection

2. **Auth0 Integration**
   - JWKS key fetching
   - Token validation
   - Rate limiting and caching

3. **Express Server**
   - Route handling
   - Middleware chain
   - Error handling

## Test Infrastructure Needed

### 1. Test Database Setup

```typescript
// tests/setup/db.ts
import { MongoClient, Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

export class TestDatabase {
  private mongod: MongoMemoryServer;
  private client: MongoClient;
  private db: Db;

  async start() {
    this.mongod = await MongoMemoryServer.create();
    const uri = this.mongod.getUri();
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db();
  }

  async stop() {
    await this.client.close();
    await this.mongod.stop();
  }

  async cleanup() {
    const collections = await this.db.collections();
    await Promise.all(collections.map(c => c.deleteMany({})));
  }

  getDb() {
    return this.db;
  }
}
```

### 2. Auth0 Mock Server

```typescript
// tests/setup/auth.ts
import express from 'express';
import jwt from 'jsonwebtoken';

export class MockAuthServer {
  private app: express.Application;
  private server: any;
  private keys: any;

  constructor() {
    this.app = express();
    this.keys = {
      // Test keys for JWT signing/verification
      private: '...',
      public: '...',
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
          x5c: [this.keys.public],
          // ... other JWKS fields
        }]
      });
    });
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(0, () => resolve(this.getPort()));
    });
  }

  async stop() {
    return new Promise((resolve) => {
      this.server.close(resolve);
    });
  }

  getPort() {
    return this.server.address().port;
  }

  createToken(payload: any) {
    return jwt.sign(payload, this.keys.private, {
      algorithm: 'RS256',
      keyid: this.keys.kid
    });
  }
}
```

### 3. Test Environment Setup

```typescript
// tests/setup/environment.ts
export class TestEnvironment {
  private db: TestDatabase;
  private auth: MockAuthServer;
  private app: express.Application;
  private server: any;

  async start() {
    // Start test database
    this.db = new TestDatabase();
    await this.db.start();

    // Start mock Auth0 server
    this.auth = new MockAuthServer();
    const authPort = await this.auth.start();

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = this.db.getUri();
    process.env.AUTH0_DOMAIN = `localhost:${authPort}`;
    process.env.AUTH0_AUDIENCE = 'https://test.api';

    // Start app server
    const app = (await import('../../src/app')).default;
    this.app = app;
    await new Promise((resolve) => {
      this.server = this.app.listen(0, resolve);
    });
  }

  async stop() {
    await this.server.close();
    await this.db.stop();
    await this.auth.stop();
  }

  async cleanup() {
    await this.db.cleanup();
  }

  getApp() {
    return this.app;
  }

  getPort() {
    return this.server.address().port;
  }

  createAuthToken(payload: any) {
    return this.auth.createToken(payload);
  }
}
```

## Example Integration Tests

### 1. Tenant API Tests

```typescript
// tests/integration/tenants.test.ts
import request from 'supertest';
import { TestEnvironment } from '../setup/environment';

describe('Tenant API Integration', () => {
  let env: TestEnvironment;
  let authToken: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.start();
    
    // Create test auth token
    authToken = env.createAuthToken({
      sub: 'test-user',
      email: 'test@example.com'
    });
  });

  afterAll(async () => {
    await env.stop();
  });

  beforeEach(async () => {
    await env.cleanup();
  });

  it('should create a new tenant', async () => {
    const response = await request(env.getApp())
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Tenant',
        settings: {
          allowPublicProjects: true,
          maxProjects: 20
        }
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Test Tenant',
      settings: {
        allowPublicProjects: true,
        maxProjects: 20
      }
    });
  });

  // More test cases...
});
```

### 2. Authentication Tests

```typescript
// tests/integration/auth.test.ts
describe('Authentication Integration', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.start();
  });

  afterAll(async () => {
    await env.stop();
  });

  it('should reject requests without token', async () => {
    const response = await request(env.getApp())
      .get('/api/v1/tenants/me');

    expect(response.status).toBe(401);
  });

  it('should reject invalid tokens', async () => {
    const response = await request(env.getApp())
      .get('/api/v1/tenants/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  // More test cases...
});
```

## Test Data Management

### 1. Test Data Factories

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
```

### 2. Database Seeding

```typescript
// tests/setup/seed.ts
import { Db } from 'mongodb';
import { createTenantData } from '../factories/tenant.factory';

export async function seedTestData(db: Db) {
  const tenant = createTenantData();
  await db.collection('tenants').insertOne(tenant);
  return { tenant };
}
```

## Next Steps

1. **Infrastructure Setup**
   - Set up MongoDB Memory Server for tests
   - Create mock Auth0 server
   - Configure test environment

2. **Test Data Management**
   - Create data factories
   - Implement database seeding
   - Set up cleanup routines

3. **Test Implementation**
   - Write API integration tests
   - Write authentication tests
   - Write error handling tests

4. **CI/CD Integration**
   - Configure test environment in CI
   - Set up test reporting
   - Configure test coverage thresholds

## Testing Guidelines

1. **Test Environment**
   - Use in-memory MongoDB for tests
   - Mock external services (Auth0)
   - Reset data between tests

2. **Test Data**
   - Use factories for consistent test data
   - Clean up data after tests
   - Use realistic but minimal data sets

3. **Test Coverage**
   - Test happy paths
   - Test error conditions
   - Test edge cases
   - Test authentication and authorization

4. **Test Organization**
   - Group tests by feature
   - Use descriptive test names
   - Keep tests focused and isolated

5. **Test Maintenance**
   - Keep tests simple and readable
   - Avoid test duplication
   - Document test setup and requirements