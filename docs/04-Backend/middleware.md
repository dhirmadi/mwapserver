# Middleware Documentation

This document describes the middleware components used in the MWAP backend API, based on the actual implementation in `src/middleware/`.

## Overview

MWAP uses a layered middleware approach for:
- **Authentication**: JWT token validation
- **Authorization**: Role-based access control
- **Error Handling**: Centralized error processing
- **Security**: Rate limiting and security headers

## Middleware Stack

The middleware is applied in the following order in `src/app.ts`:

1. **Basic Middleware**: JSON parsing, URL encoding
2. **Security Middleware**: Helmet, CORS, rate limiting
3. **Authentication Middleware**: JWT validation
4. **Route-specific Authorization**: Role-based access control
5. **Error Handler**: Centralized error processing

## Authentication Middleware

### `authenticateJWT()`

**File**: `src/middleware/auth.ts`

Validates Auth0 JWT tokens using RS256 signature verification.

#### Implementation
```typescript
import { authenticateJWT } from './middleware/auth.js';

// Applied globally to all routes after /health
app.use(authenticateJWT());
```

#### Features
- **JWKS validation**: Fetches public keys from Auth0
- **Token verification**: Validates JWT signature and claims
- **User context**: Adds user information to request object
- **Error handling**: Returns 401 for invalid tokens

#### Request Enhancement
Adds the following to the request object:
```typescript
interface AuthenticatedRequest extends Request {
  user: {
    sub: string;      // Auth0 user ID
    email?: string;   // User email
    // Additional Auth0 claims
  };
}
```

## Authorization Middleware

### Role-Based Access Control

**File**: `src/middleware/authorization.ts`

Provides role-based access control for different resource types.

#### Available Middleware

1. **`requireSuperAdminRole()`**
   - Restricts access to super administrators only
   - Used for system-wide administrative operations

2. **`requireTenantOwner()`**
   - Restricts access to tenant owners
   - Used for tenant management operations

3. **`requireProjectRole(role: ProjectRole)`**
   - Restricts access based on project-specific roles
   - Roles: `OWNER`, `DEPUTY`, `MEMBER`

#### Usage Examples
```typescript
// Super admin only
router.delete('/tenants/:id', requireSuperAdminRole(), controller.deleteTenant);

// Tenant owner only
router.patch('/tenants/:id', requireTenantOwner(), controller.updateTenant);

// Project role-based
router.post('/projects/:id/members', requireProjectRole('OWNER'), controller.addMember);
```

### Role Definitions

**File**: `src/middleware/roles.ts`

Defines the role hierarchy and permissions.

#### Role Types
```typescript
enum ProjectRole {
  OWNER = 'OWNER',     // Full project control
  DEPUTY = 'DEPUTY',   // Administrative permissions
  MEMBER = 'MEMBER'    // Basic access permissions
}

enum SystemRole {
  SUPERADMIN = 'SUPERADMIN',  // System-wide administration
  TENANT_OWNER = 'TENANT_OWNER'  // Tenant-level administration
}
```

#### Permission Matrix

| Resource | Super Admin | Tenant Owner | Project Owner | Project Deputy | Project Member |
|----------|-------------|--------------|---------------|----------------|----------------|
| System Config | ✅ | ❌ | ❌ | ❌ | ❌ |
| All Tenants | ✅ | ❌ | ❌ | ❌ | ❌ |
| Own Tenant | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tenant Projects | ✅ | ✅ | ❌ | ❌ | ❌ |
| Project Management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Project Members | ✅ | ✅ | ✅ | ✅ | ❌ |
| Project Files | ✅ | ✅ | ✅ | ✅ | ✅ |

## Error Handler Middleware

### `errorHandler()`

**File**: `src/middleware/errorHandler.ts`

Centralized error processing for consistent error responses.

#### Features
- **Error normalization**: Converts all errors to standard format
- **Logging**: Structured error logging with context
- **Security**: Prevents sensitive information leakage
- **HTTP status mapping**: Maps error types to appropriate status codes

#### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Error code (e.g., 'auth/invalid-token')
    message: string;        // User-friendly error message
    details?: any;          // Additional error details (development only)
    timestamp: string;      // ISO timestamp
    requestId: string;      // Request correlation ID
  };
}
```

#### Error Types
- **Authentication Errors**: 401 status
- **Authorization Errors**: 403 status
- **Validation Errors**: 400 status
- **Not Found Errors**: 404 status
- **Server Errors**: 500 status

## Security Middleware

### Rate Limiting

Applied globally in `src/app.ts`:

```typescript
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                   // 100 requests per window
}));
```

### CORS Configuration

Environment-based CORS settings:

```typescript
app.use(cors({
  origin: env.NODE_ENV === 'production' ? 'https://app.mwap.dev' : true,
  credentials: true
}));
```

### Security Headers

Applied via Helmet middleware:

```typescript
app.use(helmet());
```

Provides:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- And other security headers

## Middleware Development

### Creating New Middleware

1. **Create middleware file** in `src/middleware/`
2. **Export middleware function** with proper typing
3. **Add error handling** for edge cases
4. **Include logging** for debugging
5. **Write tests** for middleware behavior

#### Example Template
```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logInfo, logError } from '../utils/logger.js';

export function customMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Middleware logic here
      logInfo('Custom middleware executed', { path: req.path });
      next();
    } catch (error) {
      logError('Custom middleware error', error);
      next(new AppError('middleware/custom-error', 'Custom middleware failed'));
    }
  };
}
```

### Testing Middleware

Middleware should be tested for:
- **Success scenarios**: Normal operation
- **Error scenarios**: Invalid inputs and edge cases
- **Security scenarios**: Unauthorized access attempts
- **Performance**: Response time under load

#### Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { customMiddleware } from '../middleware/custom.js';

describe('Custom Middleware', () => {
  it('should process valid requests', async () => {
    const middleware = customMiddleware();
    const req = mockRequest();
    const res = mockResponse();
    const next = vi.fn();

    await middleware(req, res, next);
    
    expect(next).toHaveBeenCalledWith();
  });
});
```

## Best Practices

### Security
- **Always validate inputs** in middleware
- **Use least privilege principle** for role assignments
- **Log security events** for monitoring
- **Handle errors gracefully** without exposing internals

### Performance
- **Cache role lookups** where possible
- **Minimize database queries** in middleware
- **Use async/await** for non-blocking operations
- **Profile middleware performance** regularly

### Maintainability
- **Keep middleware focused** on single responsibilities
- **Use consistent error handling** patterns
- **Document middleware behavior** thoroughly
- **Write comprehensive tests** for all scenarios

---
*This documentation reflects the current middleware implementation and should be updated when middleware changes are made.*