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

### 1. OAuth Callback 401 Unauthorized Errors

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
- Provider-specific error responses

**Root Causes**:
1. Invalid OAuth provider configuration
2. Incorrect client credentials
3. Redirect URI mismatch
4. Network connectivity issues
5. Provider API changes

**Diagnostic Steps**:

1. **Verify Provider Configuration**:
   ```bash
   # Check provider configuration in database
   db.cloudProviders.findOne({name: "dropbox"})
   ```

2. **Test Token Exchange Manually**:
   ```bash
   # Manual token exchange test
   curl -X POST https://api.dropboxapi.com/oauth2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "code=AUTH_CODE&grant_type=authorization_code&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=REDIRECT_URI"
   ```

3. **Check Network Connectivity**:
   ```bash
   # Test connectivity to provider
   curl -v https://api.dropboxapi.com/oauth2/token
   ```

**Resolution Steps**:

1. **Validate Provider Configuration**:
   ```typescript
   // Ensure all required fields are present
   const provider = {
     name: 'dropbox',
     authUrl: 'https://www.dropbox.com/oauth2/authorize',
     tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
     clientId: 'your_client_id',
     clientSecret: 'your_client_secret', // Encrypted
     scopes: ['files.content.read', 'files.content.write']
   };
   ```

2. **Verify Redirect URI Matching**:
   ```typescript
   // Ensure redirect URI matches exactly
   const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/oauth/callback`;
   // Must match the URI registered with OAuth provider
   ```

3. **Check Client Credentials**:
   ```bash
   # Verify credentials are correct and not expired
   # Check OAuth provider dashboard for credential status
   ```

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