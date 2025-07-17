# MWAP System Design

This document provides a comprehensive overview of the MWAP system architecture, design patterns, and implementation details.

## 🏗️ High-Level Architecture

MWAP follows a modular, domain-driven architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│                 (Web, Mobile, Desktop)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/REST API
┌─────────────────────▼───────────────────────────────────────┐
│                   API Gateway                              │
│              (Express.js + Middleware)                     │
├─────────────────────────────────────────────────────────────┤
│  Auth Middleware  │  CORS  │  Rate Limiting  │  Validation │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Feature Modules                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Tenants   │ │  Projects   │ │   Cloud Integrations    │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │    Users    │ │    Files    │ │    Project Types        │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Data Layer                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │  MongoDB Atlas  │ │   Auth0 JWT     │ │ Cloud Provider│ │
│  │   (Primary DB)  │ │ (Authentication)│ │     APIs      │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🧱 Core Components

### 1. API Gateway Layer

**Express.js Application** (`src/app.ts`)
- Request routing and middleware orchestration
- Global error handling
- Security headers and CORS configuration
- Rate limiting and request validation

**Key Middleware Stack:**
```typescript
app.use(express.json());           // JSON parsing
app.use(helmet());                 // Security headers
app.use(cors());                   // Cross-origin requests
app.use(rateLimit());             // Rate limiting
app.use(authenticateJWT());       // JWT authentication
```

### 2. Feature Modules

Each feature follows a consistent structure:

```
src/features/{feature}/
├── {feature}.routes.ts      # Express routes
├── {feature}.controller.ts  # Request handlers
├── {feature}.service.ts     # Business logic
└── {feature}.types.ts       # TypeScript types
```

**Current Features:**
- **Tenants**: Multi-tenant organization management
- **Users**: User roles and permissions
- **Projects**: Project lifecycle and member management
- **Project Types**: Dynamic project type configuration
- **Cloud Providers**: Cloud service provider management
- **Cloud Integrations**: OAuth-based cloud connections
- **Files**: Virtual file system with cloud storage
- **OAuth**: OAuth 2.0 flow handling

### 3. Authentication & Authorization

**Auth0 Integration:**
- JWT token validation with RS256 signatures
- JWKS endpoint for public key retrieval
- Role-based access control (RBAC)
- Multi-factor authentication support

**Authorization Middleware:**
```typescript
// Role-based middleware
requireSuperAdminRole()           // System administrators
requireTenantOwner()              // Tenant owners
requireProjectRole('OWNER')       // Project-specific roles
```

### 4. Data Layer

**MongoDB Atlas:**
- Document-based storage with flexible schemas
- Field-level encryption for sensitive data
- Automatic scaling and backup
- Connection pooling and optimization

**Schema Validation:**
- Zod schemas for runtime validation
- TypeScript types for compile-time safety
- Consistent data models across features

## 🔄 Request Flow

### Typical API Request Flow

1. **Request Reception**
   ```
   Client → Express Router → Middleware Stack
   ```

2. **Authentication & Authorization**
   ```
   JWT Validation → Role Checking → Permission Verification
   ```

3. **Request Processing**
   ```
   Route Handler → Controller → Service → Database
   ```

4. **Response Generation**
   ```
   Database → Service → Controller → Response Formatter → Client
   ```

### Example: Create Project Flow

```typescript
// 1. Route Definition
router.post('/', wrapAsyncHandler(createProject));

// 2. Authentication (Global Middleware)
authenticateJWT() // Validates JWT token

// 3. Controller
async function createProject(req: Request, res: Response) {
  // 4. Input Validation
  const data = CreateProjectSchema.parse(req.body);
  
  // 5. Authorization Check
  await requireTenantOwner(req.auth.sub);
  
  // 6. Business Logic
  const project = await projectService.create(data, req.auth.sub);
  
  // 7. Response
  res.json(SuccessResponse(project));
}
```

## 🔐 Security Architecture

### Zero Trust Model

**Principle**: Never trust, always verify
- Every request requires authentication
- Authorization checked at multiple levels
- Sensitive data encrypted at rest and in transit

### Security Layers

1. **Network Security**
   - HTTPS enforcement
   - CORS configuration
   - Rate limiting per IP

2. **Authentication**
   - Auth0 JWT tokens
   - RS256 signature verification
   - Token expiration handling

3. **Authorization**
   - Role-based access control
   - Resource-level permissions
   - Tenant isolation

4. **Data Security**
   - MongoDB field-level encryption
   - Sensitive data masking
   - Audit logging

### Security Middleware Stack

```typescript
// Security headers
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
  origin: env.NODE_ENV === 'production' ? 'https://app.mwap.dev' : true,
  credentials: true
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

## 📊 Data Architecture

### Domain Model

**Core Entities:**
- **User**: Auth0 user with system roles
- **Tenant**: Organization/workspace container
- **Project**: Work unit within a tenant
- **ProjectType**: Template for project configuration
- **CloudProvider**: External service configuration
- **CloudIntegration**: Tenant-specific cloud connections
- **File**: Virtual file references from cloud storage

### Entity Relationships

```
User (1) ←→ (0..1) Tenant
Tenant (1) ←→ (*) Project
Project (*) ←→ (1) ProjectType
Tenant (1) ←→ (*) CloudIntegration
CloudIntegration (*) ←→ (1) CloudProvider
Project (1) ←→ (*) File
User (*) ←→ (*) Project (through ProjectMember)
```

### Data Consistency

**ACID Properties:**
- MongoDB transactions for multi-document operations
- Optimistic concurrency control
- Data validation at multiple layers
- Referential integrity through application logic

## 🚀 Scalability Design

### Horizontal Scaling

**Stateless Architecture:**
- No server-side session storage
- JWT tokens for authentication state
- Database connection pooling
- Load balancer ready

**Database Scaling:**
- MongoDB Atlas auto-scaling
- Read replicas for read-heavy operations
- Sharding strategy for large datasets
- Connection pooling and optimization

### Performance Optimization

**Caching Strategy:**
- JWT token caching
- Database query optimization
- Response compression
- Static asset optimization

**Monitoring & Observability:**
- Structured logging with correlation IDs
- Performance metrics collection
- Error tracking and alerting
- Health check endpoints

## 🔧 Development Patterns

### Error Handling

**Centralized Error Management:**
```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

// Global error handler
app.use(errorHandler);
```

### Response Formatting

**Consistent API Responses:**
```typescript
// Success response
function SuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message
  };
}

// Error response
function ErrorResponse(error: AppError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message
    }
  };
}
```

### Validation Strategy

**Schema-First Development:**
```typescript
// Zod schema definition
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  projectTypeId: z.string().uuid(),
  config: z.record(z.any()).optional()
});

// Type inference
type CreateProjectRequest = z.infer<typeof CreateProjectSchema>;

// Runtime validation
const data = CreateProjectSchema.parse(req.body);
```

## 🔄 Integration Patterns

### OAuth 2.0 Flow

**Authorization Code Flow:**
1. Client redirects to provider authorization URL
2. User grants permission
3. Provider redirects to callback with authorization code
4. Backend exchanges code for access/refresh tokens
5. Tokens stored encrypted in database
6. Tokens used for API calls to cloud providers

### Cloud Provider Integration

**Abstraction Layer:**
```typescript
interface CloudProvider {
  listFiles(accessToken: string): Promise<File[]>;
  downloadFile(accessToken: string, fileId: string): Promise<Buffer>;
  uploadFile(accessToken: string, file: Buffer, name: string): Promise<File>;
}

// Provider-specific implementations
class GoogleDriveProvider implements CloudProvider { ... }
class DropboxProvider implements CloudProvider { ... }
class OneDriveProvider implements CloudProvider { ... }
```

## 📈 Monitoring & Observability

### Logging Strategy

**Structured Logging:**
```typescript
logger.info('User action', {
  userId: req.auth.sub,
  action: 'create_project',
  projectId: project.id,
  tenantId: project.tenantId,
  timestamp: new Date().toISOString()
});
```

### Health Checks

**System Health Monitoring:**
- Database connectivity
- External service availability
- Memory and CPU usage
- Response time metrics

### Error Tracking

**Comprehensive Error Monitoring:**
- Application errors with stack traces
- Database connection issues
- External API failures
- Performance bottlenecks

## 🔮 Future Architecture Considerations

### Microservices Evolution

**Potential Service Boundaries:**
- Authentication Service
- Tenant Management Service
- Project Management Service
- File Management Service
- Integration Service

### Event-Driven Architecture

**Event Sourcing Opportunities:**
- User activity tracking
- Project state changes
- Integration status updates
- File operation events

### Caching Layer

**Redis Integration:**
- Session storage
- Frequently accessed data
- Rate limiting counters
- Background job queues

---
*This system design reflects the current MWAP architecture and provides guidance for future development and scaling decisions.*