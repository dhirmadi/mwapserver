# Authentication Testing Patterns

## Standard Auth Setup

The MWAP server uses a standardized authentication setup for tests:

```typescript
import { AUTH } from '../__tests__/constants';

// In route tests
const response = await request(app)
  .get('/api/resource')
  .set('Authorization', AUTH.HEADER);

// Test unauthorized access
const response = await request(app)
  .get('/api/resource')
  .set('Authorization', 'Bearer invalid-token');

expect(response.status).toBe(401);
expect(response.body.error.code).toBe(ERROR_CODES.AUTH.INVALID_TOKEN);
```

## Auth Mock Behavior

The authentication mock (`src/__tests__/mockAuth.ts`) provides:

1. Token Validation:
   - Checks for 'Bearer ' prefix
   - Validates token value
   - Returns 401 for invalid tokens

2. User Injection:
   - Injects standard test user
   - Provides admin user for superadmin tests
   - Maintains consistent user data

3. Error Handling:
   - Returns proper error format
   - Uses standard error codes
   - Handles edge cases

## Test Patterns

1. Standard Route Test:
```typescript
describe('Protected Route', () => {
  it('should handle authorized request', async () => {
    const response = await request(app)
      .get('/api/resource')
      .set('Authorization', AUTH.HEADER);
    expect(response.status).toBe(200);
  });

  it('should reject unauthorized request', async () => {
    const response = await request(app)
      .get('/api/resource')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.status).toBe(401);
  });
});
```

2. Admin Route Test:
```typescript
describe('Admin Route', () => {
  it('should allow admin access', async () => {
    // Mock superadmin check
    mockSuperadminsCollection.findOne.mockResolvedValue({
      userId: AUTH.ADMIN.sub
    });

    const response = await request(app)
      .delete('/api/resource')
      .set('Authorization', AUTH.HEADER);
    expect(response.status).toBe(204);
  });
});
```

## Common Issues

1. Wrong Token Format:
```typescript
// ❌ Wrong
.set('Authorization', 'test-token')
.set('Authorization', AUTH.TOKEN)

// ✅ Right
.set('Authorization', AUTH.HEADER)
```

2. Missing Auth Header:
```typescript
// ❌ Wrong
const response = await request(app).get('/api/resource');

// ✅ Right
const response = await request(app)
  .get('/api/resource')
  .set('Authorization', AUTH.HEADER);
```

3. Inconsistent Error Handling:
```typescript
// ❌ Wrong
expect(response.status).toBe(401);

// ✅ Right
expect(response.status).toBe(401);
expect(response.body.error.code).toBe(ERROR_CODES.AUTH.INVALID_TOKEN);
```

## Best Practices

1. Always use AUTH constants
2. Always check error codes
3. Test both success and failure cases
4. Use proper token format
5. Mock superadmin status when needed

## Testing Checklist

For each protected route:
- ✅ Test with valid token
- ✅ Test with invalid token
- ✅ Test with missing token
- ✅ Test with wrong format
- ✅ Test admin access (if applicable)