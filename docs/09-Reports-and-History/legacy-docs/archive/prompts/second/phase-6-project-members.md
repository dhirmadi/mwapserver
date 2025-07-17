# 🧱 Phase 6: Projects and Members Domain

You are implementing the projects domain and member management for MWAP. Follow the architecture in `/docs/v3-architecture-reference.md` and API contract in `/docs/v3-api.md`.

## ✅ Task

Implement the projects domain with member management support.

## 🔍 Prerequisites

- Phases 1 -5  complete and tested
- Tenant management operational
- Cloud Integration orperational
- project types oeprational
- Role middleware configured

## 📦 API Endpoints

### Projects API

#### GET /api/v1/projects
```typescript
// Query Parameters
interface ProjectsQuery {
  tenantId?: string;
  type?: string;
  status?: 'active' | 'archived';
}

// Response
interface ProjectsResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    status: string;
    tenantId: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}
```

#### POST /api/v1/projects
```typescript
// Request
interface CreateProjectRequest {
  name: string;
  description?: string;
  type: string;
  tenantId: string;
}

// Response: ProjectResponse
```

#### GET /api/v1/projects/:id
```typescript
// Response: ProjectResponse
```

#### PATCH /api/v1/projects/:id
```typescript
// Request
interface UpdateProjectRequest {
  description?: string;
  status?: 'active' | 'archived';
}

// Response: ProjectResponse
```

#### DELETE /api/v1/projects/:id
```typescript
// Response
{
  "success": true
}
```

### Members API

#### GET /api/v1/projects/:id/members
```typescript
// Response
interface MembersResponse {
  data: Array<{
    userId: string;
    role: 'OWNER' | 'DEPUTY' | 'MEMBER';
    addedAt: string;
    addedBy: string;
  }>;
}
```

#### POST /api/v1/projects/:id/members
```typescript
// Request
interface AddMemberRequest {
  userId: string;
  role: 'DEPUTY' | 'MEMBER';
}

// Response: MemberResponse
```

#### PATCH /api/v1/projects/:id/members/:userId
```typescript
// Request
interface UpdateMemberRequest {
  role: 'DEPUTY' | 'MEMBER';
}

// Response: MemberResponse
```

#### DELETE /api/v1/projects/:id/members/:userId
```typescript
// Response
{
  "success": true
}
```

## 📝 Schema Definitions

```typescript
// project.schema.ts
export const projectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  type: z.string(),
  tenantId: z.string().uuid(),
  status: z.enum(['active', 'archived']).default('active')
});

// projectMember.schema.ts
export const memberSchema = z.object({
  userId: z.string(),
  role: z.enum(['OWNER', 'DEPUTY', 'MEMBER'])
});
```

## ❌ Error Handling

```typescript
// Error codes
PROJECT_NOT_FOUND = 'project/not-found'
PROJECT_NAME_EXISTS = 'project/name-exists'
MEMBER_EXISTS = 'project/member-exists'
MEMBER_NOT_FOUND = 'project/member-not-found'
INVALID_ROLE_CHANGE = 'project/invalid-role-change'

// Example error
{
  "success": false,
  "error": {
    "code": "project/member-exists",
    "message": "User is already a project member",
    "details": { "userId": "123", "projectId": "456" }
  }
}
```

## 🧪 Testing Requirements

1. Unit Tests (90% coverage):
   - Schema validation
   - Role enforcement
   - Member management
   - Project CRUD

2. Integration Tests:
   - Project lifecycle
   - Member operations
   - Role inheritance
   - Access control

## 🔒 Business Rules

1. Project Rules:
   - Names unique within tenant
   - Type immutable after creation
   - Only OWNER/SUPERADMIN can delete
   - Audit log all changes

2. Member Rules:
   - One OWNER required
   - OWNER role can't be removed
   - Only OWNER can change roles
   - No duplicate members

## 🛠 Implementation Files

```typescript
src/features/projects/
  - projects.routes.ts    # Route definitions
  - projects.controller.ts# Request handling
  - projects.service.ts   # Business logic
  - members.controller.ts # Member operations
  - members.service.ts    # Member management

src/schemas/
  - project.schema.ts     # Project schemas
  - projectMember.schema.ts # Member schemas
```

## ✅ Definition of Done

- All endpoints implemented
- Schema validation complete
- Role checks enforced
- Tests passing with coverage
- Documentation updated
- Audit logging implemented
- Error handling complete

## 🧠 Claude Constraints

- ❌ DO NOT modify tenant logic
- ❌ DO NOT skip role checks
- ❌ DO NOT return DB objects directly
- ✅ Use Phase 1 utilities
- ✅ STOP after testing

## 📚 Documentation

- Update API docs in `/docs/api.md`
- Update progress in `/status.md`
- Add member management guide
- Document role hierarchy
- Add error code reference