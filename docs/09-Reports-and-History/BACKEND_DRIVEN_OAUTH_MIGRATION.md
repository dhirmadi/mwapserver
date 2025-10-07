## Backend-driven OAuth Implementation Plan (State-of-the-art)

### Purpose
Implement OAuth token exchange and security-critical logic entirely on the backend for cloud provider integrations. This eliminates client-origin PKCE/state mismatches, prevents stale metadata, and ensures secrets and refresh tokens never touch the browser.

### Scope
- Applies to all cloud provider integrations (e.g., Dropbox, Google Drive, OneDrive).
- Complete rewrite of OAuth flow: backend-initiated, backend-executed token exchange.
- Frontend simplified to: initiate → open popup → receive result.
- Clean removal of all client-side OAuth logic (PKCE generation, token exchange, metadata storage).

---

## Architecture Overview

- **Backend authoritative**: The server generates PKCE (verifier/challenge), creates and signs `state`, stores ephemeral OAuth flow context, and performs token exchange and persistence.
- **Single callback**: Providers redirect to backend callback only: `/api/v1/oauth/callback`.
- **Frontend role**: Create or select integration, call “initiate” to receive `authorizationUrl`, open popup, and await postMessage result (success/error). Optionally verify integration status after success.
- **Security**:
  - PKCE verifier generated server-side; challenge (S256) sent to provider; verifier kept server-side only.
  - `state` is an HMAC-signed payload with `tenantId`, `integrationId`, `nonce`, `iat`/`exp`.
  - Client secrets stored server-side (env/secret manager). Refresh tokens encrypted at rest (KMS/AES-GCM). No secrets in docs or client.
  - Strict redirect URI allowlists in provider app: only `https://<api-domain>/api/v1/oauth/callback`.
  - Concurrency controls (per-integration flow lock) to avoid double inits and state overwrite.

---

## Backend Changes

### Data model (conceptual)
- Integration persists tokens server-side:
  - `accessToken` (short-lived, optional), `refreshToken` (encrypted), `expiresAt`, `scopes`, `providerUserId`.
  - `oauth` subdoc: `flowId`, `nonce`, `pkceVerifier` (encrypted), `stateHash`, `createdAt`, `expiresAt`, `status: 'idle'|'initiated'|'exchanging'|'completed'|'error'`.
  - No PKCE fields in public `metadata` returned to the client.

### New/Updated Endpoints

1) Initiate OAuth (server-generated PKCE + state)

```
POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/initiate
```

- Auth: Bearer (end-user).
- Request body (optional):
```json
{}
```
- Server behavior:
  - Validate tenant ownership and integration.
  - Generate `pkceVerifier`, `codeChallenge` (S256), `nonce`, and `state` (HMAC-signed JSON with tenantId, integrationId, nonce, iat/exp).
  - Persist ephemeral flow context and mark `oauth.status = 'initiated'`.
  - Build provider authorization URL using backend callback `https://<api-domain>/api/v1/oauth/callback` and return it.
- Response:
```json
{
  "success": true,
  "data": { "authorizationUrl": "https://provider/auth?..." }
}
```

2) OAuth Callback (provider -> backend)

```
GET /api/v1/oauth/callback?code=...&state=...
```

- Server behavior:
  - Parse and validate `state` (HMAC, `exp`, nonce, tenant/integration).
  - Look up stored PKCE verifier for this flow; exchange `code` for tokens with provider using server-stored `clientId`/`clientSecret`.
  - Persist tokens securely; update integration `status = 'active'` and clear ephemeral flow context.
  - Redirect to frontend:
    - On success: `302 Location: https://<app-domain>/oauth/success?tenantId=...&integrationId=...`
    - On error: `302 Location: https://<app-domain>/oauth/error?message=...`

3) Verify Integration (optional post-success check)

```
GET /api/v1/tenants/{tenantId}/integrations/{integrationId}
```

- Auth: Bearer (end-user). Returns sanitized integration (never tokens).
- Frontend uses this to confirm `status === 'active'`.

4) Reset OAuth Flow (cleanup stale flow safely)

```
POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/reset
```

- Auth: Bearer (end-user).
- Behavior: Clears ephemeral OAuth fields (`oauth.*` flow context) without deleting the integration or tokens.
- Response:
```json
{ "success": true }
```

5) Delete Integration (existing)

```
DELETE /api/v1/tenants/{tenantId}/integrations/{integrationId}
```

- Auth: Bearer (end-user). Deletes integration and securely purges tokens.

6) Refresh Tokens (server-side)

```
POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/refresh
```

- Auth: Bearer (end-user) or internal job. Exchanges refresh token for a new access token; updates expiry.

### Endpoints to Remove

**Complete removal** (no backward compatibility needed):
```
POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/complete
```
This endpoint allowed client-driven token exchange and is **completely removed**. The backend callback now handles all token exchange.

### Security/Config Requirements
- Secrets (provider client secret, HMAC signing key) sourced from environment/secret manager; never committed.
- Encrypt `refreshToken` and `pkceVerifier` at rest (KMS/AES-GCM with key rotation policy).
- State TTL: 10 minutes (configurable).
- Rate-limit initiate and callback per integration/tenant.
- Flow lock: only one active `initiated` flow allowed per integration at a time.
- Comprehensive audit logs: initiation, callback, refresh, revoke, delete.

---

## Frontend Changes

### High-level Flow
1) Create/select integration (no PKCE or redirect URI in `metadata`).
2) Call `POST /oauth/.../initiate`; receive `authorizationUrl`.
3) Open popup to `authorizationUrl`.
4) Backend handles callback and redirects popup to `https://<app-domain>/oauth/{success|error}`.
5) The callback page posts a message to the opener with `{ type: 'oauth_success' | 'oauth_error', integrationId?, description? }`.
6) Opener verifies integration via `GET /tenants/{tenantId}/integrations/{integrationId}` and updates UI.

### What to remove from the frontend
- Remove generation and storage of PKCE values in integration `metadata` (`code_verifier`, `code_challenge`, `code_challenge_method`).
- Stop sending/maintaining `redirect_uri` in `metadata` (backend uses its callback only).
- Remove `POST /oauth/.../complete` call in the callback page.
- Keep popup success/error UX and optional cleanup button (which may call `reset` or `delete`).

### Minimal Frontend API usage examples

Initiate:
```http
POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/initiate
Authorization: Bearer <jwt>
Content-Type: application/json

{}
```
Response:
```json
{
  "success": true,
  "data": { "authorizationUrl": "https://www.dropbox.com/oauth2/authorize?..." }
}
```

Verify after popup success:
```http
GET /api/v1/tenants/{tenantId}/integrations/{integrationId}
Authorization: Bearer <jwt>
```

Reset stale flow (optional):
```http
POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/reset
Authorization: Bearer <jwt>
```

Delete integration (cleanup):
```http
DELETE /api/v1/tenants/{tenantId}/integrations/{integrationId}
Authorization: Bearer <jwt>
```

---

## Backend Implementation Tasks

### Remove Old OAuth Logic
1. **Delete `/complete` endpoint** entirely from routes and controllers.
2. **Remove client PKCE acceptance**: Initiate endpoint must not accept or use client-provided `code_verifier`, `code_challenge`, or `redirect_uri`.
3. **Purge existing integrations**: Since this is a new application, delete all existing integration records with incomplete OAuth state. Fresh start.

### Implement New OAuth Logic
1. **State signing**: Implement HMAC-SHA256 signing/verification for `state` parameter with configurable secret and 10-minute TTL.
2. **PKCE generation**: Server-side PKCE verifier (43-128 chars, URL-safe) and S256 challenge.
3. **Flow context storage**: Add `oauth` subdocument to integration schema with ephemeral fields (`flowId`, `nonce`, `pkceVerifier` encrypted, `stateHash`, `status`, `createdAt`, `expiresAt`).
4. **Token storage**: Add encrypted `accessToken`, `refreshToken`, `expiresAt`, `scopes`, `providerUserId` to integration model.
5. **Concurrency lock**: Implement per-integration flow lock (Redis or DB flag) to prevent double-initiation.
6. **Callback handler**: Parse state, validate HMAC/nonce/expiry, exchange code for tokens, persist tokens, redirect to frontend success/error.
7. **Reset endpoint**: Clear `oauth` subdoc without deleting integration.
8. **Refresh endpoint**: Exchange refresh token for new access token.

### Security Hardening
1. Store `OAUTH_STATE_SECRET` and provider `clientSecret` in environment/secret manager.
2. Encrypt `refreshToken` and `pkceVerifier` at rest using KMS or AES-GCM with key rotation.
3. Rate-limit initiate (5/min per integration) and callback (10/min per tenant).
4. Audit log: initiate, callback success/failure, refresh, revoke, delete.
5. Validate provider callback origin; reject unexpected redirects.

## Frontend Implementation Tasks

### Remove Old OAuth Logic
1. **Delete PKCE utilities**: Remove `generatePKCEChallenge`, `validatePKCEParameters` from `src/features/integrations/utils/oauthUtils.ts`.
2. **Remove metadata writes**: Stop writing `code_verifier`, `code_challenge`, `code_challenge_method`, `redirect_uri` to integration `metadata` in `useOAuthFlow.ts`.
3. **Delete `/complete` call**: Remove code exchange logic from `OAuthCallbackPage.tsx`.
4. **Remove localStorage pending context**: No longer needed; backend owns flow state.
5. **Clean up `getOAuthCallbackUri`**: Remove or mark as deprecated; backend callback is authoritative.

### Implement New OAuth Logic
1. **Simplify `useOAuthFlow.initiateOAuth`**:
   - Remove PKCE generation.
   - Remove 409 recovery path (no stale integrations).
   - Call `POST /oauth/.../initiate` with empty body.
   - Return `authorizationUrl` only.
2. **Update `OAuthButton`**:
   - Open popup to `authorizationUrl`.
   - Listen for `oauth_success` or `oauth_error` postMessage.
   - On success: verify integration status via `GET /tenants/.../integrations/{id}`.
   - On error: show cleanup modal with "Remove integration" (calls `DELETE`).
3. **Update `OAuthCallbackPage`**:
   - Remove code exchange logic.
   - Parse URL params (`/oauth/success?tenantId=...&integrationId=...` or `/oauth/error?message=...`).
   - Post message to opener: `{ type: 'oauth_success', integrationId }` or `{ type: 'oauth_error', description }`.
   - Close popup after 2-3 seconds.
4. **Add reset action** (optional): Button to call `POST /oauth/.../reset` if user wants to retry without deleting integration.

### UI/UX Enhancements
1. Show clear error messages with actionable buttons ("Remove integration", "Retry").
2. Disable OAuth button during active flow (prevent double-click).
3. Add loading states and progress indicators.
4. Show integration status badge (pending → active → expired).

---

## Deployment Strategy

Since this is a new application with no production users yet:

1. **Backend**: Implement all new endpoints and remove old logic in a single release.
2. **Database**: Delete all existing integration records (fresh start).
3. **Frontend**: Remove old OAuth logic and implement new flow in a single release.
4. **Provider config**: Update Dropbox (and other providers) to allow only backend callback URI: `https://mwapss.shibari.photo/api/v1/oauth/callback`.
5. **Environment**: Set `OAUTH_STATE_SECRET` and ensure all provider `clientSecret` values are in environment/secret manager.
6. **Deploy**: Backend first, then frontend (to avoid frontend calling non-existent endpoints).
7. **Test**: Full E2E OAuth flow for each provider before marking as complete.

## Test Plan

- Unit tests: state signing/verification, PKCE generation/validation, token exchange, error branches.
- Integration tests: full roundtrip for multiple providers; concurrent initiations; expired state; denied consent.
- Security tests: replay protection, CSRF, rate limits, secret exposure checks, token storage encryption and rotation.
- Manual E2E: open popup, approve, verify status updates; fail path shows error and reset works; repeated initiations locked.

## Critical Review / Risks

- Ensure provider app allows only backend callback URI; remove frontend callback from provider config.
- Concurrency: without a per-integration lock, quick double-clicks overwrite flow context; lock is mandatory.
- State TTL: too short → false negatives; too long → replay risk. Keep ~10 minutes.
- Logging: avoid logging secrets or tokens; audit events only.
- Data retention: encrypted refresh tokens with key rotation schedule; handle key rotation in decrypt path.
- Frontend caching: make sure UI invalidates integration lists/status after success, reset, or delete.

## Summary of Endpoint Contract (final)

- `POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/initiate` → `{ authorizationUrl }`
- `GET  /api/v1/oauth/callback?code&state` → redirects to `/oauth/success|/oauth/error`
- `GET  /api/v1/tenants/{tenantId}/integrations/{integrationId}` → integration status (sanitized)
- `POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/reset` → clear flow context
- `POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/refresh` → refresh token (server-side)
- `DELETE /api/v1/tenants/{tenantId}/integrations/{integrationId}` → delete integration

This design centralizes sensitive logic in the backend, eliminates PKCE/state drift, and provides robust recovery and verification paths for a reliable, secure OAuth experience.

---

## Complete Project Plan

### Phase 1: Backend Implementation (Estimated: 3-5 days)

#### Day 1: Core OAuth Infrastructure
**Tasks:**
1. Add `oauth` subdocument to Integration schema:
   ```typescript
   oauth: {
     flowId: string;           // UUID for this flow
     nonce: string;            // CSRF protection
     pkceVerifier: string;     // Encrypted
     stateHash: string;        // HMAC of state for validation
     status: 'idle' | 'initiated' | 'exchanging' | 'completed' | 'error';
     createdAt: Date;
     expiresAt: Date;
   }
   ```
2. Add token fields to Integration schema:
   ```typescript
   accessToken: string;        // Encrypted (optional, short-lived)
   refreshToken: string;       // Encrypted
   tokenExpiresAt: Date;
   scopes: string[];
   providerUserId: string;
   ```
3. Implement state signing utility:
   - `signState(payload)` → HMAC-SHA256 signed string
   - `verifyState(stateParam)` → validated payload or null
4. Implement PKCE generation utility:
   - `generatePKCEVerifier()` → 43-128 char URL-safe string
   - `generatePKCEChallenge(verifier)` → S256 hash
5. Implement encryption utilities for tokens and PKCE verifier.

**Deliverables:**
- Schema migration script
- Crypto utilities with unit tests
- Environment variables documented (`OAUTH_STATE_SECRET`, `ENCRYPTION_KEY`)

#### Day 2: Initiate Endpoint
**Tasks:**
1. Implement `POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/initiate`:
   - Validate tenant ownership and integration exists.
   - Check for active flow (lock); return error if already initiated.
   - Generate PKCE verifier and challenge.
   - Generate nonce and state payload.
   - Sign state with HMAC.
   - Persist flow context to `integration.oauth`.
   - Build authorization URL with backend callback.
   - Return `{ authorizationUrl }`.
2. Add flow lock mechanism (Redis or DB flag).
3. Add rate limiting (5 requests/min per integration).

**Deliverables:**
- Initiate endpoint with unit and integration tests
- Flow lock implementation
- Rate limiting middleware

#### Day 3: Callback Endpoint
**Tasks:**
1. Implement `GET /api/v1/oauth/callback?code=...&state=...`:
   - Parse and verify state (HMAC, expiry, nonce).
   - Look up integration by state payload.
   - Retrieve stored PKCE verifier.
   - Exchange code for tokens with provider (POST to `tokenUrl`).
   - Encrypt and persist tokens.
   - Update integration status to `active`.
   - Clear ephemeral flow context.
   - Redirect to frontend success or error page.
2. Handle error cases:
   - Invalid state → redirect to `/oauth/error?message=Invalid security token`
   - Token exchange failure → redirect to `/oauth/error?message=Token exchange failed`
   - Network errors → redirect to `/oauth/error?message=Provider unavailable`

**Deliverables:**
- Callback endpoint with comprehensive error handling
- Token exchange logic with retry mechanism
- Integration tests for success and error paths

#### Day 4: Supporting Endpoints
**Tasks:**
1. Implement `POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/reset`:
   - Clear `oauth` subdoc.
   - Return success.
2. Implement `POST /api/v1/oauth/tenants/{tenantId}/integrations/{integrationId}/refresh`:
   - Validate integration has refresh token.
   - Exchange refresh token for new access token.
   - Update tokens and expiry.
   - Return success.
3. Update `GET /api/v1/tenants/{tenantId}/integrations/{integrationId}`:
   - Ensure tokens are never returned to client.
   - Return sanitized integration with status.
4. Update `DELETE /api/v1/tenants/{tenantId}/integrations/{integrationId}`:
   - Securely purge tokens.
   - Optionally revoke tokens with provider.

**Deliverables:**
- Reset, refresh, and updated get/delete endpoints
- Token sanitization middleware
- Secure token purge logic

#### Day 5: Security & Cleanup
**Tasks:**
1. Remove `/complete` endpoint entirely.
2. Remove acceptance of client PKCE parameters.
3. Add audit logging for all OAuth operations.
4. Security review: secrets, encryption, rate limits, CSRF.
5. Delete all existing integration records (fresh start).
6. Update provider configurations (Dropbox, etc.) to allow only backend callback.
7. Write deployment documentation.

**Deliverables:**
- Cleaned backend codebase
- Audit logging implementation
- Security review checklist completed
- Deployment guide

---

### Phase 2: Frontend Implementation (Estimated: 2-3 days)

#### Day 1: Remove Old OAuth Logic
**Tasks:**
1. Delete PKCE generation from `src/features/integrations/utils/oauthUtils.ts`:
   - Remove `generatePKCEChallenge()`
   - Remove `validatePKCEParameters()`
2. Remove PKCE metadata writes from `src/features/integrations/hooks/useOAuthFlow.ts`:
   - Remove `pkceMetadata` object creation
   - Remove PKCE fields from integration creation/update
3. Remove localStorage pending context:
   - Remove `mwap_oauth_pending` storage
   - Remove cleanup handlers
4. Remove `/complete` call from `src/pages/OAuthCallbackPage.tsx`:
   - Delete code exchange logic
   - Remove `handleCodeExchange` function
5. Clean up `getOAuthCallbackUri()`:
   - Mark as deprecated or remove if unused

**Deliverables:**
- Cleaned frontend codebase
- No PKCE or token exchange logic remaining
- Git diff showing deletions

#### Day 2: Implement New OAuth Flow
**Tasks:**
1. Simplify `useOAuthFlow.initiateOAuth`:
   ```typescript
   const initiateOAuth = async (providerId: string, metadata?: Record<string, unknown>) => {
     // Create integration (no PKCE)
     const integration = await createIntegration.mutateAsync({
       providerId,
       metadata: {
         displayName: metadata?.displayName || `${provider.name} Integration`,
         description: metadata?.description || '',
         ...metadata,
       },
     });
     
     // Call initiate
     const response = await api.post(`/oauth/tenants/${tenantId}/integrations/${integration.id}/initiate`, {});
     const { authorizationUrl } = handleApiResponse(response);
     
     return { success: true, authUrl: authorizationUrl };
   };
   ```
2. Update `OAuthButton`:
   - Open popup to `authorizationUrl`
   - Listen for postMessage from popup
   - On `oauth_success`: verify integration and show success
   - On `oauth_error`: show cleanup modal
3. Implement cleanup modal:
   - "Remove integration" button → calls `DELETE /tenants/.../integrations/{id}`
   - "Close" button
4. Update `OAuthCallbackPage`:
   ```typescript
   // Parse URL
   if (pathname === '/oauth/success') {
     const tenantId = searchParams.get('tenantId');
     const integrationId = searchParams.get('integrationId');
     // Post success message
     window.opener?.postMessage({ type: 'oauth_success', integrationId }, window.location.origin);
     // Close after 2s
     setTimeout(() => window.close(), 2000);
   } else if (pathname === '/oauth/error') {
     const message = searchParams.get('message');
     // Post error message
     window.opener?.postMessage({ type: 'oauth_error', description: message }, window.location.origin);
     // Close after 5s
     setTimeout(() => window.close(), 5000);
   }
   ```

**Deliverables:**
- Simplified OAuth flow implementation
- Cleanup modal component
- Updated callback page

#### Day 3: Testing & Polish
**Tasks:**
1. E2E test: Create integration → Initiate → Approve in popup → Verify status
2. E2E test: Create integration → Initiate → Deny in popup → Show error → Remove integration
3. E2E test: Concurrent initiation attempts → Second blocked
4. Add loading states and progress indicators
5. Add integration status badges
6. Disable OAuth button during active flow
7. Update documentation and user guides

**Deliverables:**
- Passing E2E tests
- Polished UI/UX
- Updated user documentation

---

### Phase 3: Deployment & Validation (Estimated: 1 day)

#### Deployment Checklist
**Backend:**
- [ ] Environment variables set: `OAUTH_STATE_SECRET`, `ENCRYPTION_KEY`, provider secrets
- [ ] Database migration applied (new schema)
- [ ] All existing integrations deleted
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Backend deployed and health check passing

**Frontend:**
- [ ] Old OAuth logic removed
- [ ] New OAuth flow implemented
- [ ] Build successful with no linter errors
- [ ] Frontend deployed

**Provider Configuration:**
- [ ] Dropbox app: Redirect URI updated to `https://mwapss.shibari.photo/api/v1/oauth/callback`
- [ ] Remove any frontend callback URIs from provider config
- [ ] Test OAuth flow with each provider

**Validation:**
- [ ] Create new Dropbox integration → Success
- [ ] Verify tokens stored encrypted in database
- [ ] Verify no secrets in frontend code or network traffic
- [ ] Test error handling: deny consent → error shown → integration removable
- [ ] Test concurrent initiation → second blocked
- [ ] Monitor logs for errors

---

### Success Criteria

1. **Security**: No secrets or tokens in frontend; all OAuth logic server-side; tokens encrypted at rest.
2. **Reliability**: No stale integrations; clear error messages; actionable recovery paths.
3. **UX**: Simple flow (click → popup → done); clear status indicators; helpful error messages.
4. **Code Quality**: No dead code; comprehensive tests; clean architecture.
5. **Production Ready**: All providers working; monitoring in place; documentation complete.

---

### Estimated Total Timeline

- **Backend**: 3-5 days
- **Frontend**: 2-3 days
- **Deployment & Validation**: 1 day
- **Total**: 6-9 days (1-2 weeks with buffer)

### Team Allocation

- **Backend Developer**: Full-time on Phase 1
- **Frontend Developer**: Full-time on Phase 2 (can start after Day 2 of Phase 1)
- **DevOps**: Part-time for deployment and environment setup
- **QA**: Part-time for testing in Phase 3

### Risk Mitigation

- **Risk**: Provider API changes during implementation
  - **Mitigation**: Test with provider sandbox/test apps first
- **Risk**: Encryption key management complexity
  - **Mitigation**: Use managed KMS service (AWS KMS, GCP KMS, Azure Key Vault)
- **Risk**: State TTL too short causes false failures
  - **Mitigation**: Start with 10 minutes; monitor and adjust based on real usage
- **Risk**: Frontend/backend version mismatch during deployment
  - **Mitigation**: Deploy backend first, ensure backward compatibility for 1 release cycle (not needed for new app)

This plan provides a complete, actionable roadmap for implementing backend-driven OAuth with no migration concerns.


