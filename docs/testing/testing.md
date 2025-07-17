# Testing Strategy

## Current Test Coverage

### Core Layer Tests (Implemented)
- `utils/validate.ts`: Schema validation utilities
- `utils/auth.ts`: Token handling utilities
- `utils/errors.ts`: Custom error classes

### Features Layer Tests (Not Yet Implemented)
The features layer (e.g., tenants) is currently not testable without modifying production code due to tight coupling with external dependencies.

## Making Features Layer Testable

### 1. Dependency Injection
To make the features layer testable, we need to modify the code to support dependency injection:

```typescript
// Before
export class TenantService {
  private collection: Collection<Tenant>;

  constructor() {
    this.collection = db.collection<Tenant>('tenants');
  }
}

// After
export class TenantService {
  private collection: Collection<Tenant>;
  private superadminCollection: Collection<any>;
  private auditLogger: AuditLogger;

  constructor(
    tenantCollection: Collection<Tenant>,
    superadminCollection: Collection<any>,
    auditLogger: AuditLogger
  ) {
    this.collection = tenantCollection;
    this.superadminCollection = superadminCollection;
    this.auditLogger = auditLogger;
  }
}
```

### 2. Test Utilities Needed

#### Database Mocking
```typescript
// tests/utils/db.mock.ts
export class MockCollection<T> {
  private data: T[] = [];
  
  async findOne(query: any): Promise<T | null> {
    // Implement mock query logic
  }
  
  async insertOne(doc: T): Promise<any> {
    // Implement mock insert logic
  }
  
  // ... other collection methods
}
```

#### Auth Mocking
```typescript
// tests/utils/auth.mock.ts
export const mockJwtToken = {
  sub: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User'
};

export const mockAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.auth = mockJwtToken;
  next();
};
```

#### Audit Logger Mocking
```typescript
// tests/utils/logger.mock.ts
export class MockAuditLogger {
  private logs: any[] = [];
  
  log(action: string, userId: string, resourceId: string, details?: any) {
    this.logs.push({ action, userId, resourceId, details });
  }
  
  getLogs() {
    return this.logs;
  }
}
```

### 3. Integration Test Setup

#### Test Database Setup
```typescript
// tests/setup/db.ts
import { MongoClient } from 'mongodb';

export async function setupTestDb() {
  const client = await MongoClient.connect(process.env.TEST_MONGODB_URI!);
  const db = client.db();
  
  // Clear test data
  await db.collection('tenants').deleteMany({});
  await db.collection('superadmins').deleteMany({});
  
  return { client, db };
}
```

#### Example Integration Test
```typescript
// tests/features/tenants/tenants.service.integration.test.ts
describe('TenantService Integration', () => {
  let db: Db;
  let client: MongoClient;
  let service: TenantService;
  
  beforeAll(async () => {
    ({ client, db } = await setupTestDb());
    service = new TenantService(
      db.collection('tenants'),
      db.collection('superadmins'),
      new MockAuditLogger()
    );
  });
  
  afterAll(async () => {
    await client.close();
  });
  
  // Test cases...
});
```

## Next Steps

1. Refactor production code to support dependency injection
2. Create test utilities and mocks
3. Set up integration test infrastructure
4. Implement unit tests for features layer
5. Implement integration tests

## Testing Guidelines

1. **Unit Tests**
   - Mock all external dependencies
   - Test edge cases and error conditions
   - Use dependency injection to isolate components

2. **Integration Tests**
   - Use test database instance
   - Clean up test data between tests
   - Test complete workflows

3. **Test Data**
   - Use factories to generate test data
   - Avoid hardcoding test values
   - Clean up test data after tests

4. **Mocking**
   - Mock at the lowest level possible
   - Verify mock interactions
   - Keep mocks simple and focused