# 🟫 Phase 7: Virtual Files (Improved Prompt)

Create read-only support for `/api/v1/projects/:id/files`.

## ✅ Endpoint

- GET `/projects/:id/files?folder=optional`

## 🛠 Files to Create

```
/features/cloud/
  - files.controller.ts
/schemas/
  - file.schema.ts
```

## 🔐 Constraints

- Runtime-only, no DB persistence
- Must use project’s `cloudIntegrationId` and `folderpath`
- Enforce access using `assertProjectAccess`

## ✅ Definition of Done

- Response shape matches `FileSchema[]`
- Handles query param `folder` safely
- Secure, read-only, scoped to project members