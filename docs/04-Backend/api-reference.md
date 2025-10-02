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
- `GET /api/v1/oauth/callback` - OAuth callback endpoint (Enhanced Security)
- `GET /api/v1/oauth/success` - OAuth success page with auto-close
- `GET /api/v1/oauth/error` - OAuth error page with user-friendly messages

### OAuth Callback Security Architecture

The OAuth callback endpoint implements multi-layered security controls to protect against common attack vectors while maintaining compatibility with external OAuth providers.

#### Security Layers

1. **Public Route Registry**
   - Explicit route registration with security documentation
   - External caller verification and monitoring
   - Comprehensive audit logging for all access attempts

2. **State Parameter Validation**
   - Cryptographic state parameter verification
   - Timestamp validation with 10-minute expiration window
   - Nonce validation (16+ characters, alphanumeric)
   - ObjectId format verification for tenant/integration references
   - Required field structure validation

3. **Integration Ownership Verification**
   - Integration ownership verification with tenant access control
   - Replay attack detection through existing token validation
   - Provider availability verification
   - Cross-tenant access prevention

4. **Generic Error Handling**
   - Security-focused error responses to prevent information disclosure
   - Uniform error handling across all failure scenarios
   - Comprehensive internal logging for security analysis

5. **Comprehensive Monitoring**
   - Real-time security issue tracking and classification
   - Performance and availability monitoring
   - Success/failure rate analysis and alerting

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

### Common Error Codes and Examples

Error responses use the structure above and standardized codes:
- `auth/unauthorized` – Invalid or missing JWT
- `auth/forbidden` – Insufficient permissions
- `validation/invalid-input` – Zod validation failed
- `resource/not-found` – Resource not found
- `rate-limit/exceeded` – Too many requests

Example:
```json
{
  "success": false,
  "error": {
    "code": "validation/invalid-input",
    "message": "Invalid input provided",
    "details": { "name": "Name must be at least 3 characters long" }
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

### Get My Project Membership
Get the current user's membership in a specific project.

**Endpoint:** `GET /api/v1/projects/:id/members/me`  
**Authentication:** Required  
**Authorization:** Any authenticated user

If the user is not a member of the project, this endpoint returns 404.

**Example Success Response:**

```json
{
  "success": true,
  "data": {
    "projectId": "641f4411f24b4fcac1b1501c",
    "userId": "auth0|123",
    "role": "MEMBER"
  }
}
```

**Example Not Found Response:**

```json
{
  "success": false,
  "error": {
    "code": "project/member-not-found",
    "message": "Member not found in project"
  }
}
```

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

### OAuth Flow Initiation
Generate OAuth authorization URL with consistent redirect URI construction to prevent redirect URI mismatch errors.

**Endpoint:** `POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/initiate`
**Authentication:** Required (JWT Bearer token)
**Authorization:** Tenant owner

**Path Parameters:**
- `tenantId: string` - Tenant ID (must be owned by authenticated user)
- `integrationId: string` - Cloud integration ID

**Features:**
- ✅ Consistent redirect URI construction between authorization and callback phases
- ✅ HTTPS enforcement for all OAuth flows
- ✅ Provider-specific parameters (e.g., `token_access_type: offline` for Dropbox)
- ✅ Cryptographically secure state parameter generation
- ✅ Comprehensive audit logging and security monitoring

**Response Schema:**
```typescript
{
  authorizationUrl: string;     // Complete OAuth authorization URL
  provider: {
    name: string;               // Provider name (e.g., "dropbox")
    displayName: string;        // Human-readable name (e.g., "Dropbox")
  };
  redirectUri: string;          // Redirect URI used in authorization URL
  state: string;                // Base64-encoded state parameter
}
```

**Usage Example:**
```javascript
// Frontend: Request authorization URL from backend
const response = await fetch(`/api/v1/oauth/tenants/${tenantId}/integrations/${integrationId}/initiate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

const { authorizationUrl } = await response.json();

// Redirect user to the generated authorization URL
window.location.href = authorizationUrl;
```

**Error Responses:**
- `404 Not Found` - Integration or tenant not found
- `403 Forbidden` - User not authorized for tenant
- `500 Internal Server Error` - Authorization URL generation failed

### OAuth Callback (Enhanced Security)
Handle OAuth authorization callbacks from cloud providers with comprehensive security controls.

**Endpoint:** `GET /api/v1/oauth/callback`  
**Authentication:** Not required (public endpoint with enhanced security)  
**Authorization:** State parameter validation required

**Security Features:**
- ✅ Enhanced state parameter validation with cryptographic verification
- ✅ Integration ownership verification with tenant access control
- ✅ Timestamp validation with 10-minute expiration window
- ✅ Replay attack prevention through nonce validation
- ✅ Comprehensive audit logging with security issue tracking
- ✅ Generic error responses to prevent information disclosure

**Query Parameters:**
- `code: string` - Authorization code from OAuth provider
- `state: string` - Base64-encoded state parameter containing integration context
- `error?: string` - Error code if OAuth authorization failed
- `error_description?: string` - Detailed error description from provider

**State Parameter Structure:**
The state parameter must be a Base64-encoded JSON object with the following structure:
```typescript
{
  tenantId: string;        // MongoDB ObjectId of the tenant
  integrationId: string;   // MongoDB ObjectId of the integration
  userId: string;          // Auth0 user ID
  timestamp: number;       // Unix timestamp when state was created
  nonce: string;          // Random string (min 16 characters, alphanumeric)
  redirectUri?: string;   // Optional custom redirect URI
}
```

**Success Flow:**
1. External OAuth provider redirects user to callback endpoint
2. Enhanced security validation of state parameter structure and timing
3. Integration ownership verification against tenant access control
4. OAuth authorization code exchange for access/refresh tokens
5. Token storage and integration activation in database
6. Redirect to success page with minimal information

**Error Handling:**
All errors result in generic responses to prevent information disclosure:
- Invalid state parameter → "Invalid request parameters"
- Expired state → "Request has expired, please try again"
- Integration not found → "Integration not found"
- Replay attack detected → "Integration already configured"
- Provider error → "Authentication failed"

**Success Response:**
Redirects to: `/oauth/success?tenantId={tenantId}&integrationId={integrationId}`

**Error Response:**
Redirects to: `/oauth/error?message={encoded_message}`

**Security Monitoring:**
All callback attempts are logged with comprehensive context:
```typescript
{
  event: 'oauth.callback.attempt',
  success: boolean,
  ip: string,
  userAgent: string,
  tenantId?: string,
  integrationId?: string,
  userId?: string,
  errorCode?: string,
  securityIssues?: string[],
  stateAge?: number,
  provider?: string
}
```

### Refresh Integration Tokens
Manually refresh OAuth tokens for a specific integration.

**Endpoint:** `POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Tenant owner

**Path Parameters:**
- `tenantId: string` - Tenant ID (must be owned by authenticated user)
- `integrationId: string` - Integration ID (must belong to specified tenant)

**Request Body (optional):**
```typescript
{
  force?: boolean; // If true, bypass cached validity and force refresh
}
```

**Response Schema:**
```typescript
{
  success: true,
  data: {
    _id: string;                    // Integration ID
    tenantId: string;               // Tenant ID  
    providerId: string;             // Cloud provider ID
    status: 'active' | 'expired' | 'revoked' | 'error';
    connectedAt: string;            // ISO date when tokens were refreshed
    scopesGranted: string[];        // OAuth scopes granted
    accessToken: '[REDACTED]';     // Access token (redacted for security)
    refreshToken: '[REDACTED]';    // Refresh token (redacted for security)
    tokenExpiresAt: string;         // ISO date when access token expires
    metadata: Record<string, any>; // Provider-specific metadata
    createdAt: string;              // ISO date when integration was created
    updatedAt: string;              // ISO date when integration was last updated
    createdBy: string;              // Auth0 user ID who created integration
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not owner of specified tenant
- `404 Not Found` - Integration not found or doesn't belong to tenant
- `400 Bad Request` - Integration doesn't have refresh token
- `500 Internal Server Error` - Token refresh failed with provider

**Security Features:**
- ✅ JWT authentication required
- ✅ Tenant ownership verification  
- ✅ Integration access control validation
- ✅ Audit logging of all refresh attempts
- ✅ Rate limiting protection
- ✅ Token redaction in responses

**Usage Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  https://api.mwap.dev/api/v1/oauth/tenants/641f4411f24b4fcac1b1501b/integrations/641f4411f24b4fcac1b1501c/refresh
```

### OAuth Success Page
Display success message after successful OAuth authorization.

**Endpoint:** `GET /api/v1/oauth/success`  
**Authentication:** Not required (public endpoint)  
**Authorization:** None

**Query Parameters:**
- `tenantId?: string` - Tenant ID for context
- `integrationId?: string` - Integration ID for context

**Response:** HTML page with success message and auto-close functionality for popup windows

### OAuth Error Page
Display error message after failed OAuth authorization.

**Endpoint:** `GET /api/v1/oauth/error`  
**Authentication:** Not required (public endpoint)  
**Authorization:** None

**Query Parameters:**
- `message?: string` - User-friendly error message

**Response:** HTML page with error message and auto-close functionality for popup windows

## 🛡️ OAuth Security Monitoring

The OAuth system includes comprehensive security monitoring endpoints for tracking and analyzing OAuth flow security.

### Get Security Metrics
Retrieve OAuth security metrics and statistics.

**Endpoint:** `GET /api/v1/oauth/security/metrics`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  securityIssuesDetected: number;
  averageResponseTime: number;
  lastUpdated: string;
}
```

### Get Security Alerts
Retrieve active security alerts from OAuth flows.

**Endpoint:** `GET /api/v1/oauth/security/alerts`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  alerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    metadata: Record<string, any>;
  }>;
}
```

### Get Suspicious Patterns
Retrieve detected suspicious patterns in OAuth flows.

**Endpoint:** `GET /api/v1/oauth/security/patterns`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  patterns: Array<{
    pattern: string;
    occurrences: number;
    severity: 'low' | 'medium' | 'high';
    lastSeen: string;
  }>;
}
```

### Get Security Report
Generate comprehensive security report for OAuth operations.

**Endpoint:** `GET /api/v1/oauth/security/report`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  summary: {
    totalAttempts: number;
    successRate: number;
    securityIssues: number;
  };
  alerts: Array<any>;
  patterns: Array<any>;
  recommendations: string[];
  generatedAt: string;
}
```

### Validate Data Exposure
Validate data exposure controls in OAuth responses.

**Endpoint:** `GET /api/v1/oauth/security/validate/data-exposure`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  validated: boolean;
  issues: string[];
  timestamp: string;
}
```

### Validate Attack Vectors
Validate protection against known attack vectors.

**Endpoint:** `GET /api/v1/oauth/security/validate/attack-vectors`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  validated: boolean;
  vulnerabilities: string[];
  protections: string[];
  timestamp: string;
}
```

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

The MWAP API provides comprehensive OpenAPI 3.1 specification with management endpoints for validation, performance monitoring, and security auditing.

### Interactive Documentation
For interactive API exploration and testing:
1. Start the MWAP server
2. Navigate to `/docs` (requires authentication)
3. Use the Swagger UI interface to explore and test endpoints

### Get OpenAPI Specification
Retrieve the complete OpenAPI specification.

**Endpoint:** `GET /api/v1/openapi`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Query Parameters:**
- `format?: 'json' | 'yaml'` - Response format (default: json)
- `includeExamples?: boolean` - Include examples in specification (default: false)
- `minify?: boolean` - Return minified specification (default: false)

**Response:** Complete OpenAPI 3.1.0 specification in JSON or YAML format

### Get OpenAPI Info
Get summary information about the OpenAPI specification.

**Endpoint:** `GET /api/v1/openapi/info`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  title: string;
  version: string;
  description: string;
  pathCount: number;
  schemaCount: number;
  tagCount: number;
}
```

### Validate OpenAPI Specification
Validate the generated OpenAPI specification for completeness and correctness.

**Endpoint:** `GET /api/v1/openapi/validate`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  valid: boolean;
  errors: string[];
  timestamp: string;
}
```

### OpenAPI Service Health Check
Check the health status of the OpenAPI documentation service.

**Endpoint:** `GET /api/v1/openapi/health`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  status: string;
  timestamp: string;
  service: string;
  version: string;
  cache: object;
  metrics: object;
}
```

### Cache Management

#### Get Cache Status
Get the current status of the OpenAPI documentation cache.

**Endpoint:** `GET /api/v1/openapi/cache/status`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  cached: boolean;
  age: number;
  ttl: number;
  lastGenerated: string;
}
```

#### Invalidate Cache
Invalidate the OpenAPI documentation cache (force regeneration).

**Endpoint:** `POST /api/v1/openapi/cache/invalidate`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** SUPERADMIN only

**Response Schema:**
```typescript
{
  message: string;
  timestamp: string;
}
```

### Validation Management

#### Get Validation History
Retrieve historical validation results.

**Endpoint:** `GET /api/v1/openapi/validation/history`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Query Parameters:**
- `limit?: number` - Maximum number of history entries (default: 10)

**Response Schema:**
```typescript
{
  history: Array<{
    timestamp: string;
    valid: boolean;
    errors: string[];
  }>;
  count: number;
  timestamp: string;
}
```

#### Generate CI/CD Validation Report
Generate validation report for CI/CD integration.

**Endpoint:** `GET /api/v1/openapi/validation/ci-report`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Query Parameters:**
- `format?: 'json' | 'junit' | 'text'` - Report format (default: text)
- `failOnErrors?: boolean` - Fail on validation errors (default: false)
- `failOnWarnings?: boolean` - Fail on validation warnings (default: false)

**Response:** Validation report in specified format

#### Monitor Validation Status
Trigger validation monitoring for error detection.

**Endpoint:** `POST /api/v1/openapi/validation/monitor`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  message: string;
  timestamp: string;
}
```

### Performance Management

#### Get Performance Metrics
Retrieve comprehensive performance metrics for OpenAPI generation.

**Endpoint:** `GET /api/v1/openapi/performance/metrics`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  metrics: {
    averageGenerationTime: number;
    cacheHitRate: number;
    totalRequests: number;
  };
  timestamp: string;
}
```

#### Run Performance Benchmarks
Execute performance benchmarks for OpenAPI generation.

**Endpoint:** `POST /api/v1/openapi/performance/benchmark`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Request Body:**
```typescript
{
  iterations?: number; // Default: 10
}
```

**Response Schema:**
```typescript
{
  benchmarks: Array<{
    iteration: number;
    duration: number;
    memoryUsage: number;
  }>;
  iterations: number;
  timestamp: string;
}
```

#### Optimize Cache Configuration
Automatically optimize cache configuration for better performance.

**Endpoint:** `POST /api/v1/openapi/performance/optimize-cache`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  message: string;
  configuration: {
    ttl: number;
    maxSize: number;
  };
  timestamp: string;
}
```

### Security Management

#### Perform Security Audit
Execute comprehensive security audit of OpenAPI documentation.

**Endpoint:** `POST /api/v1/openapi/security/audit`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response Schema:**
```typescript
{
  secure: boolean;
  vulnerabilities: Array<{
    severity: string;
    description: string;
    recommendation: string;
  }>;
  warnings: Array<{
    message: string;
  }>;
  timestamp: string;
}
```

#### Get Sanitized Specification
Retrieve OpenAPI specification with sensitive information removed.

**Endpoint:** `GET /api/v1/openapi/security/sanitized`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Response:** Sanitized OpenAPI specification with secrets and sensitive data removed

#### Get Security Audit Log
Retrieve audit log of documentation access attempts.

**Endpoint:** `GET /api/v1/openapi/security/audit-log`  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Authenticated users

**Query Parameters:**
- `limit?: number` - Maximum number of audit entries (default: 100)

**Response Schema:**
```typescript
{
  auditLog: Array<{
    timestamp: string;
    userId: string;
    action: string;
    endpoint: string;
    success: boolean;
  }>;
  count: number;
  timestamp: string;
}
```

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