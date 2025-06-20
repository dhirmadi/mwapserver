# Cloud Provider Integration Example

## Cloud Provider vs. Cloud Provider Integration

### Cloud Provider
A cloud provider represents a service like AWS, Azure, or Google Cloud. It contains:
- Authentication details (clientId, clientSecret)
- OAuth endpoints (authUrl, tokenUrl)
- Configuration (scopes, grantType)

### Cloud Provider Integration
An integration represents a tenant's connection to a specific cloud provider. It contains:
- Reference to the provider (providerId)
- OAuth tokens (accessToken, refreshToken)
- Status information (status, tokenExpiresAt)
- Metadata (displayName, description)

## Example Payloads

### Creating a Cloud Provider Integration

```json
POST /api/v1/tenants/:tenantId/integrations

{
  "providerId": "<valid-mongodb-objectid>",
  "status": "active",
  "metadata": {
    "displayName": "My AWS Integration",
    "description": "Integration for production environment"
  }
}
```

Note: The `tenantId` is provided in the URL path, not in the request body. The system automatically associates the integration with the tenant specified in the URL. This ensures that integrations are always properly scoped to their tenant.

#### How Tenant Association Works

1. The `tenantId` from the URL path is extracted in the controller
2. The service validates that the tenant exists
3. The integration is created with the `tenantId` field set to the tenant's ID
4. All queries for integrations filter by `tenantId` to ensure proper data isolation

### Updating OAuth Tokens (After OAuth Flow)

```json
PATCH /api/v1/tenants/:tenantId/integrations/:integrationId

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenExpiresAt": "2023-12-31T23:59:59Z",
  "scopesGranted": ["read:resources", "write:resources"]
}
```

## OAuth Flow

1. Create a cloud provider integration (using the payload above)
2. Redirect user to OAuth authorization URL with the integration ID
3. After authorization, update the integration with tokens
4. Use the integration for API calls to the cloud provider

## Querying Integrations

### Get All Integrations for a Tenant

```
GET /api/v1/tenants/:tenantId/integrations
```

This endpoint returns all integrations associated with the specified tenant. The system uses the `tenantId` from the URL to filter the results, ensuring that only integrations belonging to that tenant are returned.

### Get a Specific Integration

```
GET /api/v1/tenants/:tenantId/integrations/:integrationId
```

This endpoint returns a specific integration. The system verifies that:
1. The integration exists
2. The integration belongs to the specified tenant
3. The user has permission to access the tenant's data

## Common Errors

- **400 Bad Request**: Missing required fields (providerId)
- **404 Not Found**: Invalid tenant ID or provider ID
- **409 Conflict**: Integration already exists for this tenant and provider
- **403 Forbidden**: User does not have permission to access the tenant's data