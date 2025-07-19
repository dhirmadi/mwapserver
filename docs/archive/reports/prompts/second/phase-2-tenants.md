# 🟩 Phase 2: Tenants Domain

You are implementing the full tenants domain for MWAP. Follow the domain model and security rules in `/docs/v3-domainmap.md`, and route structure from `/docs/v3-api.md`.

## ✅ Task

Implement full support for tenant creation, retrieval, update, and deletion.

## 🔍 Prerequisites

- Phase 1 infrastructure complete and tested
- MongoDB connection configured
- Auth0 integration verified

## 📦 API Endpoints

### POST /api/v1/tenants
```typescript
// Request
interface CreateTenantRequest {
  name: string;
  settings?: {
    allowPublicProjects: boolean;
    maxProjects: number;
  };
}

// Response
interface TenantResponse {
  id: string;
  name: string;
  ownerId: string; // Auth0 sub
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}
```

### GET /api/v1/tenants/me
```typescript
// Response: TenantResponse
```

### PATCH /api/v1/tenants/:id
```typescript
// Request
interface UpdateTenantRequest {
  name?: string;
  settings?: Partial<TenantSettings>;
}

// Response: TenantResponse
```

### DELETE /api/v1/tenants/:id
```typescript
// Response
{
  "success": true
}
```

## 🛠 Implementation Files

```typescript
src/features/tenants/
  - tenants.routes.ts    # Route definitions and middleware
  - tenants.controller.ts# Request handling and response formatting
  - tenants.service.ts   # Business logic and DB operations

src/schemas/
  - tenant.schema.ts     # Zod schemas and TypeScript types
```

## 📝 Schema Definition

```typescript
// tenant.schema.ts
export const tenantSchema = z.object({
  name: z.string().min(3).max(50),
  settings: z.object({
    allowPublicProjects: z.boolean(),
    maxProjects: z.number().int().min(1).max(100)
  }).optional()
});

export const tenantUpdateSchema = tenantSchema.partial();
```

## ❌ Error Handling

```typescript
// Error codes
TENANT_NOT_FOUND = 'tenant/not-found'
TENANT_EXISTS = 'tenant/already-exists'
TENANT_LIMIT = 'tenant/limit-reached'

// Example error response
{
  "success": false,
  "error": {
    "code": "tenant/not-found",
    "message": "Tenant not found",
    "details": { "id": "123" }
  }
}
```

## 🧪 Testing Requirements

1. Unit Tests (90% coverage):
   - Schema validation
   - Controller logic
   - Service methods
   - Error handling

2. Integration Tests:
   - Full CRUD operations
   - Role-based access
   - Audit logging
   - Constraint validation

## 🔒 Business Rules

- One tenant per user (Auth0 `sub`)
- Only SUPERADMIN can delete tenants
- OWNER/SUPERADMIN can update tenants
- All mutations must be audit logged
- Validate unique tenant names

## ✅ Definition of Done

- All endpoints implemented and tested
- Schema validation in place
- Role middleware configured
- Audit logging implemented
- Documentation updated
- No TypeScript errors
- Tests passing with coverage

## 🧠 Claude Constraints

- ❌ DO NOT return raw Mongo documents
- ❌ DO NOT hardcode role checks
- ❌ DO NOT skip schema validation
- ✅ Use shared utilities from Phase 1
- ✅ STOP when all endpoints are tested

## 📚 Documentation Updates

- Add tenant API docs to `/docs/api.md`
- Update progress in `/status.md`
- Document error codes
- Update schema documentation
- Add tenant management guide