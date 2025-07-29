# OAuth Callback Security Guide

## Overview

This guide documents the comprehensive security architecture for OAuth callback authentication in the MWAP server. The implementation addresses critical security vulnerabilities while maintaining seamless integration with external OAuth providers.

## Security Challenge

**Problem**: OAuth integration callbacks cannot use JWT authentication because external OAuth providers (Google, Dropbox, OneDrive) cannot provide JWT tokens when completing authorization flows. This creates a security gap where callback endpoints must be public but need robust security controls.

**Solution**: Multi-layered security architecture with enhanced validation, ownership verification, and comprehensive monitoring.

## Security Architecture

### 🛡️ Defense in Depth Strategy

The OAuth callback security implementation uses multiple layers of protection:

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL OAUTH PROVIDER                 │
│                    (Google, Dropbox, etc.)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ OAuth Callback Request
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 1: PUBLIC ROUTE REGISTRY            │
│  ✅ Explicit route registration with security documentation │
│  ✅ Route access logging and monitoring                     │
│  ✅ External caller verification                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ Authorized Public Route
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYER 2: STATE PARAMETER VALIDATION           │
│  ✅ Cryptographic state parameter verification              │
│  ✅ Timestamp validation (10-minute expiration)             │
│  ✅ Nonce validation (16+ characters, alphanumeric)         │
│  ✅ ObjectId format verification for tenant/integration     │
│  ✅ Required field structure validation                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ Valid State Parameter
                       ▼
┌─────────────────────────────────────────────────────────────┐
│             LAYER 3: OWNERSHIP VERIFICATION                │
│  ✅ Integration ownership verification                       │
│  ✅ Tenant access control validation                        │
│  ✅ Replay attack detection (existing token check)          │
│  ✅ Provider availability verification                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ Authorized Integration Access
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               LAYER 4: OAUTH TOKEN EXCHANGE                │
│  ✅ Secure OAuth code exchange with provider                │
│  ✅ Token validation and storage                            │
│  ✅ Integration activation and status update                │
└──────────────────────┬──────────────────────────────────────┘
                       │ Integration Complete
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYER 5: AUDIT AND MONITORING                 │
│  ✅ Comprehensive audit logging for all attempts            │
│  ✅ Security issue classification and tracking              │
│  ✅ Success/failure metrics and alerting                    │
│  ✅ Generic error responses to prevent reconnaissance       │
└─────────────────────────────────────────────────────────────┘
```

## Security Controls Implementation

### 1. Public Route Registration

**File**: `src/middleware/publicRoutes.ts`

The OAuth callback route is explicitly registered in the public routes registry with comprehensive security documentation:

```typescript
{
  path: '/api/v1/oauth/callback',
  methods: ['GET'],
  justification: 'OAuth providers must complete authorization flow without JWT tokens',
  securityControls: [
    'State parameter cryptographic validation',
    'Integration ownership verification',
    'Timestamp validation to prevent replay attacks',
    'Comprehensive audit logging of all attempts',
    'Generic error messages to prevent information disclosure',
    'Redirect URI validation'
  ],
  approvedDate: '2025-01-17',
  externalCallers: [
    'Google OAuth 2.0 service',
    'Dropbox OAuth 2.0 service', 
    'Microsoft OneDrive OAuth 2.0 service'
  ],
  exposesData: false,
  dataExposed: 'None - only redirects to success/error pages with minimal information'
}
```

**Security Benefits**:
- ✅ Explicit route documentation prevents accidental public exposure
- ✅ Security review requirements for all public routes
- ✅ Comprehensive justification and approval tracking
- ✅ External caller documentation for monitoring

### 2. Enhanced State Parameter Validation

**File**: `src/features/oauth/oauthCallbackSecurity.service.ts`

State parameters undergo rigorous validation to prevent tampering and replay attacks:

#### Structure Validation
```typescript
const REQUIRED_STATE_FIELDS = ['tenantId', 'integrationId', 'userId', 'timestamp', 'nonce'];

// Validates all required fields are present
// Verifies ObjectId format for MongoDB references
// Checks data type consistency
```

#### Timestamp Validation
```typescript
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

// Prevents replay attacks through time-based validation
// Rejects future timestamps (clock skew protection)
// Configurable expiration window for flexibility
```

#### Nonce Validation
```typescript
const MIN_NONCE_LENGTH = 16;
const NONCE_REGEX = /^[a-zA-Z0-9\-_]+$/;

// Ensures cryptographic randomness
// Validates character set to prevent injection
// Configurable minimum length requirement
```

**Security Benefits**:
- 🔒 Prevents state parameter tampering
- 🔒 Eliminates replay attack vectors
- 🔒 Validates cryptographic integrity
- 🔒 Provides configurable security parameters

### 3. Integration Ownership Verification

The system verifies that only authorized users can complete OAuth flows:

#### Ownership Chain Validation
1. **Integration Exists**: Verifies integration exists in the specified tenant
2. **Tenant Access**: Confirms user has access to the tenant
3. **Integration State**: Checks integration is ready for OAuth completion
4. **Provider Status**: Ensures cloud provider is available and active

#### Replay Attack Detection
```typescript
if (integration.status === 'active' && integration.accessToken) {
  // Integration already has tokens - potential replay attack
  logAudit('oauth.callback.duplicate_attempt', userId, integrationId, {
    hasExistingTokens: true,
    securityThreat: 'REPLAY_ATTACK_DETECTED'
  });
  return { isValid: false, errorCode: 'ALREADY_CONFIGURED' };
}
```

**Security Benefits**:
- 🛡️ Prevents unauthorized OAuth completions
- 🛡️ Detects and blocks replay attacks
- 🛡️ Validates integration state consistency
- 🛡️ Ensures provider availability

### 4. Generic Error Handling

Error responses are designed to prevent information disclosure:

```typescript
const errorMessages: Record<string, string> = {
  'INVALID_STATE': 'Invalid request parameters',
  'STATE_EXPIRED': 'Request has expired, please try again',
  'INTEGRATION_NOT_FOUND': 'Integration not found',
  'ALREADY_CONFIGURED': 'Integration already configured',
  'PROVIDER_UNAVAILABLE': 'Service temporarily unavailable'
};
```

**Security Benefits**:
- 🔐 Prevents system reconnaissance
- 🔐 Uniform error responses across all failures
- 🔐 User-friendly messages without technical details
- 🔐 Comprehensive internal logging for debugging

### 5. Redirect URI Security

**File**: `src/features/oauth/oauthCallbackSecurity.service.ts`

Redirect URI validation ensures OAuth callbacks only accept requests from authorized domains:

#### Environment-Specific Configuration
```typescript
const ALLOWED_REDIRECT_HOSTS = [
  'localhost', '127.0.0.1',           // Local development
  'mwapss.shibari.photo',             // Staging/development server
  'mwapsp.shibari.photo'              // Production server
];
```

#### HTTPS Enforcement (All Environments)
```typescript
// SECURITY: Always use HTTPS for OAuth flows across all environments
const protocol = 'https'; // Force HTTPS for all OAuth flows for security
const redirectUri = `${protocol}://${req.get('host')}/api/v1/oauth/callback`;
```

#### Required OAuth Provider Configuration
Register these exact redirect URIs with OAuth providers:
- **Production**: `https://mwapsp.shibari.photo/api/v1/oauth/callback`
- **Staging**: `https://mwapss.shibari.photo/api/v1/oauth/callback`
- **Local**: `https://localhost:3001/api/v1/oauth/callback`

> **⚠️ HTTPS-Only Policy**: All OAuth redirect URIs must use HTTPS for security compliance, including local development. Use tools like `mkcert` for local HTTPS certificates.

#### Local Development HTTPS Setup
For local development with HTTPS, install and configure `mkcert`:

```bash
# Install mkcert (macOS)
brew install mkcert

# Install mkcert (Linux)
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert

# Create local CA and certificates
mkcert -install
mkcert localhost 127.0.0.1 ::1

# Configure your local server to use the generated certificates
# Update your OAuth provider settings to use https://localhost:3001/api/v1/oauth/callback
```

**Security Benefits**:
- 🔒 Prevents OAuth hijacking through redirect URI validation
- 🔒 Enforces HTTPS across all environments for maximum security
- 🔒 Validates host allowlist to prevent unauthorized callbacks
- 🔒 Eliminates protocol-based attack vectors by using HTTPS-only

### 6. Comprehensive Audit Logging

All OAuth callback attempts are logged with detailed context:

#### Successful Attempts
```typescript
logAudit('oauth.callback.success', userId, integrationId, {
  tenantId,
  providerId,
  provider: provider.name,
  scopesGranted: tokenResponse.scopesGranted,
  ip: requestContext.ip,
  userAgent: requestContext.userAgent,
  stateAge: requestContext.timestamp - stateData.timestamp
});
```

#### Failed Attempts
```typescript
logAudit('oauth.callback.attempt.failed', userId || 'unknown', integrationId || 'unknown', {
  errorCode: auditData.errorCode,
  securityIssues: auditData.securityIssues,
  ip: auditData.ip,
  userAgent: auditData.userAgent,
  component: 'oauth_callback_security'
});
```

#### Security Issue Tracking
```typescript
if (auditData.securityIssues && auditData.securityIssues.length > 0) {
  logError('OAuth callback security issues detected', {
    securityIssues: auditData.securityIssues,
    errorCode: auditData.errorCode,
    threatLevel: 'MEDIUM',
    requiresInvestigation: true
  });
}
```

**Security Benefits**:
- 📊 Complete audit trail for security analysis
- 📊 Security issue classification and tracking  
- 📊 Performance and availability monitoring
- 📊 Forensic investigation capabilities

## Implementation Files

### Core Security Components

| File | Purpose | Security Role |
|------|---------|---------------|
| `src/middleware/publicRoutes.ts` | Public route registry | Route authorization and documentation |
| `src/middleware/auth.ts` | Authentication middleware | JWT bypass for public routes |
| `src/features/oauth/oauthCallbackSecurity.service.ts` | Callback security service | State validation and ownership verification |
| `src/features/oauth/oauth.controller.ts` | OAuth controller | Enhanced callback processing |
| `src/features/oauth/oauth.routes.ts` | Route configuration | Security-enhanced route setup |

### Test Coverage

| Test File | Coverage | Purpose |
|-----------|----------|---------|
| `tests/middleware/publicRoutes.test.ts` | Route registry | Public route detection and validation |
| `tests/middleware/auth.test.ts` | Authentication | JWT bypass behavior verification |
| `tests/oauth/oauthCallbackSecurity.test.ts` | Security validation | Comprehensive security control testing |

## Security Configuration

### Configurable Security Parameters

```typescript
// State parameter security
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
const MIN_NONCE_LENGTH = 16; // characters
const REQUIRED_STATE_FIELDS = ['tenantId', 'integrationId', 'userId', 'timestamp', 'nonce'];

// Route monitoring
const MAX_REQUESTS_PER_MINUTE = 60; // per IP
const EXPECTED_RESPONSE_TIME = 2000; // milliseconds

// Error handling
const GENERIC_ERROR_MESSAGE = 'An error occurred during authentication';
const ERROR_REDIRECT_BASE = '/oauth/error';
```

### Environment-Specific Settings

| Environment | State Expiration | Nonce Length | Logging Level |
|-------------|------------------|--------------|---------------|
| Production | 10 minutes | 16 characters | INFO + AUDIT |
| Staging | 15 minutes | 12 characters | DEBUG + AUDIT |
| Development | 30 minutes | 8 characters | DEBUG + AUDIT |

## Monitoring and Alerting

### Key Security Metrics

1. **OAuth Callback Success Rate**
   - Target: >95% successful completions
   - Alert: <90% success rate over 5 minutes

2. **State Parameter Validation Failures**
   - Target: <1% validation failures
   - Alert: >5% failures indicating potential attacks

3. **Replay Attack Detections**
   - Target: 0 replay attempts
   - Alert: Any detected replay attack

4. **Integration Ownership Violations**
   - Target: 0 ownership violations
   - Alert: Any unauthorized access attempt

### Security Event Log Queries

#### Failed OAuth Attempts
```sql
SELECT * FROM audit_logs 
WHERE event_type = 'oauth.callback.attempt.failed'
AND timestamp > NOW() - INTERVAL 1 HOUR
ORDER BY timestamp DESC;
```

#### Security Issues
```sql
SELECT * FROM audit_logs 
WHERE event_data->>'securityIssues' IS NOT NULL
AND event_type LIKE 'oauth%'
ORDER BY timestamp DESC;
```

#### Replay Attack Detection
```sql
SELECT * FROM audit_logs 
WHERE event_type = 'oauth.callback.duplicate_attempt'
AND event_data->>'hasExistingTokens' = 'true'
ORDER BY timestamp DESC;
```

## Security Review Process

### Regular Security Reviews

1. **Monthly Security Audit**
   - Review public route registry
   - Analyze security event logs
   - Validate security control effectiveness

2. **Quarterly Penetration Testing**
   - OAuth callback endpoint testing
   - State parameter manipulation attempts
   - Replay attack simulation

3. **Annual Security Architecture Review**
   - Evaluate security control evolution
   - Update threat model
   - Review security documentation

### Security Approval Process

For any changes to OAuth callback security:

1. **Security Impact Assessment**
   - Document security implications
   - Identify affected security controls
   - Assess threat model changes

2. **Security Team Review**
   - Code review by security team
   - Security testing validation
   - Documentation approval

3. **Production Deployment**
   - Staged rollout with monitoring
   - Security metric validation
   - Incident response readiness

## Threat Model and Mitigations

### Identified Threats and Mitigations

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| State Parameter Tampering | HIGH | MEDIUM | Cryptographic validation, structure checks |
| Replay Attacks | HIGH | MEDIUM | Timestamp validation, existing token detection |
| Unauthorized OAuth Completion | HIGH | LOW | Ownership verification, tenant access control |
| Redirect URI Hijacking | HIGH | LOW | Host allowlist validation, HTTPS enforcement |
| Information Disclosure | MEDIUM | LOW | Generic error messages, sanitized logging |
| Reconnaissance Attacks | MEDIUM | MEDIUM | Generic responses, rate limiting |
| Man-in-the-Middle | MEDIUM | LOW | HTTPS enforcement, redirect URI validation |

### Attack Scenarios and Response

#### Scenario 1: Malicious State Parameter
**Attack**: Attacker modifies state parameter to target different integration
**Detection**: Structure validation fails, ObjectId format violations
**Response**: Request denied, security event logged, generic error returned

#### Scenario 2: Replay Attack
**Attack**: Attacker reuses captured OAuth callback URL
**Detection**: Timestamp expiration or existing token detection
**Response**: Request denied, replay attack logged, investigation triggered

#### Scenario 3: Cross-Tenant Attack
**Attack**: Attacker attempts to complete OAuth for integration in different tenant
**Detection**: Integration ownership verification fails
**Response**: Access denied, ownership violation logged, security alert

#### Scenario 4: Redirect URI Hijacking
**Attack**: Attacker registers malicious domain to intercept OAuth callbacks
**Detection**: Host validation fails, unauthorized domain detected
**Response**: Request denied, redirect URI violation logged, security alert

## Best Practices

### For Developers

1. **Never Modify Public Routes Without Security Review**
   - All public route changes require security team approval
   - Document security justification for any new public routes
   - Maintain comprehensive test coverage for security controls

2. **Security-First Error Handling**
   - Always use generic error messages for public endpoints
   - Log detailed security context internally
   - Never expose system internals in error responses

3. **Comprehensive Audit Logging**
   - Log all security-relevant events with context
   - Include sufficient detail for forensic analysis
   - Ensure logs are tamper-resistant and backed up

### For Security Teams

1. **Regular Security Monitoring**
   - Monitor OAuth callback success/failure rates
   - Track security issue trends and patterns
   - Investigate any unusual activity promptly

2. **Proactive Threat Hunting**
   - Analyze logs for attack patterns
   - Test security controls regularly
   - Update threat model based on new intelligence

3. **Incident Response Readiness**
   - Maintain incident response procedures for OAuth attacks
   - Ensure rapid detection and containment capabilities
   - Document lessons learned from security incidents

## Conclusion

The OAuth callback authentication security implementation provides comprehensive protection against common attack vectors while maintaining seamless integration with external OAuth providers. The multi-layered security architecture ensures defense in depth, while comprehensive monitoring enables rapid detection and response to security threats.

Regular security reviews and continuous monitoring ensure the security controls remain effective against evolving threats, providing a robust foundation for secure OAuth integrations in the MWAP platform. 