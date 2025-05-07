# 📘 MWAP API Contract

This document defines the **canonical API endpoints** of the MWAP backend, based on the updated domain model and backend architecture. All endpoints are authenticated, role-based, and return Zod-validated responses.

---

## 🔐 Authentication

* All routes require Auth0 JWT (Bearer token)
* Roles are enforced per tenant and/or project scope via middleware (`verifyProjectRole`, `requireRoles`)

---

## 🏢 Tenants

| Endpoint              | Method | Role                    | Request Schema                                      | Response Schema |
| --------------------- | ------ | ----------------------- | --------------------------------------------------- | --------------- |
| `/api/v1/tenants`     | POST   | Authenticated           | `TenantSchema.pick({ name: true })`                 | `TenantSchema`  |
| `/api/v1/tenants/me`  | GET    | Authenticated           | —                                                   | `TenantSchema`  |
| `/api/v1/tenants/:id` | PATCH  | `OWNER` or `SUPERADMIN` | `TenantSchema.pick({ name: true, archived: true })` | `TenantSchema`  |
| `/api/v1/tenants/:id` | DELETE | `SUPERADMIN`            | -                                                   | `204`           |

---

## ☁️ CloudProvider + Integrations

| Endpoint                                          | Method | Role       | Request Schema                                       | Response Schema                    |
| ------------------------------------------------- | ------ | ---------- | ---------------------------------------------------- | ---------------------------------- |
| `/api/v1/cloud-providers`                         | GET    | SUPERADMIN | —                                                    | `CloudProviderSchema[]`            |
| `/api/v1/cloud-providers`                         | POST   | SUPERADMIN | `CloudProviderSchema.omit({ _id: true })`            | `CloudProviderSchema`              |
| `/api/v1/cloud-providers/:id`                     | PATCH  | SUPERADMIN | `CloudProviderSchema`                                | `CloudProviderSchema`              |
| `/api/v1/cloud-providers/:id`                     | DELETE | SUPERADMIN | —                                                    | `204`                              |
| `/api/v1/tenants/:id/integrations`                | GET    | `OWNER`    | —                                                    | `CloudProviderIntegrationSchema[]` |
| `/api/v1/tenants/:id/integrations`                | POST   | `OWNER`    | `CloudProviderIntegrationSchema.omit({ _id: true })` | `CloudProviderIntegrationSchema`   |
| `/api/v1/tenants/:id/integrations/:integrationId` | DELETE | `OWNER`    | —                                                    | `204`                              |

---

## 📦 Projects

| Endpoint               | Method | Role                 | Request Schema                                          | Response Schema   |
| ---------------------- | ------ | -----------------    | ------------------------------------------------------- | ----------------- |
| `/api/v1/projects`     | GET    | Authenticated        | —                                                       | `ProjectSchema[]` |
| `/api/v1/projects/:id` | GET    | Authenticated        | —                                                       | `ProjectSchema` |
| `/api/v1/projects`     | POST   | `OWNER`              | `ProjectSchema.omit({ _id: true })`                     | `ProjectSchema`   |
| `/api/v1/projects/:id` | PATCH  | `OWNER`, `DEPUTY`    | `ProjectSchema.pick({ name: true, description: true })` | `ProjectSchema`   |
| `/api/v1/projects/:id` | DELETE | `OWNER`, `SUPERADMIN`| —                                                       | `204`             |



---

## 👥 Project Members

| Endpoint                               | Method | Role              | Request Schema                             | Response Schema         |
| -------------------------------------- | ------ | ----------------- | ------------------------------------------ | ----------------------- |
| `/api/v1/projects/:id/members`         | GET    | Project Member    | —                                          | `ProjectMemberSchema[]` |
| `/api/v1/projects/:id/members`         | POST   | `OWNER`, `DEPUTY` | `ProjectMemberSchema`                      | `204`                   |
| `/api/v1/projects/:id/members/:userId` | PATCH  | `OWNER`           | `ProjectMemberSchema.pick({ role: true })` | `204`                   |
| `/api/v1/projects/:id/members/:userId` | DELETE | `OWNER`, `DEPUTY` | —                                          | `204`                   |

---

## 🧩 Project Types

| Endpoint                    | Method | Role       | Request Schema                          | Response Schema       |
| --------------------------- | ------ | ---------- | --------------------------------------- | --------------------- |
| `/api/v1/project-types`     | GET    | SUPERADMIN | —                                       | `ProjectTypeSchema[]` |
| `/api/v1/project-types`     | POST   | SUPERADMIN | `ProjectTypeSchema.omit({ _id: true })` | `ProjectTypeSchema`   |
| `/api/v1/project-types/:id` | PATCH  | SUPERADMIN | `ProjectTypeSchema`                     | `ProjectTypeSchema`   |
| `/api/v1/project-types/:id` | DELETE | SUPERADMIN | —                                       | `204`                 |

---

## 📂 Cloud Files (Virtual)

| Endpoint                     | Method | Role                        | Request Schema               | Response Schema |
| ---------------------------- | ------ | --------------------------- | ---------------------------- | --------------- |
| `/api/v1/projects/:id/files` | GET    | `OWNER`, `DEPUTY`, `MEMBER` | `query: { folder?: string }` | `FileSchema[]`  |

> Files are derived at runtime via CloudProviderIntegration. Not persisted in the DB.


---
