# Auth0 Authentication Implementation

This document covers the Auth0 integration and JWT authentication implementation in the MWAP backend.

## 🔐 Authentication Flow

### Architecture
```
Frontend → Auth0 → Backend
    ↓        ↓        ↓
Login → JWT Token → Validation
```

### Token Validation Process
1. **Frontend** authenticates with Auth0
2. **Auth0** returns JWT token
3. **Backend** validates token using JWKS
4. **Request** proceeds with authenticated user context

## ⚙️ Configuration

### Environment Variables
```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.yourapp.com
```

### Auth0 Client Setup
```typescript
// src/config/auth0.ts
import JwksClient from 'jwks-rsa';
import { env } from './env.js';

export const jwksClient = JwksClient({
  jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  requestHeaders: {},
  timeout: 30000
});
```

## 🛡️ JWT Middleware

### Implementation
```typescript
// src/middleware/auth.ts
import { expressjwt as jwt } from 'express-jwt';

export const authenticateJWT = () => {
  return jwt({
    secret: async (req) => {
      const token = req.headers.authorization?.split(' ')[1];
      const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
      const key = await jwksClient.getSigningKey(header.kid);
      return key.getPublicKey();
    },
    audience: env.AUTH0_AUDIENCE,
    issuer: `https://${env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  });
};
```

### Global Application
```typescript
// src/app.ts
app.use(authenticateJWT()); // Applied to all routes after this point
```

## 🔍 Token Processing

### Token Structure
```typescript
interface JWTPayload {
  sub: string;      // User ID (Auth0 subject)
  email: string;    // User email
  name: string;     // User display name
  iat: number;      // Issued at timestamp
  exp: number;      // Expiration timestamp
  aud: string;      // Audience
  iss: string;      // Issuer
}
```

### User Extraction
```typescript
// src/utils/auth.ts
export function getUserFromToken(req: Request): JWTPayload {
  if (!req.user) {
    throw new ApiError('User not authenticated', 401, 'AUTH_REQUIRED');
  }
  return req.user as JWTPayload;
}
```

## 🚨 Error Handling

### Common Auth Errors
```typescript
// Token missing
401 Unauthorized: "No authorization token provided"

// Token invalid
401 Unauthorized: "invalid signature"

// Token expired
401 Unauthorized: "jwt expired"

// Wrong audience
401 Unauthorized: "jwt audience invalid"
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_INVALID",
    "message": "JWT token is invalid or expired"
  }
}
```

## 🔧 Development Setup

### Auth0 Configuration
1. **Create Auth0 Application**
   - Type: Single Page Application
   - Algorithm: RS256
   - Token Endpoint Authentication Method: None

2. **Configure Allowed Origins**
   ```
   Development: http://localhost:3000, http://localhost:5173
   Production: https://yourapp.com
   ```

3. **Set API Audience**
   - Create Auth0 API with identifier matching `AUTH0_AUDIENCE`

### Local Testing
```bash
# Test token validation
curl -H "Authorization: Bearer <jwt_token>" \
     http://localhost:3001/api/v1/users/me/roles
```

## 🚀 Production Considerations

### Security
- **HTTPS Only**: JWT tokens over encrypted connections
- **Token Expiry**: Short-lived access tokens (15-60 minutes)
- **Key Rotation**: Auth0 handles automatic key rotation
- **JWKS Caching**: Keys cached for performance

### Performance
- **JWKS Caching**: 30-second timeout for key requests
- **Token Validation**: Cached public keys reduce latency
- **Logging**: Structured auth logs for monitoring

### Monitoring
```typescript
// Authentication metrics
logInfo('JWT authentication', {
  userId: user.sub,
  endpoint: req.path,
  hasToken: !!token,
  tokenLength: token?.length
});
```

## 🧪 Testing

### Unit Tests
```typescript
// Mock authenticated requests
const mockUser = { sub: 'auth0|123', email: 'test@example.com' };
req.user = mockUser;
```

### Integration Tests
```typescript
// Use test JWT tokens
const testToken = jwt.sign(payload, secret, { algorithm: 'RS256' });
```

## 🔗 Related Components

- **[RBAC Implementation](rbac.md)** - Role-based authorization
- **[API Integration](../03-Frontend/authentication.md)** - Frontend Auth0 setup
- **[User Management](../03-Frontend/rbac.md)** - User role handling

---

*Auth0 provides secure, scalable authentication with minimal backend complexity.* 