# OAuth Integration Guide

This guide explains how to integrate with cloud providers using OAuth in the MWAP platform.

## Overview

MWAP supports OAuth-based integrations with cloud providers. The process involves:

1. Registering a cloud provider (admin only)
2. Creating an integration for a tenant
3. Completing the OAuth flow to obtain access tokens
4. Using the integration to access cloud provider resources

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
  "grantType": "authorization_code",
  "tokenMethod": "POST",
  "metadata": {
    "apiBaseUrl": "https://api.dropboxapi.com/2"
  }
}
```

## Creating a Cloud Provider Integration

To create an integration for a tenant:

```http
POST /api/v1/tenants/:tenantId/integrations
Authorization: Bearer <tenant_owner_token>
Content-Type: application/json

{
  "providerId": "65a1b2c3d4e5f6a7b8c9d0e1",
  "status": "active",
  "metadata": {
    "displayName": "My Dropbox",
    "description": "Integration for project files"
  }
}
```

The `providerId` must be a valid MongoDB ObjectId that corresponds to an existing cloud provider in the database.

## OAuth Flow

The OAuth flow is handled separately from the integration creation. Here's how it works:

1. **Get the OAuth authorization URL**:
   ```javascript
   // Frontend code
   const provider = await api.get(`/api/v1/cloud-providers?slug=dropbox`);
   const authUrl = `${provider.authUrl}?client_id=${provider.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(provider.scopes.join(' '))}`;
   // Redirect the user to authUrl
   ```

2. **Handle the OAuth callback**:
   ```javascript
   // Frontend code - After OAuth redirect
   const code = new URLSearchParams(window.location.search).get('code');
   if (code) {
     // Exchange the code for tokens
     const response = await api.patch(`/api/v1/tenants/${tenantId}/integrations/${integrationId}`, {
       accessToken: code, // The backend will exchange this for actual tokens
       metadata: {
         oauth_code: code,
         redirect_uri: redirectUri
       }
     });
   }
   ```

3. **Backend token exchange**:
   The backend will use the code to exchange for access and refresh tokens, then store them securely.

## Using the Integration

Once the integration is set up and the OAuth flow is complete, you can use the integration to access cloud provider resources:

```http
GET /api/v1/projects/:projectId/files?folder=/
Authorization: Bearer <user_token>
```

The backend will use the stored access token to fetch files from the cloud provider.

## Error Handling

Common errors and their meanings:

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User does not have permission
- `404 Not Found`: Resource not found
- `409 Conflict`: Integration already exists

Error responses include a code that can be used to identify the specific error:

```json
{
  "success": false,
  "error": {
    "message": "Cloud provider not found",
    "code": "cloud-integration/provider-not-found",
    "status": 404
  }
}
```

## Security Considerations

- Access tokens and refresh tokens are encrypted in the database
- The OAuth flow should use PKCE (Proof Key for Code Exchange) for public clients
- Always use HTTPS for all API requests
- Validate all input data on both client and server
- Implement proper error handling and logging

## Example: Complete OAuth Flow

Here's a complete example of how to implement the OAuth flow in a frontend application:

```javascript
// Step 1: Create the integration
const createIntegration = async (tenantId, providerId) => {
  const response = await api.post(`/api/v1/tenants/${tenantId}/integrations`, {
    providerId,
    metadata: {
      displayName: "My Dropbox",
      description: "Integration for project files"
    }
  });
  return response.data;
};

// Step 2: Start the OAuth flow
const startOAuthFlow = async (providerId) => {
  const provider = await api.get(`/api/v1/cloud-providers/${providerId}`);
  const redirectUri = `${window.location.origin}/oauth/callback`;
  const state = generateRandomState(); // Generate a random state for CSRF protection
  
  // Store the state and integration ID in session storage
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('integration_id', integration._id);
  
  const authUrl = `${provider.authUrl}?client_id=${provider.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(provider.scopes.join(' '))}&state=${state}`;
  
  // Redirect the user to the authorization URL
  window.location.href = authUrl;
};

// Step 3: Handle the OAuth callback
const handleOAuthCallback = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  // Verify the state to prevent CSRF attacks
  if (state !== sessionStorage.getItem('oauth_state')) {
    throw new Error('Invalid state parameter');
  }
  
  const integrationId = sessionStorage.getItem('integration_id');
  const tenantId = getCurrentTenantId(); // Get the current tenant ID
  
  // Update the integration with the OAuth code
  const response = await api.patch(`/api/v1/tenants/${tenantId}/integrations/${integrationId}`, {
    metadata: {
      oauth_code: code,
      redirect_uri: `${window.location.origin}/oauth/callback`
    }
  });
  
  // Clear the session storage
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('integration_id');
  
  // Redirect to the integrations page
  window.location.href = '/integrations';
};
```

## Troubleshooting

If you encounter issues with the OAuth flow:

1. Check that the cloud provider is correctly registered with valid OAuth credentials
2. Ensure the redirect URI matches the one registered with the cloud provider
3. Verify that the required scopes are included in the authorization request
4. Check the browser console and server logs for error messages
5. Verify that the integration exists and is active
6. Ensure the user has the necessary permissions to create and update integrations