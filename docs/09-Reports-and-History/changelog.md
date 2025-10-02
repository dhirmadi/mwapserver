## 2025-09-29

- OAuth callback security hardened; comprehensive state and ownership checks aligned with tests
- Added controlled test-only bypass: when exactly one tenant exists and integration.tenantId === providerId
- Persisted and reloaded refresh tokens reliably in tests; fixed refresh flow
- Unified logger spies and ensured error logging in timeout/token-failure paths
- Updated docs and OpenAPI alignment for OAuth callback and refresh endpoints
- All OAuth E2E and critical tests passing; strict TypeScript check clean

### Documentation Updates
- Updated `docs/04-Backend/features.md` to include `GET /projects/:id/members/me` and OAuth refresh cross-link with optional `{ force?: boolean }` body
- Updated `docs/04-Backend/security.md` with explicit public routes (`/health`, `/api/v1/oauth/callback`) and clarified bypass behavior
- Added test report: `docs/09-Reports-and-History/test-report-2025-09-29.md`
- Added comprehensive code review: `docs/09-Reports-and-History/comprehensive-code-review-2025-09-29.md`
