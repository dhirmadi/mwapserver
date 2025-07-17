# 🟫 Phase 7: Virtual Files Domain

Implement the virtual file system for cloud storage access. Follow the architecture in `/docs/v3-architecture-reference.md`.

## ✅ Task

Create read-only API endpoint for accessing cloud provider files through project integrations.

## 🔍 Prerequisites

- Phases 1-6 complete and tested
- Cloud integrations operational
- Project access control working
- Provider clients configured

## 📦 API Endpoint

### GET /api/v1/projects/:id/files
```typescript
// Query Parameters
interface FilesQuery {
  folder?: string;     // Optional subfolder path
  pageToken?: string;  // For pagination
  pageSize?: number;   // Default: 100, max: 1000
}

// Response
interface FilesResponse {
  data: Array<{
    name: string;
    path: string;
    type: 'file' | 'folder';
    size?: number;
    modifiedAt?: string;
    metadata?: Record<string, unknown>;
  }>;
  pagination: {
    nextPageToken?: string;
    hasMore: boolean;
  };
}
```

## 📝 Schema Definition

```typescript
// file.schema.ts
export const fileSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(['file', 'folder']),
  size: z.number().optional(),
  modifiedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const filesQuerySchema = z.object({
  folder: z.string().optional(),
  pageToken: z.string().optional(),
  pageSize: z.number().min(1).max(1000).default(100)
});
```

## ❌ Error Handling

```typescript
// Error codes
PROJECT_NOT_FOUND = 'project/not-found'
INTEGRATION_NOT_FOUND = 'integration/not-found'
FOLDER_NOT_FOUND = 'files/folder-not-found'
PROVIDER_ERROR = 'files/provider-error'

// Example error
{
  "success": false,
  "error": {
    "code": "files/folder-not-found",
    "message": "Specified folder does not exist",
    "details": { 
      "folder": "/invalid/path",
      "projectId": "123"
    }
  }
}
```

## 🧪 Testing Requirements

1. Unit Tests (90% coverage):
   - Schema validation
   - Path sanitization
   - Access control
   - Error handling

2. Integration Tests:
   - Provider connectivity
   - Pagination
   - Folder navigation
   - Access control

## 🛠 Implementation Files

```typescript
src/features/cloud/
  - files.routes.ts       # Route definition
  - files.controller.ts   # Request handling
  - files.service.ts      # Business logic
  - provider.client.ts    # Provider API client
  - path.utils.ts         # Path manipulation

src/schemas/
  - file.schema.ts        # Type definitions
```

## 🔒 Business Rules

- Read-only access only
- Must be project member
- Sanitize all paths
- Validate folder exists
- Handle provider errors
- Cache responses (optional)

## ✅ Definition of Done

- Endpoint implemented
- Path validation working
- Access control enforced
- Provider integration tested
- Documentation updated
- Error handling complete

## 🧠 Claude Constraints

- ❌ DO NOT modify project data
- ❌ DO NOT skip access checks
- ❌ DO NOT trust raw paths
- ✅ Use Phase 1 utilities
- ✅ STOP after testing

## 📚 Documentation

- Update API docs in `/docs/api.md`
- Update progress in `/status.md`
- Document file access patterns
- Add path format guide
- Document error scenarios