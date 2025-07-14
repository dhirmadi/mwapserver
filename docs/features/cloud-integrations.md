# 📘 Cloud Integrations Feature Documentation

## 🎯 Overview

The Cloud Integrations feature enables tenant owners to connect their workspaces to supported cloud storage providers (like Google Drive, Dropbox, etc.). This feature builds upon the Cloud Providers feature and is a prerequisite for the Projects feature, which will use these integrations to access cloud storage.

## 🔑 Key Concepts

- **Cloud Provider Integration**: A tenant's authenticated connection to a specific cloud provider
- **OAuth Authentication**: Secure authentication flow for connecting to cloud providers
- **Tenant Scoping**: Integrations are scoped to specific tenants
- **Token Management**: Secure handling of access and refresh tokens
- **Sensitive Data Protection**: Encryption of client secrets and tokens

## 📋 API Endpoints

### Cloud Integration Endpoints

| Endpoint                                          | Method | Role    | Description                       |
|---------------------------------------------------|--------|---------|-----------------------------------|
| `/api/v1/tenants/:tenantId/integrations`          | GET    | OWNER   | List tenant's integrations        |
| `/api/v1/tenants/:tenantId/integrations/:id`      | GET    | OWNER   | Get a specific integration        |
| `/api/v1/tenants/:tenantId/integrations`          | POST   | OWNER   | Create a new integration          |
| `/api/v1/tenants/:tenantId/integrations/:id`      | PATCH  | OWNER   | Update an existing integration    |
| `/api/v1/tenants/:tenantId/integrations/:id`      | DELETE | OWNER   | Delete an integration             |

### OAuth Endpoints

| Endpoint                                                                | Method | Role         | Description                                |
|-------------------------------------------------------------------------|--------|-------------|--------------------------------------------|
| `/api/v1/oauth/callback`                                                | GET    | Public      | Handle OAuth callback from cloud providers  |
| `/api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh`   | POST   | OWNER       | Refresh OAuth tokens for an integration     |

## 📊 Data Model

```typescript
interface CloudProviderIntegration {
  _id: ObjectId;
  tenantId: ObjectId;           // References the tenant
  providerId: ObjectId;         // References the cloud provider
  clientId: string;             // From the tenant's app registration
  clientSecret: string;         // Encrypted in production
  redirectUri: string;          // OAuth callback URL
  accessToken?: string;         // Encrypted in production
  refreshToken?: string;        // Encrypted in production
  expiresAt?: Date;             // Token expiration timestamp
  metadata?: object;            // Provider-specific data
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;            // Auth0 sub of the user who created it
}
```

## 🔒 Security Considerations

- All endpoints require authentication via Auth0 JWT
- Only tenant owners can manage their integrations
- Sensitive data (client secrets, tokens) should be encrypted in production
- Token refresh operations should be handled securely
- Integrations cannot be deleted if they are in use by any projects

## 🧩 Implementation Details

### Schema Validation

The Cloud Provider Integration schema enforces:
- Valid tenant and provider references
- Required client credentials
- Valid redirect URI format
- Optional metadata for provider-specific configuration

### Business Rules

1. **Tenant Scoping**: Each integration belongs to a specific tenant
2. **Provider Uniqueness**: A tenant can have at most one integration per provider
3. **Deletion Protection**: Integrations in use by projects cannot be deleted
4. **Owner-Only**: All operations require tenant owner role
5. **Audit Logging**: All write operations are logged with the acting user's ID

### Error Codes

| Code                                | Status | Description                                      |
|-------------------------------------|--------|--------------------------------------------------|
| `cloud-integration/not-found`       | 404    | The requested integration does not exist         |
| `cloud-integration/provider-not-found` | 404 | The referenced cloud provider does not exist     |
| `cloud-integration/tenant-not-found`| 404    | The referenced tenant does not exist             |
| `cloud-integration/already-exists`  | 409    | An integration already exists for this provider  |
| `cloud-integration/in-use`          | 409    | The integration is in use by projects            |
| `cloud-integration/invalid-input`   | 400    | The request contains invalid data                |
| `cloud-integration/unauthorized`    | 403    | The user is not authorized for this operation    |

## 🔄 Integration Points

- **Cloud Providers**: Integrations reference cloud providers
- **Tenants**: Integrations are scoped to tenants
- **Projects**: Projects use integrations to access cloud storage
- **OAuth Flow**: External authentication with cloud providers

## 📝 Usage Examples

### Creating a Cloud Provider Integration

```json
POST /api/v1/tenants/60a1b2c3d4e5f6g7h8i9j0k1/integrations
{
  "providerId": "60a1b2c3d4e5f6g7h8i9j0k2",
  "clientId": "your-oauth-client-id",
  "clientSecret": "your-oauth-client-secret",
  "redirectUri": "https://app.mwap.dev/oauth/callback",
  "metadata": {
    "projectId": "your-google-project-id"
  }
}
```

### Updating OAuth Tokens After Authentication

```json
PATCH /api/v1/tenants/60a1b2c3d4e5f6g7h8i9j0k1/integrations/60a1b2c3d4e5f6g7h8i9j0k3
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token",
  "expiresAt": "2025-07-10T12:00:00Z"
}
```

## 🔐 OAuth Flow

1. **Initialization**:
   - Create integration with client credentials
   - Generate authorization URL using provider's authUrl and scopes
   - Include state parameter with tenant and integration IDs

2. **Authorization**:
   - Redirect user to provider's authorization page
   - User grants permissions to the application

3. **Token Exchange** (Dedicated Callback Endpoint):
   - Provider redirects to `/api/v1/oauth/callback` with authorization code
   - Backend extracts tenant ID, integration ID, and user ID from state parameter
   - Backend exchanges code for access and refresh tokens
   - Backend updates integration with tokens and expiration
   - User is redirected to success or error page

4. **Token Refresh**:
   - Monitor token expiration
   - Use dedicated endpoint to refresh tokens: `/api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh`
   - Backend updates integration with new tokens

For detailed implementation, see the [OAuth Feature Documentation](../feature/oauth.md) and [OAuth Integration Guide](../oauth-integration-guide.md).

## 🔜 Future Enhancements

- Automatic token refresh using background jobs
- Support for non-OAuth authentication methods
- Enhanced encryption for sensitive data
- Integration status monitoring
- User-friendly OAuth flow with status tracking