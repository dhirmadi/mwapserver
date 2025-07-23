# OAuth Integration Guide

## Overview

This guide provides comprehensive instructions for integrating OAuth providers with the MWAP platform. The OAuth system implements a secure, scalable architecture with comprehensive security controls, monitoring, and audit logging.

## Architecture

### Core Components

1. **Authentication Middleware** (`src/middleware/auth.ts`)
   - Selective JWT authentication with public route detection
   - Comprehensive audit logging for all access attempts
   - Zero Trust security model with explicit public route registry

2. **OAuth Controller** (`src/features/oauth/oauth.controller.ts`)
   - Secure OAuth callback handling with state parameter validation
   - Integration ownership verification
   - Comprehensive error handling with generic responses

3. **Security Services**
   - **OAuth Callback Security** (`src/features/oauth/oauthCallbackSecurity.service.ts`)
   - **Security Monitoring** (`src/features/oauth/oauthSecurityMonitoring.service.ts`)

4. **Public Route Registry** (`src/middleware/publicRoutes.ts`)
   - Strictly controlled registry of public endpoints
   - Security justification documentation for each route

## Security Model

### Zero Trust Principles

- **Default Deny**: All routes require JWT authentication by default
- **Explicit Allow**: Only explicitly registered routes bypass authentication
- **Comprehensive Logging**: All public route access attempts are audited
- **Minimal Exposure**: Public routes expose no sensitive data

### OAuth Callback Security

1. **State Parameter Validation**
   - Cryptographic integrity verification
   - Timestamp-based expiration (10 minutes)
   - Nonce validation for uniqueness
   - Structure validation with required fields

2. **Integration Ownership Verification**
   - Tenant-integration relationship validation
   - User access verification through state parameter
   - Provider availability and accessibility checks

3. **Redirect URI Security**
   - Scheme whitelist (http/https only)
   - Host whitelist with subdomain support
   - Exact path matching (`/api/v1/oauth/callback`)
   - Query parameter and fragment prevention

4. **Replay Attack Prevention**
   - State parameters expire after 10 minutes
   - Timestamp validation prevents future-dated states
   - Duplicate attempt detection prevents reuse

## Integration Process

### 1. Provider Configuration

Add your OAuth provider to the cloud providers collection:

```javascript
{
  name: "your_provider",
  displayName: "Your Provider",
  type: "oauth",
  authUrl: "https://provider.com/oauth/authorize",
  tokenUrl: "https://provider.com/oauth/token",
  scopes: ["scope1", "scope2"],
  clientId: "your_client_id",
  clientSecret: "your_client_secret", // Encrypted
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### 2. OAuth Flow Implementation

#### Step 1: Authorization Request

```javascript
// Generate authorization URL
const authUrl = `${provider.authUrl}?${new URLSearchParams({
  client_id: provider.clientId,
  response_type: 'code',
  redirect_uri: `${baseUrl}/api/v1/oauth/callback`,
  scope: provider.scopes.join(' '),
  state: generateStateParameter(integrationId, tenantId, userId)
}).toString()}`;

// Redirect user to authorization URL
res.redirect(authUrl);
```

#### Step 2: Callback Handling

The OAuth callback endpoint (`/api/v1/oauth/callback`) handles the authorization response:

1. **Security Validation**
   - State parameter validation
   - Integration ownership verification
   - Redirect URI validation

2. **Token Exchange**
   - Exchange authorization code for access tokens
   - Store tokens securely with encryption

3. **Integration Update**
   - Update integration status to 'configured'
   - Store provider-specific metadata

### 3. State Parameter Generation

```javascript
function generateStateParameter(integrationId, tenantId, userId) {
  const stateData = {
    integrationId,
    tenantId,
    userId,
    nonce: generateNonce(),
    timestamp: Date.now()
  };
  
  return Buffer.from(JSON.stringify(stateData)).toString('base64');
}
```

## API Endpoints

### Public Endpoints

#### OAuth Callback
- **Endpoint**: `GET /api/v1/oauth/callback`
- **Authentication**: None (Public route)
- **Purpose**: Handle OAuth provider callbacks
- **Security**: State parameter validation, comprehensive audit logging

### Protected Endpoints

#### Token Refresh
- **Endpoint**: `POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh`
- **Authentication**: JWT required
- **Authorization**: Tenant owner only
- **Purpose**: Refresh OAuth access tokens

#### Security Monitoring
- **Endpoint**: `GET /api/v1/oauth/security/*`
- **Authentication**: JWT required
- **Authorization**: Admin only (future enhancement)
- **Purpose**: Access security metrics, alerts, and reports

## Security Monitoring

### Real-time Metrics

Access security metrics via the monitoring API:

```javascript
GET /api/v1/oauth/security/metrics?timeWindow=300000 // 5 minutes
```

Response:
```json
{
  "metrics": {
    "totalAttempts": 150,
    "successfulAttempts": 142,
    "failedAttempts": 8,
    "successRate": 0.947,
    "failureRate": 0.053,
    "timeWindow": "300s"
  }
}
```

### Security Alerts

Monitor active security alerts:

```javascript
GET /api/v1/oauth/security/alerts
```

### Suspicious Pattern Detection

The system automatically detects:
- High failure rates (>50%)
- Rapid attempts (>10 in 5 minutes)
- IP abuse (>20 attempts from single IP)
- State parameter manipulation

## Error Handling

### Generic Error Responses

All OAuth errors return generic messages to prevent information disclosure:

- `Invalid request parameters`
- `Request has expired, please try again`
- `Security verification failed`
- `Service temporarily unavailable`

### Error Codes (Internal)

- `INVALID_STATE`: State parameter validation failed
- `STATE_EXPIRED`: State parameter expired (>10 minutes)
- `INTEGRATION_NOT_FOUND`: Integration not found
- `PROVIDER_ERROR`: OAuth provider returned error
- `INVALID_REDIRECT_URI`: Redirect URI validation failed

## Testing

### Local Development

1. **Environment Setup**
   ```bash
   # Set environment variables
   export NODE_ENV=development
   export JWT_SECRET=your_jwt_secret
   export MONGODB_URI=your_mongodb_uri
   ```

2. **Mock Provider Testing**
   Use the OAuth test environment for local testing without real providers.

3. **Security Validation**
   ```bash
   # Test security endpoints
   curl -H "Authorization: Bearer $JWT_TOKEN" \
        http://localhost:3000/api/v1/oauth/security/report
   ```

### Integration Testing

1. **State Parameter Validation**
   - Test valid state parameters
   - Test expired state parameters
   - Test tampered state parameters

2. **Error Scenarios**
   - Provider error responses
   - Network failures
   - Invalid authorization codes

3. **Security Monitoring**
   - Verify suspicious pattern detection
   - Test security alert generation
   - Validate audit logging

## Best Practices

### Security

1. **State Parameter Security**
   - Always validate state parameters
   - Use cryptographically secure nonces
   - Implement proper expiration handling

2. **Token Management**
   - Store tokens encrypted at rest
   - Implement secure token refresh
   - Use proper token scoping

3. **Error Handling**
   - Return generic error messages
   - Log detailed errors internally
   - Implement proper retry mechanisms

### Performance

1. **Monitoring**
   - Monitor OAuth success/failure rates
   - Track response times
   - Set up alerting for anomalies

2. **Caching**
   - Cache provider configurations
   - Implement efficient state validation
   - Use connection pooling for database access

### Compliance

1. **Audit Logging**
   - Log all OAuth attempts
   - Include security context
   - Maintain audit trails for compliance

2. **Data Protection**
   - Minimize data exposure in public routes
   - Implement proper data retention
   - Follow GDPR requirements

## Troubleshooting

### Common Issues

1. **OAuth Callback 401 Errors**
   - Verify public route registration
   - Check JWT middleware configuration
   - Validate redirect URI configuration

2. **State Parameter Validation Failures**
   - Check state parameter generation
   - Verify timestamp handling
   - Validate nonce generation

3. **Token Exchange Failures**
   - Verify provider configuration
   - Check client credentials
   - Validate redirect URI matching

### Debug Tools

1. **Security Monitoring Dashboard**
   ```bash
   GET /api/v1/oauth/security/report
   ```

2. **Audit Log Analysis**
   ```bash
   # Check application logs for OAuth events
   grep "oauth" application.log
   ```

3. **State Parameter Debugging**
   ```javascript
   // Decode state parameter for debugging
   const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
   console.log('State data:', stateData);
   ```

## Migration Guide

### From Previous Versions

1. **Update Authentication Middleware**
   - Implement public route detection
   - Add comprehensive logging
   - Update error handling

2. **Enhance Security Controls**
   - Add state parameter validation
   - Implement redirect URI validation
   - Add security monitoring

3. **Update Documentation**
   - Document public route security model
   - Update API documentation
   - Create troubleshooting guides

## Support

For additional support:

1. **Documentation**: Check `/docs` directory for detailed architecture guides
2. **Security Issues**: Report security concerns through proper channels
3. **Integration Help**: Consult the troubleshooting guide and security monitoring tools

---

**Last Updated**: 2025-07-23  
**Version**: 1.0  
**Maintainer**: MWAP Security Team