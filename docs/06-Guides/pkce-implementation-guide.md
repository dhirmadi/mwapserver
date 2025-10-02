# PKCE Implementation Guide

## Overview

This guide documents the implementation of PKCE (Proof Key for Code Exchange) support in the MWAP backend, enabling secure OAuth 2.0 authentication for public clients like Single Page Applications (SPAs).

## What is PKCE?

PKCE (RFC 7636) is an extension to OAuth 2.0 that provides enhanced security for public clients that cannot securely store client secrets. Instead of using a static client secret, PKCE uses a dynamically generated code verifier/challenge pair for each authorization flow.

### PKCE vs Traditional OAuth 2.0

| Aspect | Traditional OAuth 2.0 | PKCE OAuth 2.0 |
|--------|----------------------|-----------------|
| **Client Type** | Confidential clients | Public clients (SPAs, mobile apps) |
| **Authentication** | HTTP Basic Auth with client_secret | code_verifier parameter |
| **Security** | Relies on client secret security | Dynamic verification per flow |
| **Replay Protection** | Client secret validation | Single-use code verifier |

## Implementation Architecture

### Flow Detection

The backend automatically detects PKCE vs traditional flows based on the presence of `code_verifier` in the integration metadata:

```typescript
const isPKCEFlow = !!(integration.metadata?.code_verifier);
```

### Dual Authentication Support

The OAuth service supports both authentication methods:

```typescript
// PKCE Flow
if (isPKCEFlow) {
  tokenRequest = {
    // No Authorization header
    data: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: provider.clientId,
      code_verifier: codeVerifier  // PKCE parameter
    })
  };
}

// Traditional Flow  
else {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  tokenRequest = {
    headers: {
      'Authorization': `Basic ${credentials}`  // HTTP Basic Auth
    },
    data: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  };
}
```

## Frontend Integration

### Required Metadata

For PKCE flows, the frontend must store the following in the integration metadata:

```json
{
  "metadata": {
    "oauth_code": "authorization_code_from_provider",
    "redirect_uri": "https://your-app.com/oauth/callback",
    "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
    "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    "code_challenge_method": "S256",
    "pkce_flow": true
  }
}
```

### PKCE Parameter Requirements

#### code_verifier
- **Length**: 43-128 characters (RFC 7636)
- **Characters**: A-Z, a-z, 0-9, -, ., _, ~ only
- **Generation**: Cryptographically random string

#### code_challenge  
- **Method S256**: `base64url(sha256(code_verifier))`
- **Method plain**: `code_verifier` (not recommended)

#### code_challenge_method
- **S256**: SHA256 hash (recommended)
- **plain**: Plain text (less secure)

## Security Features

### PKCE Parameter Validation

The backend validates all PKCE parameters according to RFC 7636:

```typescript
validatePKCEParameters(integration): {
  isValid: boolean;
  issues?: string[];
  isPKCEFlow?: boolean;
} {
  // Validate code_verifier length (43-128 chars)
  if (codeVerifier.length < 43 || codeVerifier.length > 128) {
    issues.push('Invalid code_verifier length');
  }
  
  // Validate character set
  if (!/^[A-Za-z0-9\-._~]+$/.test(codeVerifier)) {
    issues.push('Invalid code_verifier characters');
  }
  
  // Validate challenge method
  if (method !== 'S256' && method !== 'plain') {
    issues.push('Invalid code_challenge_method');
  }
}
```

### Enhanced Security Controls

All existing security controls are maintained for PKCE flows:

- ✅ State parameter validation
- ✅ Integration ownership verification
- ✅ Timestamp validation (replay attack prevention)
- ✅ Redirect URI validation
- ✅ Comprehensive audit logging
- ✅ Generic error responses

### Additional PKCE Security

- ✅ RFC 7636 compliant parameter validation
- ✅ Dynamic verification per authorization flow
- ✅ No client secret exposure risk
- ✅ Enhanced logging for PKCE-specific events

## Error Handling

### PKCE-Specific Error Codes

| Error Code | User Message | Description |
|------------|--------------|-------------|
| `INVALID_PKCE_PARAMETERS` | Invalid authentication parameters | PKCE validation failed |
| `PKCE_VERIFICATION_FAILED` | Authentication verification failed | Token exchange failed |
| `MISSING_CODE_VERIFIER` | Missing authentication verifier | No code_verifier provided |

### Error Response Format

All errors return generic user-safe messages while logging detailed information internally:

```typescript
// User sees:
"Invalid authentication parameters"

// Logs contain:
{
  error: "INVALID_PKCE_PARAMETERS",
  issues: ["code_verifier length must be 43-128 characters"],
  integrationId: "...",
  securityThreat: "PARAMETER_VALIDATION_FAILURE"
}
```

## Monitoring and Logging

### Flow Type Tracking

All OAuth operations now track the flow type:

```typescript
logAudit('oauth.callback.success', userId, integrationId, {
  flowType: isPKCEFlow ? 'PKCE' : 'traditional',
  provider: 'google',
  scopesGranted: ['drive.readonly'],
  // ... other audit data
});
```

### PKCE-Specific Metrics

Monitor these PKCE-related metrics:

- **PKCE Flow Success Rate**: Percentage of successful PKCE completions
- **PKCE Parameter Validation Failures**: Invalid code_verifier incidents
- **Flow Type Distribution**: PKCE vs traditional flow usage
- **Security Issue Classification**: PKCE-related security events

## Backward Compatibility

### Existing Integrations

- ✅ All existing traditional OAuth integrations continue to work unchanged
- ✅ No migration required for current implementations
- ✅ Client secret authentication preserved for confidential clients

### Migration Strategy

Organizations can migrate to PKCE gradually:

1. **Phase 1**: Deploy PKCE-enabled backend (supports both flows)
2. **Phase 2**: Update frontend applications to use PKCE
3. **Phase 3**: Monitor and validate PKCE flow success rates
4. **Phase 4**: Optionally deprecate traditional flows for public clients

## Testing PKCE Implementation

### Unit Tests

Test PKCE parameter validation:

```typescript
describe('PKCE Parameter Validation', () => {
  it('should validate code_verifier length', () => {
    const result = oauthSecurity.validatePKCEParameters({
      metadata: { code_verifier: 'too_short' }
    });
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('code_verifier length must be 43-128 characters');
  });
  
  it('should validate code_verifier character set', () => {
    const result = oauthSecurity.validatePKCEParameters({
      metadata: { code_verifier: 'invalid@characters!' }
    });
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('code_verifier contains invalid characters');
  });
});
```

### Integration Tests

Test end-to-end PKCE flow:

```typescript
describe('PKCE OAuth Flow', () => {
  it('should complete PKCE token exchange successfully', async () => {
    const codeVerifier = generateCodeVerifier(); // 43-128 chars
    const tokenResponse = await oauthService.exchangeCodeForTokens(
      'auth_code',
      provider,
      'https://app.com/callback',
      codeVerifier
    );
    
    expect(tokenResponse.accessToken).toBeDefined();
    expect(tokenResponse.refreshToken).toBeDefined();
  });
});
```

## Best Practices

### Frontend Implementation

1. **Generate Secure Code Verifier**:
   ```javascript
   function generateCodeVerifier() {
     const array = new Uint8Array(32);
     crypto.getRandomValues(array);
     return base64URLEncode(array);
   }
   ```

2. **Store PKCE Parameters Securely**:
   - Store code_verifier in session storage (not localStorage)
   - Clear PKCE parameters after successful completion
   - Validate code_challenge generation

3. **Handle PKCE Errors Gracefully**:
   ```javascript
   if (error.code === 'INVALID_PKCE_PARAMETERS') {
     // Regenerate PKCE parameters and retry
     restartOAuthFlow();
   }
   ```

### Backend Configuration

1. **Monitor PKCE Adoption**:
   - Track PKCE vs traditional flow ratios
   - Alert on PKCE validation failures
   - Monitor token exchange success rates

2. **Security Monitoring**:
   - Log all PKCE parameter validation failures
   - Monitor for replay attack attempts
   - Track unusual PKCE flow patterns

3. **Performance Optimization**:
   - Cache PKCE validation results where appropriate
   - Optimize code_verifier validation regex
   - Monitor token exchange latency by flow type

## Troubleshooting

### Common PKCE Issues

1. **Invalid code_verifier Length**:
   ```
   Error: code_verifier length must be 43-128 characters
   Solution: Ensure frontend generates proper length verifier
   ```

2. **Invalid Character Set**:
   ```
   Error: code_verifier contains invalid characters
   Solution: Use only A-Z, a-z, 0-9, -, ., _, ~ characters
   ```

3. **Missing PKCE Parameters**:
   ```
   Error: Missing code_verifier for PKCE flow
   Solution: Ensure frontend stores code_verifier in metadata
   ```

### Debugging Steps

1. **Check Integration Metadata**:
   ```bash
   # Verify PKCE parameters are stored
   db.cloudProviderIntegrations.findOne({_id: ObjectId("...")})
   ```

2. **Review Audit Logs**:
   ```bash
   # Check for PKCE validation failures
   grep "PKCE parameter validation failed" /var/log/mwap/audit.log
   ```

3. **Monitor Flow Detection**:
   ```bash
   # Verify flow type detection
   grep "OAuth flow detected" /var/log/mwap/application.log
   ```

## Conclusion

The PKCE implementation provides secure OAuth 2.0 authentication for public clients while maintaining full backward compatibility with existing traditional OAuth flows. The implementation follows RFC 7636 standards and includes comprehensive security controls, monitoring, and error handling.

Key benefits:
- ✅ Enhanced security for public clients
- ✅ No client secret exposure risk
- ✅ Backward compatibility maintained
- ✅ Comprehensive security monitoring
- ✅ RFC 7636 compliant implementation

For additional support or questions about PKCE implementation, refer to the [OAuth Security Guide](oauth-security.md) or contact the development team.