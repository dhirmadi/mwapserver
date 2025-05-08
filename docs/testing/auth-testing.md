# Authentication Testing Guide

## Overview

This guide covers testing authentication and authorization in the application, focusing on:
1. Mocking JWT authentication
2. Testing protected routes
3. Testing permission checks
4. Common auth testing patterns

## Mock Auth Setup

### Basic Auth Mock

```typescript
vi.mock('../middleware/auth', () => {
  const { AUTH } = vi.importActual('./constants') as typeof import('./constants');
  
  return {
    authenticateJWT: () => (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          throw new ApiError('No token provided', 401, 'auth/invalid-token');
        }

        const token = authHeader.split(' ')[1];
        if (token === 'test-token') {
          req.auth = {
            sub: 'auth0|123',
            email: 'test@example.com',
            name: 'Test User',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            aud: AUTH.AUDIENCE,
            iss: `https://${AUTH.DOMAIN}/`
          };
          next();
        } else {
          throw new ApiError('Invalid token', 401, 'auth/invalid-token');
        }
      } catch (error) {
        next(error);
      }
    }
  };
});
```

### Testing Different User Roles

```typescript
vi.mock('../middleware/auth', () => {
  const { AUTH } = vi.importActual('./constants') as typeof import('./constants');
  
  const MOCK_USERS = {
    admin: {
      sub: AUTH.ADMIN.sub,
      email: AUTH.ADMIN.email,
      name: 'Admin User',
      roles: ['admin']
    },
    regular: {
      sub: 'auth0|123',
      email: 'user@example.com',
      name: 'Regular User',
      roles: ['user']
    }
  };

  return {
    authenticateJWT: () => (req, res, next) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          throw new ApiError('No token provided', 401, 'auth/invalid-token');
        }

        const user = MOCK_USERS[token] || MOCK_USERS.regular;
        req.auth = {
          ...user,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          aud: AUTH.AUDIENCE,
          iss: `https://${AUTH.DOMAIN}/`
        };
        next();
      } catch (error) {
        next(error);
      }
    }
  };
});
```

## Testing Protected Routes

### Basic Auth Tests

```typescript
describe('Protected Route', () => {
  it('should require authentication', async () => {
    const response = await request(app)
      .get('/api/protected');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'auth/invalid-token',
        message: expect.any(String)
      }
    });
  });

  it('should accept valid token', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Role-Based Access Tests

```typescript
describe('Admin-only Route', () => {
  it('should allow admin access', async () => {
    const response = await request(app)
      .delete('/api/tenants/123')
      .set('Authorization', 'Bearer admin');

    expect(response.status).toBe(204);
  });

  it('should reject non-admin access', async () => {
    const response = await request(app)
      .delete('/api/tenants/123')
      .set('Authorization', 'Bearer regular');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'auth/insufficient-permissions',
        message: expect.any(String)
      }
    });
  });
});
```

## Testing Permission Checks

### Resource Owner Tests

```typescript
describe('Resource Owner Access', () => {
  it('should allow owner access', async () => {
    // Create resource as user
    const createResponse = await request(app)
      .post('/api/resources')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'test' });

    const resourceId = createResponse.body.data.id;

    // Update as same user
    const updateResponse = await request(app)
      .patch(`/api/resources/${resourceId}`)
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'updated' });

    expect(updateResponse.status).toBe(200);
  });

  it('should reject non-owner access', async () => {
    // Create as user 1
    const createResponse = await request(app)
      .post('/api/resources')
      .set('Authorization', 'Bearer user1')
      .send({ name: 'test' });

    const resourceId = createResponse.body.data.id;

    // Try to update as user 2
    const updateResponse = await request(app)
      .patch(`/api/resources/${resourceId}`)
      .set('Authorization', 'Bearer user2')
      .send({ name: 'updated' });

    expect(updateResponse.status).toBe(403);
  });
});
```

### Role-Based Permission Tests

```typescript
describe('Role-Based Permissions', () => {
  it('should allow admin to access any resource', async () => {
    // Create as regular user
    const createResponse = await request(app)
      .post('/api/resources')
      .set('Authorization', 'Bearer regular')
      .send({ name: 'test' });

    const resourceId = createResponse.body.data.id;

    // Access as admin
    const adminResponse = await request(app)
      .get(`/api/resources/${resourceId}`)
      .set('Authorization', 'Bearer admin');

    expect(adminResponse.status).toBe(200);
  });

  it('should enforce role hierarchy', async () => {
    const responses = await Promise.all([
      request(app)
        .get('/api/admin-only')
        .set('Authorization', 'Bearer admin'),
      request(app)
        .get('/api/admin-only')
        .set('Authorization', 'Bearer manager'),
      request(app)
        .get('/api/admin-only')
        .set('Authorization', 'Bearer user')
    ]);

    expect(responses[0].status).toBe(200); // admin
    expect(responses[1].status).toBe(403); // manager
    expect(responses[2].status).toBe(403); // user
  });
});
```

## Best Practices

1. **Token Management**
   - Use consistent test tokens
   - Document token formats
   - Test token validation

2. **Role Testing**
   - Test each role's permissions
   - Test role inheritance
   - Test role combinations

3. **Error Cases**
   - Test missing tokens
   - Test invalid tokens
   - Test expired tokens
   - Test malformed tokens

4. **Resource Access**
   - Test owner access
   - Test shared access
   - Test admin override
   - Test resource visibility

5. **Mock Management**
   - Keep mocks simple
   - Document mock behavior
   - Reset mocks between tests

## Common Issues

1. **Token Format**
   ```typescript
   // ❌ Wrong
   .set('Authorization', token)
   
   // ✅ Correct
   .set('Authorization', `Bearer ${token}`)
   ```

2. **Auth Property Access**
   ```typescript
   // ❌ Wrong
   req.user.sub
   
   // ✅ Correct
   req.auth.sub
   ```

3. **Mock Scope**
   ```typescript
   // ❌ Wrong: Using outer scope variables
   const AUTH = require('./constants');
   vi.mock('../auth', () => {
     return { AUTH }; // AUTH is undefined
   });
   
   // ✅ Correct: Import inside mock
   vi.mock('../auth', () => {
     const { AUTH } = vi.importActual('./constants');
     return { AUTH };
   });
   ```

## Testing Utilities

### Auth Test Helpers

```typescript
export const TEST_TOKENS = {
  admin: 'admin-token',
  user: 'user-token',
  expired: 'expired-token'
};

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function createAuthenticatedRequest(
  app: Express,
  method: string,
  url: string,
  token: string,
  body?: any
) {
  const request = supertest(app)[method](url)
    .set(authHeader(token));
  
  if (body) {
    request.send(body);
  }
  
  return request;
}
```

### Usage Example

```typescript
describe('Protected API', () => {
  it('should handle authenticated request', async () => {
    const response = await createAuthenticatedRequest(
      app,
      'post',
      '/api/resources',
      TEST_TOKENS.user,
      { name: 'test' }
    );

    expect(response.status).toBe(201);
  });
});
```