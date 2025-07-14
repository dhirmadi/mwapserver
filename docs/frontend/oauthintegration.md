# OAuth Integration Guide for MWAP Frontend Developers

This document provides a comprehensive guide for frontend developers implementing OAuth integration with cloud providers in the MWAP platform. It details the exact data flow, API calls, and example data for each step of the process.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [OAuth Integration Flow](#oauth-integration-flow)
4. [API Reference](#api-reference)
5. [Error Handling](#error-handling)
6. [Security Considerations](#security-considerations)
7. [Implementation Checklist](#implementation-checklist)

## Overview

The MWAP platform allows tenant owners to integrate with various cloud providers (Google Drive, Dropbox, OneDrive, etc.) using OAuth 2.0. This integration enables projects to access files from these cloud providers securely.

## Prerequisites

Before implementing OAuth integration, ensure:

1. You have a valid tenant ID
2. The user has tenant owner permissions
3. You have access to the list of available cloud providers

## OAuth Integration Flow

The OAuth integration process follows these steps:

1. **List Available Cloud Providers**
2. **Create Cloud Integration**
3. **Redirect to OAuth Authorization Page**
4. **Handle OAuth Callback**
5. **Update Integration with OAuth Tokens**
6. **Verify Integration Status**

### Detailed Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐     ┌─────────────┐
│  Frontend   │     │  MWAP API   │     │  Cloud Provider     │     │  Frontend   │
│  (Initial)  │     │             │     │  OAuth Server       │     │  (Callback) │
└──────┬──────┘     └──────┬──────┘     └──────────┬──────────┘     └──────┬──────┘
       │                   │                       │                        │
       │ 1. List Providers │                       │                        │
       │─────────────────>│                       │                        │
       │                   │                       │                        │
       │ 2. Providers List │                       │                        │
       │<─────────────────│                       │                        │
       │                   │                       │                        │
       │ 3. Create         │                       │                        │
       │    Integration    │                       │                        │
       │─────────────────>│                       │                        │
       │                   │                       │                        │
       │ 4. Integration ID │                       │                        │
       │<─────────────────│                       │                        │
       │                   │                       │                        │
       │ 5. Build OAuth URL│                       │                        │
       │    with state     │                       │                        │
       │<─────────────────┘                       │                        │
       │                   │                       │                        │
       │ 6. Redirect to    │                       │                        │
       │    OAuth URL      │                       │                        │
       │───────────────────────────────────────────>                        │
       │                   │                       │                        │
       │                   │                       │ 7. User Authorizes     │
       │                   │                       │    Application         │
       │                   │                       │                        │
       │                   │                       │ 8. Redirect to         │
       │                   │                       │    Callback URL        │
       │                   │                       │───────────────────────>│
       │                   │                       │                        │
       │                   │                       │                        │
       │                   │ 9. Exchange Code      │                        │
       │                   │    for Tokens         │                        │
       │                   │<──────────────────────────────────────────────│
       │                   │                       │                        │
       │                   │ 10. Update Integration│                        │
       │                   │     with Tokens       │                        │
       │                   │─────────────────────>│                        │
       │                   │                       │                        │
       │ 11. Verify        │                       │                        │
       │     Integration   │                       │                        │
       │─────────────────>│                       │                        │
       │                   │                       │                        │
       │ 12. Integration   │                       │                        │
       │     Status        │                       │                        │
       │<─────────────────│                       │                        │
       │                   │                       │                        │
```

## API Reference

### 1. List Available Cloud Providers

**Endpoint:** `GET /api/v1/cloud-providers`

**Authentication:** JWT Bearer token

**Response Example:**
```json
[
  {
    "_id": "60a1e2c3d4e5f6a7b8c9d0e1",
    "name": "Google Drive",
    "slug": "gdrive",
    "scopes": [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly"
    ],
    "authUrl": "https://accounts.google.com/o/oauth2/auth",
    "tokenUrl": "https://oauth2.googleapis.com/token",
    "clientId": "your-google-client-id.apps.googleusercontent.com",
    "clientSecret": "[REDACTED]",
    "grantType": "authorization_code",
    "tokenMethod": "POST",
    "metadata": {
      "icon": "google-drive",
      "color": "#4285F4"
    },
    "createdAt": "2025-05-15T10:00:00.000Z",
    "updatedAt": "2025-05-15T10:00:00.000Z",
    "createdBy": "auth0|123456789"
  },
  {
    "_id": "60a1e2c3d4e5f6a7b8c9d0e2",
    "name": "Dropbox",
    "slug": "dropbox",
    "scopes": [
      "files.metadata.read",
      "files.content.read"
    ],
    "authUrl": "https://www.dropbox.com/oauth2/authorize",
    "tokenUrl": "https://api.dropboxapi.com/oauth2/token",
    "clientId": "your-dropbox-client-id",
    "clientSecret": "[REDACTED]",
    "grantType": "authorization_code",
    "tokenMethod": "POST",
    "metadata": {
      "icon": "dropbox",
      "color": "#0061FF"
    },
    "createdAt": "2025-05-15T10:00:00.000Z",
    "updatedAt": "2025-05-15T10:00:00.000Z",
    "createdBy": "auth0|123456789"
  }
]
```

### 2. Create Cloud Integration

**Endpoint:** `POST /api/v1/tenants/:tenantId/integrations`

**Authentication:** JWT Bearer token (must be tenant owner)

**Request Example:**
```json
{
  "providerId": "60a1e2c3d4e5f6a7b8c9d0e1",
  "status": "active",
  "metadata": {
    "displayName": "My Google Drive"
  }
}
```

**Response Example:**
```json
{
  "_id": "60b2f3c4d5e6f7a8b9c0d1e2",
  "tenantId": "60c3f4d5e6f7a8b9c0d1e2f3",
  "providerId": "60a1e2c3d4e5f6a7b8c9d0e1",
  "status": "active",
  "metadata": {
    "displayName": "My Google Drive"
  },
  "createdAt": "2025-06-10T14:30:00.000Z",
  "updatedAt": "2025-06-10T14:30:00.000Z",
  "createdBy": "auth0|123456789"
}
```

### 3. Build OAuth Authorization URL

After creating the integration, you need to build the OAuth authorization URL using the cloud provider's `authUrl` and other parameters:

```javascript
function buildOAuthUrl(cloudProvider, integration, redirectUri) {
  const url = new URL(cloudProvider.authUrl);
  
  // Add required OAuth parameters
  url.searchParams.append('client_id', cloudProvider.clientId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', cloudProvider.scopes.join(' '));
  
  // Add state parameter with integration ID for security and callback handling
  const state = JSON.stringify({
    integrationId: integration._id,
    tenantId: integration.tenantId
  });
  url.searchParams.append('state', btoa(state));
  
  // Add any provider-specific parameters
  if (cloudProvider.metadata && cloudProvider.metadata.additionalParams) {
    Object.entries(cloudProvider.metadata.additionalParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
}
```

### 4. Dedicated OAuth Callback Endpoint

When the user authorizes your application, the cloud provider will redirect back to the dedicated OAuth callback endpoint with an authorization code and the state parameter:

```
https://your-app.com/api/v1/oauth/callback?code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7&state=eyJpbnRlZ3JhdGlvbklkIjoiNjBiMmYzYzRkNWU2ZjdhOGI5YzBkMWUyIiwidGVuYW50SWQiOiI2MGMzZjRkNWU2ZjdhOGI5YzBkMWUyZjMifQ==
```

The backend will:
1. Parse the `code` and `state` parameters
2. Decode the state to get the integration ID, tenant ID, and user ID
3. Exchange the code for tokens
4. Update the integration with the tokens
5. Redirect to a success or error page

**Endpoint:** `GET /api/v1/oauth/callback`

**Authentication:** None (public endpoint)

**Query Parameters:**
- `code`: The authorization code from the cloud provider
- `state`: The state parameter containing the integration ID, tenant ID, and user ID
- `error`: Error message if the authorization failed
- `error_description`: Additional error details

**Response:** Redirects to a success or error page

### 5. Alternative: Manual Token Update (Legacy Approach)

For backward compatibility, you can still update the integration manually with the OAuth tokens:

**Endpoint:** `PATCH /api/v1/tenants/:tenantId/integrations/:integrationId`

**Authentication:** JWT Bearer token (must be tenant owner)

**Request Example:**
```json
{
  "accessToken": "ya29.a0AfH6SMBx7-Tn...",
  "refreshToken": "1//04dkrn4h9T...",
  "tokenExpiresAt": "2025-06-10T15:30:00.000Z",
  "scopesGranted": [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly"
  ],
  "status": "active",
  "connectedAt": "2025-06-10T14:35:00.000Z",
  "metadata": {
    "oauth_code": "4/P7q7W91a-oMsCeLvIaQm6bTrgtp7",
    "redirect_uri": "https://your-app.com/oauth/callback"
  }
}
```

**Note**: You can also pass just the OAuth code and redirect URI in the metadata field:

```json
{
  "metadata": {
    "oauth_code": "4/P7q7W91a-oMsCeLvIaQm6bTrgtp7",
    "redirect_uri": "https://your-app.com/oauth/callback"
  }
}
```

However, the dedicated callback endpoint is recommended for new implementations.

**Response Example:**
```json
{
  "_id": "60b2f3c4d5e6f7a8b9c0d1e2",
  "tenantId": "60c3f4d5e6f7a8b9c0d1e2f3",
  "providerId": "60a1e2c3d4e5f6a7b8c9d0e1",
  "accessToken": "[REDACTED]",
  "refreshToken": "[REDACTED]",
  "tokenExpiresAt": "2025-06-10T15:30:00.000Z",
  "scopesGranted": [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly"
  ],
  "status": "active",
  "connectedAt": "2025-06-10T14:35:00.000Z",
  "metadata": {
    "displayName": "My Google Drive"
  },
  "createdAt": "2025-06-10T14:30:00.000Z",
  "updatedAt": "2025-06-10T14:35:00.000Z",
  "createdBy": "auth0|123456789"
}
```

### 6. Verify Integration Status

**Endpoint:** `GET /api/v1/tenants/:tenantId/integrations/:integrationId`

**Authentication:** JWT Bearer token (must be tenant owner)

**Response Example:**
```json
{
  "_id": "60b2f3c4d5e6f7a8b9c0d1e2",
  "tenantId": "60c3f4d5e6f7a8b9c0d1e2f3",
  "providerId": "60a1e2c3d4e5f6a7b8c9d0e1",
  "accessToken": "[REDACTED]",
  "refreshToken": "[REDACTED]",
  "tokenExpiresAt": "2025-06-10T15:30:00.000Z",
  "scopesGranted": [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly"
  ],
  "status": "active",
  "connectedAt": "2025-06-10T14:35:00.000Z",
  "metadata": {
    "displayName": "My Google Drive",
    "userInfo": {
      "email": "user@example.com",
      "name": "Example User"
    }
  },
  "createdAt": "2025-06-10T14:30:00.000Z",
  "updatedAt": "2025-06-10T14:35:00.000Z",
  "createdBy": "auth0|123456789"
}
```

## Error Handling

The API returns standardized error responses with specific error codes:

```json
{
  "success": false,
  "error": {
    "code": "cloud-integration/provider-not-found",
    "message": "Cloud provider not found"
  }
}
```

### Common Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `cloud-integration/not-found` | Integration does not exist | Verify integration ID |
| `cloud-integration/provider-not-found` | Referenced cloud provider does not exist | Verify provider ID |
| `cloud-integration/tenant-not-found` | Referenced tenant does not exist | Verify tenant ID |
| `cloud-integration/already-exists` | Integration already exists for this tenant and provider | Use existing integration or delete it first |
| `cloud-integration/invalid-input` | Invalid input data | Check request payload against schema |
| `cloud-integration/unauthorized` | User is not authorized for this operation | Verify user has tenant owner role |
| `cloud-provider/not-found` | Cloud provider not found | Verify provider ID |

## Security Considerations

1. **Token Encryption**: The backend automatically encrypts OAuth tokens using AES-256-GCM before storing them in the database.

2. **State Parameter**: Always use the state parameter in OAuth requests to prevent CSRF attacks. The state should contain the integration ID and tenant ID, and should be validated on callback.

3. **Scope Limitation**: Request only the minimum scopes needed for your application to function.

4. **Token Refresh**: The backend handles token refresh automatically when tokens expire.

5. **Tenant Isolation**: Each integration is scoped to a specific tenant, ensuring proper data isolation.

## Implementation Checklist

- [ ] List available cloud providers
- [ ] Create cloud integration
- [ ] Build OAuth authorization URL with proper state parameter
- [ ] Implement OAuth callback handler
- [ ] Exchange authorization code for tokens
- [ ] Update integration with OAuth tokens
- [ ] Verify integration status
- [ ] Implement error handling for all API calls
- [ ] Add loading states and user feedback
- [ ] Test the complete flow with each supported provider

## Backend API Implementation Notes

Based on the codebase analysis, here are some important implementation details:

1. **Token Encryption**: The backend uses AES-256-GCM encryption for OAuth tokens with a 16-byte IV and 16-byte authentication tag.

2. **Integration Creation**: The initial creation of an integration does not include OAuth tokens. These are added in a separate update step after the OAuth flow.

3. **Tenant Owner Check**: All integration endpoints are protected by the `requireTenantOwner` middleware, which ensures only the tenant owner can manage integrations.

4. **Backward Compatibility**: The API supports both `/api/v1/tenants/:tenantId/integrations` and `/api/v1/tenants/:tenantId/cloud-integrations` paths for the same functionality.

5. **Integration Usage Check**: The API prevents deletion of integrations that are in use by projects.

6. **Provider Metadata**: Cloud providers can include additional metadata that may be useful for the frontend (icons, colors, etc.).

7. **Missing OAuth Callback Endpoint**: The backend does not currently have a dedicated endpoint for handling OAuth callbacks. This should be implemented on the frontend, which will need to exchange the authorization code for tokens and update the integration.

## Implementation Notes

### Token Exchange Mechanism

Based on the existing documentation and codebase analysis, there are two approaches to handling the OAuth token exchange:

1. **Frontend Token Exchange**:
   - The frontend exchanges the authorization code for tokens using the cloud provider's token endpoint
   - The frontend then updates the integration with the tokens via the PATCH endpoint
   - This approach gives the frontend more control but requires handling sensitive tokens

2. **Backend Token Exchange** (Recommended):
   - The frontend sends the authorization code and redirect URI to the backend via the PATCH endpoint
   - The backend handles the token exchange and securely stores the tokens
   - This approach is more secure as tokens are never exposed to the frontend

The recommended approach is to use the backend token exchange mechanism by including the `oauth_code` and `redirect_uri` in the metadata field of the PATCH request.

### Complete Implementation Example

Here's a complete example of implementing the OAuth flow using the new dedicated callback endpoint:

```javascript
// Step 1: List available cloud providers
async function listCloudProviders() {
  const response = await fetch('/api/v1/cloud-providers', {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  return response.json();
}

// Step 2: Create a new integration
async function createIntegration(tenantId, providerId) {
  const response = await fetch(`/api/v1/tenants/${tenantId}/integrations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      providerId,
      metadata: {
        displayName: "My Cloud Integration"
      }
    })
  });
  return response.json();
}

// Step 3: Build and redirect to OAuth URL with dedicated callback endpoint
function redirectToOAuth(provider, integration, userId) {
  // Create state parameter with integration, tenant, and user IDs
  const state = btoa(JSON.stringify({
    integrationId: integration._id,
    tenantId: integration.tenantId,
    userId: userId
  }));
  
  // Build OAuth URL with the dedicated callback endpoint
  const redirectUri = `${window.location.origin}/api/v1/oauth/callback`;
  const url = new URL(provider.authUrl);
  url.searchParams.append('client_id', provider.clientId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', provider.scopes.join(' '));
  url.searchParams.append('state', state);
  
  // Redirect to OAuth authorization page
  window.location.href = url.toString();
}

// Step 4: Verify integration status after redirect
async function verifyIntegration(tenantId, integrationId) {
  const response = await fetch(`/api/v1/tenants/${tenantId}/integrations/${integrationId}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  return response.json();
}

// Step 5: Refresh tokens if needed
async function refreshIntegrationTokens(tenantId, integrationId) {
  const response = await fetch(`/api/v1/oauth/tenants/${tenantId}/integrations/${integrationId}/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  return response.json();
}

// Main function to orchestrate the flow
async function setupOAuthIntegration(tenantId, providerId) {
  try {
    // Step 1: Get provider details
    const providers = await listCloudProviders();
    const provider = providers.find(p => p._id === providerId);
    if (!provider) throw new Error('Provider not found');
    
    // Step 2: Create integration
    const integration = await createIntegration(tenantId, providerId);
    
    // Step 3: Redirect to OAuth with the dedicated callback endpoint
    const userId = getCurrentUserId(); // Get the current user ID
    redirectToOAuth(provider, integration, userId);
    
    // The backend will handle the callback and token exchange
    // No need for manual callback handling!
  } catch (error) {
    console.error('OAuth setup failed:', error);
  }
}

// Success page handler after OAuth callback
async function handleSuccessPage() {
  try {
    // Get tenantId and integrationId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tenantId = urlParams.get('tenantId');
    const integrationId = urlParams.get('integrationId');
    
    if (!tenantId || !integrationId) {
      showErrorMessage('Missing tenant ID or integration ID');
      return;
    }
    
    // Verify the integration
    const integration = await verifyIntegration(tenantId, integrationId);
    
    // Show success message
    if (integration.status === 'active') {
      showSuccessMessage('Integration successful!');
    } else {
      showErrorMessage('Integration status is not active. Please try again.');
    }
    
    // Redirect back to integrations page
    setTimeout(() => {
      window.location.href = `/tenants/${tenantId}/integrations`;
    }, 2000);
  } catch (error) {
    console.error('Success page handling failed:', error);
    showErrorMessage('Failed to verify integration: ' + error.message);
  }
}
```

By following this guide and example implementation, frontend developers can implement a secure and reliable OAuth integration flow with cloud providers in the MWAP platform.