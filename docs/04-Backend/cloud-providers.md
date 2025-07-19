# Cloud Provider Integration Patterns

This document outlines the cloud provider integration architecture and patterns used in the MWAP backend for secure, scalable OAuth-based cloud service connections.

## 🏗️ Architecture Overview

### Integration Flow
```
User → Frontend → Backend → Auth0 → Cloud Provider → OAuth Callback → Token Storage
```

### Core Components
```
CloudProviderService         # Manage provider configurations
CloudIntegrationsService     # Handle tenant-specific integrations
OAuthService                 # OAuth token management
EncryptionService           # Secure credential storage
```

## 📋 Cloud Provider Configuration

### Provider Schema
```typescript
interface CloudProvider {
  _id: ObjectId;
  name: string;              // Display name (e.g., "Google Drive")
  slug: string;              // URL-safe identifier (e.g., "google-drive")
  scopes: string[];          // OAuth scopes required
  authUrl: string;           // OAuth authorization URL
  tokenUrl: string;          // Token exchange URL
  clientId: string;          // OAuth client ID
  clientSecret: string;      // OAuth client secret (encrypted)
  grantType: string;         // OAuth grant type (default: "authorization_code")
  tokenMethod: string;       // HTTP method for token requests (default: "POST")
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;         // Auth0 user ID
}
```

### Example Provider Configuration
```typescript
// Google Drive Provider
{
  name: "Google Drive",
  slug: "google-drive",
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  authUrl: "https://accounts.google.com/o/oauth2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  clientId: "your-google-client-id",
  clientSecret: "[ENCRYPTED]",
  grantType: "authorization_code",
  tokenMethod: "POST"
}

// Dropbox Provider
{
  name: "Dropbox",
  slug: "dropbox",
  scopes: ["files.metadata.read"],
  authUrl: "https://www.dropbox.com/oauth2/authorize",
  tokenUrl: "https://api.dropbox.com/oauth2/token",
  clientId: "your-dropbox-client-id",
  clientSecret: "[ENCRYPTED]",
  grantType: "authorization_code",
  tokenMethod: "POST"
}
```

## 🔐 Security Implementation

### Credential Encryption
```typescript
// CloudProviderService.create()
export async function create(data: CreateCloudProviderRequest, userId: string) {
  // Encrypt sensitive data before storage
  const dataToSave = { ...data };
  if (dataToSave.clientSecret) {
    dataToSave.clientSecret = encrypt(dataToSave.clientSecret);
  }
  
  const cloudProvider = await this.collection.insertOne(dataToSave);
  
  // Return response with original (unencrypted) secret for immediate use
  const responseProvider = { ...cloudProvider };
  if (data.clientSecret) {
    responseProvider.clientSecret = data.clientSecret;
  }
  
  return responseProvider;
}
```

### Secret Redaction
```typescript
// CloudProviderService.findAll()
export async function findAll(): Promise<CloudProvider[]> {
  const providers = await this.collection.find().toArray();
  
  // Remove client secrets from public responses
  return providers.map(provider => ({
    ...provider,
    clientSecret: provider.clientSecret ? '[REDACTED]' : undefined
  }));
}
```

### Access Control
```typescript
// Route protection patterns
router.get('/', wrapAsyncHandler(getAllCloudProviders));           // All authenticated users
router.get('/:id', wrapAsyncHandler(getCloudProviderById));        // All authenticated users
router.post('/', requireSuperAdminRole(), createCloudProvider);    // SuperAdmin only
router.patch('/:id', requireSuperAdminRole(), updateCloudProvider); // SuperAdmin only
router.delete('/:id', requireSuperAdminRole(), deleteCloudProvider); // SuperAdmin only
```

## 🔗 Integration Management

### Tenant Integration Schema
```typescript
interface CloudProviderIntegration {
  _id: ObjectId;
  tenantId: ObjectId;        // Tenant this integration belongs to
  providerId: ObjectId;      // Cloud provider configuration
  status: 'pending' | 'active' | 'expired' | 'revoked' | 'error';
  accessToken?: string;      // OAuth access token
  refreshToken?: string;     // OAuth refresh token
  tokenExpiresAt?: Date;     // Token expiration time
  scopesGranted?: string[];  // Actual scopes granted by user
  connectedAt?: Date;        // When integration was first connected
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;         // Auth0 user ID
}
```

### Integration Creation
```typescript
// CloudIntegrationsService.create()
export async function create(tenantId: string, data: CreateIntegrationRequest, userId: string) {
  // Verify tenant exists and user has access
  const tenant = await getDB().collection('tenants').findOne({ _id: new ObjectId(tenantId) });
  if (!tenant) {
    throw new ApiError('Tenant not found', 404, 'TENANT_NOT_FOUND');
  }
  
  // Verify cloud provider exists
  const provider = await getDB().collection('cloudProviders').findOne({ 
    _id: new ObjectId(data.providerId) 
  });
  if (!provider) {
    throw new ApiError('Cloud provider not found', 404, 'PROVIDER_NOT_FOUND');
  }
  
  // Check for existing integration
  const existingIntegration = await this.collection.findOne({ 
    tenantId: new ObjectId(tenantId),
    providerId: new ObjectId(data.providerId)
  });
  
  if (existingIntegration) {
    throw new ApiError('Integration already exists', 409, 'ALREADY_EXISTS');
  }
  
  // Create integration with pending status
  const integration = {
    _id: new ObjectId(),
    tenantId: new ObjectId(tenantId),
    providerId: new ObjectId(data.providerId),
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId
  };
  
  await this.collection.insertOne(integration);
  return integration;
}
```

## 🔄 OAuth Flow Implementation

### Authorization URL Generation
```typescript
// Frontend initiates OAuth flow
const authUrl = `${provider.authUrl}?` + new URLSearchParams({
  client_id: provider.clientId,
  redirect_uri: `${apiBaseUrl}/api/v1/oauth/callback`,
  scope: provider.scopes.join(' '),
  response_type: 'code',
  state: Buffer.from(JSON.stringify({
    tenantId,
    integrationId,
    userId: user.sub
  })).toString('base64')
});

// Redirect user to cloud provider for authorization
window.location.href = authUrl;
```

### OAuth Callback Handling
```typescript
// oauth.controller.ts - handleOAuthCallback()
export async function handleOAuthCallback(req: Request, res: Response) {
  const { code, state, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    return res.redirect(`/oauth/error?message=${encodeURIComponent(error)}`);
  }
  
  // Parse state parameter
  const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
  const { tenantId, integrationId, userId } = stateData;
  
  // Get integration and provider
  const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
  const provider = await cloudProviderService.findById(integration.providerId, true);
  
  // Exchange code for tokens
  const tokenResponse = await oauthService.exchangeCodeForTokens(
    code,
    provider,
    `${req.protocol}://${req.get('host')}/api/v1/oauth/callback`
  );
  
  // Update integration with tokens
  await cloudIntegrationsService.updateTokens(
    integrationId,
    tenantId,
    tokenResponse.accessToken,
    tokenResponse.refreshToken,
    tokenResponse.expiresIn,
    userId,
    tokenResponse.scopesGranted
  );
  
  // Redirect to success page
  res.redirect(`/oauth/success?tenantId=${tenantId}&integrationId=${integrationId}`);
}
```

### Token Exchange
```typescript
// oauth.service.ts - exchangeCodeForTokens()
export async function exchangeCodeForTokens(code: string, provider: CloudProvider, redirectUri: string) {
  const tokenRequest = {
    method: provider.tokenMethod,
    url: provider.tokenUrl,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: new URLSearchParams({
      grant_type: provider.grantType,
      code,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      redirect_uri: redirectUri
    }).toString()
  };
  
  const response = await axios(tokenRequest);
  
  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresIn: response.data.expires_in,
    scopesGranted: response.data.scope ? response.data.scope.split(' ') : undefined
  };
}
```

## 🔄 Token Management

### Token Refresh
```typescript
// oauth.service.ts - refreshTokens()
export async function refreshTokens(refreshToken: string, provider: CloudProvider) {
  const refreshRequest = {
    method: provider.tokenMethod,
    url: provider.tokenUrl,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: provider.clientId,
      client_secret: provider.clientSecret
    }).toString()
  };
  
  const response = await axios(refreshRequest);
  
  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token || refreshToken, // Some providers don't return new refresh token
    expiresIn: response.data.expires_in,
    scopesGranted: response.data.scope ? response.data.scope.split(' ') : undefined
  };
}
```

### Integration Health Monitoring
```typescript
// cloudIntegrations.service.ts - checkIntegrationHealth()
export async function checkIntegrationHealth(id: string, tenantId: string) {
  const integration = await this.findById(id, tenantId);
  const now = new Date();
  
  // Check if access token exists
  if (!integration.accessToken) {
    return { status: 'unauthorized', message: 'No access token available' };
  }
  
  // Check if token is expired
  if (integration.tokenExpiresAt && integration.tokenExpiresAt <= now) {
    return { status: 'expired', message: 'Access token has expired' };
  }
  
  // Test token with provider API
  const provider = await getDB().collection('cloudProviders').findOne({ 
    _id: new ObjectId(integration.providerId) 
  });
  
  try {
    await this.testTokenWithProvider(integration.accessToken, provider);
    
    // Update integration status
    await this.collection.updateOne(
      { _id: integration._id },
      { $set: { status: 'active', updatedAt: now } }
    );
    
    return { status: 'healthy', message: 'Token is valid and working' };
  } catch (error) {
    // Update integration status based on error
    let status = 'error';
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) status = 'unauthorized';
      if (error.response?.status === 403) status = 'expired';
    }
    
    await this.collection.updateOne(
      { _id: integration._id },
      { $set: { status: status === 'unauthorized' ? 'revoked' : status, updatedAt: now } }
    );
    
    return { status, message: 'Token validation failed' };
  }
}
```

### Provider-Specific Token Testing
```typescript
// Test endpoints for different providers
const testEndpoints: Record<string, string> = {
  'google-drive': 'https://www.googleapis.com/drive/v3/about',
  'dropbox': 'https://api.dropboxapi.com/2/users/get_current_account',
  'onedrive': 'https://graph.microsoft.com/v1.0/me/drive',
  'aws': 'https://sts.amazonaws.com/',
  'github': 'https://api.github.com/user'
};

private async testTokenWithProvider(accessToken: string, provider: any) {
  const testUrl = testEndpoints[provider.slug] || provider.apiBaseUrl;
  
  if (!testUrl) {
    throw new Error(`No test endpoint configured for provider: ${provider.name}`);
  }
  
  await axios.get(testUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    },
    timeout: 10000
  });
}
```

## 📊 Integration Lifecycle

### Status Transitions
```
pending → active     # Successful OAuth completion
active → expired     # Token expiration detected
active → revoked     # User revoked permissions
expired → active     # Successful token refresh
revoked → pending    # Re-authorization required
* → error           # System or network errors
```

### Status Management
```typescript
// Update integration status based on various conditions
export async function updateIntegrationStatus(integrationId: string, status: IntegrationStatus, reason?: string) {
  const updates: any = {
    status,
    updatedAt: new Date()
  };
  
  // Add timestamp for specific status changes
  switch (status) {
    case 'active':
      updates.connectedAt = new Date();
      break;
    case 'expired':
    case 'revoked':
      // Keep original connectedAt but update status
      break;
  }
  
  await this.collection.updateOne(
    { _id: new ObjectId(integrationId) },
    { $set: updates }
  );
  
  logAudit('integration.status.update', 'system', integrationId, {
    status,
    reason
  });
}
```

## 🔧 API Endpoints

### Cloud Provider Management
```bash
# Public endpoints (all authenticated users)
GET    /api/v1/cloud-providers           # List available providers
GET    /api/v1/cloud-providers/:id       # Get provider details

# Admin endpoints (superadmin only)
POST   /api/v1/cloud-providers           # Create new provider
PATCH  /api/v1/cloud-providers/:id       # Update provider
DELETE /api/v1/cloud-providers/:id       # Delete provider
```

### Cloud Integration Management
```bash
# Tenant-specific endpoints (tenant owner only)
GET    /api/v1/tenants/:tenantId/integrations                    # List integrations
POST   /api/v1/tenants/:tenantId/integrations                    # Create integration
GET    /api/v1/tenants/:tenantId/integrations/:integrationId     # Get integration
PATCH  /api/v1/tenants/:tenantId/integrations/:integrationId     # Update integration
DELETE /api/v1/tenants/:tenantId/integrations/:integrationId     # Delete integration

# Integration management endpoints
POST   /api/v1/tenants/:tenantId/integrations/:integrationId/refresh-token  # Refresh tokens
GET    /api/v1/tenants/:tenantId/integrations/:integrationId/health         # Check health
```

### OAuth Endpoints
```bash
# Public OAuth callback
GET    /api/v1/oauth/callback             # Handle OAuth callbacks

# Protected token refresh
POST   /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh  # Manual refresh
```

## 🚨 Error Handling

### Common Error Scenarios
```typescript
// Provider configuration errors
CloudProviderErrorCodes = {
  NOT_FOUND: 'cloud-provider/not-found',
  NAME_EXISTS: 'cloud-provider/name-exists',
  SLUG_EXISTS: 'cloud-provider/slug-exists',
  IN_USE: 'cloud-provider/in-use',
  INVALID_INPUT: 'cloud-provider/invalid-input'
};

// Integration errors
CloudIntegrationErrorCodes = {
  NOT_FOUND: 'cloud-integration/not-found',
  ALREADY_EXISTS: 'cloud-integration/already-exists',
  TENANT_NOT_FOUND: 'cloud-integration/tenant-not-found',
  PROVIDER_NOT_FOUND: 'cloud-integration/provider-not-found',
  TOKEN_EXPIRED: 'cloud-integration/token-expired',
  INVALID_INPUT: 'cloud-integration/invalid-input'
};
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "cloud-integration/token-expired",
    "message": "Access token has expired",
    "details": {
      "integrationId": "507f1f77bcf86cd799439011",
      "expiresAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

## 📈 Best Practices

### Security Guidelines
1. **Encrypt credentials**: Always encrypt client secrets before storage
2. **Scope limitation**: Request minimum necessary OAuth scopes
3. **Token rotation**: Implement automatic token refresh
4. **Access control**: Restrict provider management to superadmins
5. **Audit logging**: Log all integration operations

### Performance Considerations
1. **Token caching**: Cache valid tokens to reduce API calls
2. **Health monitoring**: Regular integration health checks
3. **Connection pooling**: Reuse HTTP connections for API calls
4. **Rate limiting**: Respect provider rate limits
5. **Async operations**: Handle OAuth flows asynchronously

### Scalability Patterns
1. **Provider isolation**: Each integration is tenant-scoped
2. **Stateless design**: OAuth state stored in URL parameters
3. **Horizontal scaling**: No server-side session dependencies
4. **Database optimization**: Index tenant and provider relationships
5. **Caching strategy**: Cache provider configurations

## 📖 Related Documentation

- **[OAuth Integration Guide](../06-Guides/how-to-integrate-auth0.md)** - OAuth setup and configuration
- **[API Documentation](API-v3.md)** - Complete API reference
- **[Security Guide](../06-Guides/security-guide.md)** - Security best practices

---

*Cloud provider integrations enable secure, scalable connections to external services while maintaining tenant isolation and robust error handling.* 