# 🟥 Phase 3: Project Types Domain

Implement the project types management system. Follow the architecture in `/docs/v3-architecture-reference.md`.

## ✅ Task

Add full CRUD operations for project types. All operations require SUPERADMIN role.

## 🔍 Prerequisites

- Phases 1-2 complete and tested
- Projects domain operational
- SUPERADMIN role middleware configured

## 📦 API Endpoints

### GET /api/v1/project-types
```typescript
// Response
interface ProjectTypesResponse {
  data: Array<{
    id: string;
    name: string;
    description: string;
    configSchema: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

### POST /api/v1/project-types
```typescript
// Request
interface CreateProjectTypeRequest {
  name: string;
  description: string;
  configSchema: Record<string, unknown>;
  isActive?: boolean;
}

// Response: ProjectTypeResponse
```

### PATCH /api/v1/project-types/:id
```typescript
// Request
interface UpdateProjectTypeRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Response: ProjectTypeResponse
```

### DELETE /api/v1/project-types/:id
```typescript
// Response
{
  "success": true
}
```

## 📝 Schema Definition

```typescript
// projectType.schema.ts
export const projectTypeSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500),
  configSchema: z.record(z.unknown()),
  isActive: z.boolean().default(true)
});

export const projectTypeUpdateSchema = projectTypeSchema
  .partial()
  .omit({ configSchema: true });
```

## ❌ Error Handling

```typescript
// Error codes
TYPE_NOT_FOUND = 'project-type/not-found'
TYPE_NAME_EXISTS = 'project-type/name-exists'
TYPE_IN_USE = 'project-type/in-use'
INVALID_CONFIG_SCHEMA = 'project-type/invalid-schema'

// Example error
{
  "success": false,
  "error": {
    "code": "project-type/in-use",
    "message": "Project type is in use by existing projects",
    "details": { "typeId": "123", "projectCount": 5 }
  }
}
```

## 🧪 Testing Requirements

1. Unit Tests (90% coverage):
   - Schema validation
   - CRUD operations
   - Config schema validation
   - Reference checking

2. Integration Tests:
   - Full CRUD workflow
   - Role enforcement
   - Project references
   - Schema validation

## 🛠 Implementation Files

```typescript
src/features/project-types/
  - projectTypes.routes.ts    # Route definitions
  - projectTypes.controller.ts# Request handling
  - projectTypes.service.ts   # Business logic

src/schemas/
  - projectType.schema.ts     # Type definitions
```

## 🔒 Business Rules

- Only SUPERADMIN can manage types
- configSchema must be valid JSON Schema
- Cannot delete types in use by projects
- Names must be unique
- Audit log all changes

## ✅ Definition of Done

- All endpoints implemented
- Schema validation complete
- Reference checks working
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
- Document config schema format
- Add type management guide
- Document validation rules