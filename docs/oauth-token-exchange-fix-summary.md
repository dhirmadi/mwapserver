# OAuth Token Exchange Fix for Dropbox Compatibility

## Problem Statement

The MWAP OAuth service was experiencing 400 Bad Request errors when exchanging authorization codes for tokens with Dropbox and other OAuth providers. The issue was caused by incorrect client authentication method and insufficient error handling.

## Root Cause Analysis

1. **Incorrect Client Authentication**: The original implementation sent `client_id` and `client_secret` in the request body, but many OAuth providers (including Dropbox) require HTTP Basic Authentication as specified in RFC 6749 Section 2.3.1.

2. **Redirect URI Mismatch**: The `redirect_uri` parameter in the token exchange request must exactly match the one used in the authorization request, but there was no validation to ensure this.

3. **Poor Error Handling**: Generic error messages made it difficult to diagnose OAuth failures, and sensitive data was being logged.

4. **Missing Timeout Handling**: Network requests could hang indefinitely without proper timeout configuration.

## Solution Implementation

### 1. HTTP Basic Authentication (RFC 6749 Compliance)

**Before:**
```javascript
data: new URLSearchParams({
  grant_type: provider.grantType,
  code,
  client_id: provider.clientId,
  client_secret: provider.clientSecret,
  redirect_uri: redirectUri
}).toString()
```

**After:**
```javascript
const clientCredentials = Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64');

headers: {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Authorization': `Basic ${clientCredentials}`,
  'User-Agent': 'MWAP-OAuth-Client/1.0'
},
data: new URLSearchParams({
  grant_type: provider.grantType,
  code,
  redirect_uri: redirectUri
}).toString()
```

### 2. Comprehensive Error Handling

- **OAuth Error Codes**: Specific handling for `invalid_grant`, `invalid_client`, `invalid_request`, `unsupported_grant_type`
- **Network Errors**: Timeout detection, connection failures, and HTTP status code handling
- **Response Validation**: Ensures access token is present in response before processing

### 3. Secure Debug Logging

- **Request Logging**: Logs request details without exposing sensitive credentials
- **Error Logging**: Captures OAuth error responses with provider-specific error codes
- **Performance Metrics**: Tracks request duration for monitoring
- **Security**: Omits authorization codes, tokens, and client secrets from logs

### 4. Enhanced Network Configuration

- **Timeout**: 30-second timeout for all token requests
- **Status Validation**: Custom status validation to handle 4xx errors gracefully
- **User Agent**: Identifies MWAP requests to OAuth providers

## Key Changes Made

### File: `src/features/oauth/oauth.service.ts`

1. **HTTP Basic Auth Implementation**:
   - Client credentials now sent in `Authorization` header
   - Removed `client_id` and `client_secret` from request body
   - Added proper Base64 encoding of credentials

2. **Error Handling Improvements**:
   - Specific error messages for common OAuth error codes
   - Network error detection and classification
   - Response structure validation

3. **Logging Enhancements**:
   - Detailed request/response logging without sensitive data
   - Performance timing for debugging
   - Security-conscious error reporting

4. **Both Methods Updated**:
   - `exchangeCodeForTokens()`: Authorization code flow
   - `refreshTokens()`: Refresh token flow

## Testing Recommendations

### Manual Testing
1. **Dropbox Integration**: Test complete OAuth flow with Dropbox
2. **Error Scenarios**: Test with invalid codes, expired tokens, wrong redirect URIs
3. **Network Issues**: Test timeout handling and connection failures

### Monitoring
1. **Log Analysis**: Monitor OAuth error patterns in production logs
2. **Performance**: Track token exchange duration and success rates
3. **Security**: Verify no sensitive data appears in logs

## Compatibility

### OAuth Providers Supported
- **Dropbox**: Primary target, now uses correct Basic Auth
- **Google Drive**: Should continue working (supports both methods)
- **OneDrive**: Should continue working (supports both methods)
- **Generic OAuth 2.0**: Compliant with RFC 6749 standards

### Backward Compatibility
- No breaking changes to public API
- Existing integrations will automatically use new authentication method
- Error responses now provide more specific information

## Security Improvements

1. **Credential Protection**: Client secrets no longer sent in request body
2. **Log Security**: Sensitive data excluded from debug logs
3. **Error Messages**: Generic error messages prevent information disclosure
4. **Timeout Protection**: Prevents hanging requests that could cause resource exhaustion

## Performance Improvements

1. **Request Timeouts**: 30-second timeout prevents hanging requests
2. **Error Classification**: Faster error handling with specific error types
3. **Logging Efficiency**: Structured logging for better performance monitoring

## Deployment Notes

- **Zero Downtime**: Changes are backward compatible
- **Configuration**: No environment variable changes required
- **Monitoring**: Enhanced logging will provide better visibility into OAuth issues
- **Rollback**: Can be safely rolled back if issues arise

## Future Enhancements

1. **PKCE Support**: Consider implementing PKCE for public clients
2. **Provider-Specific Logic**: Add provider-specific optimizations
3. **Retry Logic**: Implement exponential backoff for transient failures
4. **Metrics**: Add Prometheus metrics for OAuth success/failure rates

---

**Author**: OpenHands AI Assistant  
**Date**: 2025-07-29  
**Branch**: `fix/oauth-token-exchange-dropbox-basic-auth`  
**Commit**: `c6181c8`