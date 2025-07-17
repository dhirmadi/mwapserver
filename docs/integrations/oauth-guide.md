# OAuth Integration Guide

This comprehensive guide explains how to integrate with cloud providers using OAuth in the MWAP platform, covering both backend implementation and frontend development.

## Overview

MWAP supports OAuth-based integrations with cloud providers using the OAuth 2.0 authorization code flow. The platform provides a secure, standardized way to integrate with third-party cloud providers, with a dedicated callback endpoint that handles OAuth authorization code exchange.

## Architecture

The OAuth feature consists of the following components:

1. **OAuth Service**: Handles token exchange and refresh operations
2. **OAuth Controller**: Processes OAuth callbacks and token refresh requests  
3. **OAuth Routes**: Exposes endpoints for OAuth operations
4. **Integration with Cloud Providers**: Works with the existing cloud provider integration system

## OAuth Flow

The OAuth integration process follows these steps:

1. **Cloud Provider Registration** (Admin only)
2. **Create Integration** (Tenant Owner)
3. **Authorization Request** (User)
4. **Authorization Grant** (User)
5. **Callback Processing** (System)
6. **Token Storage** (System)
7. **Resource Access** (Application)

### Detailed Flow

1. **Create Integration**: The frontend creates a cloud provider integration
2. **Authorization Request**: The user is redirected to the cloud provider's authorization page
3. **Authorization Grant**: The user grants permission to the application
4. **Callback Processing**: The cloud provider redirects to the callback endpoint with an authorization code
5. **Token Exchange**: The backend exchanges the authorization code for access and refresh tokens
6. **Token Storage**: Tokens are securely stored with encryption
7. **Integration Update**: The integration status is updated to indicate successful authorization

## API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/v1/oauth/callback` | GET | Handles OAuth callbacks from cloud providers | Public |
| `/api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh` | POST | Refreshes OAuth tokens for an integration | Tenant Owner |

## Cloud Provider Registration (Admin Only)

Cloud providers must be registered by an admin before they can be used for integrations.

```http
POST /api/v1/cloud-providers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Dropbox",
  "slug": "dropbox", 
  "scopes": ["files.content.read", "files.metadata.read"],
  "authUrl": "https://www.dropbox.com/oauth2/authorize",
  "tokenUrl": "https://api.dropboxapi.com/oauth2/token",
  "clientId": "your-dropbox-app-key",
  "clientSecret": "your-dropbox-app-secret",
  "metadata": {
    "description": "Dropbox cloud storage integration",
    "iconUrl": "https://example.com/dropbox-icon.png"
  }
}
```

## Frontend Implementation

### Prerequisites

Before implementing OAuth integration, ensure:

1. You have a valid tenant ID
2. The user has tenant owner permissions  
3. You have access to the list of available cloud providers

### Creating an Integration

```javascript
// 1. Get available cloud providers
const providers = await fetch('/api/v1/cloud-providers', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json());

// 2. Create integration
const integration = await fetch('/api/v1/cloud-integrations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenantId: 'tenant_123',
    providerId: 'provider_456',
    name: 'My Dropbox Integration'
  })
}).then(res => res.json());
```

### Authorization Flow

```javascript
// 3. Build authorization URL
const authUrl = new URL(provider.authUrl);
authUrl.searchParams.set('client_id', provider.clientId);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('redirect_uri', `${window.location.origin}/api/v1/oauth/callback`);
authUrl.searchParams.set('scope', provider.scopes.join(' '));
authUrl.searchParams.set('state', integration._id);

// 4. Redirect user to authorization URL
window.location.href = authUrl.toString();
```

### Handling Callback

The OAuth callback is handled automatically by the backend. After successful authorization, users can be redirected to a success page or the integration will be updated with the new status.

## Security Considerations

1. **Token Encryption**: All OAuth tokens are encrypted before storage
2. **State Parameter**: Used to prevent CSRF attacks during OAuth flow
3. **Secure Callback**: Callback endpoint validates state and handles errors securely
4. **Token Refresh**: Automatic token refresh prevents expired token issues
5. **Scope Limitation**: Only request necessary scopes for functionality

## Error Handling

Common error scenarios and handling:

- **Invalid State**: Callback receives invalid or missing state parameter
- **Authorization Denied**: User denies authorization request
- **Token Exchange Failed**: Error during authorization code exchange
- **Invalid Integration**: Integration not found or user lacks permissions

## Token Refresh

Tokens can be refreshed using the dedicated refresh endpoint:

```http
POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh
Authorization: Bearer <tenant_owner_token>
```

## Implementation Checklist

### Backend Setup
- [ ] Cloud provider registered by admin
- [ ] OAuth service configured
- [ ] Callback endpoint secured
- [ ] Token encryption enabled

### Frontend Implementation  
- [ ] Provider selection UI
- [ ] Integration creation flow
- [ ] Authorization redirect handling
- [ ] Success/error state management
- [ ] Token refresh handling

## Related Documentation

- [Cloud Providers](../features/cloud-providers.md)
- [Cloud Integrations](../features/cloud-integrations.md)
- [Virtual Files](../features/virtual-files.md)
- [Frontend Authentication](../frontend/authentication.md)

---
*Last updated: 2025-07-16*