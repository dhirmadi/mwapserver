# OAuth Feature Documentation

## Overview

The OAuth feature in MWAP provides a secure and standardized way to integrate with third-party cloud providers using the OAuth 2.0 authorization code flow. This feature includes a dedicated callback endpoint that handles the OAuth authorization code exchange, eliminating the need for the frontend to handle sensitive tokens.

## Architecture

The OAuth feature consists of the following components:

1. **OAuth Service**: Handles token exchange and refresh operations
2. **OAuth Controller**: Processes OAuth callbacks and token refresh requests
3. **OAuth Routes**: Exposes endpoints for OAuth operations
4. **Integration with Cloud Providers**: Works with the existing cloud provider integration system

## Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/v1/oauth/callback` | GET | Handles OAuth callbacks from cloud providers | Public |
| `/api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh` | POST | Refreshes OAuth tokens for an integration | Tenant Owner |

## OAuth Flow

The OAuth flow in MWAP follows the standard OAuth 2.0 authorization code flow:

1. **Create Integration**: The frontend creates a cloud provider integration
2. **Authorization Request**: The user is redirected to the cloud provider's authorization page
3. **Authorization Grant**: The user grants permission to the application
4. **Callback Processing**: The cloud provider redirects to the callback endpoint with an authorization code
5. **Token Exchange**: The backend exchanges the code for access and refresh tokens
6. **Token Storage**: The tokens are securely stored in the database
7. **Resource Access**: The application can now access the cloud provider's resources using the tokens

## Security Considerations

The OAuth implementation includes several security measures:

- **State Parameter**: Prevents CSRF attacks by including a state parameter in the authorization request
- **Backend Token Exchange**: Sensitive tokens are never exposed to the frontend
- **Secure Token Storage**: Tokens are stored securely in the database
- **Token Refresh**: Expired tokens are automatically refreshed
- **Error Handling**: Comprehensive error handling for OAuth failures

## Implementation Details

### State Parameter

The state parameter is a base64-encoded JSON object containing:
- `tenantId`: The ID of the tenant
- `integrationId`: The ID of the cloud provider integration
- `userId`: The ID of the user initiating the OAuth flow

Example:
```json
{
  "tenantId": "60c3f4d5e6f7a8b9c0d1e2f3",
  "integrationId": "60b2f3c4d5e6f7a8b9c0d1e2",
  "userId": "auth0|123456789"
}
```

### Token Exchange

The token exchange process involves:
1. Extracting the authorization code from the callback URL
2. Retrieving the cloud provider details
3. Making a request to the provider's token endpoint
4. Processing the token response
5. Updating the integration with the tokens

### Token Refresh

The token refresh process involves:
1. Using the refresh token to obtain new access and refresh tokens
2. Updating the integration with the new tokens

## Backward Compatibility

The OAuth feature maintains backward compatibility with the existing approach of sending the OAuth code to the PATCH endpoint. This ensures that existing integrations continue to work while new integrations can use the more secure dedicated callback endpoint.

## Frontend Integration

Frontend applications should use the dedicated callback endpoint for OAuth flows. See the [OAuth Integration Guide](oauth-integration-guide.md) and [Frontend OAuth Integration](oauthintegration.md) for detailed implementation examples.

## Error Handling

The OAuth feature includes comprehensive error handling:
- OAuth provider errors are captured and logged
- Invalid state parameters are detected and rejected
- Token exchange failures are handled gracefully
- Users are redirected to appropriate error pages

## Logging and Auditing

All OAuth operations are logged for auditing purposes:
- OAuth callback processing
- Token exchange
- Token refresh
- OAuth errors

## Future Enhancements

Potential future enhancements to the OAuth feature include:
- Support for additional OAuth grant types (e.g., implicit, client credentials)
- Enhanced token management (e.g., automatic token refresh)
- Support for additional cloud providers
- Advanced security features (e.g., PKCE)