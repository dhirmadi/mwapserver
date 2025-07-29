# OAuth Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting information for OAuth integration issues in the MWAP platform. It covers common problems, diagnostic procedures, and resolution steps for OAuth-related issues.

## Quick Diagnostic Checklist

Before diving into specific issues, run through this quick checklist:

- [ ] Check OAuth provider configuration
- [ ] Verify redirect URI configuration
- [ ] Validate JWT middleware configuration
- [ ] Check public route registration
- [ ] Review recent security alerts
- [ ] Examine audit logs for error patterns

## Common Issues and Solutions

### 1. OAuth Redirect URI Mismatch Errors

**Symptoms**:
- OAuth provider returns "redirect_uri mismatch" error during token exchange
- Dropbox returns "Invalid redirect_uri parameter" error
- OAuth flow fails after user authorization with provider-specific error messages
- Token exchange requests fail with 400 Bad Request

**Root Causes**:
1. Different redirect URI construction logic between authorization and callback phases
2. Frontend constructing authorization URLs with different redirect URI than backend callback handler
3. HTTP vs HTTPS protocol mismatch in different environments
4. Express proxy configuration issues in Heroku/cloud environments
5. Missing or incorrect `trust proxy` configuration

**Diagnostic Steps**:

1. **Check Redirect URI Consistency**:
   ```bash
   # Check application logs for redirect URI values
   grep "OAuth redirect URI" logs/application.log
   grep "redirectUri" logs/application.log
   
   # Look for both authorization and callback redirect URIs
   grep -A 5 -B 5 "authorization.*redirectUri\|callback.*redirectUri" logs/application.log
   ```

2. **Verify Express Proxy Configuration**:
   ```bash
   # Check app.ts for proper proxy configuration
   grep -n "trust proxy" src/app.ts
   # Should show: app.set('trust proxy', 1)
   # NOT: app.enable('trust proxy')
   ```

3. **Test OAuth Initiation Endpoint**:
   ```bash
   # Test the OAuth initiation endpoint
   curl -X POST \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:3000/api/v1/oauth/tenants/$TENANT_ID/integrations/$INTEGRATION_ID/initiate"
   
   # Verify the redirectUri in the response matches callback expectations
   ```

4. **Check Protocol Consistency**:
   ```bash
   # Verify HTTPS enforcement in logs
   grep "protocol.*https\|HTTPS" logs/application.log
   
   # Check for protocol resolution logs
   grep "originalProtocol\|resolvedProtocol" logs/application.log
   ```

**Resolution Steps**:

1. **Use OAuth Initiation Endpoint** (Recommended):
   ```javascript
   // Frontend: Replace direct authorization URL construction
   const response = await fetch(`/api/v1/oauth/tenants/${tenantId}/integrations/${integrationId}/initiate`, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${jwtToken}`,
       'Content-Type': 'application/json'
     }
   });
   
   const { authorizationUrl } = await response.json();
   window.location.href = authorizationUrl;
   ```

2. **Fix Express Proxy Configuration**:
   ```javascript
   // In src/app.ts - CORRECT configuration
   app.set('trust proxy', 1);
   
   // NOT this (insecure):
   // app.enable('trust proxy');
   ```

3. **Verify Redirect URI Construction**:
   ```javascript
   // Both authorization and callback should use identical logic:
   const protocol = 'https'; // Force HTTPS for all OAuth flows
   const redirectUri = `${protocol}://${req.get('host')}/api/v1/oauth/callback`;
   ```

4. **Enable Enhanced Logging**:
   ```javascript
   // Add to OAuth controller for debugging
   logInfo('OAuth redirect URI resolved', {
     originalProtocol: req.protocol,
     resolvedProtocol: protocol,
     host: req.get('host'),
     redirectUri,
     environment: process.env.NODE_ENV,
     forwardedProto: req.get('X-Forwarded-Proto')
   });
   ```

**Prevention**:
- Always use the OAuth initiation endpoint for new integrations
- Implement redirect URI consistency tests in CI/CD pipeline
- Monitor OAuth success rates and alert on redirect URI mismatch patterns
- Use centralized redirect URI construction logic

### 2. OAuth Callback 401 Unauthorized Errors

**Symptoms**:
- OAuth providers receive 401 Unauthorized when calling callback endpoint
- Users see "Authentication failed" messages after OAuth authorization
- OAuth flow fails at callback stage

**Root Causes**:
1. JWT middleware blocking public OAuth callback endpoint
2. Public route not properly registered
3. Authentication middleware misconfiguration

**Diagnostic Steps**:

1. **Check Public Route Registration**:
   ```bash
   # Verify OAuth callback is registered as public route
   grep -r "oauth/callback" src/middleware/publicRoutes.ts
   ```

2. **Verify Authentication Middleware**:
   ```bash
   # Check if isPublicRoute function is working
   curl -v http://localhost:3000/api/v1/oauth/callback
   # Should NOT return 401 for GET requests
   ```

3. **Check Application Logs**:
   ```bash
   # Look for authentication middleware logs
   grep "public route" logs/application.log
   grep "oauth.callback" logs/application.log
   ```

**Resolution Steps**:

1. **Ensure Public Route Registration**:
   ```typescript
   // In src/middleware/publicRoutes.ts
   {
     path: '/api/v1/oauth/callback',
     methods: ['GET'],
     justification: 'OAuth provider callback endpoint',
     // ... other configuration
   }
   ```

2. **Verify Middleware Order**:
   ```typescript
   // In src/app.ts - ensure correct middleware order
   app.use(authenticateJWT); // Should check for public routes
   app.use('/api/v1/oauth', oauthRoutes);
   ```

3. **Test Public Route Access**:
   ```bash
   # Test without authentication
   curl -X GET "http://localhost:3000/api/v1/oauth/callback?code=test&state=test"
   # Should not return 401
   ```

### 2. State Parameter Validation Failures

**Symptoms**:
- "Invalid request parameters" error messages
- OAuth flow fails after user authorization
- Security alerts for state parameter manipulation

**Root Causes**:
1. State parameter corruption during transmission
2. State parameter expiration (>10 minutes)
3. State parameter tampering or manipulation
4. Incorrect state parameter generation

**Diagnostic Steps**:

1. **Decode State Parameter**:
   ```javascript
   // Debug state parameter content
   const state = "base64_encoded_state";
   try {
     const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
     console.log('State data:', decoded);
     console.log('Age (minutes):', (Date.now() - decoded.timestamp) / 60000);
   } catch (error) {
     console.log('State decode error:', error.message);
   }
   ```

2. **Check Security Monitoring**:
   ```bash
   # Check for state parameter security alerts
   curl -H "Authorization: Bearer $JWT_TOKEN" \
        http://localhost:3000/api/v1/oauth/security/patterns
   ```

3. **Examine Audit Logs**:
   ```bash
   # Look for state validation errors
   grep "state.*validation" logs/application.log
   grep "INVALID_STATE" logs/application.log
   ```

**Resolution Steps**:

1. **Verify State Generation**:
   ```typescript
   // Ensure proper state parameter generation
   const stateData = {
     integrationId: integration._id.toString(),
     tenantId: tenant._id.toString(),
     userId: user.sub,
     nonce: generateSecureNonce(),
     timestamp: Date.now()
   };
   const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
   ```

2. **Check Timestamp Handling**:
   ```typescript
   // Verify timestamp validation logic
   const age = Date.now() - stateData.timestamp;
   const maxAge = 10 * 60 * 1000; // 10 minutes
   if (age > maxAge) {
     // Handle expired state
   }
   ```

3. **Validate Integration Ownership**:
   ```typescript
   // Ensure integration belongs to tenant/user
   const integration = await Integration.findOne({
     _id: stateData.integrationId,
     tenantId: stateData.tenantId
   });
   ```

### 3. Token Exchange Failures

**Symptoms**:
- OAuth flow completes but integration remains unconfigured
- "Service temporarily unavailable" error messages
- Provider-specific error responses (400 Bad Request, 401 Unauthorized)
- "Failed to exchange code for tokens" error messages
- Dropbox OAuth specifically returning 400 Bad Request errors

**Root Causes**:
1. **Incorrect client authentication method** (most common with Dropbox)
2. Invalid OAuth provider configuration
3. Incorrect client credentials
4. Redirect URI mismatch between authorization and token exchange
5. Network connectivity issues
6. Provider API changes
7. Expired or invalid authorization codes

**Diagnostic Steps**:

1. **Check Token Exchange Logs**:
   ```bash
   # Look for detailed token exchange errors
   grep "Token exchange" logs/application.log
   grep "exchangeCodeForTokens" logs/application.log
   grep "invalid_client\|invalid_grant\|invalid_request" logs/application.log
   ```

2. **Verify Provider Configuration**:
   ```bash
   # Check provider configuration in database
   db.cloudProviders.findOne({name: "dropbox"})
   ```

3. **Test Token Exchange with HTTP Basic Auth**:
   ```bash
   # Manual token exchange test using HTTP Basic Authentication (RFC 6749 compliant)
   curl -X POST https://api.dropboxapi.com/oauth2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
     -d "code=AUTH_CODE&grant_type=authorization_code&redirect_uri=REDIRECT_URI"
   ```

4. **Compare with Legacy Method** (for debugging):
   ```bash
   # Test with credentials in body (deprecated method)
   curl -X POST https://api.dropboxapi.com/oauth2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "code=AUTH_CODE&grant_type=authorization_code&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=REDIRECT_URI"
   ```

5. **Check Network Connectivity**:
   ```bash
   # Test connectivity to provider
   curl -v https://api.dropboxapi.com/oauth2/token
   ```

**Resolution Steps**:

1. **Verify HTTP Basic Authentication Implementation** (Critical for Dropbox):
   ```typescript
   // CORRECT: Use HTTP Basic Authentication per RFC 6749 Section 2.3.1
   const clientCredentials = Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64');
   
   const tokenRequest = {
     method: 'POST',
     url: provider.tokenUrl,
     headers: {
       'Content-Type': 'application/x-www-form-urlencoded',
       'Authorization': `Basic ${clientCredentials}`,
       'User-Agent': 'MWAP-OAuth-Client/1.0'
     },
     data: new URLSearchParams({
       grant_type: 'authorization_code',
       code,
       redirect_uri: redirectUri
     }).toString()
   };
   ```

2. **Validate Provider Configuration**:
   ```typescript
   // Ensure all required fields are present
   const provider = {
     name: 'dropbox',
     authUrl: 'https://www.dropbox.com/oauth2/authorize',
     tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
     clientId: 'your_client_id',
     clientSecret: 'your_client_secret', // Encrypted
     grantType: 'authorization_code',
     tokenMethod: 'POST',
     scopes: ['files.content.read', 'files.content.write']
   };
   ```

3. **Ensure Exact Redirect URI Matching**:
   ```typescript
   // CRITICAL: redirect_uri must exactly match between authorization and token exchange
   const redirectUri = `https://${req.get('host')}/api/v1/oauth/callback`;
   // Must match the URI used in the authorization request AND registered with OAuth provider
   ```

4. **Implement Comprehensive Error Handling**:
   ```typescript
   // Handle specific OAuth error codes
   if (response.status >= 400) {
     const errorData = response.data || {};
     let errorMessage = 'Failed to exchange code for tokens';
     
     switch (errorData.error) {
       case 'invalid_grant':
         errorMessage = 'Authorization code is invalid or expired';
         break;
       case 'invalid_client':
         errorMessage = 'Client authentication failed';
         break;
       case 'invalid_request':
         errorMessage = 'Token request is malformed';
         break;
       case 'unsupported_grant_type':
         errorMessage = 'Grant type not supported by provider';
         break;
     }
     
     throw new ApiError(errorMessage, response.status);
   }
   ```

5. **Check Client Credentials and Registration**:
   ```bash
   # Verify credentials are correct and not expired
   # Check OAuth provider dashboard for credential status
   # Ensure redirect URI is registered exactly as: https://yourdomain.com/api/v1/oauth/callback
   ```

6. **Monitor Token Exchange Performance**:
   ```typescript
   // Add timeout and performance monitoring
   const tokenRequest = {
     // ... other config
     timeout: 30000, // 30 second timeout
     validateStatus: (status: number) => status < 500 // Handle 4xx errors gracefully
   };
   ```

**Common Dropbox-Specific Issues**:

- **400 Bad Request**: Usually indicates incorrect client authentication method. Ensure using HTTP Basic Auth.
- **401 Unauthorized**: Client credentials are invalid or client_id/client_secret mismatch.
- **Invalid Grant**: Authorization code expired (10-minute limit) or already used.
- **Redirect URI Mismatch**: The redirect_uri in token exchange doesn't match authorization request.

### 4. Integration Ownership Verification Failures

**Symptoms**:
- "Integration not found" error messages
- OAuth flow fails for valid integrations
- Security alerts for ownership verification

**Root Causes**:
1. Integration not found in database
2. Tenant-integration relationship mismatch
3. User access permission issues
4. Database connectivity problems

**Diagnostic Steps**:

1. **Verify Integration Exists**:
   ```bash
   # Check integration in database
   db.cloudIntegrations.findOne({_id: ObjectId("integration_id")})
   ```

2. **Check Tenant Relationship**:
   ```bash
   # Verify tenant-integration relationship
   db.cloudIntegrations.findOne({
     _id: ObjectId("integration_id"),
     tenantId: ObjectId("tenant_id")
   })
   ```

3. **Validate User Access**:
   ```bash
   # Check user belongs to tenant
   db.tenants.findOne({
     _id: ObjectId("tenant_id"),
     "users.userId": "user_id"
   })
   ```

**Resolution Steps**:

1. **Verify Integration Creation**:
   ```typescript
   // Ensure integration is properly created before OAuth flow
   const integration = await CloudIntegration.create({
     tenantId: tenant._id,
     providerId: provider._id,
     status: 'pending',
     createdBy: user.sub
   });
   ```

2. **Check Database Indexes**:
   ```bash
   # Ensure proper indexes for performance
   db.cloudIntegrations.createIndex({tenantId: 1, _id: 1})
   ```

3. **Validate State Parameter Data**:
   ```typescript
   // Ensure state contains correct IDs
   const stateData = {
     integrationId: integration._id.toString(), // String format
     tenantId: tenant._id.toString(),           // String format
     userId: user.sub
   };
   ```

### 5. Redirect URI Security Failures

**Symptoms**:
- "Invalid redirect configuration" error messages
- OAuth flow blocked at callback stage
- Security alerts for redirect URI issues

**Root Causes**:
1. Redirect URI not in allowed hosts list
2. Invalid URI scheme (not http/https)
3. Query parameters in redirect URI
4. Path mismatch

**Diagnostic Steps**:

1. **Check Redirect URI Configuration**:
   ```typescript
   // In oauthCallbackSecurity.service.ts
   const ALLOWED_REDIRECT_HOSTS = [
     'localhost',
     'your-domain.com',
     'staging.your-domain.com'
   ];
   ```

2. **Validate URI Format**:
   ```javascript
   // Test URI parsing
   const redirectUri = "http://localhost:3000/api/v1/oauth/callback";
   try {
     const url = new URL(redirectUri);
     console.log('Scheme:', url.protocol);
     console.log('Host:', url.hostname);
     console.log('Path:', url.pathname);
   } catch (error) {
     console.log('Invalid URI:', error.message);
   }
   ```

**Resolution Steps**:

1. **Update Allowed Hosts**:
   ```typescript
   // Add your domain to allowed hosts
   private readonly ALLOWED_REDIRECT_HOSTS = [
     'localhost',
     'your-domain.com',
     'staging.your-domain.com',
     'production.your-domain.com'
   ];
   ```

2. **Ensure Correct URI Format**:
   ```typescript
   // Proper redirect URI format
   const redirectUri = `${protocol}://${hostname}/api/v1/oauth/callback`;
   // No query parameters or fragments
   ```

## Security Monitoring and Alerts

### Accessing Security Metrics

1. **Real-time Metrics**:
   ```bash
   curl -H "Authorization: Bearer $JWT_TOKEN" \
        "http://localhost:3000/api/v1/oauth/security/metrics?timeWindow=300000"
   ```

2. **Security Alerts**:
   ```bash
   curl -H "Authorization: Bearer $JWT_TOKEN" \
        "http://localhost:3000/api/v1/oauth/security/alerts"
   ```

3. **Suspicious Patterns**:
   ```bash
   curl -H "Authorization: Bearer $JWT_TOKEN" \
        "http://localhost:3000/api/v1/oauth/security/patterns"
   ```

### Understanding Security Alerts

**High Failure Rate Alert**:
```json
{
  "type": "HIGH_FAILURE_RATE",
  "severity": "HIGH",
  "description": "High failure rate detected: 75.0%",
  "evidence": {
    "failureRate": 0.75,
    "totalAttempts": 20,
    "failedAttempts": 15
  }
}
```

**Recommended Actions**:
- Check OAuth provider configuration
- Verify client credentials
- Review recent configuration changes

**Rapid Attempts Alert**:
```json
{
  "type": "RAPID_ATTEMPTS",
  "severity": "MEDIUM",
  "description": "Rapid callback attempts detected: 15 in 300s",
  "evidence": {
    "attemptCount": 15,
    "timeWindow": 300000,
    "ip": "192.168.1.100"
  }
}
```

**Recommended Actions**:
- Investigate potential bot activity
- Consider implementing additional rate limiting
- Monitor for DDoS patterns

## Diagnostic Tools

### 1. OAuth Flow Tester

Create a simple test script to validate OAuth flow:

```javascript
// oauth-test.js
const axios = require('axios');

async function testOAuthFlow(providerId, integrationId) {
  try {
    // Step 1: Generate authorization URL
    const authUrl = generateAuthUrl(providerId, integrationId);
    console.log('Authorization URL:', authUrl);
    
    // Step 2: Simulate callback (manual step)
    console.log('Visit the authorization URL and copy the callback URL');
    
    // Step 3: Test callback endpoint
    const callbackUrl = 'http://localhost:3000/api/v1/oauth/callback?code=test&state=test';
    const response = await axios.get(callbackUrl);
    console.log('Callback response:', response.status);
    
  } catch (error) {
    console.error('OAuth test failed:', error.message);
  }
}
```

### 2. State Parameter Validator

```javascript
// state-validator.js
function validateStateParameter(state) {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
    
    console.log('State Parameter Analysis:');
    console.log('- Integration ID:', decoded.integrationId);
    console.log('- Tenant ID:', decoded.tenantId);
    console.log('- User ID:', decoded.userId);
    console.log('- Nonce:', decoded.nonce);
    console.log('- Timestamp:', new Date(decoded.timestamp));
    console.log('- Age (minutes):', (Date.now() - decoded.timestamp) / 60000);
    
    // Validation checks
    const age = Date.now() - decoded.timestamp;
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    if (age > maxAge) {
      console.log('❌ State parameter expired');
    } else {
      console.log('✅ State parameter valid');
    }
    
  } catch (error) {
    console.log('❌ Invalid state parameter:', error.message);
  }
}
```

### 3. Security Monitoring Dashboard

```bash
#!/bin/bash
# oauth-monitor.sh

echo "OAuth Security Monitoring Dashboard"
echo "=================================="

# Get security metrics
echo "Security Metrics:"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
     "http://localhost:3000/api/v1/oauth/security/metrics" | jq .

echo -e "\nActive Alerts:"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
     "http://localhost:3000/api/v1/oauth/security/alerts" | jq .

echo -e "\nSuspicious Patterns:"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
     "http://localhost:3000/api/v1/oauth/security/patterns" | jq .
```

## Performance Troubleshooting

### Slow OAuth Callbacks

**Symptoms**:
- OAuth callbacks taking >5 seconds to complete
- Timeout errors from OAuth providers
- Poor user experience

**Diagnostic Steps**:

1. **Check Database Performance**:
   ```bash
   # Monitor database query performance
   db.setProfilingLevel(2)
   db.system.profile.find().sort({ts: -1}).limit(5)
   ```

2. **Monitor Network Latency**:
   ```bash
   # Test network latency to OAuth providers
   curl -w "@curl-format.txt" -o /dev/null -s https://api.dropboxapi.com/oauth2/token
   ```

3. **Profile Application Performance**:
   ```bash
   # Use Node.js profiling tools
   node --prof app.js
   ```

**Resolution Steps**:

1. **Optimize Database Queries**:
   ```typescript
   // Use proper indexes
   await CloudIntegration.findOne({
     _id: integrationId,
     tenantId: tenantId
   }).lean(); // Use lean() for read-only operations
   ```

2. **Implement Caching**:
   ```typescript
   // Cache provider configurations
   const providerCache = new Map();
   ```

3. **Use Connection Pooling**:
   ```typescript
   // Configure MongoDB connection pooling
   mongoose.connect(uri, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000
   });
   ```

## Prevention Strategies

### 1. Monitoring and Alerting

- Set up comprehensive monitoring for OAuth metrics
- Configure alerts for high failure rates
- Monitor security patterns continuously
- Implement automated response procedures

### 2. Testing

- Implement automated OAuth flow testing
- Test error scenarios regularly
- Validate security controls periodically
- Conduct penetration testing

### 3. Documentation

- Keep OAuth provider documentation updated
- Document all configuration changes
- Maintain troubleshooting runbooks
- Train team members on OAuth troubleshooting

### 4. Security

- Regular security reviews of OAuth implementation
- Monitor threat landscape for OAuth-specific attacks
- Keep security controls updated
- Implement defense in depth

## Escalation Procedures

### Level 1: Self-Service

- Use this troubleshooting guide
- Check security monitoring dashboard
- Review application logs
- Test with diagnostic tools

### Level 2: Team Support

- Escalate to development team
- Provide diagnostic information
- Include security monitoring data
- Document issue details

### Level 3: Security Team

- Escalate security-related issues
- Provide comprehensive audit logs
- Include threat analysis
- Follow incident response procedures

## Contact Information

- **Development Team**: dev-team@company.com
- **Security Team**: security@company.com
- **On-Call Support**: +1-555-0123
- **Documentation**: https://docs.company.com/oauth

---

**Last Updated**: 2025-07-23  
**Version**: 1.0  
**Maintainer**: MWAP Development Team