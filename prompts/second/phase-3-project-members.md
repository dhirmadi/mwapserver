# 🧱 Phase 3: Implement `/api/v1/projects` and `/projects/:id/members`

You are continuing work on the MWAP backend. Phases 1 and 2 are complete — the infrastructure and tenants domain are implemented and build successfully.

Now implement the **projects domain and member management** following the official architecture and API contract.

📚 Follow these canonical definitions:
- `v3-api.md` → endpoint definitions
- `v3-domainmap.md` → entity constraints and role rules
- `architecture-reference.md` → architecture and folder structure
- Use only Zod for validation
- Enforce auth via `authenticateJWT()` and roles via `requireProjectRole()` or `assertProjectAccess()`

---

## ✅ Required Endpoints

Implement the following:

### `/api/v1/projects`
- `GET` – List all accessible projects for the user
- `GET /:id` – Get single project (must be a member)
- `POST` – Create new project
- `PATCH /:id` – Update project (must be OWNER or DEPUTY)
- `DELETE /:id` – Delete project (must be OWNER or SUPERADMIN)

### `/api/v1/projects/:id/members`
- `GET` – List project members (must be member)
- `POST` – Add new member (OWNER or DEPUTY only)
- `PATCH /:userId` – Change role of member (OWNER only)
- `DELETE /:userId` – Remove member (OWNER or DEPUTY)

---

## 🔐 Business Rules to Enforce

- `OWNER` must always be a project member
- No duplicate members (by userId)
- Only `OWNER` can change member roles
- `PROJECT.name` and `type` are **immutable** after creation
- Every action must be audit-logged via `logAudit`

---

## 📁 File Structure

Create or complete the following:

```
/features/projects/
  - projects.routes.ts
  - projects.controller.ts
  - projects.service.ts
  - members.controller.ts
/schemas/
  - project.schema.ts
  - projectMember.schema.ts
```

---

## 🧱 Constraints

- Reuse utilities: `validateWithSchema`, `wrapAsyncHandler`, `jsonResponse`
- Reuse middleware: `authenticateJWT`, `requireProjectRole`
- Do NOT add new folders or change shared code
- Log all changes via `logAudit`
- Validate all input with Zod
- Do not create new endpoints beyond the ones listed

✅ Stop once all endpoints are implemented and compile cleanly. Wait for review before starting Phase 4.