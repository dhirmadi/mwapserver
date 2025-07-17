🔧 Proceed to Phase 4: Project Types

- Build full CRUD support for `/api/v1/project-types`
- Access restricted to `SUPERADMIN` only
- Use Zod schema in `projectType.schema.ts`
- Field: `configSchema` must be a valid Zod-compatible JSON schema
- Enforce constraint: ProjectType **cannot be deleted if it is in use by any Project**
- Reuse: `authenticateJWT`, `requireRoles('SUPERADMIN')`, `jsonResponse`, `wrapAsyncHandler`
- Log audit events for create/update/delete
