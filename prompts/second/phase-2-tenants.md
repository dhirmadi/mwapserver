# 🟩 Phase 2: Tenants Domain (Improved Prompt)

You are implementing the full tenants domain for MWAP. All endpoints must follow the domain model and security rules in `v3-domainmap.md`, and route structure from `v3-api.md`.

## ✅ Task

Implement full support for tenant creation, retrieval, update, and deletion.

## 📦 Endpoints to Implement

- `POST /api/v1/tenants` – Create new tenant (Authenticated user only)
- `GET /api/v1/tenants/me` – Return tenant by current Auth0 sub
- `PATCH /api/v1/tenants/:id` – Update tenant (OWNER or SUPERADMIN)
- `DELETE /api/v1/tenants/:id` – Delete tenant (SUPERADMIN only)

## 🛠 Files to Create

```
src/features/tenants/
  - tenants.routes.ts
  - tenants.controller.ts
  - tenants.service.ts

src/schemas/
  - tenant.schema.ts
```

## 🔒 Business Constraints

- One tenant per user (Auth0 `sub`)
- Cannot delete unless SUPERADMIN
- Log all mutations with `logAudit`

## ✅ Definition of Done

- Zod schemas applied on POST, PATCH
- Role middleware enforced per route
- All responses use `jsonResponse`
- Services are used for business logic only
- `wrapAsyncHandler()` used on all routes

## 🧠 Claude Constraints

- ❌ DO NOT return raw Mongo objects
- ❌ DO NOT hardcode role checks — use `requireTenantRole()`
- ✅ STOP when all four endpoints are tested and compile