# MWAP Security Guide

This comprehensive guide covers authentication, authorization, and security implementation for the MWAP backend, including Auth0 integration, JWT handling, and role-based access control.

## 🎯 Security Architecture Overview

### Security Strategy
MWAP implements a robust, multi-layered security model using Auth0 as the identity provider, JWT tokens for API access, and role-based authorization for resource protection. The security architecture follows zero-trust principles with authentication and authorization at every layer.

### Key Components
- **Auth0 Integration**: Enterprise identity provider with PKCE flow
- **JWT Validation**: RS256 signature verification using JWKS
- **Multi-layered Authorization**: Role-based and resource-level access control
- **Multi-tenancy**: Tenant-scoped access control and data isolation
- **Audit Logging**: Comprehensive security event tracking

## 🔐 Authentication Implementation

### Public Routes
The following endpoints are intentionally public and bypass JWT authentication (with enhanced security monitoring):
- `GET /health` — liveness check
- `GET /api/v1/oauth/callback` — OAuth provider redirect target

All other endpoints require a valid Auth0 JWT and applicable authorization checks.

### Authentication Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │    Auth0    │    │   Backend   │
│             │    │             │    │     API     │
└─────────────┘    └─────────────┘    └─────────────┘
        │                  │                  │
        │ 1. Login Request │                  │
        │─────────────────►│                  │
        │                  │                  │
        │ 2. Auth Response │                  │
        │◄─────────────────│                  │
        │                  │                  │
        │ 3. API Request + JWT Token         │
        │───────────────────────────────────►│
        │                  │                  │
        │                  │ 4. Verify Token │
        │                  │◄─────────────────│
        │                  │                  │
        │                  │ 5. JWKS Response │
        │                  │─────────────────►│
        │                  │                  │
        │ 6. API Response                    │
        │◄───────────────────────────────────│
```

### Auth0 Configuration

#### Environment Variables
```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.mwap.dev
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

#### JWKS Client Setup
```typescript
// config/auth0.ts
import JwksClient from 'jwks-rsa';
import { env } from './env.js';

export const jwksClient = JwksClient({
  jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 60000 * 10, // 10 minutes
  timeout: 30000,
  requestHeaders: {},
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

export const auth0Config = {
  domain: env.AUTH0_DOMAIN,
  audience: env.AUTH0_AUDIENCE,
  issuer: `https://${env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'] as const
};
```

### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string;          // User ID (Auth0 subject)
  email: string;        // User email address
  name: string;         // User display name
  email_verified: boolean; // Email verification status
  iat: number;          // Issued at timestamp
  exp: number;          // Expiration timestamp
  aud: string;          // Audience (API identifier)
  iss: string;          // Issuer (Auth0 domain)
  scope?: string;       // Optional scopes
}

interface AuthenticatedUser {
  sub: string;
  email: string;
  name: string;
  email_verified: boolean;
}
```

### Authentication Middleware

#### Primary Authentication Middleware
```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { jwksClient, auth0Config } from '../config/auth0.js';
import { AuthError, UnauthorizedError } from '../utils/errors.js';
import { logInfo, logWarn } from '../utils/logger.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

export function authenticateJWT() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip authentication for public endpoints
    if (isPublicRoute(req.path)) {
      return next();
    }

    try {
      // Extract and verify JWT token
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        throw new UnauthorizedError('Access token required');
      }

      // Verify token and extract user information
      const user = await verifyToken(token);
      req.auth = user;

      // Log successful authentication
      logInfo('User authenticated', {
        userId: user.sub,
        endpoint: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      logWarn('Authentication failed', {
        error: error.message,
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });
      next(error);
    }
  };
}

// Public routes that don't require authentication
const isPublicRoute = (path: string): boolean => {
  const publicRoutes = [
    '/health',
    '/api/v1/oauth/callback'
  ];
  return publicRoutes.some(route => path.startsWith(route));
};

// Extract Bearer token from Authorization header
const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7); // Remove 'Bearer ' prefix
};

// Verify JWT token using Auth0 JWKS
const verifyToken = async (token: string): Promise<AuthenticatedUser> => {
  return new Promise((resolve, reject) => {
    // Decode token to get header information
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      reject(new UnauthorizedError('Invalid token format'));
      return;
    }

    // Get signing key using kid from token header
    getSigningKey(decoded.header.kid!)
      .then(signingKey => {
        // Verify token signature and claims
        jwt.verify(token, signingKey, {
          audience: auth0Config.audience,
          issuer: auth0Config.issuer,
          algorithms: auth0Config.algorithms,
        }, (err, payload) => {
          if (err) {
            reject(new UnauthorizedError(`Token verification failed: ${err.message}`));
          } else {
            const user = payload as JWTPayload;
            resolve({
              sub: user.sub,
              email: user.email,
              name: user.name,
              email_verified: user.email_verified
            });
          }
        });
      })
      .catch(() => {
        reject(new UnauthorizedError('Failed to get signing key'));
      });
  });
};

// Get signing key from JWKS endpoint
const getSigningKey = async (kid: string): Promise<string> => {
  try {
    const key = await jwksClient.getSigningKey(kid);
    return key.getPublicKey();
  } catch (error) {
    throw new Error(`Unable to retrieve signing key: ${error.message}`);
  }
};
```

#### User Information Utility
```typescript
// utils/auth.ts
import { Request } from 'express';
import { AuthError } from './errors.js';

export function getUserFromToken(req: Request): AuthenticatedUser {
  if (!req.auth) {
    throw new AuthError('User not authenticated');
  }
  return req.auth;
}

export function getOptionalUser(req: Request): AuthenticatedUser | null {
  return req.auth || null;
}
```

## 🛡️ Role-Based Access Control (RBAC)

### Role System Architecture

#### Role Hierarchy
```
SuperAdmin
├── Platform-wide access
├── All tenant operations
├── System configuration
└── User management

Tenant Owner
├── Own tenant management
├── Tenant project operations
├── Cloud integrations
└── Project member management

Project Roles
├── OWNER: Full project control
├── DEPUTY: Project editing + member management
└── MEMBER: Read-only project access
```

#### Permission Matrix
| Resource | SuperAdmin | Tenant Owner | Project Owner | Project Deputy | Project Member |
|----------|------------|--------------|---------------|----------------|----------------|
| System Config | ✅ | ❌ | ❌ | ❌ | ❌ |
| All Tenants | ✅ | ❌ | ❌ | ❌ | ❌ |
| Own Tenant | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Project | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Project | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Project | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Members | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Project | ✅ | ✅ | ✅ | ✅ | ✅ |

### Authorization Middleware

#### SuperAdmin Authorization
```typescript
// middleware/authorization.ts
import { Request, Response, NextFunction } from 'express';
import { PermissionError } from '../utils/errors.js';
import { getUserFromToken } from '../utils/auth.js';
import { getDatabase } from '../config/db.js';

export function requireSuperAdminRole() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      
      const superadmin = await getDatabase()
        .collection('superadmins')
        .findOne({ userId: user.sub });
      
      if (!superadmin) {
        throw new PermissionError('SuperAdmin access required');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}
```

#### Tenant Owner Authorization
```typescript
export function requireTenantOwner(tenantIdParam = 'tenantId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      const tenantId = req.params[tenantIdParam];
      
      if (!tenantId) {
        throw new PermissionError('Tenant ID required');
      }
      
      const tenant = await getDatabase()
        .collection('tenants')
        .findOne({
          _id: new ObjectId(tenantId),
          ownerId: user.sub
        });
      
      if (!tenant) {
        throw new PermissionError('Only tenant owners can access this resource');
      }
      
      // Attach tenant to request for use in handlers
      req.tenant = tenant;
      next();
    } catch (error) {
      next(error);
    }
  };
}
```

#### Flexible Authorization (Owner or Admin)
```typescript
export function requireTenantOwnerOrSuperAdmin(tenantIdParam = 'tenantId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      const tenantId = req.params[tenantIdParam];
      
      // Check SuperAdmin first (highest privilege)
      const superadmin = await getDatabase()
        .collection('superadmins')
        .findOne({ userId: user.sub });
        
      if (superadmin) {
        req.isSuperAdmin = true;
        return next();
      }
      
      // Check tenant ownership
      if (!tenantId) {
        throw new PermissionError('Tenant ID required for non-admin access');
      }
      
      const tenant = await getDatabase()
        .collection('tenants')
        .findOne({
          _id: new ObjectId(tenantId),
          ownerId: user.sub
        });
      
      if (!tenant) {
        throw new PermissionError('Only tenant owners or superadmins can access this resource');
      }
      
      req.tenant = tenant;
      next();
    } catch (error) {
      next(error);
    }
  };
}
```

#### Project Role Authorization
```typescript
// middleware/roles.ts
export function requireProjectRole(requiredRole: 'OWNER' | 'DEPUTY' | 'MEMBER') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      const projectId = req.params.id || req.params.projectId;
      
      if (!projectId) {
        throw new PermissionError('Project ID required');
      }
      
      // Check SuperAdmin first
      const superadmin = await getDatabase()
        .collection('superadmins')
        .findOne({ userId: user.sub });
        
      if (superadmin) {
        req.isSuperAdmin = true;
        return next();
      }
      
      // Get project and check membership
      const project = await getDatabase()
        .collection('projects')
        .findOne({ _id: new ObjectId(projectId) });
      
      if (!project) {
        throw new PermissionError('Project not found');
      }
      
      const member = project.members?.find(m => m.userId === user.sub);
      
      if (!member) {
        throw new PermissionError('Not a project member');
      }
      
      if (!hasRolePermission(member.role, requiredRole)) {
        throw new PermissionError(`Project ${requiredRole} access required`);
      }
      
      req.project = project;
      req.projectRole = member.role;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Check if user role has sufficient permissions
function hasRolePermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = { OWNER: 3, DEPUTY: 2, MEMBER: 1 };
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  return userLevel >= requiredLevel;
}
```

### Role Resolution Service

#### User Roles API Implementation
```typescript
// features/users/user.service.ts
import { ObjectId } from 'mongodb';
import { getDatabase } from '../../config/db.js';

export interface UserRoles {
  userId: string;
  isSuperAdmin: boolean;
  isTenantOwner: boolean;
  tenantId: string | null;
  projectRoles: Array<{
    projectId: string;
    role: 'OWNER' | 'DEPUTY' | 'MEMBER';
  }>;
}

export async function getUserRoles(userId: string): Promise<UserRoles> {
  const db = getDatabase();
  
  // Parallel queries for efficiency
  const [superadmin, tenant, projects] = await Promise.all([
    db.collection('superadmins').findOne({ userId }),
    db.collection('tenants').findOne({ ownerId: userId }),
    db.collection('projects').find({ 'members.userId': userId }).toArray()
  ]);
  
  // Extract project roles
  const projectRoles = projects.map(project => {
    const member = project.members.find(m => m.userId === userId);
    return {
      projectId: project._id.toString(),
      role: member?.role || 'MEMBER'
    };
  });
  
  return {
    userId,
    isSuperAdmin: !!superadmin,
    isTenantOwner: !!tenant,
    tenantId: tenant?._id?.toString() || null,
    projectRoles
  };
}
```

## 🔒 Route Protection Patterns

### SuperAdmin Only Routes
```typescript
// Project types management (admin only)
router.use(requireSuperAdminRole());
router.get('/', wrapAsyncHandler(getAllProjectTypes));
router.post('/', wrapAsyncHandler(createProjectType));
router.patch('/:id', wrapAsyncHandler(updateProjectType));
router.delete('/:id', wrapAsyncHandler(deleteProjectType));
```

### Tenant Owner Routes
```typescript
// Cloud integrations (tenant-scoped)
router.use('/:tenantId/integrations', requireTenantOwner('tenantId'));
router.get('/', wrapAsyncHandler(getIntegrations));
router.post('/', wrapAsyncHandler(createIntegration));
router.patch('/:id', wrapAsyncHandler(updateIntegration));
```

### Project Role-Based Routes
```typescript
// Project operations by role
router.get('/:id', requireProjectRole('MEMBER'), wrapAsyncHandler(getProject));
router.patch('/:id', requireProjectRole('DEPUTY'), wrapAsyncHandler(updateProject));
router.delete('/:id', requireProjectRole('OWNER'), wrapAsyncHandler(deleteProject));

// Project member management
router.get('/:id/members', requireProjectRole('MEMBER'), wrapAsyncHandler(getMembers));
router.post('/:id/members', requireProjectRole('DEPUTY'), wrapAsyncHandler(addMember));
router.delete('/:id/members/:userId', requireProjectRole('OWNER'), wrapAsyncHandler(removeMember));
```

### Flexible Permission Routes
```typescript
// Multiple access patterns
router.get('/:id', requireTenantOwnerOrSuperAdmin('id'), wrapAsyncHandler(getTenantById));
router.patch('/:id', requireTenantOwnerOrSuperAdmin('id'), wrapAsyncHandler(updateTenant));
```

## 🚨 Error Handling & Security

### Security Error Types
```typescript
// utils/errors.ts
export class AuthError extends Error {
  statusCode = 401;
  code = 'auth/unauthorized';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthError';
  }
}

export class PermissionError extends Error {
  statusCode = 403;
  code = 'auth/forbidden';
  
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'PermissionError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Invalid or expired token') {
    super(message);
    this.code = 'auth/invalid-token';
  }
}
```

### Error Response Format
```typescript
// Global error handler for auth errors
if (error instanceof AuthError) {
  return res.status(401).json({
    success: false,
    error: {
      code: error.code,
      message: error.message
    }
  });
}

if (error instanceof PermissionError) {
  return res.status(403).json({
    success: false,
    error: {
      code: error.code,
      message: error.message
    }
  });
}
```

### Common Error Responses
```json
// Authentication required
{
  "success": false,
  "error": {
    "code": "auth/unauthorized",
    "message": "Access token required"
  }
}

// Invalid token
{
  "success": false,
  "error": {
    "code": "auth/invalid-token", 
    "message": "Token verification failed"
  }
}

// Insufficient permissions
{
  "success": false,
  "error": {
    "code": "auth/forbidden",
    "message": "SuperAdmin access required"
  }
}
```

## 📊 Database Schema for RBAC

### SuperAdmins Collection
```typescript
interface SuperAdmin {
  _id: ObjectId;
  userId: string;        // Auth0 user ID
  createdAt: Date;
  createdBy: string;     // Admin who created this entry
  permissions?: string[]; // Future: granular permissions
}
```

### Tenants Collection
```typescript
interface Tenant {
  _id: ObjectId;
  name: string;
  ownerId: string;       // Auth0 user ID (one-to-one relationship)
  settings: {
    allowPublicProjects: boolean;
    maxProjects: number;
  };
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
}
```

### Projects Collection
```typescript
interface Project {
  _id: ObjectId;
  name: string;
  tenantId: ObjectId;
  projectTypeId: ObjectId;
  members: Array<{
    userId: string;      // Auth0 user ID
    role: 'OWNER' | 'DEPUTY' | 'MEMBER';
    addedAt: Date;
    addedBy: string;     // User ID who added this member
  }>;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
}
```

## 🔍 Security Best Practices

### Token Security
1. **Short-lived tokens**: Use access tokens with 15-60 minute expiry
2. **HTTPS only**: Never transmit tokens over unencrypted connections
3. **Secure storage**: Frontend should use memory storage, not localStorage
4. **Token rotation**: Implement refresh token rotation for long-term access

### Authentication Security
1. **JWKS caching**: Cache signing keys with appropriate TTL
2. **Rate limiting**: Implement rate limiting on authentication endpoints
3. **Audit logging**: Log all authentication attempts and failures
4. **Input validation**: Validate all tokens and user data

### Authorization Security
1. **Principle of least privilege**: Grant minimum necessary permissions
2. **Resource-level checks**: Validate access to specific resources
3. **Context validation**: Ensure operations are within proper context
4. **Audit trail**: Log all authorization decisions

### Production Security
1. **Environment isolation**: Separate dev/staging/production Auth0 tenants
2. **Key rotation**: Regular rotation of secrets and keys
3. **Monitoring**: Real-time monitoring of authentication failures
4. **Incident response**: Procedures for security incidents

## 🧪 Testing Security Implementation

### Unit Tests for Authentication
```typescript
// tests/middleware/auth.test.ts
describe('authenticateJWT', () => {
  it('should authenticate valid JWT token', async () => {
    const validToken = generateTestToken({ sub: 'user123' });
    req.headers.authorization = `Bearer ${validToken}`;
    
    await authenticateJWT()(req, res, next);
    
    expect(req.auth).toEqual({
      sub: 'user123',
      email: 'test@example.com',
      name: 'Test User'
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject invalid JWT token', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    
    await authenticateJWT()(req, res, next);
    
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
```

### Unit Tests for Authorization
```typescript
// tests/middleware/authorization.test.ts
describe('requireSuperAdminRole', () => {
  it('should allow superadmin users', async () => {
    mockDB.collection('superadmins').findOne.mockResolvedValue({ userId: 'user123' });
    req.auth = { sub: 'user123' };
    
    await requireSuperAdminRole()(req, res, next);
    
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject non-superadmin users', async () => {
    mockDB.collection('superadmins').findOne.mockResolvedValue(null);
    req.auth = { sub: 'user123' };
    
    await requireSuperAdminRole()(req, res, next);
    
    expect(next).toHaveBeenCalledWith(expect.any(PermissionError));
  });
});
```

### Integration Tests
```typescript
// tests/integration/auth.test.ts
describe('Authentication Integration', () => {
  it('should protect API endpoints', async () => {
    const response = await request(app)
      .get('/api/v1/tenants')
      .expect(401);
      
    expect(response.body.error.code).toBe('auth/unauthorized');
  });

  it('should allow authenticated requests', async () => {
    const token = await getTestAuthToken();
    
    const response = await request(app)
      .get('/api/v1/users/me/roles')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
      
    expect(response.body.success).toBe(true);
  });
});
```

---
*This security guide provides comprehensive coverage of authentication, authorization, and security best practices for the MWAP platform.* 