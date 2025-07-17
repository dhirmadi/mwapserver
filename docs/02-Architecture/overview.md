# MWAP Architecture Overview

This document provides a high-level overview of the MWAP (Modular Web Application Platform) architecture, focusing on the key components, design decisions, and architectural patterns.

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

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│              (React/Next.js - Future)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/REST API
┌─────────────────────▼───────────────────────────────────────┐
│                   API Gateway                              │
│         Express.js + Security Middleware                   │
├─────────────────────────────────────────────────────────────┤
│  JWT Auth  │  CORS  │  Rate Limit  │  Validation  │  Logs  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Business Logic Layer                        │
│                 Feature Modules                            │
├─────────────────────────────────────────────────────────────┤
│  Tenants  │  Projects  │  Users  │  Files  │  OAuth  │ ... │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Data Layer                                │
│  MongoDB Atlas  │  Auth0  │  Cloud APIs  │  Encryption    │
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

### Inter-Domain Communication

```typescript
// Service-to-service communication pattern
export class ProjectService {
  constructor(
    private tenantService: TenantService,
    private userService: UserService
  ) {}
  
  async createProject(data: CreateProjectRequest, userId: string): Promise<Project> {
    // Validate tenant ownership
    const tenant = await this.tenantService.findByOwnerId(userId);
    if (!tenant) {
      throw new ForbiddenError('User must own a tenant to create projects');
    }
    
    // Create project with tenant context
    return await this.createProjectForTenant(data, tenant.id);
  }
}
```

## 🔐 Security Architecture

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

### Error Handling Flow

```
1. Error Occurs → Custom Error Class
2. Error Propagation → Service → Controller
3. Global Error Handler → Error Processing
4. Error Logging → Structured Logs
5. Error Response → Sanitized Client Response
```

### Example Request Flow

```typescript
// 1. Route Definition
router.post('/api/v1/projects', 
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

## 🚀 Scalability Considerations

### Horizontal Scaling

**Stateless Design:**
- No server-side sessions
- JWT tokens for authentication state
- Database connection pooling
- Load balancer compatibility

**Database Scaling:**
- MongoDB Atlas auto-scaling
- Read replicas for read-heavy operations
- Sharding strategy for large datasets
- Connection optimization

### Performance Optimization

**Caching Strategy:**
- JWT token validation caching
- Database query result caching
- Static asset optimization
- Response compression

**Async Processing:**
- Background job processing
- Event-driven architecture
- Non-blocking I/O operations
- Parallel processing where possible

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