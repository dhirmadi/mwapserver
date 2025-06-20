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

## Common Errors

- **400 Bad Request**: Missing required fields (providerId)
- **404 Not Found**: Invalid tenant ID or provider ID
- **409 Conflict**: Integration already exists for this tenant and provider