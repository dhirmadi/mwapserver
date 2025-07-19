# MWAP Backend Development Guide

This comprehensive guide covers the backend architecture, development patterns, configuration, and best practices for the MWAP platform.

## 🎯 Overview

### Platform Architecture
MWAP backend is a Node.js application built with Express.js and TypeScript, providing a robust REST API for multi-tenant project management, cloud integrations, and file operations. The backend emphasizes security, scalability, and maintainability through feature-based architecture and comprehensive validation.

### Core Features
- **Multi-tenant Architecture**: Isolated data and operations per tenant
- **OAuth Integration**: Secure integration with Google Drive, Dropbox, OneDrive
- **JWT Authentication**: Auth0-based authentication with role-based access control
- **Virtual File System**: Unified file management across cloud providers
- **Feature-Based Organization**: Domain-driven module structure
- **Comprehensive Validation**: Zod-based request/response validation
- **Interactive Documentation**: Swagger UI with authentication protection

## 🏗️ System Architecture

### Technology Stack
```
┌─────────────────────────────────────────────────────┐
│                Presentation Layer                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   Express   │ │    CORS     │ │   Helmet    │   │
│  │   Router    │ │ Protection  │ │  Security   │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                 Application Layer                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │Controllers  │ │Middleware   │ │ Validation  │   │
│  │   Logic     │ │   Auth      │ │   Schemas   │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                  Business Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  Services   │ │   Domain    │ │   OAuth     │   │
│  │   Logic     │ │   Models    │ │Integration  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                   Data Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  MongoDB    │ │   Cloud     │ │   Cache     │   │
│  │   Atlas     │ │   APIs      │ │  (Future)   │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Component Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: Auth0 JWT (RS256, JWKS)
- **Validation**: Zod schemas for runtime validation
- **Security**: Helmet.js, CORS, rate limiting
- **Documentation**: Swagger UI with OpenAPI 3.1

## 📁 Project Structure

### Core Directory Organization
```
src/
├── app.ts                  # Express application setup and middleware
├── server.ts               # Server startup and initialization
├── config/                 # Configuration modules
│   ├── db.ts              # MongoDB connection setup
│   ├── auth0.ts           # Auth0 JWT configuration
│   └── env.ts             # Environment variable validation
├── features/              # Feature-based domain modules
│   ├── tenants/           # Tenant management
│   │   ├── tenants.routes.ts      # Express router
│   │   ├── tenants.controller.ts  # Request handlers
│   │   ├── tenants.service.ts     # Business logic
│   │   └── tenants.types.ts       # TypeScript types
│   ├── projects/          # Project operations
│   ├── cloud-providers/   # Cloud provider management
│   ├── cloud-integrations/# OAuth integrations
│   ├── files/             # Virtual file operations
│   ├── oauth/             # OAuth callback handling
│   └── users/             # User management
├── middleware/            # Express middleware
│   ├── auth.ts            # JWT authentication
│   ├── authorization.ts   # Role-based authorization
│   ├── errorHandler.ts    # Global error handling
│   └── roles.ts           # Role validation middleware
├── schemas/               # Zod validation schemas
│   ├── tenant.schema.ts
│   ├── project.schema.ts
│   └── cloudProvider.schema.ts
├── utils/                 # Shared utilities
│   ├── auth.ts            # Authentication helpers
│   ├── errors.ts          # Custom error classes
│   ├── logger.ts          # Structured logging
│   ├── response.ts        # Response formatting
│   └── validate.ts        # Validation utilities
└── types/                 # Global TypeScript definitions
```

## 🚀 Server Setup & Configuration

### Application Bootstrap (`app.ts`)
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateJWT } from './middleware/auth.js';
import { validateEnv } from './config/env.js';

// Validate environment variables on startup
validateEnv();

const app = express();

// Security middleware (applied first)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://app.mwap.dev' 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (public endpoint)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime()
  });
});

// Global authentication middleware (excludes health check)
app.use(authenticateJWT());

// Protected API documentation
app.use('/docs', getDocsRouter());

// Feature routes (registered dynamically to prevent import cycles)
await registerRoutes();

// Global error handler (must be last)
app.use(errorHandler);

export { app };
```

### Server Startup (`server.ts`)
```typescript
import { app } from './app.js';
import { connectToDatabase } from './config/db.js';
import { logInfo, logError } from './utils/logger.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    logInfo('Database connected successfully');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logInfo(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV,
        port: PORT
      });
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logInfo(`${signal} received, shutting down gracefully`);
      server.close(() => {
        logInfo('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
```

### Dynamic Route Registration
```typescript
// Prevents circular dependency issues
export async function registerRoutes(): Promise<void> {
  const { getTenantRouter } = await import('./features/tenants/tenants.routes');
  const { getProjectsRouter } = await import('./features/projects/projects.routes');
  const { getCloudProvidersRouter } = await import('./features/cloud-providers/cloudProviders.routes');
  const { getUserRouter } = await import('./features/users/user.routes');
  const { getOAuthRouter } = await import('./features/oauth/oauth.routes');

  // Register feature routes with base paths
  app.use('/api/v1/tenants', getTenantRouter());
  app.use('/api/v1/projects', getProjectsRouter());
  app.use('/api/v1/cloud-providers', getCloudProvidersRouter());
  app.use('/api/v1/users', getUserRouter());
  app.use('/api/v1/oauth', getOAuthRouter());
}
```

## 🔧 Feature Development Pattern

### Standard Feature Structure
Each feature follows a consistent pattern for maintainability and scalability:

```typescript
// features/example/example.routes.ts
import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import { requireRole } from '../../middleware/authorization.js';
import * as controller from './example.controller.js';

export function getExampleRouter(): Router {
  const router = Router();

  // Public routes (authentication already applied globally)
  router.get('/', wrapAsyncHandler(controller.getExamples));
  router.get('/:id', wrapAsyncHandler(controller.getExampleById));

  // Role-restricted routes
  router.post('/', 
    requireRole('TENANT_OWNER'), 
    wrapAsyncHandler(controller.createExample)
  );
  
  router.patch('/:id', 
    requireRole('TENANT_OWNER'), 
    wrapAsyncHandler(controller.updateExample)
  );
  
  router.delete('/:id', 
    requireRole('SUPERADMIN'), 
    wrapAsyncHandler(controller.deleteExample)
  );

  return router;
}
```

```typescript
// features/example/example.controller.ts
import { Request, Response } from 'express';
import { ExampleService } from './example.service.js';
import { CreateExampleSchema, UpdateExampleSchema } from '../../schemas/example.schema.js';
import { validateWithSchema } from '../../utils/validate.js';
import { jsonResponse } from '../../utils/response.js';
import { getUserFromToken } from '../../utils/auth.js';

const exampleService = new ExampleService();

export async function getExamples(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const examples = await exampleService.getExamplesForUser(user.sub);
  return jsonResponse(res, examples);
}

export async function createExample(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const data = validateWithSchema(CreateExampleSchema, req.body);
  
  const example = await exampleService.create(data, user.sub);
  return jsonResponse(res, example, 201);
}
```

```typescript
// features/example/example.service.ts
import { ObjectId } from 'mongodb';
import { getDatabase } from '../../config/db.js';
import { Example, CreateExampleRequest } from './example.types.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { logInfo, logAudit } from '../../utils/logger.js';

export class ExampleService {
  private get collection() {
    return getDatabase().collection<Example>('examples');
  }

  async create(data: CreateExampleRequest, userId: string): Promise<Example> {
    // Business logic validation
    await this.validateCreateRequest(data, userId);

    const example: Example = {
      _id: new ObjectId(),
      ...data,
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.collection.insertOne(example);
    
    logAudit('example_created', userId, example._id.toString());
    logInfo('Example created', { exampleId: example._id, userId });

    return example;
  }

  private async validateCreateRequest(data: CreateExampleRequest, userId: string): Promise<void> {
    // Implement business logic validation
    if (await this.nameExists(data.name, userId)) {
      throw new ValidationError('Example name already exists');
    }
  }
}
```

## 🔐 Security & Middleware

### Authentication Middleware
```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../utils/errors.js';

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 60000 * 10 // 10 minutes
});

export function authenticateJWT() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip authentication for health check
    if (req.path === '/health') {
      return next();
    }

    try {
      const token = extractTokenFromHeader(req);
      if (!token) {
        throw new AuthError('No token provided');
      }

      const decoded = await verifyToken(token);
      req.auth = {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name
      };

      next();
    } catch (error) {
      next(new AuthError('Invalid token'));
    }
  };
}

async function verifyToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}
```

### Authorization Middleware
```typescript
// middleware/authorization.ts
import { Request, Response, NextFunction } from 'express';
import { PermissionError } from '../utils/errors.js';
import { getUserRoles } from '../services/userService.js';

export function requireRole(role: 'SUPERADMIN' | 'TENANT_OWNER') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRoles = await getUserRoles(req.auth.sub);
      
      if (role === 'SUPERADMIN' && !userRoles.isSuperAdmin) {
        throw new PermissionError('SuperAdmin access required');
      }
      
      if (role === 'TENANT_OWNER' && !userRoles.isTenantOwner && !userRoles.isSuperAdmin) {
        throw new PermissionError('Tenant owner access required');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireProjectRole(role: 'OWNER' | 'DEPUTY' | 'MEMBER') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.id || req.params.projectId;
      const hasAccess = await checkProjectAccess(req.auth.sub, projectId, role);
      
      if (!hasAccess) {
        throw new PermissionError(`Project ${role} access required`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}
```

### Error Handling Middleware
```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError, ValidationError, AuthError, PermissionError } from '../utils/errors.js';
import { logError } from '../utils/logger.js';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log all errors for debugging
  logError('Request error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.auth?.sub
  });

  // Handle known error types
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation/invalid-input',
        message: error.message,
        details: error.details
      }
    });
  }

  if (error instanceof AuthError) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'auth/unauthorized',
        message: error.message
      }
    });
  }

  if (error instanceof PermissionError) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'auth/forbidden',
        message: error.message
      }
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: 'server/internal-error',
      message: 'An unexpected error occurred'
    }
  });
}
```

## ⚙️ Environment Configuration

### Environment Variables
```bash
# Core Server Configuration
NODE_ENV=development                   # development, staging, production
PORT=3000                             # Server port
API_VERSION=v3                        # API version prefix

# Database Configuration
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mwap

# Authentication (Auth0)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.mwap.dev
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# Security Configuration
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-256-bit-secret-key
CORS_ORIGIN=https://app.mwap.dev,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000           # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100           # Max requests per window

# Cloud Provider Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DROPBOX_CLIENT_ID=your-dropbox-client-id
DROPBOX_CLIENT_SECRET=your-dropbox-client-secret

# Monitoring & Logging
LOG_LEVEL=info                        # debug, info, warn, error
SENTRY_DSN=https://your-sentry-dsn

# Feature Flags
ENABLE_AI_AGENTS=true
ENABLE_FILE_PROCESSING=true
ENABLE_CLOUD_INTEGRATIONS=true
```

### Environment Validation
```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().min(1).max(65535),
  MONGODB_URI: z.string().url(),
  AUTH0_DOMAIN: z.string(),
  AUTH0_AUDIENCE: z.string().url(),
  AUTH0_CLIENT_ID: z.string(),
  ENCRYPTION_KEY: z.string().min(32),
  CORS_ORIGIN: z.string(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:', error.errors);
    process.exit(1);
  }
}

export type Env = z.infer<typeof envSchema>;
```

## 🔧 Development Workflow

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/your-org/mwapserver.git
cd mwapserver

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

### Database Migrations
```typescript
// migrations/001_initial_setup.ts
export async function up() {
  const db = getDatabase();
  
  // Create indexes
  await db.collection('tenants').createIndex({ ownerId: 1 }, { unique: true });
  await db.collection('projects').createIndex({ tenantId: 1 });
  await db.collection('projects').createIndex({ 'members.userId': 1 });
}

export async function down() {
  const db = getDatabase();
  
  // Drop indexes
  await db.collection('tenants').dropIndex({ ownerId: 1 });
  await db.collection('projects').dropIndex({ tenantId: 1 });
  await db.collection('projects').dropIndex({ 'members.userId': 1 });
}
```

## 📋 Best Practices

### Code Organization
1. **Feature-based structure**: Organize code by business domain
2. **Consistent naming**: Use clear, descriptive names for files and functions
3. **Single responsibility**: Each module should have one clear purpose
4. **Dependency injection**: Use dependency injection for testability

### Security Practices
1. **Input validation**: Validate all inputs with Zod schemas
2. **Error handling**: Never expose internal errors to clients
3. **Authentication**: Use JWT tokens with proper verification
4. **Authorization**: Implement role-based access control
5. **Rate limiting**: Protect against abuse and DDoS attacks

### Performance Optimization
1. **Database indexing**: Create appropriate indexes for queries
2. **Connection pooling**: Use connection pooling for database access
3. **Caching**: Implement caching for frequently accessed data
4. **Async operations**: Use async/await for non-blocking operations

### Testing Strategy
1. **Unit tests**: Test individual functions and modules
2. **Integration tests**: Test API endpoints and database operations
3. **Test coverage**: Maintain high test coverage (>80%)
4. **Mocking**: Mock external dependencies in tests

### Monitoring & Observability
1. **Structured logging**: Use structured JSON logging
2. **Error tracking**: Implement error tracking and alerting
3. **Performance monitoring**: Monitor API response times
4. **Health checks**: Implement comprehensive health checks

---
*This backend development guide provides the foundation for building scalable, secure, and maintainable features in the MWAP platform.* 