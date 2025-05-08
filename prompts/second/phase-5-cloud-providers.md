# 🟪 Phase 5: Cloud Providers (Improved Prompt)

Create static cloud provider registry endpoints — admin-only.

## 📦 Endpoints

- GET `/api/v1/cloud-providers`
- POST `/api/v1/cloud-providers`
- PATCH `/api/v1/cloud-providers/:id`
- DELETE `/api/v1/cloud-providers/:id`

## 🛠 Files

```
src/features/cloud-providers/
  - cloudProviders.routes.ts
  - cloudProviders.controller.ts
  - cloudProviders.service.ts

src/schemas/
  - cloudProvider.schema.ts
```

## 🔒 Constraints

- Slug must be unique
- Use `requireRoles('SUPERADMIN')` only