# 🗺️ MWAP Backend Project Plan

This document defines the execution strategy and technical expectations for building the MWAP backend API using Node.js, Express, MongoDB, Auth0, and Zod. It is used by both developers and automated scaffolding tools (e.g., Claude via OpenHands) during code generation to follow a staged, DRY, and testable build approach.

---

## 🎯 Goal

Implement a secure, modular, and tenant-isolated backend platform for cloud-integrated AI services. Follow the domain-driven architecture, route structure, and validation models as defined in the canonical documentation.

---

## ⚙️ Stack Summary

| Layer        | Technology                     |
|--------------|-------------------------------|
| Runtime      | Node.js 18+                   |
| Language     | TypeScript + ESModules        |
| Framework    | Express.js                    |
| DB           | MongoDB Atlas via Mongoose    |
| Validation   | Zod                           |
| Auth         | Auth0 JWT (RS256, JWKS)       |
| Testing      | Vitest or Jest                |
| Deployment   | Local + Heroku                |

---

## 🧱 Architecture Principles

- Domain-driven modular design (`/features/{domain}`)
- Thin controllers, fat services
- Strict use of shared middleware and utilities
- Schema-first validation via Zod
- No business logic in routes or controllers
- Errors handled via `errors.ts` + `response.ts`
- Auth enforced via `authenticateJWT()` and `requireProjectRole/requireTenantRole`

---

## 📌 API Endpoint Matrix (Full Scope)

| Domain              | Method | Path                                                 | Role Requirement         |
|---------------------|--------|------------------------------------------------------|--------------------------|
| 🏢 Tenants           | POST   | `/api/v1/tenants`                                    | Authenticated            |
|                     | GET    | `/api/v1/tenants/me`                                 | Authenticated            |
|                     | PATCH  | `/api/v1/tenants/:id`                                | OWNER or SUPERADMIN      |
|                     | DELETE | `/api/v1/tenants/:id`                                | SUPERADMIN               |
| 📦 Projects          | GET    | `/api/v1/projects`                                   | Authenticated            |
|                     | GET    | `/api/v1/projects/:id`                               | Authenticated            |
|                     | POST   | `/api/v1/projects`                                   | OWNER                    |
|                     | PATCH  | `/api/v1/projects/:id`                               | OWNER or DEPUTY          |
|                     | DELETE | `/api/v1/projects/:id`                               | OWNER or SUPERADMIN      |
| 👥 Project Members   | GET    | `/api/v1/projects/:id/members`                       | Project Member           |
|                     | POST   | `/api/v1/projects/:id/members`                       | OWNER or DEPUTY          |
|                     | PATCH  | `/api/v1/projects/:id/members/:userId`               | OWNER                    |
|                     | DELETE | `/api/v1/projects/:id/members/:userId`               | OWNER or DEPUTY          |
| 🧩 Project Types     | GET    | `/api/v1/project-types`                              | SUPERADMIN               |
|                     | POST   | `/api/v1/project-types`                              | SUPERADMIN               |
|                     | PATCH  | `/api/v1/project-types/:id`                          | SUPERADMIN               |
|                     | DELETE | `/api/v1/project-types/:id`                          | SUPERADMIN               |
| ☁️ Cloud Providers   | GET    | `/api/v1/cloud-providers`                            | SUPERADMIN               |
|                     | POST   | `/api/v1/cloud-providers`                            | SUPERADMIN               |
|                     | PATCH  | `/api/v1/cloud-providers/:id`                        | SUPERADMIN               |
|                     | DELETE | `/api/v1/cloud-providers/:id`                        | SUPERADMIN               |
| 🔌 Integrations      | GET    | `/api/v1/tenants/:id/integrations`                  | OWNER                    |
|                     | POST   | `/api/v1/tenants/:id/integrations`                  | OWNER                    |
|                     | DELETE | `/api/v1/tenants/:id/integrations/:integrationId`   | OWNER                    |
| 📂 Files (Virtual)   | GET    | `/api/v1/projects/:id/files`                         | OWNER, DEPUTY, MEMBER    |

---

## 📶 Execution Plan by Phase

Each phase includes a `Definition of Done` and may not be skipped or merged with others.

---

### 🟦 Phase 1: Core Infrastructure

**Components to Build**:

- `/src/config/`: `env.ts`, `db.ts`, `auth0.ts`
- `/src/utils/`: `auth.ts`, `logger.ts`, `response.ts`, `errors.ts`, `validate.ts`
- `/src/middleware/`: `auth.ts`, `roles.ts`, `errorHandler.ts`
- `/src/app.ts`, `/src/server.ts`

✅ **Definition of Done**:
- Server boots with MongoDB and Auth0 enabled
- Middleware and utilities are ready to support all routes
- No domain logic or endpoints are implemented yet

---

### 🟩 Phase 2: Tenants Domain

- `/features/tenants/`: `tenants.routes.ts`, `controller.ts`, `service.ts`
- `/schemas/tenant.schema.ts`
- Implements **ALL** `/tenants` endpoints

✅ DoD:
- Auth and role guards applied
- 1 tenant per user rule enforced
- Log audit for create/update/delete

---

### 🟥 Phase 3: Project Types

- `/features/project-types/`
- `/schemas/projectType.schema.ts`
- Admin-only access

✅ DoD:
- CRUD supported
- ConfigSchema is Zod-compatible
- Types cannot be deleted if used by projects

---

### 🟪 Phase 4: Cloud Providers

- `/features/cloud-providers/`
- `/schemas/cloudProvider.schema.ts`

✅ DoD:
- Admin CRUD
- Scopes, URLs, metadata saved
- Used only via integrations

---

### 🟧 Phase 5: Cloud Integrations

- `/features/integrations/`
- `/schemas/cloudIntegration.schema.ts`

✅ DoD:
- One integration per provider per tenant
- OAuth fields securely handled
- Tenant scoping enforced

---

### 🟨 Phase 6: Projects + Members

- `/features/projects/`
- `/schemas/project.schema.ts`, `projectMember.schema.ts`
- Implements:
  - `/projects`
  - `/projects/:id/members`

✅ DoD:
- All endpoints work
- Role-based access and immutability rules enforced
- Member operations protected by project roles

---

### 🟫 Phase 7: Virtual Files

- `/features/files/files.service.ts`
- `/features/files/files.controller.ts`
- `/features/files/files.routes.ts`
- `/schemas/file.schema.ts`

✅ DoD:
- Read-only file listing
- Files fetched dynamically via cloud integration
- Project access required
- Support for multiple cloud providers (Google Drive, Dropbox, OneDrive)
- Role-based access control
- Query parameters for folder navigation and filtering

---

## 🧪 Phase 8: Testing and Validation (Optional)

- Unit tests for services
- Middleware coverage
- Schema validation tests

---

## 📌 Execution Rules for Agents

- 🧠 **Do not invent folder structure** – reuse `/features`, `/schemas`, `/utils`
- 🔁 **Each route must match exactly** as defined in `v3-api.md`
- 🧱 **Use `wrapAsyncHandler`, `validateWithSchema`, `jsonResponse`**
- 🔒 **All routes require `authenticateJWT()` and role middleware**
- 🚫 **Never** call `res.json()` or `console.error()` directly
- 🧼 Use centralized logging and error handling only
- 🔁 Return only one phase at a time and wait for review

---

## 🧠 OpenHands / Claude

You are building an authenticated multi-tenant backend. Follow all security and role constraints exactly. Validate all inputs via Zod schemas. Reuse only what exists in `v3-architecture-reference.md` — never invent.

When done with each phase stop and commit the code. Do not start the next one unless instructed.
