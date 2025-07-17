# 🗺️ MWAP Backend Project Plan

This document defines the official, phased execution strategy for building the MWAP backend. It ensures full API compliance, modular architecture, secure authentication, and role-based access — ready for deployment and runtime execution.

---

## 🎯 Project Goal

Build a scalable, tenant-aware backend platform for AI-driven file processing — integrated with cloud storage and powered by microagents. This system must be fully functional, testable, and bootable with `npm run`.

---

## ⚙️ Tech Stack Summary

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
- Centralized logging, input validation, error handling
- Shared middleware for all route protection
- All inputs validated using Zod schemas
- No direct use of `res.json()` or `console.error()`

---

## 📌 Full API Endpoint Matrix

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

## 📶 Build Phases

Each phase includes a complete, reviewable deliverable and must pause for review before continuing.

---

### 🟦 Phase 1: Core Infrastructure

**Goal**: Bootstrap server with MongoDB, Auth0, and shared middleware.

**Required**:
- `config/`: `env.ts`, `db.ts`, `auth0.ts`
- `utils/`: `auth.ts`, `logger.ts`, `response.ts`, `errors.ts`, `validate.ts`
- `middleware/`: `auth.ts`, `roles.ts`, `errorHandler.ts`
- `app.ts`, `server.ts`

✅ **DoD**:
- Compiles with `tsc`
- Starts Express server
- Auth + DB connection functional
- No domain-specific logic generated

---

### 🟩 Phase 2: Tenants Domain

Implements `/api/v1/tenants` using:

- `features/tenants/`: `routes.ts`, `controller.ts`, `service.ts`
- `schemas/tenant.schema.ts`

✅ DoD:
- Enforces 1 tenant per user
- Auth and role protection in place
- Audit logging and Zod validation applied

---

### 🟨 Phase 3: Projects + Members

Implements:

- `/api/v1/projects`
- `/api/v1/projects/:id/members`

✅ DoD:
- Immutable fields respected
- Membership logic adheres to role enforcement
- Project owner is auto-added

---

### 🟥 Phase 4: Project Types

Implements:

- `/api/v1/project-types`

✅ DoD:
- `configSchema` is validated Zod JSON schema
- ProjectType cannot be deleted if used

---

### 🟪 Phase 5: Cloud Providers

Implements:

- `/api/v1/cloud-providers`

✅ DoD:
- Admin-only access
- Metadata and OAuth endpoints stored securely

---

### 🟧 Phase 6: Integrations

Implements:

- `/api/v1/tenants/:id/integrations`

✅ DoD:
- One integration per provider per tenant
- Secure handling of credentials
- Linked to tenant via `tenantId`

---

### 🟫 Phase 7: Virtual Files

Implements:

- `/api/v1/projects/:id/files`

✅ DoD:
- Runtime-only
- Files derived from project context + integration
- Role checks enforced

---

### 🧪 Phase 8: Testing

**Optional but recommended**

- Unit tests for each service
- Middleware coverage
- Zod validation unit tests

---

## ✅ Runtime & Build

Once complete, this app will:

- Compile via `tsc`
- Run via:

```bash
npm install
npm run build
npm start
