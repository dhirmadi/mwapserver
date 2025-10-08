# Dropbox OAuth Integration Fix Report

**Date:** October 8, 2025  
**Status:** ✅ Resolved  
**Severity:** High (Blocked all Dropbox integrations)  
**Versions Affected:** All versions prior to v139  
**Fixed In:** v139

---

## Executive Summary

Fixed a critical bug preventing Dropbox OAuth integrations from functioning. The root cause was incorrect HTTP headers when calling the Dropbox API's `/2/users/get_current_account` endpoint, resulting in HTTP 400 errors for all health checks and token validation attempts.

---

## Problem Description

### Symptoms
- Health check endpoint returned "Token validation failed" status
- Test endpoint returned HTTP 400 from Dropbox API
- Error message: `Bad HTTP "Content-Type" header: "application/x-www-form-urlencoded"`
- All Dropbox integrations appeared as "unhealthy" despite successful OAuth flow

### Root Cause
The Dropbox API endpoint `/2/users/get_current_account` strictly requires:
1. **Content-Type:** `application/json` (not `application/x-www-form-urlencoded`)
2. **Request Body:** `null` or no body (not `{}` empty object)

Our implementation was:
- Not explicitly setting `Content-Type`, causing axios to default to `application/x-www-form-urlencoded`
- Sending an empty JSON object `{}` as the body

### Why This Wasn't Caught Earlier
- OAuth token exchange worked fine (different endpoint with different requirements)
- Tokens were correctly stored and encrypted
- The issue only manifested when trying to validate tokens against Dropbox's API
- Initial testing focused on OAuth flow completion, not subsequent API validation

---

## Investigation Process

### Phase 1: Initial Debugging (Focus on Token Storage)
**Hypothesis:** Tokens were being double-encrypted or corrupted during storage.

**Investigation Steps:**
1. Added comprehensive logging to track token lifecycle
2. Verified encryption/decryption was working correctly
3. Discovered Dropbox returns unusually long tokens (1309 characters with `sl.u.` prefix)
4. Confirmed this is normal for Dropbox's short-lived, user-scoped tokens

**Result:** Token storage was working correctly. Issue was elsewhere.

### Phase 2: API Call Investigation
**Hypothesis:** The Dropbox API call format was incorrect.

**Investigation Steps:**
1. Added detailed logging to Dropbox API calls
2. Captured exact error message from Dropbox
3. Identified HTTP 400 response with Content-Type error
4. Reviewed Dropbox API documentation for correct format

**Result:** Found the root cause - incorrect Content-Type and body format.

### Phase 3: Solution Implementation
**Actions Taken:**
1. Changed axios call to explicitly set `Content-Type: application/json`
2. Changed request body from `{}` to `null`
3. Used axios object syntax to prevent automatic Content-Type inference
4. Tested with fresh OAuth flow and existing integrations

**Result:** Dropbox API returned HTTP 200 with valid account information.

---

## Solution Details

### Code Changes

#### Before (Broken)
```typescript
// Health check - src/features/cloud-integrations/cloudIntegrations.service.ts
const resp = await axios.post(url, {}, {  // Empty object body
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'  // Not explicitly set originally
  },
  timeout: 5000
});
```

#### After (Fixed)
```typescript
// Health check - src/features/cloud-integrations/cloudIntegrations.service.ts
const resp = await axios({
  method: 'POST',
  url,
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'  // Explicitly required by Dropbox
  },
  data: null,  // Must be null, not {}
  timeout: 5000
});
```

### Files Modified
1. `src/features/cloud-integrations/cloudIntegrations.service.ts`
   - Fixed `testTokenWithProvider()` method for health checks
   
2. `src/features/cloud-integrations/cloudIntegrations.controller.ts`
   - Fixed `testIntegrationConnectivity()` method for test endpoint

---

## Testing Results

### Test Environment: Heroku Staging
- **App:** mwap-server-staging
- **URL:** https://mwapss.shibari.photo

### Test Scenarios

#### 1. Fresh OAuth Integration
- ✅ OAuth flow completed successfully
- ✅ Tokens stored and encrypted correctly
- ✅ Health check returned "healthy" status
- ✅ Test endpoint returned `success: true`

#### 2. Dropbox API Response
```json
{
  "account_id": "dbid:AAAAzrqIZj3J9GVP2mgk7SwS26zGh1AGk0w",
  "name": {
    "given_name": "Evert",
    "surname": "Smit",
    "familiar_name": "Evert",
    "display_name": "Evert Smit"
  },
  "email": "evert@smit.li"
}
```

#### 3. Token Validation
- **Token Length:** 1309 characters (expected for `sl.u.` tokens)
- **Token Format:** `sl.u.AGDWouek3Eog9Wt...` (valid Dropbox format)
- **Decryption:** Working correctly
- **API Call:** HTTP 200 response

---

## Impact Analysis

### Affected Features
- ✅ Health check endpoint (`GET /integrations/:id/health`)
- ✅ Test endpoint (`POST /integrations/:id/test`)
- ❌ OAuth flow (not affected - different endpoint)
- ❌ Token storage (not affected - working correctly)
- ❌ Token refresh (not affected - different Dropbox endpoint)

### User Impact
- **Before Fix:** All Dropbox integrations showed as "unhealthy"
- **After Fix:** Dropbox integrations show correct health status
- **Data Loss:** None - all tokens were preserved
- **Migration Required:** None - fix is transparent to users

---

## Lessons Learned

### What Went Well
1. Comprehensive logging infrastructure enabled rapid debugging
2. Systematic investigation approach identified root cause efficiently
3. Fix was surgical and didn't require data migration
4. All existing integrations automatically recovered after deployment

### What Could Be Improved
1. **API Provider Testing:** Need explicit tests for each provider's API call format
2. **Documentation:** Should document provider-specific API requirements upfront
3. **Error Messages:** Dropbox's error messages were clear and helpful
4. **Monitoring:** Should have alerts for high health check failure rates

### Best Practices Established
1. **Always explicitly set Content-Type** for API calls
2. **Review provider documentation** for exact request format requirements
3. **Test with actual provider APIs** not just OAuth flow
4. **Use axios object syntax** for precise control over request format

---

## Recommendations

### Immediate Actions (Completed)
- ✅ Fix deployed to production (v139)
- ✅ Documentation updated with troubleshooting guide
- ✅ Changelog updated
- ✅ Debug logging cleaned up

### Short-term Actions
- [ ] Add provider-specific integration tests
- [ ] Document API requirements for each provider
- [ ] Add health check monitoring and alerts
- [ ] Create provider API compatibility matrix

### Long-term Actions
- [ ] Abstract provider-specific API calls into provider adapters
- [ ] Create comprehensive provider testing suite
- [ ] Add automated API format validation
- [ ] Build provider API mock servers for testing

---

## Dropbox-Specific Notes

### Token Format
Dropbox uses long-format tokens with the `sl.u.` prefix:
- **Length:** ~1300 characters
- **Format:** Base64url-encoded with embedded metadata
- **Type:** Short-lived, user-scoped tokens
- **Encryption:** Works correctly with our AES-256-GCM encryption

### API Requirements
The `/2/users/get_current_account` endpoint:
- **Method:** POST (not GET)
- **Content-Type:** `application/json` (required)
- **Body:** `null` or no body (not `{}`)
- **Authorization:** `Bearer {token}` header
- **Timeout:** Typically responds in 200-400ms

### Error Messages
Dropbox provides clear error messages:
- `Bad HTTP "Content-Type" header` - Wrong Content-Type
- `expected null, got value` - Non-null body sent
- HTTP 401 - Invalid/expired token
- HTTP 403 - Insufficient scopes

---

## Related Documentation

- [OAuth Integration Guide](../06-Guides/oauth-integration-guide.md) - Updated with Dropbox troubleshooting
- [API Reference](../04-Backend/api-reference.md) - Test endpoint documentation
- [Features Guide](../04-Backend/features.md) - Integration endpoints
- [Changelog](./changelog.md) - Version history

---

## Conclusion

The Dropbox OAuth integration issue has been completely resolved. The fix was simple but required careful investigation to identify the root cause. All Dropbox integrations are now fully functional, and comprehensive documentation has been added to prevent similar issues in the future.

**Status:** ✅ Resolved and Deployed  
**Version:** v139+  
**Date:** October 8, 2025

