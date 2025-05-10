# 🟪 Phase 5: Cloud Providers Domain

Implement the cloud providers registry system. Follow the architecture in `/docs/v3-architecture-reference.md`.

## ✅ Task

Create CRUD endpoints for managing cloud provider configurations. All operations require SUPERADMIN role.

## 🔍 Prerequisites

- Phases 1-4 complete and tested
- Project types operational
- SUPERADMIN role middleware configured

## 📦 API Endpoints

### GET /api/v1/cloud-providers
```typescript
// Response
interface CloudProvidersResponse {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    authType: 'oauth2' | 'apikey';
    configSchema: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

### POST /api/v1/cloud-providers
```typescript
// Request
interface CreateCloudProviderRequest {
  name: string;
  slug: string;
  description: string;
  authType: 'oauth2' | 'apikey';
  configSchema: Record<string, unknown>;
  isActive?: boolean;
}

// Response: CloudProviderResponse
```

### PATCH /api/v1/cloud-providers/:id
```typescript
// Request
interface UpdateCloudProviderRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Response: CloudProviderResponse
```

### DELETE /api/v1/cloud-providers/:id
```typescript
// Response
{
  "success": true
}
```

## 📝 Schema Definition

```typescript
// cloudProvider.schema.ts
export const cloudProviderSchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(500),
  authType: z.enum(['oauth2', 'apikey']),
  configSchema: z.record(z.unknown()),
  isActive: z.boolean().default(true)
});

export const cloudProviderUpdateSchema = cloudProviderSchema
  .partial()
  .omit({ slug: true, authType: true, configSchema: true });
```

## ❌ Error Handling

```typescript
// Error codes
PROVIDER_NOT_FOUND = 'cloud-provider/not-found'
PROVIDER_SLUG_EXISTS = 'cloud-provider/slug-exists'
PROVIDER_IN_USE = 'cloud-provider/in-use'
INVALID_CONFIG_SCHEMA = 'cloud-provider/invalid-schema'

// Example error
{
  "success": false,
  "error": {
    "code": "cloud-provider/slug-exists",
    "message": "Provider with this slug already exists",
    "details": { "slug": "aws-ec2" }
  }
}
```

## 🧪 Testing Requirements

1. Unit Tests (90% coverage):
   - Schema validation
   - CRUD operations
   - Slug validation
   - Config schema validation

2. Integration Tests:
   - Full CRUD workflow
   - Role enforcement
   - Unique slug constraint
   - Schema validation

## 🛠 Implementation Files

```typescript
src/features/cloud-providers/
  - cloudProviders.routes.ts    # Route definitions
  - cloudProviders.controller.ts# Request handling
  - cloudProviders.service.ts   # Business logic

src/schemas/
  - cloudProvider.schema.ts     # Type definitions
```

## 🔒 Business Rules

- Only SUPERADMIN can manage providers
- Slugs must be unique and URL-safe
- configSchema must be valid JSON Schema
- Cannot modify auth type after creation
- Audit log all changes

## ✅ Definition of Done

- All endpoints implemented
- Schema validation complete
- Slug uniqueness enforced
- Tests passing with coverage
- Documentation updated
- Audit logging implemented

## 🧠 Claude Constraints

- ❌ DO NOT modify project logic
- ❌ DO NOT skip SUPERADMIN checks
- ❌ DO NOT allow invalid schemas
- ✅ Use Phase 1 utilities
- ✅ STOP after testing

## 📚 Documentation

- Update API docs in `/docs/api.md`
- Update progress in `/status.md`
- Document provider configuration
- Add provider management guide
- Document auth type requirements