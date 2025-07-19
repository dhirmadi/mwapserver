# Backend Authentication

This document covers the authentication implementation, security patterns, and Auth0 integration for the MWAP backend.

## 🔐 Authentication Overview

### Authentication Strategy
MWAP implements a robust authentication system using Auth0 as the identity provider, with JWT tokens for API access and role-based authorization for resource protection.

### Key Components
- **Auth0 Integration**: Identity provider with PKCE flow
- **JWT Validation**: RS256 signature verification using JWKS
- **Middleware Chain**: Authentication and authorization layers
- **Multi-tenancy**: Tenant-scoped access control
- **Role-based Access**: Granular permissions system

## 🏗️ Authentication Architecture

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

### JWT Token Structure
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id"
  },
  "payload": {
    "iss": "https://your-tenant.auth0.com/",
    "sub": "auth0|user-id",
    "aud": "https://api.mwap.dev",
    "iat": 1642723200,
    "exp": 1642809600,
    "azp": "client-id",
    "scope": "openid profile email",
    "permissions": ["read:tenants", "write:projects"]
  }
}
```

## 🔧 Authentication Implementation

### Auth0 Configuration
```typescript
// config/auth0.ts
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

export interface Auth0Config {
  domain: string;
  audience: string;
  issuer: string;
  jwksUri: string;
}

export const auth0Config: Auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  audience: process.env.AUTH0_AUDIENCE!,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
};

// JWKS client for key retrieval
export const jwksClientInstance = jwksClient({
  jwksUri: auth0Config.jwksUri,
  cache: true,
  cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  cacheMaxEntries: 5,
  timeout: 30000,
  strictSsl: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

// Get signing key
export const getSigningKey = (kid: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwksClientInstance.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
      } else {
        const signingKey = key?.getPublicKey();
        resolve(signingKey!);
      }
    });
  });
};
```

### Authentication Middleware
```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth0Config, getSigningKey } from '../config/auth0.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  name?: string;
  permissions?: string[];
  scope?: string;
}

declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip authentication for public routes
    if (isPublicRoute(req.path)) {
      return next();
    }

    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    // Verify and decode token
    const user = await verifyToken(token);
    req.user = user;

    // Log authentication success
    logger.debug('User authenticated successfully', {
      userId: user.sub,
      endpoint: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
    });
    next(error);
  }
};

const isPublicRoute = (path: string): boolean => {
  const publicRoutes = [
    '/health',
    '/docs',
    '/api/v1/auth/callback',
    '/api/v1/webhooks',
  ];
  
  return publicRoutes.some(route => path.startsWith(route));
};

const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7); // Remove 'Bearer ' prefix
};

const verifyToken = async (token: string): Promise<AuthenticatedUser> => {
  return new Promise((resolve, reject) => {
    // Decode token to get header
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      reject(new UnauthorizedError('Invalid token format'));
      return;
    }

    // Get signing key using kid from header
    getSigningKey(decoded.header.kid!)
      .then(signingKey => {
        // Verify token
        jwt.verify(token, signingKey, {
          audience: auth0Config.audience,
          issuer: auth0Config.issuer,
          algorithms: ['RS256'],
        }, (err, payload) => {
          if (err) {
            reject(new UnauthorizedError('Token verification failed'));
          } else {
            resolve(payload as AuthenticatedUser);
          }
        });
      })
      .catch(err => {
        reject(new UnauthorizedError('Failed to get signing key'));
      });
  });
};
```

### Optional Authentication Middleware
```typescript
// middleware/optionalAuth.ts
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (token) {
      const user = await verifyToken(token);
      req.user = user;
    }
    // Continue regardless of authentication status
    next();
  } catch (error) {
    // Log but don't fail the request
    logger.debug('Optional authentication failed', { error: error.message });
    next();
  }
};
```

## 🛡️ Authorization Implementation

### Role-Based Access Control
```typescript
// middleware/authorization.ts
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { TenantsService } from '../features/tenants/tenants.service.js';
import { ProjectsService } from '../features/projects/projects.service.js';

export type ResourceType = 'tenant' | 'project' | 'integration' | 'file';
export type Permission = 'read' | 'write' | 'delete' | 'admin';

export interface AccessContext {
  resourceType: ResourceType;
  resourceId: string;
  permission: Permission;
  allowOwner?: boolean;
}

// Generic authorization middleware
export const requireAccess = (context: AccessContext) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const hasAccess = await checkAccess(req.user, context, req);
      
      if (!hasAccess) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check user access to resource
const checkAccess = async (
  user: AuthenticatedUser,
  context: AccessContext,
  req: Request
): Promise<boolean> => {
  switch (context.resourceType) {
    case 'tenant':
      return await checkTenantAccess(user, context, req);
    case 'project':
      return await checkProjectAccess(user, context, req);
    case 'integration':
      return await checkIntegrationAccess(user, context, req);
    case 'file':
      return await checkFileAccess(user, context, req);
    default:
      return false;
  }
};

// Tenant access control
const checkTenantAccess = async (
  user: AuthenticatedUser,
  context: AccessContext,
  req: Request
): Promise<boolean> => {
  const tenantId = context.resourceId || req.params.tenantId;
  const tenantsService = new TenantsService();

  try {
    const tenant = await tenantsService.getById(tenantId, user.sub);
    
    // Owner has full access
    if (tenant.ownerId === user.sub) {
      return true;
    }

    // Additional role-based checks can be added here
    return false;
  } catch (error) {
    return false;
  }
};

// Project access control
const checkProjectAccess = async (
  user: AuthenticatedUser,
  context: AccessContext,
  req: Request
): Promise<boolean> => {
  const projectId = context.resourceId || req.params.projectId;
  const projectsService = new ProjectsService();

  try {
    const memberAccess = await projectsService.getUserAccess(projectId, user.sub);
    
    if (!memberAccess) {
      return false;
    }

    // Check permission based on role
    return hasPermissionForRole(memberAccess.role, context.permission);
  } catch (error) {
    return false;
  }
};

// Role-permission mapping
const hasPermissionForRole = (role: string, permission: Permission): boolean => {
  const rolePermissions: Record<string, Permission[]> = {
    owner: ['read', 'write', 'delete', 'admin'],
    admin: ['read', 'write', 'delete'],
    member: ['read', 'write'],
    viewer: ['read'],
  };

  return rolePermissions[role]?.includes(permission) || false;
};
```

### Specific Authorization Middlewares
```typescript
// Tenant ownership middleware
export const requireTenantOwnership = requireAccess({
  resourceType: 'tenant',
  resourceId: '',
  permission: 'admin',
  allowOwner: true,
});

// Project admin access
export const requireProjectAdmin = requireAccess({
  resourceType: 'project',
  resourceId: '',
  permission: 'admin',
});

// Project member access
export const requireProjectMember = requireAccess({
  resourceType: 'project',
  resourceId: '',
  permission: 'read',
});

// Usage in routes
app.get('/api/v1/tenants/:tenantId', 
  authMiddleware,
  requireTenantOwnership,
  tenantController.getById
);

app.post('/api/v1/projects/:projectId/members',
  authMiddleware,
  requireProjectAdmin,
  projectMemberController.addMember
);
```

## 🔍 User Context and Claims

### User Service
```typescript
// services/userService.ts
import { AuthenticatedUser } from '../middleware/auth.js';
import { getCollection } from '../config/db.js';

export interface UserProfile {
  _id?: string;
  auth0Id: string;
  email: string;
  name: string;
  picture?: string;
  metadata: {
    lastLogin: Date;
    loginCount: number;
    preferences: {
      theme: 'light' | 'dark';
      language: string;
      timezone: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  private collection = getCollection<UserProfile>('users');

  async getOrCreateUser(authUser: AuthenticatedUser): Promise<UserProfile> {
    let user = await this.collection.findOne({ auth0Id: authUser.sub });

    if (!user) {
      // Create new user profile
      user = {
        auth0Id: authUser.sub,
        email: authUser.email!,
        name: authUser.name || authUser.email!,
        metadata: {
          lastLogin: new Date(),
          loginCount: 1,
          preferences: {
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.collection.insertOne(user);
      user._id = result.insertedId.toString();
    } else {
      // Update last login
      await this.collection.updateOne(
        { auth0Id: authUser.sub },
        {
          $set: {
            'metadata.lastLogin': new Date(),
            updatedAt: new Date(),
          },
          $inc: {
            'metadata.loginCount': 1,
          },
        }
      );
    }

    return user;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    await this.collection.updateOne(
      { auth0Id: userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );
  }
}
```

### Enhanced Authentication Middleware
```typescript
// Enhanced middleware with user context
export const authWithUserContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Run standard authentication
    await authMiddleware(req, res, () => {});

    if (req.user) {
      // Get or create user profile
      const userService = new UserService();
      const userProfile = await userService.getOrCreateUser(req.user);
      
      // Add user profile to request
      req.userProfile = userProfile;
    }

    next();
  } catch (error) {
    next(error);
  }
};
```

## 🔒 Security Patterns

### Rate Limiting
```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';

// Redis client for rate limiting
const redis = new Redis(process.env.REDIS_URL);

// General API rate limiting
export const apiRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiting
export const authRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit authentication attempts
  message: {
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

// Per-user rate limiting
export const userRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per user
  keyGenerator: (req) => req.user?.sub || req.ip,
  message: {
    error: 'Rate limit exceeded for user',
    code: 'USER_RATE_LIMIT_EXCEEDED',
  },
});
```

### Security Headers
```typescript
// middleware/security.ts
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export const securityMiddleware = [
  // Helmet for security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://auth0.com"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),

  // Custom security middleware
  (req: Request, res: Response, next: NextFunction) => {
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    
    // Add custom security headers
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-Request-ID', req.headers['x-request-id'] || 'unknown');
    
    next();
  },
];
```

### Input Sanitization
```typescript
// middleware/sanitize.ts
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

export const sanitizeMiddleware = [
  // MongoDB injection protection
  mongoSanitize({
    replaceWith: '_',
  }),

  // XSS protection
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    next();
  },
];

const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
};
```

## 📊 Authentication Monitoring

### Audit Logging
```typescript
// middleware/auditLog.ts
import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/auditLogService.js';

export const auditLogMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const auditService = new AuditLogService();
  
  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseData: any;
  
  // Override response methods to capture data
  res.send = function(data) {
    responseData = data;
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    responseData = data;
    return originalJson.call(this, data);
  };

  // Log after response
  res.on('finish', async () => {
    try {
      await auditService.logAccess({
        userId: req.user?.sub,
        method: req.method,
        endpoint: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        success: res.statusCode < 400,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  });

  next();
};
```

### Authentication Metrics
```typescript
// services/authMetrics.ts
export class AuthMetricsService {
  private collection = getCollection('authMetrics');

  async recordLogin(userId: string, success: boolean, ip: string): Promise<void> {
    await this.collection.insertOne({
      userId,
      action: 'login',
      success,
      ip,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days TTL
    });
  }

  async recordTokenRefresh(userId: string): Promise<void> {
    await this.collection.insertOne({
      userId,
      action: 'token_refresh',
      success: true,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
  }

  async getLoginStats(userId: string, days: number = 30): Promise<any> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return await this.collection.aggregate([
      {
        $match: {
          userId,
          action: 'login',
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            success: '$success',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
    ]).toArray();
  }
}
```

## 🚨 Error Handling

### Authentication Errors
```typescript
// utils/authErrors.ts
export class AuthenticationError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.code = code;
  }
}

export class AuthorizationError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, code: string = 'FORBIDDEN') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.code = code;
  }
}

// Error handler for auth errors
export const handleAuthError = (error: any): Response => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid access token', 'INVALID_TOKEN');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Access token expired', 'TOKEN_EXPIRED');
  }
  
  return error;
};
```

## 🧪 Testing Authentication

### Authentication Testing
```typescript
// tests/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../src/middleware/auth.js';
import { mockRequest, mockResponse } from './utils/mockObjects.js';

describe('Authentication Middleware', () => {
  it('should authenticate valid JWT token', async () => {
    const mockUser = { sub: 'auth0|123', email: 'test@example.com' };
    const token = jwt.sign(mockUser, 'test-secret');
    
    const req = mockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = mockResponse();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject invalid token', async () => {
    const req = mockRequest({
      headers: { authorization: 'Bearer invalid-token' },
    });
    const res = mockResponse();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should skip authentication for public routes', async () => {
    const req = mockRequest({
      path: '/health',
      headers: {},
    });
    const res = mockResponse();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
  });
});
```

---

*This authentication implementation provides enterprise-grade security with comprehensive JWT validation, role-based access control, and audit logging for the MWAP platform.* 