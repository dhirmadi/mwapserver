# Mocking Patterns and Best Practices

## Module Mocking Scope and Hoisting

### Key Behaviors

1. **Mock Factory Hoisting**
   - Jest/Vitest hoists mock declarations (`vi.mock()`) to the top of the file
   - This means mock factories run before any imports or other code
   - Variables defined outside the mock factory are not accessible inside it

2. **Scope Isolation**
   - Mock factories run in an isolated scope
   - They cannot access variables from the outer scope
   - Each mock factory gets its own module scope

Example of what NOT to do:
```typescript
import { AUTH } from './constants';

vi.mock('../middleware/auth', () => {
  // ❌ ERROR: AUTH is undefined here because of scope isolation
  return {
    authenticateJWT: () => (req) => {
      req.auth = {
        aud: AUTH.AUDIENCE  // AUTH is undefined!
      };
    }
  };
});
```

### Best Practices

1. **Import Inside Mock Factory**
   ```typescript
   vi.mock('../middleware/auth', () => {
     // ✅ Import inside the factory using vi.importActual
     const { AUTH } = vi.importActual('./constants') as typeof import('./constants');
     return {
       authenticateJWT: () => (req) => {
         req.auth = {
           aud: AUTH.AUDIENCE  // Works correctly
         };
       }
     };
   });
   ```

2. **Use Relative Paths Correctly**
   - Paths in `vi.importActual()` are relative to the test file
   - Use `./` for files in the same directory
   - Use `../` to go up directories

## Auth Token Mocking

### Express-JWT Behavior

The real express-jwt middleware:
1. Validates the token
2. Decodes the payload
3. Sets `req.auth` with the decoded payload
4. Calls next()

### Mocking Auth Tokens

1. **Token Structure**
   ```typescript
   req.auth = {
     sub: 'user-id',
     email: 'user@example.com',
     name: 'User Name',
     iat: Math.floor(Date.now() / 1000),
     exp: Math.floor(Date.now() / 1000) + 3600,
     aud: AUTH.AUDIENCE,
     iss: `https://${AUTH.DOMAIN}/`
   };
   ```

2. **Token Validation**
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
               // ... token payload
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

## Response Structure Patterns

### API Response Format

1. **Success Response**
   ```typescript
   {
     success: true,
     data: {
       // Actual response data
     }
   }
   ```

2. **Error Response**
   ```typescript
   {
     success: false,
     error: {
       code: 'error/code',
       message: 'Error message'
     }
   }
   ```

### Test Expectations

1. **Success Cases**
   ```typescript
   expect(response.status).toBe(200);
   expect(response.body.success).toBe(true);
   expect(response.body.data).toMatchObject({
     // Expected data
   });
   ```

2. **Error Cases**
   ```typescript
   expect(response.status).toBe(errorCode);
   expect(response.body).toEqual({
     success: false,
     error: {
       code: expectedErrorCode,
       message: expect.any(String)
     }
   });
   ```

## Error Code Handling

### Error Code Structure

Error codes should be organized by domain:
```typescript
const ERROR_CODES = {
  AUTH: {
    INVALID_TOKEN: 'auth/invalid-token',
    INSUFFICIENT_PERMISSIONS: 'auth/insufficient-permissions'
  },
  VALIDATION: {
    INVALID_INPUT: 'validation/invalid-input'
  },
  RESOURCE: {
    NOT_FOUND: 'resource/not-found'
  },
  SERVER: {
    INTERNAL_ERROR: 'server/internal-error'
  }
};
```

### Error Handling Best Practices

1. **Use Consistent Error Types**
   ```typescript
   class ApiError extends Error {
     constructor(
       message: string,
       public status: number,
       public code: string
     ) {
       super(message);
       this.name = this.constructor.name;
     }
   }
   ```

2. **Map Error Types to Status Codes**
   ```typescript
   const ERROR_STATUS = {
     [ERROR_CODES.AUTH.INVALID_TOKEN]: 401,
     [ERROR_CODES.AUTH.INSUFFICIENT_PERMISSIONS]: 403,
     [ERROR_CODES.VALIDATION.INVALID_INPUT]: 400,
     [ERROR_CODES.RESOURCE.NOT_FOUND]: 404,
     [ERROR_CODES.SERVER.INTERNAL_ERROR]: 500
   };
   ```

## Testing Best Practices

1. **Mock Factory Organization**
   - Keep mock implementations close to the tests that use them
   - Use separate files for complex mocks
   - Document mock behavior and assumptions

2. **Test Data Management**
   - Use constants for test data
   - Keep test data close to the tests
   - Document data dependencies

3. **Error Testing**
   - Test both success and error paths
   - Verify error codes and messages
   - Test edge cases in error handling

4. **Auth Testing**
   - Test with and without auth tokens
   - Test with different user roles
   - Test token validation edge cases