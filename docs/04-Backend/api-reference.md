# MWAP API Reference

This document provides comprehensive documentation for the MWAP backend API v3, including all endpoints, schemas, authentication patterns, and integration examples.

## 🎯 Overview

The MWAP API is a RESTful service built with Express.js and TypeScript, providing secure multi-tenant project management, cloud integrations, and file operations. All endpoints use JSON for request/response bodies and follow consistent patterns for authentication, authorization, and error handling.

### Key Features
- **Multi-tenant Architecture**: Isolated data and operations per tenant
- **OAuth Integration**: Secure integration with Google Drive, Dropbox, OneDrive
- **JWT Authentication**: Auth0-based authentication with role-based access control
- **Virtual File System**: Unified file management across cloud providers
- **Comprehensive Validation**: Zod-based request/response validation
- **Interactive Documentation**: Swagger UI at `/docs` (authentication required)

### Base URL
```
Production: https://api.mwap.dev/api/v1
Development: http://localhost:3000/api/v1
```

## 🔐 Authentication & Authorization

### Authentication
All API endpoints require authentication unless explicitly marked as public.

**Authentication Header:**
```
Authorization: Bearer <jwt_token>
```

**Public Endpoints:**
- `GET /health` - Health check endpoint
- `GET /api/v1/oauth/callback` - OAuth callback endpoint

### Authorization Roles
The API implements a hierarchical role-based access control system:

#### Global Roles
- **SuperAdmin**: Platform-wide access to all features and data
- **Tenant Owner**: Full control over their tenant and associated projects

#### Project Roles
- **Project Owner**: Full control over a specific project
- **Project Deputy**: Can edit project details and manage members
- **Project Member**: Can view and interact with project resources

### Role Hierarchy
```
SuperAdmin > Tenant Owner > Project Owner > Project Deputy > Project Member
```

Higher-level roles inherit permissions from lower-level roles.

## 📊 Response Format

All API responses follow a consistent format for both success and error cases.

### Success Response
```typescript
{
  success: true,
  data: T,              // Response data (type varies by endpoint)
  message?: string      // Optional success message
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,       // Machine-readable error code
    message: string,    // Human-readable error message
    details?: any       // Optional additional error details
  }
}
```

## 👤 Users API

### Get User Roles
Get the current user's roles and permissions across the platform.

**Endpoint:** `GET /api/v1/users/me/roles`  
**Authentication:** Required  
**Authorization:** Any authenticated user

**Response Schema:**
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

**Example Response:**
```json
{
  "success": true,
  "data": {
    "userId": "auth0|123456789",
    "isSuperAdmin": false,
    "isTenantOwner": true,
    "tenantId": "641f4411f24b4fcac1b1501b",
    "projectRoles": [
      {
        "projectId": "641f4411f24b4fcac1b1501c",
        "role": "OWNER"
      }
    ]
  }
}
```

## 🏢 Tenants API

### Get Current User's Tenant
Get the tenant owned by the current user.

**Endpoint:** `GET /api/v1/tenants/me`  
**Authentication:** Required  
**Authorization:** Any authenticated user

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

### Create Tenant
Create a new tenant. Each user can only own one tenant.

**Endpoint:** `POST /api/v1/tenants`  
**Authentication:** Required  
**Authorization:** Any authenticated user

**Request Schema:**
```typescript
{
  name: string;             // Tenant name (3-50 characters)
  settings?: {              // Optional tenant settings
    allowPublicProjects?: boolean;  // Default: false
    maxProjects?: number;           // 1-100, Default: 10
  };
}
```

### Update Tenant
Update tenant information.

**Endpoint:** `PATCH /api/v1/tenants/:id`  
**Authentication:** Required  
**Authorization:** Tenant owner or SUPERADMIN

**Request Schema:**
```typescript
{
  name?: string;            // Updated name (3-50 characters)
  settings?: {              // Optional tenant settings update
    allowPublicProjects?: boolean;
    maxProjects?: number;   // 1-100
  };
  archived?: boolean;       // Archive/unarchive tenant
}
```

### Delete Tenant (Admin Only)
Delete a tenant from the system.

**Endpoint:** `DELETE /api/v1/tenants/:id`  
**Authentication:** Required  
**Authorization:** SUPERADMIN only

**Response:** `204 No Content`

### Tenant Response Schema
```typescript
{
  _id: string;              // Tenant ID (MongoDB ObjectId as string)
  name: string;             // Tenant name
  ownerId: string;          // Auth0 user ID of the owner
  settings: {               // Tenant settings
    allowPublicProjects: boolean;  // Whether public projects are allowed
    maxProjects: number;           // Maximum number of projects allowed
  };
  createdAt: string;        // ISO date string
  updatedAt: string;        // ISO date string
  archived: boolean;        // Whether tenant is archived
}
```

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

**Request Schema:**
```typescript
{
  name: string;             // Project name
  description?: string;     // Optional description
  projectTypeId: string;    // Project type ID
  config?: object;          // Project configuration (validated against project type schema)
}
```

### Update Project
Update project information.

**Endpoint:** `PATCH /api/v1/projects/:id`  
**Authentication:** Required  
**Authorization:** Project DEPUTY or higher

**Request Schema:**
```typescript
{
  name?: string;            // Updated name
  description?: string;     // Updated description
  config?: object;          // Updated configuration
  archived?: boolean;       // Archive status
}
```

### Delete Project
Delete a project.

**Endpoint:** `DELETE /api/v1/projects/:id`  
**Authentication:** Required  
**Authorization:** Project OWNER

**Response:** `204 No Content`

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

**Request Schema:**
```typescript
{
  userId: string;           // User ID to add
  role: 'OWNER' | 'DEPUTY' | 'MEMBER'; // Role to assign
}
```

### Update Project Member Role
Update a member's role in a project.

**Endpoint:** `PATCH /api/v1/projects/:id/members/:userId`  
**Authentication:** Required  
**Authorization:** Project OWNER

**Request Schema:**
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

**Response:** `204 No Content`

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

**Request Schema:**
```typescript
{
  name: string;             // Project type name
  description?: string;     // Optional description
  configSchema: object;    // Zod schema for project configuration
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

**Response:** `204 No Content`

## ☁️ Cloud Providers API

### List Cloud Providers
Get all available cloud providers.

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

**Request Schema:**
```typescript
{
  name: string;             // Provider name (e.g., "Google Drive")
  slug: string;             // URL-safe identifier (e.g., "google-drive")
  scopes: string[];         // OAuth scopes required
  authUrl: string;          // OAuth authorization URL
  tokenUrl: string;         // OAuth token exchange URL
  clientId: string;         // OAuth client ID
  clientSecret: string;     // OAuth client secret
  grantType: string;        // OAuth grant type
  tokenMethod: string;      // HTTP method for token requests
  metadata?: object;        // Additional provider-specific metadata
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

**Response:** `204 No Content`

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

**Request Schema:**
```typescript
{
  providerId: string;       // Cloud provider ID
  status: 'active' | 'inactive'; // Integration status
  metadata?: object;        // Additional integration metadata
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

**Response:** `204 No Content`

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

## 📄 Files API

### List Project Files
Get files associated with a project from connected cloud providers.

**Endpoint:** `GET /api/v1/projects/:id/files`  
**Authentication:** Required  
**Authorization:** Project MEMBER or higher

**Response Schema:**
```typescript
{
  files: {
    id: string;             // File ID
    name: string;           // File name
    type: string;           // File type/extension
    size?: number;          // File size in bytes
    modifiedTime?: string;  // Last modified timestamp
    provider: string;       // Cloud provider name
    providerId: string;     // Provider-specific file ID
    downloadUrl?: string;   // Temporary download URL
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

## 🚨 Error Handling

### Common Error Codes
| Code | Description |
|------|-------------|
| `auth/unauthorized` | Missing or invalid JWT token |
| `auth/forbidden` | Insufficient permissions |
| `auth/token-expired` | JWT token has expired |
| `validation/invalid-input` | Request validation failed |
| `resource/not-found` | Requested resource not found |
| `resource/conflict` | Resource conflict (e.g., duplicate name) |
| `tenant/not-found` | Tenant not found |
| `tenant/already-exists` | User already owns a tenant |
| `project/not-found` | Project not found |
| `project/access-denied` | User lacks project access |
| `cloud-provider/not-found` | Cloud provider not found |
| `integration/not-found` | Cloud integration not found |
| `oauth/error` | OAuth flow error |
| `route/not-found` | API endpoint not found |
| `server/internal-error` | Internal server error |

### HTTP Status Codes
| Status | Usage |
|--------|-------|
| `200` | Success (GET, PATCH) |
| `201` | Created (POST) |
| `204` | No Content (DELETE) |
| `400` | Bad Request (validation errors) |
| `401` | Unauthorized (authentication required) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (resource already exists) |
| `429` | Too Many Requests (rate limited) |
| `500` | Internal Server Error |

### Error Response Examples

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "validation/invalid-input",
    "message": "Invalid input provided",
    "details": [
      {
        "field": "name",
        "message": "Name must be at least 3 characters long"
      }
    ]
  }
}
```

**Authorization Error:**
```json
{
  "success": false,
  "error": {
    "code": "auth/forbidden",
    "message": "Insufficient permissions to access this resource"
  }
}
```

## 🔒 Rate Limiting

All API endpoints are subject to rate limiting to ensure fair usage and system stability.

### Rate Limit Configuration
- **Window**: 15 minutes
- **Limit**: 100 requests per window per IP address
- **Scope**: Applied per IP address across all endpoints

### Rate Limit Headers
The API includes rate limit information in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1672531200
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "rate-limit/exceeded",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 900
    }
  }
}
```

## 📚 OpenAPI Specification

The complete OpenAPI 3.1 specification is available at `/api/v1/openapi.yaml` and provides:

- **Complete endpoint documentation** with request/response schemas
- **Authentication configuration** for testing tools
- **Schema definitions** for all data models
- **Example requests and responses** for all endpoints

### Interactive Documentation
For interactive API exploration and testing:
1. Start the MWAP server
2. Navigate to `/docs` (requires authentication)
3. Use the Swagger UI interface to explore and test endpoints

### OpenAPI Metadata
```yaml
openapi: 3.1.0
info:
  title: MWAP API
  version: 1.0.0
  description: Multi-tenant project management platform with cloud integrations
servers:
  - url: https://api.mwap.dev/api/v1
    description: Production server
  - url: http://localhost:3000/api/v1
    description: Development server
```

### Security Schemes
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Auth0 JWT token with RS256 signature
```

## 🔗 Integration Examples

### cURL Examples

**Get User Roles:**
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
     https://api.mwap.dev/api/v1/users/me/roles
```

**Create Tenant:**
```bash
curl -X POST \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "My Company"}' \
     https://api.mwap.dev/api/v1/tenants
```

**List Projects:**
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
     https://api.mwap.dev/api/v1/projects
```

### JavaScript/TypeScript Examples

**Using Axios:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.mwap.dev/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get user roles
const roles = await api.get('/users/me/roles');

// Create project
const project = await api.post('/projects', {
  name: 'New Project',
  projectTypeId: 'project-type-id'
});
```

---
*This API reference is automatically generated from the actual implementation and is updated with each release. For the most current interactive documentation, visit `/docs` on your MWAP instance.* 