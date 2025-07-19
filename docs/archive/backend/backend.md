# Backend Development Guide

This comprehensive guide covers the backend architecture, implementation patterns, and development practices for the MWAP platform.

## 🎯 Backend Overview

### Platform Architecture
MWAP backend is a Node.js application built with Express.js and TypeScript, providing a robust REST API for multi-tenant project management, cloud integrations, and file operations. The backend emphasizes security, scalability, and maintainability.

### Core Features
- **Multi-tenant Architecture**: Isolated data and operations per tenant
- **OAuth Integration**: Secure integration with Google Drive, Dropbox, OneDrive
- **Authentication**: JWT-based authentication with Auth0
- **File Operations**: Virtual file management across cloud providers
- **Role-based Access Control**: Granular permissions system
- **API Documentation**: Comprehensive OpenAPI specification

## 🏗️ Architecture Overview

### Backend Stack
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

### Core Technologies
- **Node.js 20+**: Runtime environment with ESM support
- **Express.js**: Web application framework
- **TypeScript**: Type-safe JavaScript development
- **MongoDB Atlas**: Cloud database service
- **Auth0**: Authentication and authorization
- **Zod**: Runtime type validation and parsing
- **Vitest**: Testing framework with ESM support

## 🚀 Getting Started

### Development Environment Setup

#### Prerequisites
- Node.js 20+ (LTS recommended)
- npm 10+ (included with Node.js)
- MongoDB Atlas account (or local MongoDB)
- Auth0 account for authentication
- Git 2.25+

#### Initial Setup
```bash
# Clone the repository
git clone <backend-repo-url>
cd mwap-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

#### Environment Configuration
```bash
# .env
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap

# Authentication
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.mwap.dev

# Security
JWT_SECRET=your-development-secret
ENCRYPTION_KEY=your-32-character-encryption-key

# Cloud Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DROPBOX_CLIENT_ID=your-dropbox-client-id
DROPBOX_CLIENT_SECRET=your-dropbox-client-secret
```

### Project Structure
```
src/
├── app.ts                  # Express application setup
├── server.ts               # Server startup and configuration
├── config/                 # Configuration modules
│   ├── db.ts              # Database connection
│   ├── auth0.ts           # Auth0 configuration
│   └── env.ts             # Environment variables
├── features/              # Feature-based modules
│   ├── tenants/           # Tenant management
│   ├── projects/          # Project operations
│   ├── cloud-providers/   # Cloud provider management
│   ├── cloud-integrations/# OAuth integrations
│   ├── files/             # File operations
│   └── users/             # User management
├── middleware/            # Express middleware
│   ├── auth.ts            # Authentication
│   ├── authorization.ts   # Authorization
│   ├── errorHandler.ts    # Error handling
│   └── validate.ts        # Request validation
├── schemas/               # Zod validation schemas
├── utils/                 # Utility functions
└── types/                 # TypeScript type definitions
```

## 🔧 Core Components

### Application Setup (`app.ts`)
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { validateEnv } from './config/env.js';

// Validate environment variables
validateEnv();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
app.use(authMiddleware);

// Feature routes
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/cloud-providers', cloudProviderRoutes);
app.use('/api/v1/oauth', oauthRoutes);
app.use('/api/v1/files', fileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version 
  });
});

// Error handling
app.use(errorHandler);

export { app };
```

### Feature-Based Architecture
Each feature follows a consistent structure:

```typescript
// features/tenants/tenants.routes.ts
import { Router } from 'express';
import { TenantsController } from './tenants.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { CreateTenantSchema, UpdateTenantSchema } from '../../schemas/tenant.schema.js';

const router = Router();
const controller = new TenantsController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validateRequest(CreateTenantSchema), controller.create);
router.patch('/:id', validateRequest(UpdateTenantSchema), controller.update);
router.delete('/:id', controller.delete);

export { router as tenantRoutes };
```

```typescript
// features/tenants/tenants.controller.ts
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from './tenants.service.js';
import { successResponse } from '../../utils/response.js';

export class TenantsController {
  private service = new TenantsService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenants = await this.service.getAllForUser(req.user.sub);
      return successResponse(res, tenants, 'Tenants retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await this.service.create({
        ...req.body,
        ownerId: req.user.sub,
      });
      return successResponse(res, tenant, 'Tenant created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  // Additional methods...
}
```

```typescript
// features/tenants/tenants.service.ts
import { ObjectId } from 'mongodb';
import { getCollection } from '../../config/db.js';
import { Tenant, CreateTenantRequest } from '../../types/tenant.types.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

export class TenantsService {
  private collection = getCollection<Tenant>('tenants');

  async getAllForUser(userId: string): Promise<Tenant[]> {
    return await this.collection.find({ ownerId: userId }).toArray();
  }

  async getById(id: string, userId: string): Promise<Tenant> {
    const tenant = await this.collection.findOne({ 
      _id: new ObjectId(id),
      ownerId: userId 
    });
    
    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }
    
    return tenant;
  }

  async create(data: CreateTenantRequest): Promise<Tenant> {
    // Check for existing tenant with same name
    const existing = await this.collection.findOne({ 
      name: data.name,
      ownerId: data.ownerId 
    });
    
    if (existing) {
      throw new ConflictError('Tenant with this name already exists');
    }

    const tenant: Omit<Tenant, '_id'> = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(tenant);
    return { ...tenant, _id: result.insertedId };
  }

  // Additional methods...
}
```

## 🔐 Security Implementation

### Authentication Middleware
```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors.js';

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

const getKey = (header: any, callback: any) => {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for health check and public routes
  if (req.path === '/health' || req.path.startsWith('/docs')) {
    return next();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return next(new UnauthorizedError('Access token required'));
  }

  jwt.verify(token, getKey, {
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
  }, (err, decoded) => {
    if (err) {
      return next(new UnauthorizedError('Invalid access token'));
    }

    req.user = decoded as any;
    next();
  });
};
```

### Authorization Middleware
```typescript
// middleware/authorization.ts
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';
import { TenantsService } from '../features/tenants/tenants.service.js';
import { ProjectsService } from '../features/projects/projects.service.js';

export const requireTenantOwnership = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const tenantId = req.params.tenantId || req.body.tenantId;
    const userId = req.user.sub;
    
    const tenantsService = new TenantsService();
    const tenant = await tenantsService.getById(tenantId, userId);
    
    if (tenant.ownerId !== userId) {
      throw new ForbiddenError('Insufficient permissions for this tenant');
    }
    
    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireProjectAccess = (requiredRole: 'owner' | 'admin' | 'member' = 'member') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      const userId = req.user.sub;
      
      const projectsService = new ProjectsService();
      const access = await projectsService.getUserAccess(projectId, userId);
      
      if (!access || !hasRequiredRole(access.role, requiredRole)) {
        throw new ForbiddenError('Insufficient permissions for this project');
      }
      
      req.projectAccess = access;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const hasRequiredRole = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = ['viewer', 'member', 'admin', 'owner'];
  const userLevel = roleHierarchy.indexOf(userRole);
  const requiredLevel = roleHierarchy.indexOf(requiredRole);
  return userLevel >= requiredLevel;
};
```

## 🗄️ Database Integration

### Database Configuration
```typescript
// config/db.ts
import { MongoClient, Db, Collection } from 'mongodb';
import { logger } from '../utils/logger.js';

let client: MongoClient;
let db: Db;

export const connectToDatabase = async (): Promise<void> => {
  try {
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    db = client.db();
    
    logger.info('Connected to MongoDB Atlas');
    
    // Create indexes
    await createIndexes();
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const getCollection = <T>(name: string): Collection<T> => {
  return db.collection<T>(name);
};

const createIndexes = async (): Promise<void> => {
  try {
    // Tenant indexes
    await db.collection('tenants').createIndex({ ownerId: 1 });
    await db.collection('tenants').createIndex({ ownerId: 1, name: 1 }, { unique: true });
    
    // Project indexes
    await db.collection('projects').createIndex({ tenantId: 1 });
    await db.collection('projects').createIndex({ tenantId: 1, name: 1 }, { unique: true });
    
    // Project member indexes
    await db.collection('projectMembers').createIndex({ projectId: 1 });
    await db.collection('projectMembers').createIndex({ userId: 1 });
    await db.collection('projectMembers').createIndex({ projectId: 1, userId: 1 }, { unique: true });
    
    // Cloud integration indexes
    await db.collection('cloudIntegrations').createIndex({ tenantId: 1 });
    await db.collection('cloudIntegrations').createIndex({ tenantId: 1, providerId: 1 }, { unique: true });
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create indexes:', error);
  }
};

export const closeDatabaseConnection = async (): Promise<void> => {
  if (client) {
    await client.close();
    logger.info('Database connection closed');
  }
};
```

### Data Models
```typescript
// types/tenant.types.ts
import { ObjectId } from 'mongodb';

export interface Tenant {
  _id: ObjectId;
  name: string;
  description?: string;
  ownerId: string;
  settings: {
    allowPublicProjects: boolean;
    maxProjects: number;
    retentionDays: number;
  };
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    expiresAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantRequest {
  name: string;
  description?: string;
  ownerId: string;
  settings?: Partial<Tenant['settings']>;
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
  settings?: Partial<Tenant['settings']>;
}
```

## ☁️ Cloud Integration

### OAuth Flow Implementation
```typescript
// features/oauth/oauth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { OAuthService } from './oauth.service.js';
import { successResponse } from '../../utils/response.js';

export class OAuthController {
  private service = new OAuthService();

  initiateFlow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { providerId } = req.params;
      const userId = req.user.sub;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      const authUrl = await this.service.getAuthorizationUrl(
        providerId, 
        userId, 
        tenantId
      );
      
      return successResponse(res, { authUrl }, 'Authorization URL generated');
    } catch (error) {
      next(error);
    }
  };

  handleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;
      
      const integration = await this.service.handleCallback(
        provider,
        code as string,
        state as string
      );
      
      // Redirect to frontend with success
      res.redirect(`${process.env.FRONTEND_URL}/integrations?success=true`);
    } catch (error) {
      // Redirect to frontend with error
      res.redirect(`${process.env.FRONTEND_URL}/integrations?error=true`);
    }
  };
}
```

### Cloud Provider Services
```typescript
// features/cloud-integrations/providers/googleDrive.service.ts
import { google } from 'googleapis';
import { CloudFile, CloudProvider } from '../../../types/cloudProvider.types.js';
import { encrypt, decrypt } from '../../../utils/encryption.js';

export class GoogleDriveService implements CloudProvider {
  private oauth2Client: any;

  constructor(private accessToken: string, private refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.API_URL}/api/v1/oauth/google/callback`
    );
    
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  async listFiles(folderId?: string): Promise<CloudFile[]> {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    
    const response = await drive.files.list({
      q: folderId ? `'${folderId}' in parents` : undefined,
      fields: 'files(id,name,mimeType,size,modifiedTime,parents)',
      pageSize: 100,
    });

    return response.data.files?.map(file => ({
      id: file.id!,
      name: file.name!,
      type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
      size: file.size ? parseInt(file.size) : 0,
      modifiedAt: new Date(file.modifiedTime!),
      parentId: file.parents?.[0],
    })) || [];
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    
    const response = await drive.files.get({
      fileId,
      alt: 'media',
    }, { responseType: 'arraybuffer' });

    return Buffer.from(response.data as ArrayBuffer);
  }

  async refreshTokens(): Promise<{ accessToken: string; refreshToken?: string }> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token,
    };
  }
}
```

## 🔄 Error Handling

### Centralized Error Handler
```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Request error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
    });
  }

  // MongoDB duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        message: 'Resource already exists',
        code: 'DUPLICATE_RESOURCE',
      },
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid access token',
        code: 'INVALID_TOKEN',
      },
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
};
```

## 🧪 Testing Implementation

### Service Testing
```typescript
// tests/features/tenants/tenants.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TenantsService } from '../../../src/features/tenants/tenants.service.js';
import { connectToDatabase, closeDatabaseConnection } from '../../../src/config/db.js';

describe('TenantsService', () => {
  let service: TenantsService;
  
  beforeEach(async () => {
    await connectToDatabase();
    service = new TenantsService();
  });
  
  afterEach(async () => {
    await closeDatabaseConnection();
  });

  it('should create a tenant', async () => {
    const tenantData = {
      name: 'Test Tenant',
      description: 'Test Description',
      ownerId: 'test-user-id',
    };

    const tenant = await service.create(tenantData);
    
    expect(tenant).toBeDefined();
    expect(tenant.name).toBe(tenantData.name);
    expect(tenant.ownerId).toBe(tenantData.ownerId);
    expect(tenant._id).toBeDefined();
  });

  it('should throw error for duplicate tenant name', async () => {
    const tenantData = {
      name: 'Duplicate Tenant',
      ownerId: 'test-user-id',
    };

    await service.create(tenantData);
    
    await expect(service.create(tenantData)).rejects.toThrow('Tenant with this name already exists');
  });
});
```

### API Integration Testing
```typescript
// tests/integration/tenants.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { connectToDatabase, closeDatabaseConnection } from '../../src/config/db.js';

describe('Tenants API', () => {
  let authToken: string;

  beforeAll(async () => {
    await connectToDatabase();
    authToken = 'mock-jwt-token'; // In real tests, get from Auth0
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it('should create a tenant', async () => {
    const tenantData = {
      name: 'Test Tenant',
      description: 'Test Description',
    };

    const response = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${authToken}`)
      .send(tenantData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(tenantData.name);
  });

  it('should get tenant by id', async () => {
    // Create tenant first
    const createResponse = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Get Test Tenant' });

    const tenantId = createResponse.body.data._id;

    const response = await request(app)
      .get(`/api/v1/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(tenantId);
  });
});
```

## 📊 Monitoring and Logging

### Logging Configuration
```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mwap-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };
```

## 🚀 Performance Optimization

### Response Caching
```typescript
// middleware/cache.ts
import { Request, Response, NextFunction } from 'express';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const cacheMiddleware = (ttl: number = CACHE_TTL) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.originalUrl}`;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return res.json(cached.data);
    }
    
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, { data, timestamp: Date.now() });
      return originalJson.call(this, data);
    };
    
    next();
  };
};
```

## 🔧 Development Workflow

### Development Commands
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Environment Management
```bash
# Development
NODE_ENV=development npm run dev

# Testing
NODE_ENV=test npm test

# Production
NODE_ENV=production npm start
```

---

*This backend guide provides comprehensive coverage of MWAP's backend architecture, implementation patterns, and development practices for building a secure, scalable API.* 