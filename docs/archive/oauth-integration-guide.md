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
   
   // Create state parameter with tenant and integration IDs
   const state = btoa(JSON.stringify({
     tenantId,
     integrationId,
     userId: getCurrentUserId() // Include user ID for auditing
   }));
   
   // Build the OAuth URL
   const redirectUri = `${window.location.origin}/api/v1/oauth/callback`;
   const authUrl = `${provider.authUrl}?client_id=${provider.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(provider.scopes.join(' '))}&state=${state}`;
   
   // Redirect the user to authUrl
   window.location.href = authUrl;
   ```

2. **Dedicated OAuth Callback Endpoint**:
   The backend now provides a dedicated endpoint for handling OAuth callbacks:
   
   ```
   GET /api/v1/oauth/callback
   ```
   
   This endpoint:
   - Receives the authorization code from the cloud provider
   - Extracts the tenant ID, integration ID, and user ID from the state parameter
   - Exchanges the code for access and refresh tokens
   - Updates the integration with the tokens
   - Redirects to a success or error page

3. **Backend Token Exchange**:
   The backend automatically exchanges the code for tokens and securely stores them. No additional action is required from the frontend.

> **Note**: The previous approach of sending the OAuth code to the PATCH endpoint is still supported for backward compatibility, but the dedicated callback endpoint is recommended for new implementations.

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

Here's a complete example of how to implement the OAuth flow in a frontend application using the new dedicated callback endpoint:

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

// Step 2: Start the OAuth flow with the dedicated callback endpoint
const startOAuthFlow = async (tenantId, integrationId, providerId) => {
  // Get the provider details
  const provider = await api.get(`/api/v1/cloud-providers/${providerId}`);
  
  // Create state parameter with tenant and integration IDs
  const state = btoa(JSON.stringify({
    tenantId,
    integrationId,
    userId: getCurrentUserId() // Include user ID for auditing
  }));
  
  // Build the OAuth URL with the dedicated callback endpoint
  const redirectUri = `${window.location.origin}/api/v1/oauth/callback`;
  const authUrl = `${provider.authUrl}?client_id=${provider.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(provider.scopes.join(' '))}&state=${state}`;
  
  // Redirect the user to the authorization URL
  window.location.href = authUrl;
};

// Step 3: No need to handle the callback manually!
// The backend will:
// 1. Exchange the code for tokens
// 2. Update the integration with the tokens
// 3. Redirect to a success or error page

// Step 4: Verify the integration status after redirect
const verifyIntegrationStatus = async (tenantId, integrationId) => {
  const integration = await api.get(`/api/v1/tenants/${tenantId}/integrations/${integrationId}`);
  
  if (integration.status === 'active' && integration.accessToken) {
    // Integration is active and has tokens
    showSuccessMessage('Integration successful!');
  } else {
    // Integration failed
    showErrorMessage('Integration failed. Please try again.');
  }
};

// Step 5: Refresh tokens if needed
const refreshIntegrationTokens = async (tenantId, integrationId) => {
  try {
    await api.post(`/api/v1/oauth/tenants/${tenantId}/integrations/${integrationId}/refresh`);
    showSuccessMessage('Tokens refreshed successfully!');
  } catch (error) {
    showErrorMessage('Failed to refresh tokens. Please reconnect the integration.');
  }
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