## 2025-10-08

### Dropbox OAuth Integration Fix
- **Fixed Dropbox API Integration**: Resolved HTTP 400 errors when calling Dropbox `/2/users/get_current_account` endpoint
  - Root cause: Incorrect `Content-Type` header (was `application/x-www-form-urlencoded`, required `application/json`)
  - Solution: Updated axios calls to explicitly set `Content-Type: application/json` with `data: null`
  - Affected endpoints: Health check and test connectivity endpoints

### New Features
- **Integration Test Endpoint**: Added `POST /api/v1/tenants/:tenantId/integrations/:integrationId/test`
  - Tests integration connectivity and token validity with one-time refresh retry on 401/403
  - Rate limited: 10 requests per minute per integration
  - Returns detailed status: `tokenValid`, `apiReachable`, `scopesValid`, `responseTime`

### Improvements
- **Enhanced Logging**: Added comprehensive OAuth flow debugging capabilities (production-ready with minimal overhead)
- **Token Handling**: Verified encryption/decryption flow for long Dropbox tokens (1309 characters with `sl.u.` prefix)
- **Error Handling**: Improved Dropbox API error messages and status code handling

### Documentation Updates
- Updated API reference with integration test endpoint documentation
- Added troubleshooting guide for Dropbox OAuth integration
- Documented Dropbox token format and Content-Type requirements

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
