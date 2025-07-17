# MWAP API v3 Documentation

This document provides comprehensive documentation for the MWAP backend API v3, based on the actual implementation and route definitions.

## 🔐 Authentication

All API endpoints require authentication unless explicitly marked as public. Authentication is handled via Auth0 JWT tokens.

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### Public Endpoints
- `GET /health` - Health check endpoint
- `GET /api/v1/oauth/callback` - OAuth callback endpoint

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```typescript
{
  success: true,
  data: T, // Response data
  message?: string // Optional success message
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string, // Error code
    message: string, // Error message
    details?: any // Optional error details
  }
}
```

## 👤 Users API

### Get User Roles
Get the current user's roles and permissions.

**Endpoint:** `GET /api/v1/users/me/roles`  
**Authentication:** Required  
**Authorization:** Any authenticated user

**Response:**
```typescript
{
  userId: string;           // Auth0 user ID
  isSuperAdmin: boolean;    // Whether the user is a super admin
  isTenantOwner: boolean;   // Whether the user owns a tenant
  tenantId: string | null;  // ID of the tenant owned by the user, or null
  projectRoles: {           // Array of project roles
    projectId: string;      // Project ID
    role: 'OWNER' | 'DEPUTY' | 'MEMBER'; // Role in the project
  }[];
}
```

## 🏢 Tenants API

### Get Current User's Tenant
Get the tenant owned by the current user.

**Endpoint:** `GET /api/v1/tenants/me`  
**Authentication:** Required  
**Authorization:** Any authenticated user

### Create Tenant
Create a new tenant. Each user can only own one tenant.

**Endpoint:** `POST /api/v1/tenants`  
**Authentication:** Required  
**Authorization:** Any authenticated user

**Request Body:**
```typescript
{
  name: string;        // Tenant name
  description?: string; // Optional description
}
```

### List All Tenants (Admin Only)
Get a list of all tenants in the system.

**Endpoint:** `GET /api/v1/tenants`  
**Authentication:** Required  
**Authorization:** SUPERADMIN only

**Query Parameters:**
- `includeArchived?: boolean` - Whether to include archived tenants

### Get Tenant by ID
Get a specific tenant by its ID.

**Endpoint:** `GET /api/v1/tenants/:id`  
**Authentication:** Required  
**Authorization:** Tenant owner or SUPERADMIN

### Update Tenant
Update tenant information.

**Endpoint:** `PATCH /api/v1/tenants/:id`  
**Authentication:** Required  
**Authorization:** Tenant owner or SUPERADMIN

**Request Body:**
```typescript
{
  name?: string;        // Updated name
  description?: string; // Updated description
  archived?: boolean;   // Archive status
}
```

### Delete Tenant (Admin Only)
Delete a tenant from the system.

**Endpoint:** `DELETE /api/v1/tenants/:id`  
**Authentication:** Required  
**Authorization:** SUPERADMIN only

## 🔧 Project Types API

All project type endpoints require SUPERADMIN role.

### List Project Types
Get all project types in the system.

**Endpoint:** `GET /api/v1/project-types`  
**Authentication:** Required  
**Authorization:** SUPERADMIN

### Get Project Type by ID
Get a specific project type.

**Endpoint:** `GET /api/v1/project-types/:id`  
**Authentication:** Required  
**Authorization:** SUPERADMIN

### Create Project Type
Create a new project type.

**Endpoint:** `POST /api/v1/project-types`  
**Authentication:** Required  
**Authorization:** SUPERADMIN

**Request Body:**
```typescript
{
  name: string;           // Project type name
  description?: string;   // Optional description
  configSchema: object;  // Zod schema for project configuration
}
```

### Update Project Type
Update an existing project type.

**Endpoint:** `PATCH /api/v1/project-types/:id`  
**Authentication:** Required  
**Authorization:** SUPERADMIN

### Delete Project Type
Delete a project type.

**Endpoint:** `DELETE /api/v1/project-types/:id`  
**Authentication:** Required  
**Authorization:** SUPERADMIN

## ☁️ Cloud Providers API

### List Cloud Providers
Get all available cloud providers. Public endpoint for authenticated users.

**Endpoint:** `GET /api/v1/cloud-providers`  
**Authentication:** Required  
**Authorization:** Any authenticated user

### Get Cloud Provider by ID
Get a specific cloud provider.

**Endpoint:** `GET /api/v1/cloud-providers/:id`  
**Authentication:** Required  
**Authorization:** Any authenticated user

### Create Cloud Provider (Admin Only)
Create a new cloud provider configuration.

**Endpoint:** `POST /api/v1/cloud-providers`  
**Authentication:** Required  
**Authorization:** SUPERADMIN

**Request Body:**
```typescript
{
  name: string;           // Provider name (e.g., "Google Drive")
  slug: string;           // URL-safe identifier (e.g., "google-drive")
  scopes: string[];       // OAuth scopes required
  authUrl: string;        // OAuth authorization URL
  tokenUrl: string;       // OAuth token exchange URL
  clientId: string;       // OAuth client ID
  clientSecret: string;   // OAuth client secret
  grantType: string;      // OAuth grant type
  tokenMethod: string;    // HTTP method for token requests
  metadata?: object;      // Additional provider-specific metadata
}
```

### Update Cloud Provider (Admin Only)
Update cloud provider configuration.

**Endpoint:** `PATCH /api/v1/cloud-providers/:id`  
**Authentication:** Required  
**Authorization:** SUPERADMIN

### Delete Cloud Provider (Admin Only)
Delete a cloud provider.

**Endpoint:** `DELETE /api/v1/cloud-providers/:id`  
**Authentication:** Required  
**Authorization:** SUPERADMIN

## 🔗 Cloud Integrations API

All cloud integration endpoints are scoped to tenants and require tenant owner permissions.

### List Tenant Integrations
Get all cloud integrations for a tenant.

**Endpoint:** `GET /api/v1/tenants/:tenantId/integrations`  
**Authentication:** Required  
**Authorization:** Tenant owner

### Get Integration by ID
Get a specific cloud integration.

**Endpoint:** `GET /api/v1/tenants/:tenantId/integrations/:integrationId`  
**Authentication:** Required  
**Authorization:** Tenant owner

### Create Cloud Integration
Create a new cloud integration for a tenant.

**Endpoint:** `POST /api/v1/tenants/:tenantId/integrations`  
**Authentication:** Required  
**Authorization:** Tenant owner

**Request Body:**
```typescript
{
  providerId: string;     // Cloud provider ID
  status: 'active' | 'inactive'; // Integration status
  metadata?: object;      // Additional integration metadata
}
```

### Update Cloud Integration
Update an existing cloud integration.

**Endpoint:** `PATCH /api/v1/tenants/:tenantId/integrations/:integrationId`  
**Authentication:** Required  
**Authorization:** Tenant owner

### Delete Cloud Integration
Delete a cloud integration.

**Endpoint:** `DELETE /api/v1/tenants/:tenantId/integrations/:integrationId`  
**Authentication:** Required  
**Authorization:** Tenant owner

### Refresh Integration Token
Manually refresh OAuth tokens for an integration.

**Endpoint:** `POST /api/v1/tenants/:tenantId/integrations/:integrationId/refresh-token`  
**Authentication:** Required  
**Authorization:** Tenant owner

### Check Integration Health
Check the health status of a cloud integration.

**Endpoint:** `GET /api/v1/tenants/:tenantId/integrations/:integrationId/health`  
**Authentication:** Required  
**Authorization:** Tenant owner

## 📁 Projects API

### List Projects
Get projects accessible to the current user.

**Endpoint:** `GET /api/v1/projects`  
**Authentication:** Required  
**Authorization:** Any authenticated user

### Get Project by ID
Get a specific project.

**Endpoint:** `GET /api/v1/projects/:id`  
**Authentication:** Required  
**Authorization:** Project member (any role)

### Create Project
Create a new project.

**Endpoint:** `POST /api/v1/projects`  
**Authentication:** Required  
**Authorization:** Tenant owner

**Request Body:**
```typescript
{
  name: string;           // Project name
  description?: string;   // Optional description
  projectTypeId: string;  // Project type ID
  config?: object;        // Project configuration (validated against project type schema)
}
```

### Update Project
Update project information.

**Endpoint:** `PATCH /api/v1/projects/:id`  
**Authentication:** Required  
**Authorization:** Project DEPUTY or higher

### Delete Project
Delete a project.

**Endpoint:** `DELETE /api/v1/projects/:id`  
**Authentication:** Required  
**Authorization:** Project OWNER

## 👥 Project Members API

### List Project Members
Get all members of a project.

**Endpoint:** `GET /api/v1/projects/:id/members`  
**Authentication:** Required  
**Authorization:** Project MEMBER or higher

### Add Project Member
Add a new member to a project.

**Endpoint:** `POST /api/v1/projects/:id/members`  
**Authentication:** Required  
**Authorization:** Project DEPUTY or higher

**Request Body:**
```typescript
{
  userId: string;         // User ID to add
  role: 'OWNER' | 'DEPUTY' | 'MEMBER'; // Role to assign
}
```

### Update Project Member Role
Update a member's role in a project.

**Endpoint:** `PATCH /api/v1/projects/:id/members/:userId`  
**Authentication:** Required  
**Authorization:** Project OWNER

**Request Body:**
```typescript
{
  role: 'OWNER' | 'DEPUTY' | 'MEMBER'; // New role
}
```

### Remove Project Member
Remove a member from a project.

**Endpoint:** `DELETE /api/v1/projects/:id/members/:userId`  
**Authentication:** Required  
**Authorization:** Project OWNER

## 📄 Files API

### List Project Files
Get files associated with a project from connected cloud providers.

**Endpoint:** `GET /api/v1/projects/:id/files`  
**Authentication:** Required  
**Authorization:** Project MEMBER or higher

**Response:**
```typescript
{
  files: {
    id: string;           // File ID
    name: string;         // File name
    type: string;         // File type/extension
    size?: number;        // File size in bytes
    modifiedTime?: string; // Last modified timestamp
    provider: string;     // Cloud provider name
    providerId: string;   // Provider-specific file ID
    downloadUrl?: string; // Temporary download URL
  }[]
}
```

## 🔑 OAuth API

### OAuth Callback
Handle OAuth authorization callbacks from cloud providers.

**Endpoint:** `GET /api/v1/oauth/callback`  
**Authentication:** Not required (public endpoint)  
**Authorization:** None

**Query Parameters:**
- `code: string` - Authorization code from provider
- `state: string` - State parameter containing integration info
- `error?: string` - Error code if authorization failed

### Refresh Integration Tokens
Manually refresh OAuth tokens for a specific integration.

**Endpoint:** `POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh`  
**Authentication:** Required  
**Authorization:** Tenant owner

## 🏥 Health Check

### Health Check
Check the health status of the API.

**Endpoint:** `GET /health`  
**Authentication:** Not required  
**Authorization:** None

**Response:**
```typescript
{
  status: 'ok'
}
```

## 📋 Error Codes

### Common Error Codes
- `auth/unauthorized` - Missing or invalid JWT token
- `auth/forbidden` - Insufficient permissions
- `validation/invalid-input` - Request validation failed
- `resource/not-found` - Requested resource not found
- `resource/conflict` - Resource conflict (e.g., duplicate name)
- `route/not-found` - API endpoint not found
- `server/internal-error` - Internal server error

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content (for DELETE operations)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🔒 Rate Limiting

All API endpoints are subject to rate limiting:
- **Window**: 15 minutes
- **Limit**: 100 requests per window per IP address
- **Headers**: Rate limit information included in response headers

## 📖 Interactive Documentation

For interactive API exploration, start the server and navigate to `/docs` (requires authentication). This provides a Swagger UI interface for testing API endpoints.

---
*This documentation reflects the actual API implementation as of 2025-07-17. All endpoints and schemas are verified against the source code.*