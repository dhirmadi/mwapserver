# 🟥 Phase 4: Project Types (Improved Prompt)

Add full CRUD for `project-types`. All operations require `SUPERADMIN` role.

## 📦 Endpoints

- GET `/api/v1/project-types`
- POST `/api/v1/project-types`
- PATCH `/api/v1/project-types/:id`
- DELETE `/api/v1/project-types/:id`

## 🛠 Files

```
src/features/project-types/
  - projectTypes.routes.ts
  - projectTypes.controller.ts
  - projectTypes.service.ts

src/schemas/
  - projectType.schema.ts
```

## 🔒 Constraints

- `configSchema` must be a valid JSON-Zod object
- Cannot DELETE if referenced by any project

## ✅ Done When

- Uses `requireRoles('SUPERADMIN')`
- Zod schema for body on POST, PATCH
- Checks project references before DELETE