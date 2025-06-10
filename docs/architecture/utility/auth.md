# 🔐 Authentication Utilities

## Overview
The authentication utilities provide type-safe access to user information from JWT tokens and handle authentication-related operations.

## Types

### `User`
```typescript
interface User {
  sub: string;    // Auth0 subject identifier
  email: string;  // User's email address
  name: string;   // User's display name
}
```

## Functions

### `getUserFromToken`
```typescript
function getUserFromToken(req: Request): User
```

Extracts and validates user information from the JWT token in the request.

#### Parameters
- `req`: Express Request object containing the decoded JWT token

#### Returns
- `User`: Object containing validated user information

#### Throws
- `AuthError`: When token is missing or invalid

#### Example
```typescript
try {
  const user = getUserFromToken(req);
  console.log(`Request from user: ${user.name} (${user.email})`);
} catch (error) {
  // Handle authentication error
}
```

## Type Extensions

### Express Request
```typescript
declare global {
  namespace Express {
    interface Request {
      auth?: User;  // Decoded JWT payload
    }
  }
}
```

## Usage Notes

1. **Token Validation**
   - Always use within authenticated routes
   - Token is validated by the global `authenticateJWT` middleware in `app.ts`
   - Do not apply `authenticateJWT` middleware in individual route files
   - Throws if token is missing or invalid

2. **Error Handling**
   - Wrap in try/catch blocks
   - Handle AuthError appropriately
   - Log authentication failures

3. **Security Considerations**
   - Don't expose full user object in responses
   - Validate user permissions before operations
   - Use with role middleware for access control

4. **Authentication Flow**
   - JWT authentication is applied globally in `app.ts` for all routes except `/health`
   - Individual route files should NOT apply the `authenticateJWT` middleware again
   - Role-based middleware should be applied in route files after authentication

## Integration Example
```typescript
import { getUserFromToken } from '../utils/auth.js';
import { AuthError } from '../utils/errors.js';

// In app.ts, authentication is already applied globally:
// app.use(authenticateJWT());

// In your route file, just use the authenticated request:
router.get('/profile', (req, res, next) => {
  try {
    const user = getUserFromToken(req);
    res.json({
      email: user.email,
      name: user.name
    });
  } catch (error) {
    next(error);
  }
});
```