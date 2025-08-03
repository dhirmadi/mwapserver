# Frontend PKCE OAuth Integration Tasks

## 🎯 Project Context

**Environment Architect**: System Architecture Team  
**Backend Domains**: 
- **Production**: `https://mwapps.shibari.photo`
- **Development/Staging**: `https://mwapss.shibari.photo`  
**Status**: Backend PKCE implementation is complete and production-ready  
**Urgency**: High - PKCE flows are currently broken due to frontend integration issues  

## 📋 Executive Summary

The backend has successfully implemented PKCE (Proof Key for Code Exchange) support for OAuth 2.0 authentication. However, the frontend implementation has critical issues that prevent PKCE flows from working correctly. This document provides detailed tasks to fix the frontend PKCE integration.

## 🚨 Critical Issues Identified

### 1. **CRITICAL: Redirect URI Mismatch**
**Current Problem**: Frontend stores `redirect_uri: "https://localhost:5173/oauth/callback"`  
**Required Fix**: Must use backend callback URL: 
- **Production**: `https://mwapps.shibari.photo/api/v1/oauth/callback`
- **Development/Staging**: `https://mwapss.shibari.photo/api/v1/oauth/callback`

### 2. **CRITICAL: Incorrect OAuth Flow Pattern**
**Current Problem**: Frontend stores `oauth_code` in database  
**Required Fix**: OAuth providers redirect directly to backend, not frontend

### 3. **Security Issue: Unnecessary Code Storage**
**Current Problem**: Authorization codes stored in database  
**Required Fix**: Remove oauth_code storage (security risk)

## 📝 Detailed Tasks

### Task 1: Fix Redirect URI Configuration
**Priority**: CRITICAL  
**Estimated Effort**: 2 hours  

#### Requirements:
1. **Update OAuth Authorization URL Construction**:
   ```typescript
   // WRONG - Current implementation
   const redirectUri = 'https://localhost:5173/oauth/callback';
   
   // CORRECT - Required implementation (environment-specific)
   const redirectUri = getBackendCallbackUrl(); // See environment config below
   ```

2. **Environment-Specific Configuration**:
   ```typescript
   const BACKEND_DOMAINS = {
     development: 'https://mwapss.shibari.photo',
     staging: 'https://mwapss.shibari.photo',
     production: 'https://mwapps.shibari.photo'
   };
   
   function getBackendCallbackUrl(): string {
     const environment = process.env.NODE_ENV || 'development';
     return `${BACKEND_DOMAINS[environment]}/api/v1/oauth/callback`;
   }
   
   const redirectUri = `${BACKEND_DOMAINS[environment]}/api/v1/oauth/callback`;
   ```

3. **Update Integration Metadata**:
   ```typescript
   // Remove oauth_code, fix redirect_uri
   const metadata = {
     // oauth_code: "...", // REMOVE THIS
     redirect_uri: `${backendDomain}/api/v1/oauth/callback`, // FIX THIS
     code_verifier: codeVerifier,
     code_challenge: codeChallenge,
     code_challenge_method: 'S256'
   };
   ```

#### Acceptance Criteria:
- [ ] All OAuth authorization URLs use backend callback URL
- [ ] No localhost URLs in production metadata
- [ ] Environment-specific backend domain configuration
- [ ] Integration metadata contains correct redirect_uri

---

### Task 2: Remove OAuth Code Storage
**Priority**: HIGH  
**Estimated Effort**: 1 hour  

#### Requirements:
1. **Remove oauth_code from Metadata**:
   ```typescript
   // WRONG - Current implementation
   const metadata = {
     oauth_code: authCode, // REMOVE THIS LINE
     redirect_uri: redirectUri,
     code_verifier: codeVerifier,
     // ...
   };
   
   // CORRECT - Required implementation
   const metadata = {
     // oauth_code field removed
     redirect_uri: redirectUri,
     code_verifier: codeVerifier,
     code_challenge: codeChallenge,
     code_challenge_method: 'S256'
   };
   ```

2. **Update Integration Creation Logic**:
   - Remove any code that stores authorization codes
   - Authorization codes are single-use and handled by backend
   - Only store PKCE parameters needed for token exchange

#### Acceptance Criteria:
- [ ] No oauth_code field in integration metadata
- [ ] No authorization code storage anywhere in frontend
- [ ] Integration creation only stores PKCE parameters

---

### Task 3: Implement Correct PKCE Parameter Generation
**Priority**: HIGH  
**Estimated Effort**: 3 hours  

#### Requirements:
1. **RFC 7636 Compliant Code Verifier Generation**:
   ```typescript
   function generateCodeVerifier(): string {
     // Generate 43-128 character string with unreserved characters
     const array = new Uint8Array(32); // 32 bytes = 43 chars base64url
     crypto.getRandomValues(array);
     return base64URLEncode(array);
   }
   
   function base64URLEncode(buffer: Uint8Array): string {
     return btoa(String.fromCharCode(...buffer))
       .replace(/\+/g, '-')
       .replace(/\//g, '_')
       .replace(/=/g, '');
   }
   ```

2. **Code Challenge Generation**:
   ```typescript
   async function generateCodeChallenge(verifier: string): Promise<string> {
     const encoder = new TextEncoder();
     const data = encoder.encode(verifier);
     const digest = await crypto.subtle.digest('SHA-256', data);
     return base64URLEncode(new Uint8Array(digest));
   }
   ```

3. **Parameter Validation**:
   ```typescript
   function validatePKCEParameters(codeVerifier: string): boolean {
     // Length: 43-128 characters
     if (codeVerifier.length < 43 || codeVerifier.length > 128) {
       return false;
     }
     
     // Character set: A-Z, a-z, 0-9, -, ., _, ~
     const validChars = /^[A-Za-z0-9\-._~]+$/;
     return validChars.test(codeVerifier);
   }
   ```

#### Acceptance Criteria:
- [ ] Code verifier is 43-128 characters long
- [ ] Code verifier uses only unreserved characters (A-Z, a-z, 0-9, -, ., _, ~)
- [ ] Code challenge is SHA256 hash of verifier, base64url encoded
- [ ] Challenge method is always 'S256'
- [ ] Client-side validation before storing parameters

---

### Task 4: Update OAuth Flow Integration
**Priority**: HIGH  
**Estimated Effort**: 4 hours  

#### Requirements:
1. **Correct OAuth Initiation Flow**:
   ```typescript
   async function initiateOAuthFlow(providerId: string, tenantId: string) {
     // 1. Generate PKCE parameters
     const codeVerifier = generateCodeVerifier();
     const codeChallenge = await generateCodeChallenge(codeVerifier);
     
     // 2. Create integration with PKCE metadata
     const integration = await createIntegration({
       tenantId,
       providerId,
       status: 'pending',
       metadata: {
         code_verifier: codeVerifier,
         code_challenge: codeChallenge,
         code_challenge_method: 'S256',
         redirect_uri: `${backendDomain}/api/v1/oauth/callback`
       }
     });
     
     // 3. Build authorization URL
     const state = encodeState({
       integrationId: integration._id,
       tenantId,
       userId: currentUser.sub,
       timestamp: Date.now(),
       nonce: generateNonce()
     });
     
     const authUrl = buildAuthorizationUrl({
       provider,
       clientId: provider.clientId,
       redirectUri: `${backendDomain}/api/v1/oauth/callback`,
       codeChallenge,
       codeChallengeMethod: 'S256',
       state
     });
     
     // 4. Redirect user to provider
     window.location.href = authUrl;
   }
   ```

2. **Authorization URL Construction**:
   ```typescript
   function buildAuthorizationUrl(params: {
     provider: Provider;
     clientId: string;
     redirectUri: string;
     codeChallenge: string;
     codeChallengeMethod: string;
     state: string;
   }): string {
     const url = new URL(params.provider.authUrl);
     url.searchParams.set('client_id', params.clientId);
     url.searchParams.set('redirect_uri', params.redirectUri);
     url.searchParams.set('response_type', 'code');
     url.searchParams.set('scope', params.provider.scopes.join(' '));
     url.searchParams.set('code_challenge', params.codeChallenge);
     url.searchParams.set('code_challenge_method', params.codeChallengeMethod);
     url.searchParams.set('state', params.state);
     
     return url.toString();
   }
   ```

#### Acceptance Criteria:
- [ ] OAuth authorization URLs include PKCE parameters
- [ ] State parameter includes all required fields
- [ ] Redirect URI points to backend callback
- [ ] Integration created before OAuth redirect
- [ ] No authorization code handling in frontend

---

### Task 5: Implement OAuth Success/Error Handling
**Priority**: MEDIUM  
**Estimated Effort**: 3 hours  

#### Requirements:
1. **Success Page Handler**:
   ```typescript
   // Handle redirect from backend: /oauth/success?tenantId=...&integrationId=...
   function handleOAuthSuccess(searchParams: URLSearchParams) {
     const tenantId = searchParams.get('tenantId');
     const integrationId = searchParams.get('integrationId');
     
     if (!tenantId || !integrationId) {
       showError('Invalid OAuth response');
       return;
     }
     
     // Fetch updated integration to verify tokens
     fetchIntegration(integrationId, tenantId)
       .then(integration => {
         if (integration.accessToken) {
           showSuccess('OAuth integration successful!');
           redirectToIntegrations();
         } else {
           showError('OAuth integration failed');
         }
       });
   }
   ```

2. **Error Page Handler**:
   ```typescript
   // Handle redirect from backend: /oauth/error?message=...
   function handleOAuthError(searchParams: URLSearchParams) {
     const message = searchParams.get('message');
     showError(message || 'OAuth authentication failed');
     redirectToIntegrations();
   }
   ```

3. **Integration Status Polling** (Alternative to redirects):
   ```typescript
   async function pollIntegrationStatus(integrationId: string, tenantId: string) {
     const maxAttempts = 30; // 30 seconds
     const interval = 1000; // 1 second
     
     for (let attempt = 0; attempt < maxAttempts; attempt++) {
       const integration = await fetchIntegration(integrationId, tenantId);
       
       if (integration.accessToken) {
         return { success: true, integration };
       }
       
       if (integration.status === 'error') {
         return { success: false, error: 'OAuth failed' };
       }
       
       await sleep(interval);
     }
     
     return { success: false, error: 'OAuth timeout' };
   }
   ```

#### Acceptance Criteria:
- [ ] Success page displays integration status
- [ ] Error page shows user-friendly messages
- [ ] Integration status updates in real-time
- [ ] Proper error handling for all scenarios

---

### Task 6: Add PKCE Parameter Validation
**Priority**: MEDIUM  
**Estimated Effort**: 2 hours  

#### Requirements:
1. **Client-Side Validation**:
   ```typescript
   interface PKCEValidationResult {
     isValid: boolean;
     errors: string[];
   }
   
   function validatePKCEParameters(metadata: any): PKCEValidationResult {
     const errors: string[] = [];
     
     // Validate code_verifier
     if (!metadata.code_verifier) {
       errors.push('Missing code_verifier');
     } else {
       const verifier = metadata.code_verifier;
       
       if (verifier.length < 43 || verifier.length > 128) {
         errors.push('code_verifier must be 43-128 characters');
       }
       
       if (!/^[A-Za-z0-9\-._~]+$/.test(verifier)) {
         errors.push('code_verifier contains invalid characters');
       }
     }
     
     // Validate code_challenge
     if (!metadata.code_challenge) {
       errors.push('Missing code_challenge');
     }
     
     // Validate code_challenge_method
     if (metadata.code_challenge_method !== 'S256') {
       errors.push('code_challenge_method must be S256');
     }
     
     return {
       isValid: errors.length === 0,
       errors
     };
   }
   ```

2. **Pre-Storage Validation**:
   ```typescript
   async function createIntegrationWithValidation(data: any) {
     // Validate PKCE parameters before storing
     const validation = validatePKCEParameters(data.metadata);
     
     if (!validation.isValid) {
       throw new Error(`PKCE validation failed: ${validation.errors.join(', ')}`);
     }
     
     return await createIntegration(data);
   }
   ```

#### Acceptance Criteria:
- [ ] All PKCE parameters validated before storage
- [ ] Clear error messages for validation failures
- [ ] No invalid PKCE parameters stored in database

---

## 🔧 Configuration Requirements

### Environment Variables
```typescript
// Required environment configuration
const CONFIG = {
  BACKEND_DOMAINS: {
    development: 'https://mwapss.shibari.photo',
    staging: 'https://mwapss.shibari.photo', 
    production: 'https://mwapps.shibari.photo'
  },
  OAUTH_CALLBACK_PATH: '/api/v1/oauth/callback',
  OAUTH_SUCCESS_PATH: '/oauth/success',
  OAUTH_ERROR_PATH: '/oauth/error'
};
```

### Provider Configuration
```typescript
// Ensure all OAuth providers support PKCE
interface OAuthProvider {
  id: string;
  name: string;
  clientId: string;
  authUrl: string;
  scopes: string[];
  supportsPKCE: boolean; // Must be true
}
```

## 🧪 Testing Requirements

### Unit Tests
- [ ] PKCE parameter generation functions
- [ ] Parameter validation functions
- [ ] Authorization URL construction
- [ ] State encoding/decoding

### Integration Tests
- [ ] Complete OAuth flow with test provider
- [ ] Error handling scenarios
- [ ] Parameter validation edge cases
- [ ] Success/error page handling

### Manual Testing Checklist
- [ ] OAuth flow completes successfully
- [ ] Tokens stored in backend database
- [ ] No authorization codes in frontend
- [ ] Correct redirect URIs in all environments
- [ ] Error messages display correctly

## 📚 Reference Documentation

### Backend Documentation
- [PKCE Implementation Guide](/docs/06-Guides/pkce-implementation-guide.md)
- [OAuth Security Guide](/docs/06-Guides/oauth-security-guide.md)
- [Integration Schema](/src/schemas/cloudProviderIntegration.schema.ts)

### External References
- [RFC 7636 - PKCE Specification](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tasks completed and tested
- [ ] Environment variables configured
- [ ] Backend domain updated in all environments
- [ ] No localhost URLs in production code

### Post-Deployment
- [ ] Monitor OAuth success rates
- [ ] Verify no PKCE validation errors in logs
- [ ] Test with multiple OAuth providers
- [ ] Confirm token storage in backend

## 📞 Support and Escalation

### Technical Questions
- **Backend Team**: For PKCE implementation details
- **DevOps Team**: For domain and environment configuration
- **Security Team**: For OAuth security concerns

### Escalation Path
1. **Level 1**: Frontend Team Lead
2. **Level 2**: Environment Architect
3. **Level 3**: CTO

---

## ⚠️ Critical Success Factors

1. **Redirect URI Must Be Correct**: This is the #1 cause of OAuth failures
2. **No Authorization Code Storage**: Security risk and unnecessary
3. **Proper PKCE Parameter Generation**: Must follow RFC 7636 exactly
4. **Environment Configuration**: Backend domain must be correct for each environment

**Deadline**: Complete all critical tasks (1-4) within 2 business days to restore PKCE functionality.

---

*This document is maintained by the Environment Architecture team. For updates or questions, contact the backend team.*