# MWAP Architecture

This document provides a comprehensive overview of the MWAP (Modular Web Application Platform) architecture, covering design principles, system components, and implementation details.

## 🎯 Architecture Goals

### Primary Objectives

1. **Scalability**: Support horizontal scaling and multi-tenant architecture
2. **Security**: Implement zero-trust security model with comprehensive authentication
3. **Modularity**: Enable independent development and deployment of features
4. **Maintainability**: Ensure clean, testable, and well-documented code
5. **Performance**: Optimize for speed and efficiency at scale

### Design Principles

- **Domain-Driven Design**: Clear separation of business domains
- **API-First**: RESTful API design with comprehensive documentation
- **Type Safety**: TypeScript throughout the entire stack
- **Security by Default**: Authentication and authorization at every layer
- **Cloud-Native**: Built for cloud deployment and integration

## 🏗️ System Architecture

### High-Level Overview

MWAP follows a layered architecture with clear separation of concerns:

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

### Technology Stack

**Backend Runtime:**
- **Node.js 20+**: JavaScript runtime with native ESM support
- **Express.js**: Web application framework
- **TypeScript**: Type-safe JavaScript with strict mode

**Database & Storage:**
- **MongoDB Atlas**: Cloud-native NoSQL database
- **Field-Level Encryption**: Sensitive data protection
- **Connection Pooling**: Optimized database connections

**Authentication & Security:**
- **Auth0**: Enterprise authentication service
- **JWT (RS256)**: JSON Web Tokens with RSA signatures
- **RBAC**: Role-based access control
- **Zero Trust**: Security at every layer

**Cloud Integration:**
- **OAuth 2.0**: Authorization framework
- **Google Drive API**: Google cloud storage
- **Dropbox API**: Dropbox cloud storage
- **OneDrive API**: Microsoft cloud storage

## 📁 Project Structure

### Core Application Structure
```
src/
├── app.ts                 # Main application entry point
├── server.ts             # Server configuration and startup
├── config/               # Configuration management
│   ├── db.ts            # Database connection setup
│   ├── auth0.ts         # Auth0 configuration
│   └── env.ts           # Environment variable validation
├── features/            # Feature-based organization
│   ├── tenants/         # Tenant management
│   ├── projects/        # Project operations
│   ├── cloud-providers/ # Cloud provider management
│   ├── cloud-integrations/ # OAuth integrations
│   ├── files/           # Virtual file operations
│   ├── oauth/           # OAuth callback handling
│   └── users/           # User management
├── middleware/          # Cross-cutting concerns
│   ├── auth.ts          # Authentication middleware
│   ├── authorization.ts # Authorization middleware
│   ├── errorHandler.ts  # Error handling middleware
│   └── roles.ts         # Role-based access control
├── schemas/             # Data validation schemas
│   ├── tenant.schema.ts
│   ├── project.schema.ts
│   ├── cloudProvider.schema.ts
│   └── user.schema.ts
└── utils/               # Shared utilities
    ├── auth.ts          # Authentication utilities
    ├── errors.ts        # Custom error classes
    ├── logger.ts        # Logging utilities
    ├── response.ts      # Response formatting
    └── validate.ts      # Validation utilities
```

## 🔧 Feature Architecture

### Domain-Driven Structure

Each feature is organized as an independent domain module:

```
src/features/{domain}/
├── {domain}.routes.ts      # Express route definitions
├── {domain}.controller.ts  # HTTP request handlers
├── {domain}.service.ts     # Business logic implementation
└── {domain}.types.ts       # TypeScript type definitions
```

### Current Domains

1. **Tenants**: Multi-tenant organization management
2. **Users**: User authentication and role management
3. **Projects**: Project lifecycle and collaboration
4. **Project Types**: Dynamic project configuration templates
5. **Cloud Providers**: External service provider management
6. **Cloud Integrations**: OAuth-based cloud connections
7. **Files**: Virtual file system with cloud storage
8. **OAuth**: OAuth 2.0 authorization flow handling

### Component Types and Responsibilities

#### Routes (`*.routes.ts`)
- **Purpose**: HTTP endpoint definitions
- **Responsibilities**:
  - URL pattern matching
  - HTTP method handling
  - Middleware application
  - Controller delegation

#### Controllers (`*.controller.ts`)
- **Purpose**: Request/response coordination
- **Responsibilities**:
  - Request parameter extraction
  - Input validation (Zod schemas)
  - Service method invocation
  - Response formatting
  - Error handling

#### Services (`*.service.ts`)
- **Purpose**: Business logic implementation
- **Responsibilities**:
  - Domain-specific operations
  - Data validation and transformation
  - Database operations
  - External service integration
  - Business rule enforcement

## 🔄 Request Processing Flow

### Typical API Request Lifecycle

```
1. HTTP Request → Express Router
2. Security Middleware → JWT Validation
3. Authorization Middleware → Role/Permission Check
4. Route Handler → Controller Function
5. Input Validation → Zod Schema Validation
6. Business Logic → Service Layer
7. Data Access → Database Operations
8. Response Formatting → Standardized JSON
9. HTTP Response → Client
```

### Example: Create Project Flow

```typescript
// 1. Route Definition
router.post('/', 
  authenticateJWT(),                    // 2. Authentication
  requireTenantOwner(),                 // 3. Authorization
  wrapAsyncHandler(createProject)       // 4. Error handling wrapper
);

// 5. Controller
export async function createProject(req: Request, res: Response) {
  // 6. Input validation
  const data = CreateProjectSchema.parse(req.body);
  
  // 7. Business logic
  const project = await projectService.create(data, req.auth.sub);
  
  // 8. Response formatting
  res.status(201).json(SuccessResponse(project));
}

// 9. Service layer
export class ProjectService {
  async create(data: CreateProjectRequest, userId: string): Promise<Project> {
    // 10. Database operations
    const project = await this.collection.insertOne({
      id: generateId(),
      ...data,
      ownerId: userId,
      createdAt: new Date()
    });
    
    return project;
  }
}
```

## 🔐 Security Architecture

### Zero Trust Model

**Principle**: Never trust, always verify
- Every request requires authentication
- Authorization checked at multiple levels
- Sensitive data encrypted at rest and in transit

### Authentication Flow

```
1. Client → Auth0 Login
2. Auth0 → JWT Token (RS256)
3. Client → API Request + JWT
4. API → JWT Validation (JWKS)
5. API → Role/Permission Check
6. API → Business Logic
7. API → Response
```

### Authorization Layers

**1. Route-Level Authorization:**
```typescript
router.post('/projects', 
  authenticateJWT(),           // Verify JWT token
  requireTenantOwner(),        // Check tenant ownership
  wrapAsyncHandler(createProject)
);
```

**2. Resource-Level Authorization:**
```typescript
export async function getProject(req: Request, res: Response) {
  const project = await projectService.findById(req.params.id);
  
  // Check if user has access to this project
  if (!await hasProjectAccess(req.auth.sub, project.id)) {
    throw new ForbiddenError('Access denied to project');
  }
  
  res.json(SuccessResponse(project));
}
```

**3. Data-Level Security:**
```typescript
// Tenant isolation in database queries
async findProjectsByUser(userId: string): Promise<Project[]> {
  const userTenant = await this.getUserTenant(userId);
  
  return await this.collection.find({
    tenantId: userTenant.id,  // Automatic tenant isolation
    members: { $in: [userId] }
  }).toArray();
}
```

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

### Entity Relationships

```
User (Auth0) ←→ Tenant (1:1)
Tenant ←→ Projects (1:many)
Project ←→ ProjectType (many:1)
Project ←→ ProjectMembers (1:many)
Project ←→ Files (1:many)
Tenant ←→ CloudIntegrations (1:many)
CloudIntegration ←→ CloudProvider (many:1)
```

### Data Flow Patterns

**1. Command Pattern (Write Operations):**
```typescript
// Create → Validate → Transform → Store → Audit
export async function createTenant(data: CreateTenantRequest, userId: string): Promise<Tenant> {
  // 1. Validate input
  const validatedData = CreateTenantSchema.parse(data);
  
  // 2. Business rules validation
  await this.validateTenantCreation(userId);
  
  // 3. Transform and enrich
  const tenant: Tenant = {
    id: generateId(),
    ...validatedData,
    ownerId: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // 4. Store in database
  await this.collection.insertOne(tenant);
  
  // 5. Audit logging
  await this.auditLogger.log('tenant_created', userId, tenant.id);
  
  return tenant;
}
```

**2. Query Pattern (Read Operations):**
```typescript
// Query → Filter → Transform → Return
export async function getProjectsForUser(userId: string): Promise<Project[]> {
  // 1. Query with security filters
  const projects = await this.collection.find({
    $or: [
      { ownerId: userId },
      { 'members.userId': userId }
    ],
    archived: { $ne: true }
  }).toArray();
  
  // 2. Transform for API response
  return projects.map(this.sanitizeProject);
}
```

### Data Consistency

**ACID Properties:**
- MongoDB transactions for multi-document operations
- Optimistic concurrency control
- Data validation at multiple layers
- Referential integrity through application logic

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

## 🔍 Monitoring & Observability

### Logging Architecture

```typescript
// Structured logging with correlation IDs
logger.info('User action', {
  correlationId: req.correlationId,
  userId: req.auth.sub,
  action: 'create_project',
  projectId: project.id,
  duration: Date.now() - req.startTime,
  success: true
});
```

### Health Monitoring

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime()
  });
});
```

### Error Tracking

```typescript
// Comprehensive error logging
logger.error('Database operation failed', {
  error: error.message,
  stack: error.stack,
  operation: 'user_creation',
  userId: req.auth?.sub,
  requestId: req.id
});
```

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

## 🔮 Future Architecture Evolution

### Microservices Migration Path

**Phase 1: Modular Monolith** (Current)
- Feature-based modules
- Shared database
- Single deployment unit

**Phase 2: Service Extraction**
- Extract high-traffic features
- Separate databases per service
- API gateway for routing

**Phase 3: Full Microservices**
- Independent services
- Event-driven communication
- Container orchestration

### Technology Evolution

**Near-term Enhancements:**
- Redis for caching and sessions
- Message queues for background processing
- Real-time features with WebSockets
- Enhanced monitoring and alerting

**Long-term Considerations:**
- GraphQL API layer
- Event sourcing for audit trails
- CQRS for read/write separation
- Multi-region deployment

---
*This architecture overview provides the foundation for understanding and contributing to the MWAP platform. It serves as a guide for architectural decisions and system evolution.* 