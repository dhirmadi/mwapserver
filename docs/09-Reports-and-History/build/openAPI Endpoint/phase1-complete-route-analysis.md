# Complete Route Analysis - All MWAP API Endpoints

## Summary Statistics
- **Total Features**: 7 (tenants, projects, project-types, cloud-providers, cloud-integrations, users, oauth, files)
- **Total Routes**: 35+ endpoints
- **Documented in Current OpenAPI**: 11 endpoints (31% coverage)
- **Missing from Documentation**: 24+ endpoints (69% gap)

## Feature-by-Feature Analysis

### 1. Tenants (`/api/v1/tenants`)
**Base Path**: `/api/v1/tenants`
**Router**: `src/features/tenants/tenants.routes.ts`

#### ✅ Currently Documented
- `GET /` - List all tenants (superadmin only)
- `POST /` - Create tenant
- `GET /me` - Get current user's tenant
- `GET /:id` - Get tenant by ID
- `PATCH /:id` - Update tenant
- `DELETE /:id` - Delete tenant

#### ❌ Missing from Documentation
- `GET /:tenantId/integrations/*` - Cloud integrations (nested routes)
- `GET /:tenantId/cloud-integrations/*` - Backward compatibility routes

**Middleware Analysis**:
- Global JWT authentication
- `requireSuperAdminRole()` for admin operations
- `requireTenantOwnerOrSuperAdmin()` for tenant-specific operations

### 2. Projects (`/api/v1/projects`)
**Base Path**: `/api/v1/projects`
**Router**: `src/features/projects/projects.routes.ts`

#### ✅ Currently Documented
- `GET /` - List projects
- `POST /` - Create project

#### ❌ Missing from Documentation
- `GET /:id` - Get project by ID
- `PATCH /:id` - Update project (requires DEPUTY role)
- `DELETE /:id` - Delete project (requires OWNER role)
- `GET /:id/members` - Get project members (requires MEMBER role)
- `POST /:id/members` - Add project member (requires DEPUTY role)
- `PATCH /:id/members/:userId` - Update project member (requires OWNER role)
- `DELETE /:id/members/:userId` - Remove project member (requires OWNER role)
- `GET /:id/files` - File management (nested routes)

**Middleware Analysis**:
- JWT authentication applied at router level
- `requireProjectRole()` with different role levels (MEMBER, DEPUTY, OWNER)

### 3. Project Types (`/api/v1/project-types`)
**Base Path**: `/api/v1/project-types`
**Router**: `src/features/project-types/projectTypes.routes.ts`

#### ✅ Currently Documented
- `GET /` - List project types

#### ❌ Missing from Documentation
- `GET /:id` - Get project type by ID
- `POST /` - Create project type
- `PATCH /:id` - Update project type
- `DELETE /:id` - Delete project type

**Middleware Analysis**:
- Standard JWT authentication
- No specific role requirements (likely admin-only in controller)

### 4. Cloud Providers (`/api/v1/cloud-providers`)
**Base Path**: `/api/v1/cloud-providers`
**Router**: `src/features/cloud-providers/cloudProviders.routes.ts`

#### ✅ Currently Documented
- `GET /` - List cloud providers

#### ❌ Missing from Documentation
- `GET /:id` - Get cloud provider by ID
- `POST /` - Create cloud provider
- `PATCH /:id` - Update cloud provider
- `DELETE /:id` - Delete cloud provider

**Middleware Analysis**:
- Standard JWT authentication
- No specific role requirements (likely admin-only in controller)

### 5. Cloud Integrations (`/api/v1/tenants/:tenantId/integrations`)
**Base Path**: `/api/v1/tenants/:tenantId/integrations`
**Router**: `src/features/cloud-integrations/cloudIntegrations.routes.ts`

#### ✅ Currently Documented
- `GET /api/v1/cloud-provider-integrations` - List integrations (different endpoint!)

#### ❌ Missing from Documentation (All nested routes)
- `GET /` - Get tenant integrations
- `GET /:integrationId` - Get integration by ID
- `POST /` - Create tenant integration
- `PATCH /:integrationId` - Update integration
- `DELETE /:integrationId` - Delete integration
- `POST /:integrationId/refresh-token` - Refresh integration token
- `GET /:integrationId/health` - Check integration health

**Middleware Analysis**:
- Nested under tenant routes with tenant ownership checks
- Complex parameter passing for tenantId

### 6. Users (`/api/v1/users`)
**Base Path**: `/api/v1/users`
**Router**: `src/features/users/user.routes.ts`

#### ✅ Currently Documented
- None

#### ❌ Missing from Documentation
- `GET /me/roles` - Get current user's roles

**Middleware Analysis**:
- Standard JWT authentication
- Minimal routes (likely expanded in future)

### 7. OAuth (`/api/v1/oauth`)
**Base Path**: `/api/v1/oauth`
**Router**: `src/features/oauth/oauth.routes.ts`

#### ✅ Currently Documented
- None

#### ❌ Missing from Documentation
- `GET /callback` - OAuth callback handler (public endpoint)
- `POST /tenants/:tenantId/integrations/:integrationId/refresh` - Refresh integration tokens

**Middleware Analysis**:
- Mixed authentication (callback is public, refresh requires tenant ownership)
- `requireTenantOwner()` for protected operations

### 8. Files (`/api/v1/projects/:id/files`)
**Base Path**: `/api/v1/projects/:id/files`
**Router**: `src/features/files/files.routes.ts`

#### ✅ Currently Documented
- None

#### ❌ Missing from Documentation
- `GET /` - List project files (requires MEMBER role)

**Middleware Analysis**:
- Nested under project routes
- `requireProjectRole('MEMBER')` for access
- Uses `mergeParams: true` for parent route parameters

## Security Pattern Analysis

### Authentication Layers
1. **Global JWT**: Applied in `app.ts` for all routes except `/health`
2. **Route-level JWT**: Some routes re-apply `authenticateJWT()` (redundant)
3. **Role-based Authorization**: Multiple middleware types

### Authorization Middleware Types
- `requireSuperAdminRole()` - System administrators only
- `requireTenantOwnerOrSuperAdmin()` - Tenant owners or system admins
- `requireTenantOwner()` - Tenant owners only
- `requireProjectRole(role)` - Project-specific roles (MEMBER, DEPUTY, OWNER)

### Security Gaps in Documentation
- Current OpenAPI only shows basic `bearerAuth`
- Missing role-based security requirements
- No documentation of nested route security
- Missing parameter validation schemas

## Schema Coverage Analysis

### Available Zod Schemas
- ✅ `tenant.schema.ts` - Complete with CRUD schemas
- ✅ `project.schema.ts` - Available
- ✅ `projectType.schema.ts` - Available
- ✅ `cloudProvider.schema.ts` - Available
- ✅ `cloudProviderIntegration.schema.ts` - Available
- ✅ `user.schema.ts` - Available
- ✅ `file.schema.ts` - Available

### Schema Gaps in Current OpenAPI
- Missing project member schemas
- Missing OAuth-related schemas
- Missing file management schemas
- Missing error response schemas for all new endpoints
- Missing nested route parameter schemas

## Route Discovery Challenges

### 1. Nested Routes
- Cloud integrations nested under tenants
- Files nested under projects
- Complex parameter inheritance

### 2. Dynamic Route Registration
- Routes registered in `registerRoutes()` function
- Async imports make static analysis difficult
- Need runtime inspection

### 3. Middleware Complexity
- Multiple authorization layers
- Role-based access control
- Tenant-specific permissions

### 4. Parameter Extraction
- Path parameters (`:id`, `:tenantId`, `:integrationId`)
- Query parameters (not well documented)
- Request body schemas from Zod

## Recommendations for Phase 2

### Priority 1: Core Infrastructure
1. **RouteDiscoveryService** - Handle nested routes and dynamic registration
2. **Middleware Analysis** - Extract security requirements automatically
3. **Parameter Extraction** - Parse path patterns and identify required parameters

### Priority 2: Schema Integration
1. **Zod-to-OpenAPI Conversion** - Leverage existing schemas
2. **Request/Response Mapping** - Connect routes to appropriate schemas
3. **Error Schema Generation** - Standardize error responses

### Priority 3: Security Documentation
1. **Role-based Security Schemes** - Document all authorization levels
2. **Nested Route Security** - Handle complex permission inheritance
3. **Parameter Validation** - Ensure all parameters are properly typed

### Testing Strategy
1. **Route Coverage Tests** - Ensure all routes are discovered
2. **Schema Validation Tests** - Verify Zod-to-OpenAPI conversion
3. **Security Documentation Tests** - Validate authorization requirements
4. **Integration Tests** - Test complete OpenAPI generation pipeline