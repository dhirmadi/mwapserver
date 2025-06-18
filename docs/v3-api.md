# 📘 MWAP API Contract

This document defines the **canonical API endpoints** of the MWAP backend, based on the updated domain model and backend architecture. All endpoints are authenticated, role-based, and return Zod-validated responses.

> **Note**: For interactive API documentation, start the server and navigate to `/docs` (requires authentication). This provides a Swagger UI interface for exploring and testing the API endpoints.

---

## 🔐 Authentication

* All routes require Auth0 JWT (Bearer token)
* Roles are enforced per tenant and/or project scope via middleware (`verifyProjectRole`, `requireRoles`)
* API documentation is protected by authentication to prevent information disclosure

---

## 👤 Users

| Endpoint                | Method | Role          | Request Schema | Response Schema         |
| ----------------------- | ------ | ------------- | -------------- | ----------------------- |
| `/api/v1/users/me/roles`| GET    | Authenticated | —              | `UserRolesResponseSchema` |

### User Roles Response Schema
```typescript
interface UserRolesResponse {
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

---

## 🏢 Tenants

| Endpoint              | Method | Role                    | Request Schema                                      | Response Schema |
| --------------------- | ------ | ----------------------- | --------------------------------------------------- | --------------- |
| `/api/v1/tenants`     | POST   | Authenticated           | `TenantSchema.pick({ name: true })`                 | `TenantSchema`  |
| `/api/v1/tenants/me`  | GET    | Authenticated           | —                                                   | `TenantSchema`  |
| `/api/v1/tenants/:id` | PATCH  | `OWNER` or `SUPERADMIN` | `TenantSchema.pick({ name: true, archived: true })` | `TenantSchema`  |
| `/api/v1/tenants/:id` | DELETE | `SUPERADMIN`            | -                                                   | `204`           |

---

## ☁️ CloudProvider + Integrations

| Endpoint                                          | Method | Role       | Request Schema                                       | Response Schema                    |
| ------------------------------------------------- | ------ | ---------- | ---------------------------------------------------- | ---------------------------------- |
| `/api/v1/cloud-providers`                         | GET    | SUPERADMIN | —                                                    | `CloudProviderSchema[]`            |
| `/api/v1/cloud-providers`                         | POST   | SUPERADMIN | `CloudProviderSchema.omit({ _id: true })`            | `CloudProviderSchema`              |
| `/api/v1/cloud-providers/:id`                     | PATCH  | SUPERADMIN | `CloudProviderSchema`                                | `CloudProviderSchema`              |
| `/api/v1/cloud-providers/:id`                     | DELETE | SUPERADMIN | —                                                    | `204`                              |
| `/api/v1/tenants/:tenantId/integrations`          | GET    | `OWNER`    | —                                                    | `CloudProviderIntegrationSchema[]` |
| `/api/v1/tenants/:tenantId/integrations`          | POST   | `OWNER`    | `CloudProviderIntegrationSchema.omit({ _id: true })` | `CloudProviderIntegrationSchema`   |
| `/api/v1/tenants/:tenantId/integrations/:integrationId` | PATCH  | `OWNER`    | `CloudProviderIntegrationSchema.partial()` | `CloudProviderIntegrationSchema`   |
| `/api/v1/tenants/:tenantId/integrations/:integrationId` | DELETE | `OWNER`    | —                                                    | `204`                              |

### Cloud Provider Schema
```typescript
interface CloudProvider {
  _id: string;
  name: string;           // 3-50 chars
  slug: string;           // 2-20 chars, lowercase, alphanumeric with hyphens
  scopes: string[];       // OAuth scopes
  authUrl: string;        // OAuth authorization URL
  tokenUrl: string;       // OAuth token URL
  clientId: string;       // OAuth client ID
  clientSecret: string;   // OAuth client secret (encrypted)
  grantType: string;      // Default: "authorization_code"
  tokenMethod: string;    // Default: "POST"
  metadata: Record<string, unknown>; // Optional provider-specific metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;      // Auth0 sub
}
```

### Cloud Provider Integration Schema
```typescript
interface CloudProviderIntegration {
  _id: string;
  tenantId: string;       // Reference to tenant
  providerId: string;     // Reference to cloud provider
  accessToken?: string;   // OAuth access token (encrypted)
  refreshToken?: string;  // OAuth refresh token (encrypted)
  tokenExpiresAt?: Date;  // Token expiration date
  scopesGranted?: string[]; // Granted OAuth scopes
  status: 'active' | 'expired' | 'revoked' | 'error'; // Default: 'active'
  connectedAt?: Date;     // When the integration was established
  metadata?: Record<string, unknown>; // Optional integration-specific metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;      // Auth0 sub
}
```

### Create Cloud Provider Integration Request
```typescript
interface CreateCloudProviderIntegrationRequest {
  providerId: string;     // Required: ID of the cloud provider
  status?: 'active' | 'expired' | 'revoked' | 'error'; // Default: 'active'
  scopesGranted?: string[]; // Optional: Granted OAuth scopes
  metadata?: Record<string, unknown>; // Optional: Integration-specific metadata
}
```

### Error Codes
- `cloud-integration/not-found`: Integration does not exist
- `cloud-integration/provider-not-found`: Referenced cloud provider does not exist
- `cloud-integration/tenant-not-found`: Referenced tenant does not exist
- `cloud-integration/already-exists`: Integration already exists for this tenant and provider
- `cloud-integration/invalid-input`: Invalid input data
- `cloud-integration/unauthorized`: User is not authorized for this operation

---

## 📦 Projects

| Endpoint               | Method | Role                 | Request Schema                                          | Response Schema   |
| ---------------------- | ------ | -----------------    | ------------------------------------------------------- | ----------------- |
| `/api/v1/projects`     | GET    | Authenticated        | —                                                       | `ProjectSchema[]` |
| `/api/v1/projects/:id` | GET    | Authenticated        | —                                                       | `ProjectSchema` |
| `/api/v1/projects`     | POST   | `OWNER`              | `ProjectSchema.omit({ _id: true })`                     | `ProjectSchema`   |
| `/api/v1/projects/:id` | PATCH  | `OWNER`, `DEPUTY`    | `ProjectSchema.pick({ name: true, description: true })` | `ProjectSchema`   |
| `/api/v1/projects/:id` | DELETE | `OWNER`, `SUPERADMIN`| —                                                       | `204`             |



---

## 👥 Project Members

| Endpoint                               | Method | Role              | Request Schema                             | Response Schema         |
| -------------------------------------- | ------ | ----------------- | ------------------------------------------ | ----------------------- |
| `/api/v1/projects/:id/members`         | GET    | Project Member    | —                                          | `ProjectMemberSchema[]` |
| `/api/v1/projects/:id/members`         | POST   | `OWNER`, `DEPUTY` | `ProjectMemberSchema`                      | `204`                   |
| `/api/v1/projects/:id/members/:userId` | PATCH  | `OWNER`           | `ProjectMemberSchema.pick({ role: true })` | `204`                   |
| `/api/v1/projects/:id/members/:userId` | DELETE | `OWNER`, `DEPUTY` | —                                          | `204`                   |

---

## 🧩 Project Types

| Endpoint                    | Method | Role       | Request Schema                          | Response Schema       |
| --------------------------- | ------ | ---------- | --------------------------------------- | --------------------- |
| `/api/v1/project-types`     | GET    | SUPERADMIN | —                                       | `ProjectTypeSchema[]` |
| `/api/v1/project-types`     | POST   | SUPERADMIN | `ProjectTypeSchema.omit({ _id: true })` | `ProjectTypeSchema`   |
| `/api/v1/project-types/:id` | PATCH  | SUPERADMIN | `ProjectTypeSchema`                     | `ProjectTypeSchema`   |
| `/api/v1/project-types/:id` | DELETE | SUPERADMIN | —                                       | `204`                 |

### Project Type Schema
```typescript
interface ProjectType {
  _id: string;
  name: string;        // 3-50 chars
  description: string; // max 500 chars
  configSchema: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;   // Auth0 sub
}
```

### Error Codes
- `project-type/not-found`: Project type does not exist
- `project-type/name-exists`: Project type name already exists
- `project-type/in-use`: Project type is in use by existing projects
- `project-type/invalid-schema`: Invalid configuration schema format

---

## 📂 Cloud Files (Virtual)

| Endpoint                     | Method | Role                        | Request Schema                                                                                                | Response Schema |
| ---------------------------- | ------ | --------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------- |
| `/api/v1/projects/:id/files` | GET    | `OWNER`, `DEPUTY`, `MEMBER` | `query: { folder?: string, recursive?: boolean, fileTypes?: string[], limit?: number, page?: number }` | `FileSchema[]`  |

> Files are derived at runtime via CloudProviderIntegration. Not persisted in the DB.

### File Schema
```typescript
interface File {
  fileId: string;         // ID from the cloud provider
  name: string;           // File name
  mimeType: string;       // MIME type
  path: string;           // Path in the cloud storage
  status: 'pending' | 'processed' | 'error'; // Processing status
  size?: number;          // File size in bytes
  createdAt?: Date;       // Creation timestamp
  modifiedAt?: Date;      // Last modification timestamp
  metadata?: {            // Provider-specific metadata
    isFolder?: boolean;   // Whether the item is a folder
    webViewLink?: string; // Link to view in browser
    [key: string]: any;   // Other provider-specific fields
  };
}
```

### Error Codes
- `file/not-found`: The requested file does not exist
- `file/project-not-found`: The referenced project does not exist
- `file/cloud-integration-not-found`: The cloud integration does not exist
- `file/cloud-provider-error`: Error communicating with the cloud provider
- `file/unauthorized`: The user is not authorized for this operation
- `file/invalid-path`: The specified path is invalid
- `file/invalid-query`: The query parameters are invalid
- `file/integration-error`: Error with the cloud integration
- `file/token-expired`: The cloud provider access token has expired


---
