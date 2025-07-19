# Express Server Structure

This document outlines the Express.js server organization and architecture for the MWAP backend.

## 🏗️ Server Architecture

### Core Files
```
src/
├── server.ts          # Server startup and initialization
├── app.ts             # Express app configuration and middleware
├── middleware/        # Authentication, authorization, error handling
├── features/          # Feature-based route modules
├── config/           # Environment and database configuration
└── utils/            # Shared utilities and helpers
```

### Bootstrap Sequence
```typescript
1. server.ts
   ├── Connect to MongoDB
   ├── Register routes (dynamic import)
   └── Start HTTP server

2. app.ts
   ├── Configure middleware stack
   ├── Export route registration function
   └── Handle 404/error responses
```

## 🔧 Middleware Stack

Applied in order:

```typescript
// Basic middleware
app.use(express.json());                    // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Security middleware
app.use(helmet());                          // Security headers
app.use(cors({ /* config */ }));           // CORS configuration
app.use(rateLimit({ /* config */ }));      // Rate limiting

// Health check (public)
app.get('/health', handler);               // System health endpoint

// Authentication (global)
app.use(authenticateJWT());                // JWT validation for all routes

// Documentation (protected)
app.use('/docs', getDocsRouter());         // API documentation

// API routes (registered dynamically)
await registerRoutes();                    // Feature-based API endpoints

// Error handling (final)
app.use(errorHandler);                     // Global error handler
```

## 📡 Route Organization

### Dynamic Route Registration
Routes are registered dynamically to prevent import cycles:

```typescript
export async function registerRoutes(): Promise<void> {
  // Dynamic imports prevent circular dependencies
  const { getTenantRouter } = await import('./features/tenants/tenants.routes');
  const { getProjectsRouter } = await import('./features/projects/projects.routes');
  
  // Register with base paths
  app.use('/api/v1/tenants', getTenantRouter());
  app.use('/api/v1/projects', getProjectsRouter());
}
```

### API Endpoints
```
/health                           # Public health check
/docs                            # Protected API documentation
/api/v1/tenants                  # Tenant management
/api/v1/projects                 # Project management
/api/v1/project-types            # Project type configuration (admin)
/api/v1/cloud-providers          # Cloud provider management (admin)
/api/v1/users                    # User information
/api/v1/oauth                    # OAuth callback handling
/api/v1/openapi                  # OpenAPI specification
```

## 🔐 Security Model

### Authentication
- **Global JWT middleware** validates all API requests
- **Public endpoints**: `/health` only
- **Protected endpoints**: All `/api/v1/*` routes

### Authorization
- **Route-level**: Middleware applied per endpoint
- **Resource-level**: Ownership and role validation
- **Feature-level**: Admin vs user access patterns

## 🏭 Feature Module Pattern

Each feature follows consistent structure:

```
src/features/tenants/
├── tenants.routes.ts      # Express router configuration
├── tenants.controller.ts  # Request/response handling
├── tenants.service.ts     # Business logic
└── tenants.types.ts       # TypeScript interfaces
```

### Route Module Template
```typescript
export function getFeatureRouter(): Router {
  const router = Router();
  
  // Authentication applied globally in app.ts
  
  // Public routes (JWT required)
  router.get('/', wrapAsyncHandler(getItems));
  
  // Role-restricted routes
  router.post('/', requireRole('ADMIN'), wrapAsyncHandler(createItem));
  
  return router;
}
```

## 🛠️ Development Patterns

### Error Handling
```typescript
// Async wrapper for route handlers
router.get('/', wrapAsyncHandler(async (req, res) => {
  const data = await service.getData();
  return jsonResponse(res, 200, data);
}));

// Global error handler catches all thrown errors
app.use(errorHandler);
```

### Logging
```typescript
import { logInfo, logError } from '../utils/logger';

// Structured logging throughout application
logInfo('Route accessed', { 
  endpoint: req.path, 
  userId: user.sub 
});
```

### Response Format
```typescript
// Consistent API responses
return jsonResponse(res, 200, data);     // Success
return errorResponse(res, 400, message); // Error
```

## 🚀 Production Considerations

### Performance
- **Rate limiting**: 100 requests/15min per IP
- **JSON size limits**: Default Express limits
- **Route caching**: None (stateless design)

### Security
- **Helmet.js**: Security headers
- **CORS**: Configurable origins
- **JWT validation**: RS256 with JWKS
- **Input validation**: Zod schemas

### Monitoring
- **Health endpoint**: `/health` for load balancers
- **Structured logging**: JSON format for aggregation
- **Error tracking**: Centralized error handling

---

*This structure supports feature-based development with consistent patterns and robust security.* 