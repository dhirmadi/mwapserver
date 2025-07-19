# Phase 1: OpenAPI Implementation Audit

## Task 1: Current OpenAPI Implementation Analysis

### Current Structure (`/src/docs/api-docs.ts`)
- **OpenAPI Version**: 3.0.3 (needs upgrade to 3.1.0)
- **Manual Specification**: Hardcoded paths and schemas
- **Coverage**: Limited to basic CRUD operations

### Documented Endpoints
✅ **Tenants**
- `GET /api/v1/tenants` - List all tenants
- `POST /api/v1/tenants` - Create tenant
- `GET /api/v1/tenants/me` - Get current user's tenant
- `GET /api/v1/tenants/{id}` - Get tenant by ID
- `PATCH /api/v1/tenants/{id}` - Update tenant
- `DELETE /api/v1/tenants/{id}` - Delete tenant

✅ **Projects**
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project

✅ **Project Types**
- `GET /api/v1/project-types` - List project types

✅ **Cloud Providers**
- `GET /api/v1/cloud-providers` - List cloud providers

✅ **Cloud Provider Integrations**
- `GET /api/v1/cloud-provider-integrations` - List integrations

### Missing Endpoints (Gap Analysis)

❌ **Projects** (Missing routes from `projects.routes.ts`)
- `GET /api/v1/projects/{id}` - Get project by ID
- `PATCH /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project
- `GET /api/v1/projects/{id}/members` - Get project members
- `POST /api/v1/projects/{id}/members` - Add project member
- `PATCH /api/v1/projects/{id}/members/{userId}` - Update project member
- `DELETE /api/v1/projects/{id}/members/{userId}` - Remove project member
- `GET /api/v1/projects/{id}/files` - File management routes

❌ **Users** (Completely missing from `user.routes.ts`)
- All user management endpoints

❌ **OAuth** (Completely missing from `oauth.routes.ts`)
- All OAuth flow endpoints

❌ **Files** (Completely missing from `files.routes.ts`)
- All file management endpoints

❌ **Tenant Cloud Integrations** (Nested routes)
- `GET /api/v1/tenants/{tenantId}/integrations`
- `POST /api/v1/tenants/{tenantId}/integrations`
- And other integration management routes

### Authentication Flow Analysis
- **Method**: JWT with Auth0 RS256
- **Middleware**: `authenticateJWT()` applied globally in `app.ts`
- **Authorization**: Role-based with `requireProjectRole()`, `requireSuperAdminRole()`, etc.
- **Current Docs**: Basic `bearerAuth` security scheme defined

### Zod Schema Mapping

✅ **Available Schemas** (`/src/schemas/`)
- `tenant.schema.ts` - Complete with create/update/response schemas
- `project.schema.ts` - Available
- `projectType.schema.ts` - Available
- `cloudProvider.schema.ts` - Available
- `cloudProviderIntegration.schema.ts` - Available
- `file.schema.ts` - Available
- `user.schema.ts` - Available

### Current Schema Coverage in OpenAPI
- **Tenant**: Partially covered (missing settings, archived fields)
- **Project**: Basic coverage (missing member relationships)
- **ProjectType**: Basic coverage
- **CloudProvider**: Basic coverage
- **CloudProviderIntegration**: Basic coverage
- **User**: Not covered
- **File**: Not covered

## Task 2: Route Discovery Architecture Design

### Proposed `RouteDiscoveryService` Interface
```typescript
interface RouteMetadata {
  path: string;
  method: string;
  feature: string;
  middleware: string[];
  handler: string;
  swaggerDoc?: any;
}

interface RouteDiscoveryService {
  scanRoutes(): Promise<RouteMetadata[]>;
  extractMiddleware(route: any): string[];
  groupByFeature(routes: RouteMetadata[]): Record<string, RouteMetadata[]>;
}
```

### Current Router Structure Analysis
- **Pattern**: Feature-based routers (`getTenantRouter()`, `getProjectsRouter()`, etc.)
- **Registration**: Dynamic in `registerRoutes()` function
- **Middleware**: Applied at router level and individual route level
- **Features**: tenants, projects, project-types, cloud-providers, users, oauth, files

### Metadata Extraction Strategy
1. **Static Analysis**: Parse route files to extract path patterns
2. **Runtime Inspection**: Hook into Express router registration
3. **Swagger Comments**: Extract existing JSDoc comments
4. **Middleware Detection**: Identify auth/role requirements

## Task 3: Dependencies and Tools Research

### OpenAPI Generation Libraries
1. **swagger-jsdoc** - JSDoc to OpenAPI conversion
2. **@apidevtools/swagger-parser** - OpenAPI validation and parsing
3. **express-openapi-validator** - Request/response validation
4. **swagger-ui-express** - Already in use for `/docs` endpoint

### Zod-to-OpenAPI Conversion
1. **@asteasolutions/zod-to-openapi** - Direct Zod schema conversion
2. **zod-openapi** - Alternative conversion library
3. **Custom converter** - Build tailored solution

### Caching Strategy Design
- **TTL**: Configurable (default 5 minutes in development, 1 hour in production)
- **Storage**: In-memory with optional Redis support
- **Invalidation**: Manual trigger + automatic on schema changes
- **Performance**: Lazy generation on first request

### Error Handling Approach
- **Follow existing patterns**: Use `AppError` class
- **Error codes**: Consistent with current API error responses
- **Logging**: Integrate with existing logger utility
- **Fallback**: Graceful degradation if generation fails

## Recommendations for Phase 2

1. **Start with RouteDiscoveryService** - Foundation for all other services
2. **Implement Zod-to-OpenAPI conversion** - Leverage existing schemas
3. **Build incremental generation** - Feature by feature approach
4. **Maintain backward compatibility** - Don't break existing `/docs` endpoint
5. **Add comprehensive testing** - Unit tests for each service component

## Security Considerations

- **Authentication required** for all OpenAPI endpoints
- **No sensitive data exposure** in generated documentation
- **Rate limiting** on documentation endpoints
- **Audit logging** for documentation access