---
name: node_backend
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - node
  - express
  - backend
  - api
---

# Node.js Backend Rules (MWAP)

## Stack
- Node.js (ESM) + Express
- MongoDB (Atlas)
- Auth0 (JWT RS256)
- Vitest for tests

## Patterns
- Feature-first layout: `src/features/<feature>/{routes,controller,service}.ts`
- Validation at controller boundary with Zod
- Use `ApiError` and `errorResponse(res, error)` for failures
- Use `jsonResponse(res, status, data)` for success
- OAuth callback is public via `isPublicRoute`; other routes require JWT
- Log with `logger` and `logAudit(action, actor, target, meta)` for sensitive ops

## MongoDB
- Prefer string ids at API edge; convert with `new ObjectId(id)` for queries
- Index frequently queried fields (tenantId, providerId, projectTypeId)

## Security
- Enforce tenant ownership on reads/writes
- Generic errors on public routes; no sensitive detail leakage
- Rate limit sensitive endpoints

## Testing
- Unit/integration using Vitest + Supertest
- No browser/E2E


