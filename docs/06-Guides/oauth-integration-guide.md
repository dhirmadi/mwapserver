# OAuth Integration Guide (Frontend & Backend)

**Last Updated:** 2024-10-01  
**Status:** ✅ Verified against implementation  
**Version:** 2.0

---

## 🎯 Documentation Guide

**This document covers:** OAuth popup flow mechanics and security  
**For complete feature implementation:** See **[Complete Frontend Guide](./oauth-frontend-complete-guide.md)**

### Which Guide Should I Read?

| Your Goal | Read This |
|-----------|-----------|
| **Build complete cloud provider integration feature** | ✅ [Complete Frontend Guide](./oauth-frontend-complete-guide.md) |
| **Understand OAuth popup mechanics** | ✅ This document |
| **Debug OAuth security issues** | ✅ This document |
| **Get TypeScript interfaces and API client** | ✅ [Complete Frontend Guide](./oauth-frontend-complete-guide.md) |
| **Understand backend architecture** | ✅ This document |

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Complete Frontend Integration](#complete-frontend-integration)
3. [Backend Architecture](#backend-architecture)
4. [PKCE Flows](#pkce-flows-advanced)
5. [Security Model](#security-model)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Frontend Integration (5 Steps)

```typescript
// Step 1: Call backend to get authorization URL
const response = await fetch(
  `/api/v1/oauth/tenants/${tenantId}/integrations/${integrationId}/initiate`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    }
  }
);

const { authorizationUrl } = await response.json();

// Step 2: Open OAuth in popup window
const popup = window.open(authorizationUrl, 'oauth', 'width=600,height=700');

// Step 3: Listen for completion messages
window.addEventListener('message', (event) => {
  if (event.data.type === 'oauth_success') {
    console.log('✅ Integration successful:', event.data.integrationId);
    // Refresh your integration list or show success
  } else if (event.data.type === 'oauth_error') {
    console.error('❌ Integration failed:', event.data.message);
    // Show error to user
  }
});

// Step 4: Handle popup close
const checkClosed = setInterval(() => {
  if (popup?.closed) {
    clearInterval(checkClosed);
    // User closed popup - handle cancellation
  }
}, 1000);
```

**That's it!** The backend handles all security, state management, and token exchange.

---

## 🎨 Complete Frontend Integration

### Full React/TypeScript Example

```typescript
import { useState } from 'react';

interface OAuthSuccessData {
  type: 'oauth_success';
  tenantId: string;
  integrationId: string;
}

interface OAuthErrorData {
  type: 'oauth_error';
  message: string;
  code: string;
}

export function useOAuthIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startOAuthFlow = async (
    tenantId: string,
    integrationId: string,
    jwtToken: string
  ): Promise<OAuthSuccessData> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Request authorization URL from backend
      const response = await fetch(
        `/api/v1/oauth/tenants/${tenantId}/integrations/${integrationId}/initiate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to initiate OAuth: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Response structure (verified from implementation):
      // {
      //   authorizationUrl: string,
      //   provider: { 
      //     name: string,          // Provider identifier (e.g., "dropbox")
      //     displayName: string    // Human-readable name (e.g., "Dropbox")
      //   },
      //   redirectUri: string,
      //   state: string
      // }

      // 2. Open OAuth in popup window
      const popup = window.open(
        data.authorizationUrl,
        'oauth',
        'width=600,height=700,scrollbars=yes'
      );

      if (!popup) {
        throw new Error('Failed to open OAuth popup. Please allow popups for this site.');
      }

      // 3. Wait for OAuth completion
      return new Promise((resolve, reject) => {
        // Message listener for OAuth completion
        const messageHandler = (event: MessageEvent) => {
          // Security: In production, verify event.origin matches your domain
          // if (event.origin !== window.location.origin) return;

          const data = event.data as OAuthSuccessData | OAuthErrorData;

          if (data.type === 'oauth_success') {
            window.removeEventListener('message', messageHandler);
            clearInterval(popupCheck);
            setIsLoading(false);
            resolve(data);
          } else if (data.type === 'oauth_error') {
            window.removeEventListener('message', messageHandler);
            clearInterval(popupCheck);
            setIsLoading(false);
            setError(data.message);
            reject(new Error(data.message));
          }
        };

        window.addEventListener('message', messageHandler);

        // Check if popup was closed without completing OAuth
        const popupCheck = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupCheck);
            window.removeEventListener('message', messageHandler);
            setIsLoading(false);
            setError('OAuth window closed');
            reject(new Error('OAuth window was closed before completion'));
          }
        }, 500);
      });
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  return { startOAuthFlow, isLoading, error };
}
```

### Usage in Component

```typescript
function IntegrateCloudProvider() {
  const { startOAuthFlow, isLoading, error } = useOAuthIntegration();
  const { tenantId, jwtToken } = useAuth(); // Your auth hook

  const handleIntegration = async (integrationId: string) => {
    try {
      const result = await startOAuthFlow(tenantId, integrationId, jwtToken);
      console.log('Integration successful:', result.integrationId);
      // Refresh integration list, show success message, etc.
    } catch (error) {
      console.error('Integration failed:', error);
      // Error is already set in state
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleIntegration('integration-id-here')}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Connect Dropbox'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

---

## 🏗️ Backend Architecture

### OAuth Flow Sequence

```
┌─────────┐                ┌─────────┐                ┌──────────┐                ┌─────────┐
│ Frontend│                │ Backend │                │  OAuth   │                │Backend  │
│         │                │   API   │                │ Provider │                │HTML Page│
└────┬────┘                └────┬────┘                └────┬─────┘                └────┬────┘
     │                          │                          │                           │
     │ POST /oauth/.../initiate │                          │                           │
     ├─────────────────────────>│                          │                           │
     │                          │                          │                           │
     │                          │ Generate state parameter │                           │
     │                          │ Build authorization URL  │                           │
     │                          │                          │                           │
     │  { authorizationUrl }    │                          │                           │
     │<─────────────────────────┤                          │                           │
     │                          │                          │                           │
     │ Open popup with URL      │                          │                           │
     ├──────────────────────────┼─────────────────────────>│                           │
     │                          │                          │                           │
     │                          │                          │ User authorizes app       │
     │                          │                          │                           │
     │                          │  GET /oauth/callback     │                           │
     │                          │<─────────────────────────┤                           │
     │                          │                          │                           │
     │                          │ Validate state parameter │                           │
     │                          │ Verify integration owner │                           │
     │                          │ Exchange code for tokens │                           │
     │                          │ Store tokens securely    │                           │
     │                          │                          │                           │
     │                          │ Redirect to success page │                           │
     │                          ├─────────────────────────────────────────────────────>│
     │                          │                          │                           │
     │                          │                          │       Success HTML Page   │
     │  postMessage success     │                          │       with auto-close     │
     │<─────────────────────────┼──────────────────────────┼───────────────────────────┤
     │                          │                          │                           │
     │ Handle success           │                          │                           │
     │ Close popup              │                          │                           │
     │                          │                          │                           │
```

### Core Components

1. **OAuth Controller** (`src/features/oauth/oauth.controller.ts`)
   - `initiateOAuthFlow()` - Generates authorization URL
   - `handleOAuthCallback()` - Processes provider callbacks
   - `handleOAuthSuccess()` - Serves success HTML page
   - `handleOAuthError()` - Serves error HTML page
   - `refreshIntegrationTokens()` - Refreshes access tokens

2. **OAuth Service** (`src/features/oauth/oauth.service.ts`)
   - `generateAuthorizationURL()` - Builds provider URLs with params
   - `exchangeCodeForTokens()` - Exchanges auth code for tokens
   - `refreshTokens()` - Refreshes expired access tokens

3. **Security Services**
   - `OAuthCallbackSecurityService` - State validation, replay prevention
   - `OAuthSecurityMonitoringService` - Metrics, alerts, pattern detection

4. **Public Route Registry** (`src/middleware/publicRoutes.ts`)
   - Explicitly registers `/api/v1/oauth/callback` as public
   - Documents security justification
   - All other routes require JWT by default

---

## 🔐 PKCE Flows (Advanced)

### What is PKCE?

PKCE (Proof Key for Code Exchange, RFC 7636) adds security for public clients (mobile apps, SPAs) where client secrets can't be securely stored.

### When to Use PKCE

- ✅ Mobile applications
- ✅ Single-page applications (SPAs)
- ✅ Desktop applications
- ✅ Any public client that can't securely store secrets
- ❌ Server-to-server (traditional OAuth with client secret is fine)

### PKCE Implementation

**Backend automatically detects and handles PKCE flows when:**
- Integration has `code_verifier` in metadata
- Integration has `code_challenge` and `code_challenge_method` in metadata

**Currently:** PKCE support is implemented in backend but requires frontend to generate and store PKCE parameters before calling `/initiate`. Full PKCE documentation coming soon.

---

## 🛡️ Security Model

### Zero Trust Architecture

- **Default Deny**: All routes require JWT authentication
- **Explicit Allow**: Only `/oauth/callback` is public (required for OAuth providers)
- **Comprehensive Logging**: All access attempts audited
- **Minimal Exposure**: Public routes expose no sensitive data

### OAuth Callback Security Layers

1. **State Parameter Validation**
   - Cryptographic integrity verification
   - 10-minute expiration window
   - Nonce validation (16+ characters)
   - Structure validation

2. **Integration Ownership Verification**
   - Tenant-integration relationship validation
   - User access verification
   - Provider availability checks

3. **Redirect URI Security**
   - **HTTPS Enforcement**: All OAuth flows use HTTPS
   - **Consistent Construction**: Same logic in authorization and callback
   - **Proxy-Aware**: Handles Heroku/cloud proxy headers correctly
   - **Exact Matching**: Prevents redirect URI mismatch errors

4. **Replay Attack Prevention**
   - State parameters expire after 10 minutes
   - Timestamp validation
   - Duplicate attempt detection

### Trust Proxy Configuration

**Critical for Heroku/Cloud Deployments:**

```typescript
// app.ts
app.set('trust proxy', 1);
```

**Why it matters:**
- Allows Express to detect HTTPS behind load balancers
- Required for `req.protocol` to resolve as 'https'
- Affects redirect URI construction
- **Without it:** Redirect URIs will use 'http://' and OAuth will fail

---

## 📚 API Reference

### POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/initiate

Generate OAuth authorization URL for cloud provider integration.

**Authentication:** JWT Bearer token required  
**Authorization:** Tenant owner only

**Path Parameters:**
- `tenantId` - Tenant ID (must be owned by authenticated user)
- `integrationId` - Integration ID (must belong to tenant)

**Response (200 OK):**
```typescript
{
  authorizationUrl: string;    // Complete OAuth URL for provider
  provider: {
    name: string;              // Provider identifier (e.g., "dropbox")
    displayName: string;       // Human-readable name (e.g., "Dropbox")
  };
  redirectUri: string;         // Callback URI (for debugging)
  state: string;               // Base64-encoded state parameter
}
```

**Example:**
```json
{
  "authorizationUrl": "https://www.dropbox.com/oauth2/authorize?client_id=...&response_type=code&redirect_uri=https%3A%2F%2Fapi.mwap.dev%2Fapi%2Fv1%2Foauth%2Fcallback&state=eyJ0ZW5hbnRJZCI6...&scope=files.content.read&token_access_type=offline",
  "provider": {
    "name": "dropbox",
    "displayName": "Dropbox"
  },
  "redirectUri": "https://api.mwap.dev/api/v1/oauth/callback",
  "state": "eyJ0ZW5hbnRJZCI6IjY0MWY0NDExZjI0YjRmY2FjMWIxNTAxYiIsImludGVncmF0aW9uSWQiOiI2NDFmNDQxMWYyNGI0ZmNhYzFiMTUwMWMiLCJ1c2VySWQiOiJhdXRoMHwxMjM0NTYiLCJ0aW1lc3RhbXAiOjE3Mjc4MDAwMDAwMDAsIm5vbmNlIjoiYWJjZGVmMTIzNDU2In0="
}
```

**Errors:**
- `401 Unauthorized` - Invalid or missing JWT
- `403 Forbidden` - User is not owner of tenant
- `404 Not Found` - Integration not found

---

### GET /api/v1/oauth/callback

**⚠️ PUBLIC ENDPOINT** - Called by OAuth providers, not frontend directly.

Handles OAuth authorization callbacks from cloud providers.

**Authentication:** None (public route)  
**Authorization:** State parameter validation

**Query Parameters:**
- `code` - Authorization code from OAuth provider
- `state` - Base64-encoded state parameter
- `error` (optional) - Error code if OAuth failed
- `error_description` (optional) - Error details

**Flow:**
1. Validates state parameter (structure, timestamp, nonce)
2. Verifies integration ownership
3. Exchanges code for access/refresh tokens
4. Stores tokens securely
5. Redirects to success or error page

**Success:** Redirects to `/oauth/success?tenantId=...&integrationId=...`  
**Error:** Redirects to `/oauth/error?message=...&code=...`

---

### GET /oauth/success

**Backend HTML page** served to popup window after successful OAuth.

**Features:**
- Displays success message
- Sends `postMessage` to parent window:
  ```javascript
  { type: 'oauth_success', tenantId, integrationId }
  ```
- Auto-closes after 3 seconds

**Frontend should NOT implement this route** - it's served by the backend.

---

### GET /oauth/error

**Backend HTML page** served to popup window after failed OAuth.

**Features:**
- Displays error message
- Sends `postMessage` to parent window:
  ```javascript
  { type: 'oauth_error', message, code }
  ```
- Auto-closes after 5 seconds

**Frontend should NOT implement this route** - it's served by the backend.

---

### POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh

Manually refresh OAuth access tokens.

**Authentication:** JWT Bearer token required  
**Authorization:** Tenant owner only

**Request Body (Optional):**
```typescript
{
  force?: boolean;  // If true, refresh even if token is not expired
}
```

**Response (200 OK):**
```typescript
{
  ...integration,           // Full integration object
  accessToken: '[REDACTED]',   // Redacted for security
  refreshToken: '[REDACTED]'   // Redacted for security
}
```

**Errors:**
- `400 Bad Request` - Integration has no refresh token
- `500 Internal Server Error` - Token refresh failed with provider

---

## 🔧 Troubleshooting

### Frontend Issues

#### Popup Blocked
**Symptom:** `window.open()` returns null  
**Cause:** Browser blocked popup  
**Solution:** 
- Ensure OAuth is triggered by user interaction (button click)
- Ask user to allow popups for your domain
- Show instructions if popup returns null

#### No Message Received
**Symptom:** Message event listener never fires  
**Cause:** Message listener not set up before popup opens  
**Solution:**
- Add message listener BEFORE calling `window.open()`
- Check browser console for errors
- Verify popup didn't close immediately

#### Wrong Message Origin
**Symptom:** Messages filtered by origin check  
**Cause:** Success/error pages send messages from backend origin  
**Solution:**
- In development: Don't filter by origin (or allow localhost)
- In production: Filter by your backend domain, not frontend

### Backend Issues

#### Redirect URI Mismatch
**Symptom:** OAuth provider returns "redirect_uri mismatch"  
**Cause:** Different redirect URIs in authorization vs callback  
**Solution:**
- ✅ Use `/initiate` endpoint (handles consistency automatically)
- ✅ Ensure `trust proxy` is configured: `app.set('trust proxy', 1)`
- ✅ Verify provider has `https://yourdomain.com/api/v1/oauth/callback` registered

#### State Parameter Invalid
**Symptom:** Callback fails with "Invalid state parameter"  
**Causes:**
- State expired (>10 minutes old)
- State tampered with
- Clock skew between servers

**Solution:**
- Ensure OAuth completes within 10 minutes
- Check server time is accurate (NTP)
- Review logs for specific validation error

#### Integration Not Found
**Symptom:** Callback fails with "Integration not found"  
**Causes:**
- Integration deleted during OAuth flow
- Wrong tenant ID in state
- Integration doesn't belong to tenant

**Solution:**
- Don't delete integrations while OAuth in progress
- Verify integration exists before starting OAuth
- Check tenant ownership

---

## 📝 Best Practices

### Security

1. **Never generate state parameters on frontend** - Backend handles this
2. **Use popup windows, not redirects** - Prevents losing application state
3. **Listen for postMessage** - Don't poll or navigate to callback URL
4. **Clean up listeners** - Remove message listeners after OAuth completes
5. **Handle popup close** - Detect if user closes popup without completing

### User Experience

1. **Show loading state** - While OAuth is in progress
2. **Provide clear error messages** - Based on error codes
3. **Auto-retry on timeout** - Network issues are common
4. **Explain popup requirement** - If popups are blocked
5. **Success feedback** - Confirm integration is active

### Performance

1. **Cache provider list** - Don't fetch on every OAuth
2. **Lazy load OAuth** - Only when user initiates
3. **Cleanup intervals** - Clear popup check intervals
4. **Debounce retries** - Prevent rapid retry loops

---

## 📖 Related Documentation

- **[API Reference](../04-Backend/api-reference.md)** - Complete API documentation
- **[Security Guide](../04-Backend/security.md)** - Security architecture
- **[OAuth Security Guide](./oauth-security.md)** - Security deep dive
- **[OAuth Troubleshooting Guide](./archive/oauth-troubleshooting-guide.md)** - Common issues (archived)

---

**Questions or issues?** Check troubleshooting section or review audit logs for detailed error information.

