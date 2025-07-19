# API Configuration Guide

This document provides comprehensive guidance for configuring, customizing, and managing the MWAP API including OpenAPI documentation generation, validation, and deployment.

## 🏗️ API Architecture Overview

### Core Components
```
MWAP API Stack:
├── Express.js Router System
├── Dynamic Route Discovery
├── OpenAPI 3.1.0 Generation
├── Zod Schema Validation
├── Auth0 JWT Authentication
├── Role-Based Authorization
└── Structured Error Handling
```

### Request Lifecycle
```
Request → JWT Auth → Role Check → Validation → Controller → Service → Database → Response
```

## ⚙️ OpenAPI Configuration

### Dynamic Documentation Generation
```typescript
// src/services/openapi/OpenAPIService.ts
export class OpenAPIService {
  private cachedDocument: any = null;
  private cacheTimestamp: number = 0;
  private readonly cacheTTL = process.env.NODE_ENV === 'production' 
    ? 3600000   // 1 hour in production
    : 300000;   // 5 minutes in development

  async generateDocument(): Promise<any> {
    // Check cache validity
    const now = Date.now();
    if (this.cachedDocument && (now - this.cacheTimestamp) < this.cacheTTL) {
      return this.cachedDocument;
    }

    // Generate fresh documentation
    const routes = await routeDiscoveryService.scanRoutes();
    const document = await openAPIDocumentBuilder.buildDocument(routes);
    
    // Cache result
    this.cachedDocument = document;
    this.cacheTimestamp = now;
    
    return document;
  }
}
```

### Route Discovery Configuration
```typescript
// src/services/openapi/RouteDiscoveryService.ts
export class RouteDiscoveryServiceImpl {
  private readonly featureModules = [
    'tenants',
    'projects', 
    'project-types',
    'cloud-providers',
    'cloud-integrations',
    'users',
    'oauth',
    'files'
  ];

  private readonly basePaths: Record<string, string> = {
    'tenants': '/api/v1/tenants',
    'projects': '/api/v1/projects',
    'project-types': '/api/v1/project-types',
    'cloud-providers': '/api/v1/cloud-providers',
    'cloud-integrations': '/api/v1/tenants/:tenantId/integrations',
    'users': '/api/v1/users',
    'oauth': '/api/v1/oauth',
    'files': '/api/v1/projects/:id/files'
  };

  // Automatically discover routes from feature modules
  async scanRoutes(): Promise<RouteMetadata[]> {
    const allRoutes: RouteMetadata[] = [];

    for (const feature of this.featureModules) {
      const routes = await this.scanFeatureRoutes(feature);
      allRoutes.push(...routes);
    }

    return allRoutes;
  }
}
```

### OpenAPI Document Structure
```typescript
// Generated OpenAPI Document Structure
const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'MWAP API',
    version: '1.0.0',
    description: 'Modular Web Application Platform API',
    contact: {
      name: 'MWAP Team',
      url: 'https://github.com/dhirmadi/mwapserver',
      email: 'support@mwap.dev'
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    }
  },
  servers: [
    {
      url: env.NODE_ENV === 'production' 
        ? 'https://api.mwap.dev' 
        : 'http://localhost:3001',
      description: `${env.NODE_ENV} server`
    }
  ],
  security: [{ bearerAuth: [] }],
  paths: {}, // Dynamically generated
  components: {
    schemas: {}, // From Zod schemas
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};
```

## 📋 Schema Configuration

### Zod Schema Registration
```typescript
// src/services/openapi/SchemaGenerationService.ts
export class SchemaGenerationServiceImpl {
  private async registerAllSchemas(): Promise<void> {
    // Tenant schemas
    this.registry.register('Tenant', tenantResponseSchema.openapi('Tenant'));
    this.registry.register('CreateTenant', createTenantSchema.openapi('CreateTenant'));
    this.registry.register('UpdateTenant', updateTenantSchema.openapi('UpdateTenant'));

    // Project schemas
    this.registry.register('Project', projectSchema.openapi('Project'));
    this.registry.register('CreateProject', createProjectSchema.openapi('CreateProject'));
    this.registry.register('UpdateProject', updateProjectSchema.openapi('UpdateProject'));

    // Cloud Provider schemas
    this.registry.register('CloudProvider', cloudProviderSchema.openapi('CloudProvider'));
    this.registry.register('CreateCloudProvider', createCloudProviderSchema.openapi('CreateCloudProvider'));

    // Add other schemas...
  }
}
```

### Custom Schema Configuration
```typescript
// src/schemas/custom.schema.ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Custom response wrapper schema
export const apiResponseSchema = z.object({
  success: z.boolean().describe('Indicates if the request was successful'),
  data: z.any().optional().describe('Response data when successful'),
  error: z.object({
    code: z.string().describe('Error code for programmatic handling'),
    message: z.string().describe('Human-readable error message'),
    details: z.any().optional().describe('Additional error details')
  }).optional().describe('Error information when request fails')
}).openapi('ApiResponse');

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1).describe('Current page number'),
  limit: z.number().min(1).max(100).default(20).describe('Items per page'),
  total: z.number().describe('Total number of items'),
  totalPages: z.number().describe('Total number of pages'),
  hasNext: z.boolean().describe('Whether there are more pages'),
  hasPrev: z.boolean().describe('Whether there are previous pages')
}).openapi('Pagination');

// Paginated response schema
export const paginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(dataSchema),
    pagination: paginationSchema
  }).openapi('PaginatedResponse');
```

## 🔐 Authentication Configuration

### JWT Configuration
```typescript
// src/config/auth0.ts
export const auth0Config = {
  domain: env.AUTH0_DOMAIN,
  audience: env.AUTH0_AUDIENCE,
  algorithms: ['RS256'] as const,
  jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  
  // JWKS client configuration
  jwksClient: {
    rateLimit: true,
    cache: true,
    cacheMaxAge: 86400000, // 24 hours
    timeout: 10000 // 10 seconds
  },
  
  // JWT verification options
  jwtOptions: {
    audience: env.AUTH0_AUDIENCE,
    issuer: `https://${env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
    clockTolerance: 60 // Allow 60 seconds clock skew
  }
};
```

### Security Scheme Configuration
```typescript
// OpenAPI Security Schemes
const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token obtained from Auth0'
  },
  superAdminRole: {
    type: 'apiKey',
    in: 'header',
    name: 'X-Super-Admin',
    description: 'Requires SuperAdmin role'
  },
  tenantOwnerRole: {
    type: 'apiKey',
    in: 'header', 
    name: 'X-Tenant-Owner',
    description: 'Requires Tenant Owner role'
  },
  projectRole: {
    type: 'apiKey',
    in: 'header',
    name: 'X-Project-Role',
    description: 'Requires specific project role'
  }
};
```

## 🌐 API Endpoint Configuration

### Route Registration Pattern
```typescript
// src/features/example/example.routes.ts
export function getExampleRouter(): Router {
  const router = Router();
  
  // Authentication applied globally in app.ts
  
  // Public routes (authenticated users only)
  router.get('/', wrapAsyncHandler(getExamples));
  router.get('/:id', wrapAsyncHandler(getExampleById));
  
  // Role-restricted routes
  router.post('/', requireTenantOwner(), wrapAsyncHandler(createExample));
  router.patch('/:id', requireProjectRole('DEPUTY'), wrapAsyncHandler(updateExample));
  router.delete('/:id', requireSuperAdminRole(), wrapAsyncHandler(deleteExample));
  
  return router;
}
```

### Controller Configuration
```typescript
// src/features/example/example.controller.ts
import { validateWithSchema } from '../../utils/validate.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';

export async function createExample(req: Request, res: Response) {
  // Extract authenticated user
  const user = getUserFromToken(req);
  
  // Validate request body
  const data = validateWithSchema(createExampleSchema, req.body);
  
  // Process business logic
  const result = await exampleService.create(data, user.sub);
  
  // Return standardized response
  return jsonResponse(res, 201, result);
}
```

## 📊 Validation Configuration

### Request Validation
```typescript
// src/utils/validate.ts
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new ApiError(
        'Validation failed',
        400,
        'VALIDATION_ERROR'
      );
      
      // Add detailed validation errors
      validationError.details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      throw validationError;
    }
    throw error;
  }
}

// Middleware for query parameter validation
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = validateWithSchema(schema, req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware for request body validation
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = validateWithSchema(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### Response Validation (Development)
```typescript
// src/middleware/responseValidation.ts (Development only)
export const validateResponse = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (env.NODE_ENV !== 'development') {
      return next();
    }
    
    const originalJson = res.json;
    res.json = function(data: any) {
      try {
        validateWithSchema(schema, data);
      } catch (error) {
        logError('Response validation failed', {
          endpoint: req.originalUrl,
          method: req.method,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};
```

## 🚨 Error Handling Configuration

### Global Error Handler
```typescript
// src/middleware/errorHandler.ts
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logError('Request error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    user: req.user?.sub
  });
  
  // Handle different error types
  if (error instanceof ApiError) {
    return errorResponse(res, error.status, error.message, error.code, error.details);
  }
  
  if (error instanceof z.ZodError) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', {
      errors: error.errors
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return errorResponse(res, 401, 'Authentication required', 'AUTH_REQUIRED');
  }
  
  // Default server error
  return errorResponse(res, 500, 'Internal server error', 'INTERNAL_ERROR');
}
```

### Standardized Error Responses
```typescript
// src/utils/response.ts
export function errorResponse(
  res: Response,
  status: number,
  message: string,
  code?: string,
  details?: any
) {
  return res.status(status).json({
    success: false,
    error: {
      code: code || 'UNKNOWN_ERROR',
      message,
      ...(details && { details })
    }
  });
}

export function jsonResponse(res: Response, status: number, data: any) {
  return res.status(status).json({
    success: true,
    data
  });
}
```

## 📖 API Documentation Configuration

### Swagger UI Setup
```typescript
// src/docs/index.ts
import swaggerUi from 'swagger-ui-express';
import { openAPIService } from '../services/openapi/index.js';

export function getDocsRouter(): Router {
  const router = Router();
  
  // Security check for production
  if (env.NODE_ENV === 'production') {
    router.use((req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required to access API documentation'
        });
      }
      next();
    });
  }
  
  // Serve OpenAPI JSON
  router.get('/json', async (req, res) => {
    try {
      const document = await openAPIService.generateDocument();
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate API documentation' });
    }
  });
  
  // Serve Swagger UI
  router.use('/', swaggerUi.serve);
  router.get('/', async (req, res, next) => {
    try {
      const document = await openAPIService.generateDocument();
      const swaggerUiHtml = swaggerUi.generateHTML(document, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'MWAP API Documentation',
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          showExtensions: true,
          showCommonExtensions: true
        }
      });
      res.send(swaggerUiHtml);
    } catch (error) {
      next(error);
    }
  });
  
  return router;
}
```

### Documentation Security
```typescript
// Production documentation access control
const documentationAuth = (req: Request, res: Response, next: NextFunction) => {
  if (env.NODE_ENV === 'production') {
    // Check if user has appropriate role for documentation access
    const userRoles = getUserRoles(req.user?.sub);
    
    if (!userRoles.isSuperAdmin && !userRoles.isTenantOwner) {
      return res.status(403).json({
        error: 'Insufficient permissions to access API documentation'
      });
    }
  }
  
  next();
};
```

## 🔧 Environment-Specific Configuration

### Development Configuration
```typescript
// config/environments/development.ts
export const developmentConfig = {
  api: {
    enableDocumentation: true,
    enableResponseValidation: true,
    enableDetailedErrors: true,
    corsOrigins: ['http://localhost:3000', 'http://localhost:5173'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // Higher limit for development
    }
  },
  openapi: {
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes
    includeExamples: true,
    includeInternalRoutes: true
  },
  validation: {
    strictMode: true,
    validateResponses: true,
    logValidationErrors: true
  }
};
```

### Production Configuration
```typescript
// config/environments/production.ts
export const productionConfig = {
  api: {
    enableDocumentation: true, // But with authentication
    enableResponseValidation: false,
    enableDetailedErrors: false,
    corsOrigins: ['https://app.mwap.dev'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // Stricter limit for production
    }
  },
  openapi: {
    cacheEnabled: true,
    cacheTTL: 3600000, // 1 hour
    includeExamples: false,
    includeInternalRoutes: false
  },
  validation: {
    strictMode: true,
    validateResponses: false,
    logValidationErrors: false
  }
};
```

## 🧪 Testing Configuration

### API Testing Setup
```typescript
// tests/integration/api.test.ts
import request from 'supertest';
import { app } from '../src/app.js';

describe('API Configuration', () => {
  describe('OpenAPI Documentation', () => {
    it('should serve OpenAPI JSON', async () => {
      const response = await request(app)
        .get('/docs/json')
        .expect(200);
        
      expect(response.body.openapi).toBe('3.1.0');
      expect(response.body.info.title).toBe('MWAP API');
    });
    
    it('should validate generated schemas', async () => {
      const response = await request(app)
        .get('/docs/json')
        .expect(200);
        
      const document = response.body;
      
      // Validate that all referenced schemas exist
      for (const path of Object.values(document.paths)) {
        for (const operation of Object.values(path)) {
          // Validate request/response schema references
          expect(operation).toBeDefined();
        }
      }
    });
  });
  
  describe('Request Validation', () => {
    it('should validate request bodies', async () => {
      await request(app)
        .post('/api/v1/tenants')
        .send({ invalid: 'data' })
        .expect(400);
    });
    
    it('should validate query parameters', async () => {
      await request(app)
        .get('/api/v1/projects?page=invalid')
        .expect(400);
    });
  });
});
```

### Schema Validation Testing
```typescript
// tests/unit/schemas.test.ts
import { z } from 'zod';
import { createTenantSchema, tenantResponseSchema } from '../src/schemas/tenant.schema.js';

describe('Schema Validation', () => {
  describe('createTenantSchema', () => {
    it('should validate valid tenant data', () => {
      const validData = { name: 'Test Tenant' };
      expect(() => createTenantSchema.parse(validData)).not.toThrow();
    });
    
    it('should reject invalid tenant data', () => {
      const invalidData = { name: '' };
      expect(() => createTenantSchema.parse(invalidData)).toThrow();
    });
  });
  
  describe('tenantResponseSchema', () => {
    it('should validate complete tenant response', () => {
      const validResponse = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Tenant',
        ownerId: 'auth0|123',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(() => tenantResponseSchema.parse(validResponse)).not.toThrow();
    });
  });
});
```

## 🚀 Deployment Configuration

### Container Configuration
```dockerfile
# Dockerfile with API configuration
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Kubernetes Configuration
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mwap-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mwap-api
  template:
    metadata:
      labels:
        app: mwap-api
    spec:
      containers:
      - name: mwap-api
        image: mwap-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mwap-secrets
              key: mongodb-uri
        - name: AUTH0_DOMAIN
          valueFrom:
            configMapKeyRef:
              name: mwap-config
              key: auth0-domain
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 📊 Configuration Monitoring

### API Metrics Configuration
```typescript
// src/monitoring/ApiMetrics.ts
export class ApiMetrics {
  collectConfigurationMetrics() {
    return {
      routes: {
        total: this.getTotalRoutes(),
        byFeature: this.getRoutesByFeature(),
        authenticated: this.getAuthenticatedRoutes(),
        public: this.getPublicRoutes()
      },
      schemas: {
        total: this.getTotalSchemas(),
        validated: this.getValidatedEndpoints(),
        documented: this.getDocumentedEndpoints()
      },
      performance: {
        averageResponseTime: this.getAverageResponseTime(),
        errorRate: this.getErrorRate(),
        cacheHitRate: this.getCacheHitRate()
      }
    };
  }
}
```

## 📖 Related Documentation

- **[Express Server Structure](../04-Backend/express-structure.md)** - Server architecture overview
- **[Authentication Implementation](../04-Backend/auth0.md)** - JWT and Auth0 setup
- **[RBAC Implementation](../04-Backend/rbac.md)** - Role-based access control

---

*Proper API configuration ensures consistent, secure, and well-documented endpoints that are easy to maintain and scale.* 