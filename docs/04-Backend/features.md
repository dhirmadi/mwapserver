# MWAP Features Guide

This comprehensive guide covers all backend features in the MWAP platform, including implementation patterns, API endpoints, data models, and development guidelines.

## 🎯 Feature Development Pattern

### Standard Feature Structure
Each feature follows a consistent pattern for maintainability and scalability across the MWAP platform:

```
/src/features/{feature-name}/
  ├── {feature}.controller.ts   # Request handlers and HTTP logic
  ├── {feature}.service.ts      # Business logic and database operations
  └── {feature}.routes.ts       # Route definitions and middleware
```

### Implementation Template

#### 1. Schema Definition
Location: `/src/schemas/{feature}.schema.ts`

```typescript
import { z } from 'zod';

// Base schema for the entity
export const featureSchema = z.object({
  _id: z.instanceof(ObjectId),
  name: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(), // Auth0 user ID
});

// Create request schema (omit auto-generated fields)
export const createFeatureSchema = featureSchema.omit({ 
  _id: true,
  createdAt: true, 
  updatedAt: true,
  createdBy: true
});

// Update request schema (make all fields optional except immutable ones)
export const updateFeatureSchema = featureSchema
  .partial()
  .omit({ 
    _id: true,
    createdAt: true, 
    updatedAt: true,
    createdBy: true 
  });

// Error codes specific to this feature
export const FeatureErrorCodes = {
  NOT_FOUND: 'feature/not-found',
  NAME_EXISTS: 'feature/name-exists',
  INVALID_INPUT: 'feature/invalid-input',
} as const;

// TypeScript types
export type Feature = z.infer<typeof featureSchema>;
export type CreateFeatureRequest = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureRequest = z.infer<typeof updateFeatureSchema>;
```

#### 2. Service Layer Implementation
```typescript
// src/features/example/example.service.ts
import { ObjectId } from 'mongodb';
import { getDatabase } from '../../config/db.js';
import { Feature, CreateFeatureRequest, UpdateFeatureRequest } from './example.types.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { logInfo, logAudit } from '../../utils/logger.js';

export class ExampleService {
  private get collection() {
    return getDatabase().collection<Feature>('features');
  }

  async create(data: CreateFeatureRequest, userId: string): Promise<Feature> {
    // Business logic validation
    await this.validateCreateRequest(data, userId);

    const feature: Feature = {
      _id: new ObjectId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    await this.collection.insertOne(feature);
    
    logAudit('feature_created', userId, feature._id.toString());
    logInfo('Feature created', { featureId: feature._id, userId });

    return feature;
  }

  async findById(id: string): Promise<Feature | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async update(id: string, data: UpdateFeatureRequest, userId: string): Promise<Feature> {
    const feature = await this.findById(id);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    const updatedFeature = {
      ...feature,
      ...data,
      updatedAt: new Date()
    };

    await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedFeature }
    );

    logAudit('feature_updated', userId, id);
    return updatedFeature;
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      throw new NotFoundError('Feature not found');
    }

    logAudit('feature_deleted', userId, id);
  }

  private async validateCreateRequest(data: CreateFeatureRequest, userId: string): Promise<void> {
    // Implement business logic validation
    if (await this.nameExists(data.name)) {
      throw new ValidationError('Feature name already exists');
    }
  }

  private async nameExists(name: string): Promise<boolean> {
    const existing = await this.collection.findOne({ name });
    return !!existing;
  }
}
```

#### 3. Controller Layer Implementation
```typescript
// src/features/example/example.controller.ts
import { Request, Response } from 'express';
import { ExampleService } from './example.service.js';
import { createFeatureSchema, updateFeatureSchema } from '../../schemas/example.schema.js';
import { validateWithSchema } from '../../utils/validate.js';
import { jsonResponse } from '../../utils/response.js';
import { getUserFromToken } from '../../utils/auth.js';

const exampleService = new ExampleService();

export async function getFeatures(req: Request, res: Response) {
  const features = await exampleService.findAll();
  return jsonResponse(res, features);
}

export async function getFeatureById(req: Request, res: Response) {
  const { id } = req.params;
  const feature = await exampleService.findById(id);
  
  if (!feature) {
    return jsonResponse(res, null, 404, 'Feature not found');
  }
  
  return jsonResponse(res, feature);
}

export async function createFeature(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const data = validateWithSchema(createFeatureSchema, req.body);
  
  const feature = await exampleService.create(data, user.sub);
  return jsonResponse(res, feature, 201);
}

export async function updateFeature(req: Request, res: Response) {
  const { id } = req.params;
  const user = getUserFromToken(req);
  const data = validateWithSchema(updateFeatureSchema, req.body);
  
  const feature = await exampleService.update(id, data, user.sub);
  return jsonResponse(res, feature);
}

export async function deleteFeature(req: Request, res: Response) {
  const { id } = req.params;
  const user = getUserFromToken(req);
  
  await exampleService.delete(id, user.sub);
  return jsonResponse(res, null, 204);
}
```

#### 4. Routes Configuration
```typescript
// src/features/example/example.routes.ts
import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import { requireRole } from '../../middleware/authorization.js';
import * as controller from './example.controller.js';

export function getExampleRouter(): Router {
  const router = Router();

  // Public routes (authentication already applied globally)
  router.get('/', wrapAsyncHandler(controller.getFeatures));
  router.get('/:id', wrapAsyncHandler(controller.getFeatureById));

  // Role-restricted routes
  router.post('/', 
    requireRole('TENANT_OWNER'), 
    wrapAsyncHandler(controller.createFeature)
  );
  
  router.patch('/:id', 
    requireRole('TENANT_OWNER'), 
    wrapAsyncHandler(controller.updateFeature)
  );
  
  router.delete('/:id', 
    requireRole('SUPERADMIN'), 
    wrapAsyncHandler(controller.deleteFeature)
  );

  return router;
}
```

## 🏢 Core Features

### Tenants Feature

#### Overview
Tenants represent organizations or user workspaces in the MWAP platform. Each tenant has its own settings, projects, and cloud integrations. The system enforces a one-tenant-per-user rule for owners.

#### API Endpoints
| Endpoint | Method | Authorization | Description |
|----------|--------|---------------|-------------|
| `POST /api/v1/tenants` | POST | Authenticated | Create a new tenant |
| `GET /api/v1/tenants/me` | GET | Authenticated | Get current user's tenant |
| `GET /api/v1/tenants` | GET | SUPERADMIN | List all tenants |
| `GET /api/v1/tenants/:id` | GET | OWNER or SUPERADMIN | Get specific tenant |
| `PATCH /api/v1/tenants/:id` | PATCH | OWNER or SUPERADMIN | Update tenant |
| `DELETE /api/v1/tenants/:id` | DELETE | SUPERADMIN | Delete tenant |

#### Data Model
```typescript
interface Tenant {
  _id: ObjectId;
  name: string;                    // Unique per owner, 3-50 characters
  description?: string;
  ownerId: string;                 // Auth0 user ID (one-to-one relationship)
  settings: {
    allowPublicProjects: boolean;  // Default: false
    maxProjects: number;           // 1-100, Default: 10
  };
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;               // Soft delete flag
}
```

#### Business Rules
- **One tenant per user**: Each user can only own one tenant
- **Name uniqueness**: Tenant names must be unique across the platform
- **Ownership immutability**: Cannot change tenant owner after creation
- **Deletion protection**: Only SuperAdmins can delete tenants
- **Settings validation**: maxProjects must be between 1-100

#### Error Codes
- `tenant/not-found` - Tenant with specified ID not found
- `tenant/name-exists` - Tenant with this name already exists
- `tenant/owner-exists` - User already owns another tenant
- `tenant/invalid-settings` - Invalid tenant settings provided

### Projects Feature

#### Overview
Projects enable tenants to create and manage application instances with specific configurations. Each project is associated with a project type and cloud integrations, and has its own set of members with different roles.

#### API Endpoints
| Endpoint | Method | Authorization | Description |
|----------|--------|---------------|-------------|
| `GET /api/v1/projects` | GET | Authenticated | List user's projects |
| `GET /api/v1/projects/:id` | GET | Project Member | Get specific project |
| `GET /api/v1/projects/:id/members/me` | GET | Authenticated | Get my membership in project (404 if not a member) |
| `POST /api/v1/projects` | POST | Tenant Owner | Create new project |
| `PATCH /api/v1/projects/:id` | PATCH | Project DEPUTY+ | Update project |
| `DELETE /api/v1/projects/:id` | DELETE | Project OWNER | Delete project |
| `GET /api/v1/projects/:id/members` | GET | Project Member | List project members |
| `POST /api/v1/projects/:id/members` | POST | Project DEPUTY+ | Add project member |
| `PATCH /api/v1/projects/:id/members/:userId` | PATCH | Project OWNER | Update member role |
| `DELETE /api/v1/projects/:id/members/:userId` | DELETE | Project OWNER | Remove member |

#### Data Model (current)
```typescript
interface Project {
  _id: ObjectId;
  tenantId: ObjectId;              // Reference to tenant
  projectTypeId: ObjectId;         // Reference to project type
  cloudIntegrationId: ObjectId;    // Reference to cloud integration
  folderpath: string;              // Absolute display path ("/...")
  name: string;                    // 1–100
  description?: string;            // ≤500
  archived: boolean;               // default false
  members: Array<{
    userId: string;                // Auth0 user ID
    role: 'OWNER' | 'DEPUTY' | 'MEMBER'
  }>;                              // OWNER ensured server-side
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;               // Auth0 sub
}
```

#### Business Rules
- **Tenant scoping**: Projects belong to specific tenants
- **Member roles**: OWNER > DEPUTY > MEMBER hierarchy
- **Owner requirement**: Each project must have at least one OWNER
- **Member limit**: Maximum of 10 members per project
- **Immutable fields**: tenantId, projectTypeId, folderPath cannot be changed
- **Creation privileges**: Only tenant owners can create projects

#### Error Codes
- `project/not-found` - Project not found
- `project/member-not-found` - Member not found in project
- `project/member-already-exists` - Member already exists in project
- `project/owner-required` - Cannot remove last owner from project
- `project/max-members-reached` - Maximum of 10 members reached
- `project/immutable-field` - Attempted to modify immutable field

### Project Types Feature

#### Overview
Project Types define the structure and configuration requirements for different kinds of projects. Each project type has a configSchema that validates project configurations at runtime.

#### API Endpoints
| Endpoint | Method | Authorization | Description |
|----------|--------|---------------|-------------|
| `GET /api/v1/project-types` | GET | SUPERADMIN | List all project types |
| `GET /api/v1/project-types/:id` | GET | SUPERADMIN | Get specific project type |
| `POST /api/v1/project-types` | POST | SUPERADMIN | Create new project type |
| `PATCH /api/v1/project-types/:id` | PATCH | SUPERADMIN | Update project type |
| `DELETE /api/v1/project-types/:id` | DELETE | SUPERADMIN | Delete project type |

#### Data Model
```typescript
interface ProjectType {
  _id: ObjectId;
  name: string;                    // Unique, 3-50 characters
  description: string;             // Max 500 characters
  configSchema: Record<string, any>; // Zod-compatible schema
  isActive: boolean;               // Whether type is available for use
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;               // Auth0 user ID
}
```

#### Business Rules
- **Admin-only management**: All operations require SUPERADMIN role
- **Name uniqueness**: Project type names must be unique
- **Schema immutability**: configSchema cannot be updated after creation
- **Deletion protection**: Cannot delete types in use by existing projects
- **Schema validation**: configSchema must be valid Zod schema

#### Error Codes
- `project-type/not-found` - Project type not found
- `project-type/name-exists` - Name already exists
- `project-type/in-use` - Type is used by existing projects
- `project-type/invalid-schema` - Invalid Zod schema configuration

## ☁️ Cloud Integration Features

### Cloud Providers Feature

#### Overview
Cloud Providers define supported external storage services (like Google Drive, Dropbox) that can be integrated with tenant workspaces. This is a platform-level configuration managed by administrators.

#### API Endpoints
| Endpoint | Method | Authorization | Description |
|----------|--------|---------------|-------------|
| `GET /api/v1/cloud-providers` | GET | SUPERADMIN | List all cloud providers |
| `GET /api/v1/cloud-providers/:id` | GET | SUPERADMIN | Get specific provider |
| `POST /api/v1/cloud-providers` | POST | SUPERADMIN | Create new provider |
| `PATCH /api/v1/cloud-providers/:id` | PATCH | SUPERADMIN | Update provider |
| `DELETE /api/v1/cloud-providers/:id` | DELETE | SUPERADMIN | Delete provider |

#### Data Model
```typescript
interface CloudProvider {
  _id: ObjectId;
  name: string;                    // Display name (e.g., "Google Drive")
  slug: string;                    // Unique identifier (e.g., "google-drive")
  scopes: string[];                // OAuth scopes required
  authUrl: string;                 // OAuth authorization endpoint
  tokenUrl: string;                // OAuth token exchange endpoint
  clientId: string;                // OAuth client ID
  clientSecret: string;            // OAuth client secret (encrypted)
  grantType: string;               // OAuth grant type
  tokenMethod: string;             // HTTP method for token requests
  metadata?: Record<string, any>;  // Provider-specific configuration
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;               // Auth0 user ID
}
```

#### Business Rules
- **Admin-only management**: All operations require SUPERADMIN role
- **Unique identifiers**: Both name and slug must be unique
- **Deletion protection**: Cannot delete providers in use by integrations
- **Secret encryption**: Client secrets are encrypted in storage
- **OAuth configuration**: Must provide valid OAuth endpoints and scopes

#### Error Codes
- `cloud-provider/not-found` - Provider not found
- `cloud-provider/name-exists` - Name already exists
- `cloud-provider/slug-exists` - Slug already exists
- `cloud-provider/in-use` - Provider used by tenant integrations

### Cloud Integrations Feature

#### Overview
Cloud Integrations enable tenant owners to connect their workspaces to supported cloud storage providers through OAuth authentication. These integrations provide projects with access to cloud-stored files.

#### API Endpoints
| Endpoint | Method | Authorization | Description |
|----------|--------|---------------|-------------|
| `GET /api/v1/tenants/:tenantId/integrations` | GET | Tenant Owner | List tenant integrations |
| `GET /api/v1/tenants/:tenantId/integrations/:id` | GET | Tenant Owner | Get specific integration |
| `POST /api/v1/tenants/:tenantId/integrations` | POST | Tenant Owner | Create new integration |
| `PATCH /api/v1/tenants/:tenantId/integrations/:id` | PATCH | Tenant Owner | Update integration |
| `DELETE /api/v1/tenants/:tenantId/integrations/:id` | DELETE | Tenant Owner | Delete integration |
| `POST /api/v1/tenants/:tenantId/integrations/:id/refresh-token` | POST | Tenant Owner | Refresh OAuth tokens |
| `GET /api/v1/tenants/:tenantId/integrations/:id/health` | GET | Tenant Owner | Check integration health |
| `POST /api/v1/tenants/:tenantId/integrations/:id/test` | POST | Tenant Owner | Test integration connectivity (rate-limited: 10/min) |

**Notes:**
- The OAuth Refresh flow is also available under the OAuth API as `POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh` with an optional `{ force?: boolean }` request body to bypass cached validity checks.
- The test endpoint validates token, API reachability, and scopes with optional one-time refresh retry on 401/403 errors.

#### Data Model
```typescript
interface CloudIntegration {
  _id: ObjectId;
  tenantId: ObjectId;              // Reference to tenant
  providerId: ObjectId;            // Reference to cloud provider
  status: 'active' | 'inactive' | 'error' | 'pending';
  authData: {
    accessToken: string;           // Encrypted OAuth access token
    refreshToken?: string;         // Encrypted OAuth refresh token
    expiresAt?: Date;             // Token expiration
    scope: string[];              // Granted scopes
  };
  userInfo?: {
    email: string;                // Provider account email
    name: string;                 // Provider account name
    providerId: string;           // Provider-specific user ID
  };
  health: {
    lastCheck: Date;
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorCount: number;
    lastError?: string;
  };
  usage: {
    totalRequests: number;
    lastRequest: Date;
    quotaUsed?: number;
    quotaLimit?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;               // Auth0 user ID
}
```

#### Business Rules
- **Tenant scoping**: Integrations belong to specific tenants
- **Provider uniqueness**: One integration per provider per tenant
- **Owner-only management**: Only tenant owners can manage integrations
- **Token encryption**: OAuth tokens are encrypted in storage
- **Deletion protection**: Cannot delete integrations used by projects
- **Health monitoring**: Regular health checks verify integration status

#### Error Codes
- `cloud-integration/not-found` - Integration not found
- `cloud-integration/already-exists` - Integration already exists for provider
- `cloud-integration/in-use` - Integration used by existing projects
- `cloud-integration/provider-not-found` - Referenced provider not found
- `cloud-integration/tenant-not-found` - Referenced tenant not found

### Virtual Files Feature

#### Overview
Virtual Files enable projects to access and manage files stored in cloud storage providers. Files are not persisted in the database but are fetched at runtime from configured cloud providers.

#### API Endpoints
| Endpoint | Method | Authorization | Description |
|----------|--------|---------------|-------------|
| `GET /api/v1/projects/:id/files` | GET | Project Member | List files for project |

#### Data Model
```typescript
interface VirtualFile {
  fileId: string;                  // Provider-specific file ID
  name: string;                    // File name
  mimeType: string;                // MIME type
  path: string;                    // Path in cloud storage
  status: 'pending' | 'processed' | 'error';
  size?: number;                   // File size in bytes
  createdAt?: Date;               // Creation timestamp
  modifiedAt?: Date;              // Last modification timestamp
  metadata?: {
    isFolder?: boolean;           // Whether item is a folder
    webViewLink?: string;         // Link to view in browser
    [key: string]: any;           // Provider-specific fields
  };
}
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `folder` | string | Path to folder to list (default: root) |
| `recursive` | boolean | Whether to list files in subfolders |
| `fileTypes` | string[] | Filter by file types (e.g., "pdf,docx") |
| `limit` | number | Maximum files to return (default: 100) |
| `page` | number | Page number for pagination |

#### Business Rules
- **Project context**: Files accessed within project context only
- **Role-based access**: File access controlled by project member roles
- **Cloud provider integration**: Files fetched using project's cloud integrations
- **Real-time fetching**: Files not stored in database, fetched on demand
- **Multiple providers**: Support for Google Drive, Dropbox, OneDrive

#### Error Codes
- `file/not-found` - File not found
- `file/project-not-found` - Project not found
- `file/cloud-integration-not-found` - Integration not found
- `file/cloud-provider-error` - Error communicating with provider
- `file/token-expired` - Cloud provider token expired
- `file/invalid-path` - Invalid file path specified

## 🔐 Security Patterns

### Authentication Requirements
- **Global authentication**: All API endpoints require Auth0 JWT tokens
- **Role-based authorization**: Endpoints protected by role middleware
- **Resource-level access**: Authorization checks specific resource ownership
- **Audit logging**: All write operations logged with user context

### Data Protection
- **Sensitive data encryption**: OAuth tokens and secrets encrypted at rest
- **Tenant isolation**: Data scoped to prevent cross-tenant access
- **Input validation**: All requests validated using Zod schemas
- **Error sanitization**: Internal errors sanitized before client response

### Authorization Patterns
```typescript
// Tenant-level authorization
router.use('/:tenantId', requireTenantOwner('tenantId'));

// Project-level authorization
router.patch('/:id', requireProjectRole('DEPUTY'), updateProject);

// Admin-only operations
router.use(requireSuperAdminRole());

// Flexible authorization (owner or admin)
router.get('/:id', requireTenantOwnerOrSuperAdmin('id'), getTenant);
```

## 📊 Common Patterns

### Error Handling
All features implement consistent error handling:
- **Custom error classes**: Specific error types with status codes
- **Error codes**: Machine-readable error identifiers
- **Sanitized responses**: No internal details exposed to clients
- **Audit logging**: Errors logged for debugging and monitoring

### Validation
- **Zod schemas**: Runtime validation for all requests
- **Business rule validation**: Custom validation in service layer
- **Database constraints**: Unique indexes and required fields
- **Type safety**: Full TypeScript coverage with strict mode

### Auditing
- **Operation logging**: All CRUD operations logged with context
- **User tracking**: Every operation associated with Auth0 user ID
- **Resource identification**: Clear resource IDs in all log entries
- **Security events**: Authentication and authorization events tracked

---
*This features guide provides comprehensive coverage of all MWAP backend features with consistent patterns for development, security, and maintenance.* 