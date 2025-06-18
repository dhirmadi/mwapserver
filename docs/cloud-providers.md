# Cloud Providers and Integrations

## Overview

MWAP supports integration with various cloud storage providers through a standardized OAuth 2.0 flow. The system is designed with a two-level architecture:

1. **Cloud Providers** (System Level): Managed by SuperAdmins, these define the available cloud services that can be integrated with MWAP.
2. **Cloud Provider Integrations** (Tenant Level): Managed by Tenant Owners, these are the actual connections between a tenant and a cloud provider.

## Cloud Provider Model

Cloud Providers are defined at the system level and include all the information needed to establish OAuth connections:

```typescript
{
  _id: ObjectId("..."),
  name: "Dropbox",                   // Display name
  slug: "dropbox",                   // Used in URLs / lookups
  authUrl: "https://www.dropbox.com/oauth2/authorize",
  tokenUrl: "https://api.dropboxapi.com/oauth2/token",
  clientId: "DROPBOX_CLIENT_ID",     // Required for OAuth
  clientSecret: "<encrypted>",       // Stored securely, never exposed to clients
  scopes: [
    "files.content.read",
    "files.content.write",
    "files.metadata.read",
    "files.metadata.write"
  ],
  grantType: "authorization_code",   // Standard OAuth flow
  tokenMethod: "POST",               // Usually POST
  metadata: {
    icon: "dropbox",
    color: "#007ee5",
    description: "Connect your Dropbox account"
  },
  createdBy: "auth0|abc123",         // SuperAdmin user ID
  createdAt: ISODate("2025-06-16T09:42:06.990Z"),
  updatedAt: ISODate("2025-06-16T09:42:06.990Z")
}
```

## Cloud Provider Integration Model

Cloud Provider Integrations are tenant-specific connections to cloud providers:

```typescript
{
  _id: ObjectId("..."),
  tenantId: ObjectId("..."),
  providerId: ObjectId("..."),       // FK to `cloudProviders._id`
  accessToken: "<encrypted>",        // OAuth access token
  refreshToken: "<encrypted>",       // Optional
  tokenExpiresAt: ISODate("2025-06-30T14:12:00.000Z"),
  scopesGranted: [
    "files.content.read",
    "files.metadata.read"
  ],
  status: "active",                  // active | expired | revoked | error
  connectedAt: ISODate("2025-06-16T10:00:00.000Z"),
  createdBy: "auth0|def456",         // Auth0 user ID of Tenant Owner
  createdAt: ISODate("2025-06-16T10:00:00.000Z"),
  updatedAt: ISODate("2025-06-16T10:00:00.000Z")
}
```

## Security Considerations

1. **Encrypted Secrets**: All sensitive data (client secrets, access tokens, refresh tokens) are encrypted at rest using AES-256-GCM.
2. **No Client Exposure**: Sensitive fields are never returned to the client in API responses.
3. **Role-Based Access**: Cloud Provider management is restricted to SuperAdmins, while Cloud Provider Integrations are managed by Tenant Owners.
4. **Audit Logging**: All operations on cloud providers and integrations are logged for security auditing.

## OAuth Flow

The OAuth flow for connecting a tenant to a cloud provider follows these steps:

1. Tenant Owner initiates connection by creating a Cloud Provider Integration record
2. System redirects user to the provider's OAuth authorization page
3. User grants permission to MWAP to access their cloud provider account
4. Provider redirects back to MWAP with an authorization code
5. MWAP exchanges the code for access and refresh tokens
6. Tokens are encrypted and stored in the Cloud Provider Integration record
7. Integration status is updated to "active"

## API Endpoints

### Cloud Providers (SuperAdmin only)

- `GET /api/v1/cloud-providers`: List all cloud providers
- `GET /api/v1/cloud-providers/{id}`: Get a specific cloud provider
- `POST /api/v1/cloud-providers`: Create a new cloud provider
- `PATCH /api/v1/cloud-providers/{id}`: Update a cloud provider
- `DELETE /api/v1/cloud-providers/{id}`: Delete a cloud provider

### Cloud Provider Integrations (Tenant Owner)

- `GET /api/v1/tenants/{tenantId}/cloud-integrations`: List all integrations for a tenant
- `GET /api/v1/tenants/{tenantId}/cloud-integrations/{id}`: Get a specific integration
- `POST /api/v1/tenants/{tenantId}/cloud-integrations`: Create a new integration
- `PATCH /api/v1/tenants/{tenantId}/cloud-integrations/{id}`: Update an integration
- `DELETE /api/v1/tenants/{tenantId}/cloud-integrations/{id}`: Delete an integration
- `GET /api/v1/tenants/{tenantId}/cloud-integrations/{id}/oauth/callback`: OAuth callback endpoint

## Implementation Details

- Cloud Provider records are created and managed by SuperAdmins
- Cloud Provider Integration records are created and managed by Tenant Owners
- All sensitive data is encrypted using AES-256-GCM
- OAuth tokens are automatically refreshed when they expire
- Integration status is automatically updated based on token validity

## Error Handling

The system handles various error conditions:

- Invalid OAuth credentials
- Expired tokens
- Revoked access
- Network failures
- Invalid scopes

Each error is logged and the integration status is updated accordingly.

## Future Enhancements

- Support for more cloud providers (Google Drive, OneDrive, Box, etc.)
- Enhanced token refresh logic
- Webhook support for provider events
- Advanced permission management for shared cloud resources