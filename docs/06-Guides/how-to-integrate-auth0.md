# How to Integrate Auth0

This guide provides step-by-step instructions for integrating Auth0 authentication into the MWAP platform, covering both backend and frontend setup.

## 🎯 Overview

Auth0 provides secure authentication using JWT tokens with PKCE flow for the frontend and JWT validation middleware for the backend.

**Authentication Flow:**
```
Frontend (React) → Auth0 (Login) → JWT Token → Backend (Validation) → API Access
```

## 🏗️ Auth0 Setup

### Step 1: Create Auth0 Account
1. Go to [auth0.com](https://auth0.com) and create an account
2. Create a new tenant (e.g., `dev-yourapp`, `prod-yourapp`)
3. Note your domain: `your-tenant.auth0.com`

### Step 2: Create Auth0 API
1. Navigate to **APIs** in Auth0 Dashboard
2. Click **Create API**
3. Configure:
   - **Name**: `MWAP API`
   - **Identifier**: `https://api.yourapp.com` (this becomes AUTH0_AUDIENCE)
   - **Signing Algorithm**: `RS256`
4. Enable **RBAC** and **Add Permissions in the Access Token**

### Step 3: Create Auth0 Application
1. Navigate to **Applications** in Auth0 Dashboard
2. Click **Create Application**
3. Configure:
   - **Name**: `MWAP Frontend`
   - **Type**: `Single Page Application`
4. Configure Application Settings:
   ```
   Allowed Callback URLs: http://localhost:3000/callback, https://yourapp.com/callback
   Allowed Logout URLs: http://localhost:3000, https://yourapp.com
   Allowed Web Origins: http://localhost:3000, https://yourapp.com
   Allowed Origins (CORS): http://localhost:3000, https://yourapp.com
   ```

## 🔧 Backend Integration

### Step 1: Environment Configuration
```bash
# .env.local
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.yourapp.com
```

### Step 2: Install Dependencies
```bash
npm install express-jwt jwks-rsa
npm install --save-dev @types/express
```

### Step 3: Auth0 Configuration
```typescript
// src/config/auth0.ts
import { JwksClient } from 'jwks-rsa';
import { env } from './env.js';

export const jwksClient = new JwksClient({
  jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  rateLimit: true,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  timeout: 10000 // 10 seconds
});
```

### Step 4: JWT Middleware
```typescript
// src/middleware/auth.ts
import { expressjwt as jwt } from 'express-jwt';
import { env } from '../config/env';
import { jwksClient } from '../config/auth0';
import { logInfo, logError } from '../utils/logger';

export const authenticateJWT = () => {
  return jwt({
    secret: async (req) => {
      try {
        const token = req.headers.authorization?.split(' ')[1] || '';
        
        logInfo('Processing JWT authentication', {
          endpoint: req.originalUrl,
          method: req.method,
          hasToken: !!token
        });
        
        if (!token) {
          throw new Error('Missing authorization token');
        }
        
        const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
        const key = await jwksClient.getSigningKey(header.kid);
        
        return key.getPublicKey();
      } catch (error) {
        logError('JWT authentication error', {
          error: error instanceof Error ? error.message : String(error),
          endpoint: req.originalUrl
        });
        throw error;
      }
    },
    audience: env.AUTH0_AUDIENCE,
    issuer: `https://${env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  });
};
```

### Step 5: Apply Authentication
```typescript
// src/app.ts
import { authenticateJWT } from './middleware/auth.js';

// Apply JWT authentication to all API routes
app.use(authenticateJWT());
```

### Step 6: User Extraction Utility
```typescript
// src/utils/auth.ts
import { Request } from 'express';
import { ApiError } from './errors.js';

export interface JWTPayload {
  sub: string;      // User ID
  email: string;    // User email
  name: string;     // Display name
  iat: number;      // Issued at
  exp: number;      // Expires
  aud: string;      // Audience
  iss: string;      // Issuer
}

export function getUserFromToken(req: Request): JWTPayload {
  if (!req.user) {
    throw new ApiError('User not authenticated', 401, 'AUTH_REQUIRED');
  }
  return req.user as JWTPayload;
}
```

## 🖥️ Frontend Integration

### Step 1: Install Auth0 React SDK
```bash
npm install @auth0/auth0-react
```

### Step 2: Auth0 Provider Setup
```typescript
// src/main.tsx or src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

const domain = process.env.VITE_AUTH0_DOMAIN!;
const clientId = process.env.VITE_AUTH0_CLIENT_ID!;
const audience = process.env.VITE_AUTH0_AUDIENCE!;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin + '/callback',
        audience: audience,
        scope: 'openid profile email'
      }}
      cacheLocation="localstorage"
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
```

### Step 3: Environment Variables (Frontend)
```bash
# .env.local (React/Vite)
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-app-client-id
VITE_AUTH0_AUDIENCE=https://api.yourapp.com
VITE_API_BASE_URL=http://localhost:3001
```

### Step 4: Login/Logout Components
```typescript
// src/components/Auth/LoginButton.tsx
import { useAuth0 } from '@auth0/auth0-react';

export const LoginButton: React.FC = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  if (isAuthenticated) return null;

  return (
    <button 
      onClick={() => loginWithRedirect()}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Log In
    </button>
  );
};

// src/components/Auth/LogoutButton.tsx
import { useAuth0 } from '@auth0/auth0-react';

export const LogoutButton: React.FC = () => {
  const { logout, isAuthenticated } = useAuth0();

  if (!isAuthenticated) return null;

  return (
    <button 
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Log Out
    </button>
  );
};
```

### Step 5: Protected Routes
```typescript
// src/components/Auth/ProtectedRoute.tsx
import { useAuth0 } from '@auth0/auth0-react';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    loginWithRedirect();
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
};
```

### Step 6: API Integration with Token
```typescript
// src/services/api.ts
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useApiClient = () => {
  const { getAccessTokenSilently } = useAuth0();

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
  });

  // Add auth token to all requests
  apiClient.interceptors.request.use(async (config) => {
    try {
      const token = await getAccessTokenSilently();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to get access token:', error);
    }
    return config;
  });

  return apiClient;
};

// Usage example
export const useApi = () => {
  const apiClient = useApiClient();

  const getTenants = async () => {
    const response = await apiClient.get('/api/v1/tenants/me');
    return response.data;
  };

  const createTenant = async (data: { name: string }) => {
    const response = await apiClient.post('/api/v1/tenants', data);
    return response.data;
  };

  return { getTenants, createTenant };
};
```

## 🧪 Testing Integration

### Step 1: Test Backend Authentication
```bash
# Get token from frontend (browser console)
localStorage.getItem('@@auth0spajs@@::clientId::audience::scope')

# Test API with token
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/v1/users/me/roles
```

### Step 2: Test Frontend Login Flow
1. Start frontend: `npm run dev`
2. Click login button
3. Complete Auth0 login
4. Verify token in localStorage
5. Test protected API calls

### Step 3: Integration Testing
```typescript
// Example test
describe('Auth0 Integration', () => {
  it('should authenticate and access API', async () => {
    // Mock Auth0 hook
    const mockGetAccessTokenSilently = jest.fn().mockResolvedValue('mock-token');
    
    // Test API call with token
    const apiClient = useApiClient();
    const response = await apiClient.get('/api/v1/tenants/me');
    
    expect(response.status).toBe(200);
    expect(mockGetAccessTokenSilently).toHaveBeenCalled();
  });
});
```

## 🔒 Security Configuration

### Auth0 Security Settings
1. **Password Policy**: Set strong password requirements
2. **Multi-Factor Authentication**: Enable MFA for production
3. **Anomaly Detection**: Enable brute force protection
4. **Session Management**: Configure session timeouts

### Token Configuration
```typescript
// Token expiration settings in Auth0 Dashboard
{
  "access_token_lifetime": 3600,        // 1 hour
  "refresh_token_lifetime": 86400,      // 24 hours
  "refresh_token_rotation": true,
  "refresh_token_expiration": "rotating"
}
```

## 🚀 Production Setup

### Production Auth0 Configuration
1. Create separate production tenant
2. Update environment variables:
   ```bash
   AUTH0_DOMAIN=prod-tenant.auth0.com
   AUTH0_AUDIENCE=https://api.yourapp.com
   ```
3. Configure production URLs in Auth0 application
4. Enable security features (MFA, anomaly detection)

### Deployment Checklist
- [ ] Production Auth0 tenant configured
- [ ] Environment variables set correctly
- [ ] Frontend callback URLs updated
- [ ] CORS settings configured
- [ ] Security features enabled
- [ ] Token expiration configured appropriately

## 🐛 Troubleshooting

### Common Issues

#### "jwt audience invalid"
```bash
→ Verify AUTH0_AUDIENCE matches API identifier
→ Check frontend audience parameter
→ Ensure case sensitivity is correct
```

#### "Unable to verify signature"
```bash
→ Check AUTH0_DOMAIN configuration
→ Verify JWKS endpoint accessibility
→ Check network connectivity to Auth0
```

#### Frontend login redirect loops
```bash
→ Check callback URL configuration
→ Verify client ID is correct
→ Check localStorage for corrupted tokens
```

#### Token not included in API requests
```bash
→ Verify getAccessTokenSilently is called
→ Check axios interceptor configuration
→ Ensure audience is specified in frontend
```

## 📊 Monitoring and Analytics

### Auth0 Dashboard
- Monitor login attempts and failures
- Track user registrations
- Review security anomalies
- Analyze token usage patterns

### Application Logging
```typescript
// Backend: Log authentication events
logInfo('User authenticated', {
  userId: user.sub,
  email: user.email,
  loginTime: new Date().toISOString()
});

// Frontend: Log auth state changes
useEffect(() => {
  if (isAuthenticated) {
    console.log('User logged in:', user);
  }
}, [isAuthenticated, user]);
```

## 📖 Related Documentation

- **[Backend Auth Implementation](../04-Backend/auth0.md)** - Detailed backend setup
- **[Frontend RBAC](../03-Frontend/rbac.md)** - Role-based access control
- **[API Integration](../03-Frontend/api-integration.md)** - Frontend API usage

---

*Follow this guide to implement secure, scalable Auth0 authentication across your MWAP application.* 