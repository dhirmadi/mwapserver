# 🏗️ MWAP Express Server Structure

## 🎯 Overview

This document outlines the Express.js server architecture for MWAP, detailing the modular structure, middleware stack, routing patterns, and best practices for maintaining a scalable and secure backend API.

## 🏛️ Server Architecture

### **Application Structure**
```
src/
├── app.ts                 # Express app configuration
├── server.ts             # Server startup and configuration
├── config/               # Configuration management
│   ├── database.ts       # MongoDB connection
│   ├── auth.ts          # Auth0 configuration
│   └── environment.ts   # Environment variables
├── middleware/          # Custom middleware
│   ├── auth.ts         # Authentication middleware
│   ├── rbac.ts         # Authorization middleware
│   ├── validation.ts   # Request validation
│   ├── error.ts        # Error handling
│   └── logging.ts      # Request logging
├── features/           # Feature-based modules
│   ├── auth/          # Authentication feature
│   ├── tenants/       # Tenant management
│   ├── users/         # User management
│   ├── projects/      # Project management
│   └── files/         # File management
├── shared/            # Shared utilities
│   ├── types/         # TypeScript types
│   ├── utils/         # Utility functions
│   ├── errors/        # Error classes
│   └── constants/     # Application constants
└── __tests__/         # Global test utilities
```

### **Express Application Setup**
```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/error';
import { requestLogger } from './middleware/logging';
import { authMiddleware } from './middleware/auth';
import { setupRoutes } from './routes';

export function createApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Request logging
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API routes
  setupRoutes(app);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
```

### **Server Startup**
```typescript
// src/server.ts
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { logger } from './shared/utils/logger';

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Create Express app
    const app = createApp();

    // Start server
    const port = process.env.PORT || 3000;
    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`API Version: ${process.env.API_VERSION || 'v1'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
```

## 🛣️ Routing Architecture

### **Route Organization**
```typescript
// src/routes/index.ts
import { Application } from 'express';
import { authRoutes } from '../features/auth/auth.routes';
import { tenantRoutes } from '../features/tenants/tenant.routes';
import { userRoutes } from '../features/users/user.routes';
import { projectRoutes } from '../features/projects/project.routes';
import { fileRoutes } from '../features/files/file.routes';

export function setupRoutes(app: Application): void {
  const apiVersion = process.env.API_VERSION || 'v1';
  const baseUrl = `/api/${apiVersion}`;

  // Authentication routes (public)
  app.use(`${baseUrl}/auth`, authRoutes);

  // Protected routes (require authentication)
  app.use(`${baseUrl}/tenants`, tenantRoutes);
  app.use(`${baseUrl}/users`, userRoutes);
  app.use(`${baseUrl}/projects`, projectRoutes);
  app.use(`${baseUrl}/files`, fileRoutes);

  // 404 handler for API routes
  app.use(`${baseUrl}/*`, (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ENDPOINT_NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} not found`
      }
    });
  });
}
```

### **Feature Route Pattern**
```typescript
// src/features/projects/project.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { rbacMiddleware } from '../../middleware/rbac';
import { validateRequest } from '../../middleware/validation';
import { projectController } from './project.controller';
import { 
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema 
} from './project.validation';

const router = Router();

// All project routes require authentication
router.use(authMiddleware);

// GET /api/v1/projects - List projects
router.get('/',
  rbacMiddleware(['project:read']),
  validateRequest({ query: projectQuerySchema }),
  projectController.getProjects
);

// POST /api/v1/projects - Create project
router.post('/',
  rbacMiddleware(['project:create']),
  validateRequest({ body: createProjectSchema }),
  projectController.createProject
);

// GET /api/v1/projects/:id - Get project by ID
router.get('/:id',
  rbacMiddleware(['project:read']),
  validateRequest({ params: { id: 'string' } }),
  projectController.getProject
);

// PUT /api/v1/projects/:id - Update project
router.put('/:id',
  rbacMiddleware(['project:update']),
  validateRequest({ 
    params: { id: 'string' },
    body: updateProjectSchema 
  }),
  projectController.updateProject
);

// DELETE /api/v1/projects/:id - Delete project
router.delete('/:id',
  rbacMiddleware(['project:delete']),
  validateRequest({ params: { id: 'string' } }),
  projectController.deleteProject
);

// Project members sub-routes
router.use('/:projectId/members', projectMemberRoutes);

export { router as projectRoutes };
```

## 🛡️ Middleware Stack

### **Authentication Middleware**
```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { AppError } from '../shared/errors/AppError';
import { logger } from '../shared/utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    permissions: string[];
    email: string;
    name: string;
  };
}

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000 // 10 minutes
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = await new Promise<any>((resolve, reject) => {
      jwt.verify(token, getKey, {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
      }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    // Extract user information
    req.user = {
      userId: decoded.sub,
      tenantId: decoded.tenantId,
      role: decoded.role,
      permissions: decoded.permissions || [],
      email: decoded.email,
      name: decoded.name
    };

    logger.info('User authenticated', {
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      ip: req.ip
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    } else {
      next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
    }
  }
};
```

### **Authorization Middleware**
```typescript
// src/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { logger } from '../shared/utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    permissions: string[];
  };
}

export const rbacMiddleware = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission) || 
      userPermissions.includes(permission.split(':')[0] + ':*')
    );

    if (!hasPermission) {
      logger.warn('Authorization failed', {
        userId: req.user.userId,
        tenantId: req.user.tenantId,
        requiredPermissions,
        userPermissions,
        endpoint: `${req.method} ${req.path}`
      });

      return next(new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};

export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const roleHierarchy = {
      'superadmin': 3,
      'tenant_owner': 2,
      'project_member': 1
    };

    const userRoleLevel = roleHierarchy[req.user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return next(new AppError('Insufficient role privileges', 403, 'INSUFFICIENT_ROLE'));
    }

    next();
  };
};
```

### **Validation Middleware**
```typescript
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../shared/errors/AppError';

interface ValidationSchemas {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      // Validate path parameters
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.received
        }));

        next(new AppError(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          { errors: validationErrors }
        ));
      } else {
        next(error);
      }
    }
  };
};
```

### **Error Handling Middleware**
```typescript
// src/middleware/error.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { logger } from '../shared/utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
    tenantId: (req as any).user?.tenantId
  });

  // Handle known application errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details })
      }
    });
  }

  // Handle MongoDB errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    if ((error as any).code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Resource already exists'
        }
      });
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }

  // Handle unexpected errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message
    }
  });
};
```

## 🔧 Configuration Management

### **Environment Configuration**
```typescript
// src/config/environment.ts
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default(3000),
  API_VERSION: z.string().default('v1'),
  
  // Database
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  
  // Auth0
  AUTH0_DOMAIN: z.string().min(1, 'Auth0 domain is required'),
  AUTH0_CLIENT_ID: z.string().min(1, 'Auth0 client ID is required'),
  AUTH0_CLIENT_SECRET: z.string().min(1, 'Auth0 client secret is required'),
  AUTH0_AUDIENCE: z.string().min(1, 'Auth0 audience is required'),
  
  // Security
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(64, 'Encryption key must be at least 64 characters'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
  
  // File upload
  MAX_FILE_SIZE: z.string().transform(Number).default(10485760), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // Cloud storage (optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional()
});

export type Environment = z.infer<typeof environmentSchema>;

export const env: Environment = environmentSchema.parse(process.env);
```

### **Database Configuration**
```typescript
// src/config/database.ts
import mongoose from 'mongoose';
import { env } from './environment';
import { logger } from '../shared/utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    };

    await mongoose.connect(env.MONGODB_URI, options);

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}
```

## 📊 Performance Optimization

### **Response Compression**
```typescript
// Compression middleware configuration
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses > 1KB
  level: 6, // Compression level (1-9)
  memLevel: 8 // Memory usage level (1-9)
}));
```

### **Request Caching**
```typescript
// src/middleware/cache.ts
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = createHash('md5')
      .update(`${req.originalUrl}:${req.user?.userId || 'anonymous'}`)
      .digest('hex');

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return res.json(cached.data);
    }

    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: ttlSeconds
        });
      }
      return originalJson.call(this, data);
    };

    next();
  };
};
```

## 🔗 Related Documentation

- **[📋 API Documentation](./API-v3.md)** - Complete REST API reference
- **[🔒 Auth Middleware](./auth-middleware.md)** - Authentication middleware details
- **[🏛️ Security Architecture](./security-architecture.md)** - Security design and patterns
- **[🗃️ Database Models](./database-models.md)** - MongoDB models and schemas
- **[❌ Error Handling](./error-handling.md)** - Error management patterns

---

*This Express structure provides a scalable, secure, and maintainable foundation for the MWAP backend API, following best practices for enterprise-grade applications.*