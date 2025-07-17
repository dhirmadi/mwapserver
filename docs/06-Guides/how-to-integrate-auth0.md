# 🔐 Auth0 Integration Guide

## 🎯 Overview

This comprehensive guide covers the complete Auth0 integration for the MWAP platform, including setup, configuration, implementation, and best practices for both backend and frontend components.

## 🚀 Quick Start

### **Prerequisites**
- Auth0 account with appropriate plan
- MWAP development environment set up
- Node.js 20+ and npm/yarn installed
- MongoDB Atlas connection configured

### **Setup Checklist**
- [ ] Auth0 tenant configured
- [ ] Application registered in Auth0
- [ ] API configured in Auth0
- [ ] Environment variables set
- [ ] Backend middleware configured
- [ ] Frontend SDK integrated
- [ ] Custom claims configured
- [ ] MFA enabled (optional)

## 🏗️ Auth0 Tenant Setup

### **1. Create Auth0 Tenant**
```bash
# Navigate to Auth0 Dashboard
# https://manage.auth0.com/

# Create new tenant or use existing
# Recommended settings:
# - Region: Choose closest to your users
# - Environment: Development/Staging/Production
# - Domain: your-tenant.auth0.com
```

### **2. Configure Tenant Settings**
```javascript
// Auth0 Dashboard > Settings > General
{
  "tenant": {
    "friendly_name": "MWAP Platform",
    "picture_url": "https://your-domain.com/logo.png",
    "support_email": "support@your-domain.com",
    "support_url": "https://your-domain.com/support",
    "allowed_logout_urls": [
      "http://localhost:3000",
      "https://app.mwap.dev"
    ],
    "session_lifetime": 720, // 12 hours
    "idle_session_lifetime": 72, // 3 days
    "sandbox_version": "18"
  }
}
```

### **3. Configure Universal Login**
```html
<!-- Auth0 Dashboard > Universal Login > Login -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <title>Sign In | MWAP Platform</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.auth0.com/ulp/react-components/1.70.0/css/main.cdn.min.css">
</head>
<body>
  <div id="root"></div>
  <script src="https://cdn.auth0.com/ulp/react-components/1.70.0/js/main.cdn.min.js"></script>
  <script>
    const config = {
      logo: 'https://your-domain.com/logo.png',
      colors: {
        primary: '#0066cc',
        page_background: '#ffffff'
      },
      theme: 'light',
      language: 'en',
      auth0Domain: config.auth0Domain,
      clientId: config.clientId,
      redirectUri: config.callbackURL,
      responseType: 'code',
      scope: 'openid profile email',
      audience: 'https://api.mwap.local'
    };

    const webAuth = new auth0.WebAuth(config);
    webAuth.parseHash(window.location.hash, function(err, authResult) {
      if (err) {
        console.error('Authentication error:', err);
        return;
      }
      if (authResult) {
        webAuth.client.userInfo(authResult.accessToken, function(err, user) {
          if (err) {
            console.error('User info error:', err);
            return;
          }
          // Handle successful authentication
          window.location.href = config.internalOptions.redirectUri || '/dashboard';
        });
      }
    });
  </script>
</body>
</html>
```

## 🔧 Application Configuration

### **1. Register Single Page Application**
```javascript
// Auth0 Dashboard > Applications > Create Application
{
  "name": "MWAP Frontend",
  "type": "Single Page Application",
  "callbacks": [
    "http://localhost:3000/callback",
    "https://app.mwap.dev/callback"
  ],
  "allowed_logout_urls": [
    "http://localhost:3000",
    "https://app.mwap.dev"
  ],
  "allowed_web_origins": [
    "http://localhost:3000",
    "https://app.mwap.dev"
  ],
  "allowed_origins": [
    "http://localhost:3000",
    "https://app.mwap.dev"
  ],
  "grant_types": [
    "authorization_code",
    "refresh_token"
  ],
  "token_endpoint_auth_method": "none"
}
```

### **2. Register Machine to Machine Application**
```javascript
// Auth0 Dashboard > Applications > Create Application
{
  "name": "MWAP Backend",
  "type": "Machine to Machine",
  "grant_types": [
    "client_credentials"
  ],
  "token_endpoint_auth_method": "client_secret_post",
  "authorized_apis": [
    "https://api.mwap.local"
  ]
}
```

### **3. Configure API**
```javascript
// Auth0 Dashboard > APIs > Create API
{
  "name": "MWAP API",
  "identifier": "https://api.mwap.local",
  "signing_algorithm": "RS256",
  "allow_offline_access": true,
  "token_lifetime": 86400, // 24 hours
  "token_lifetime_for_web": 7200, // 2 hours
  "scopes": [
    {
      "value": "read:profile",
      "description": "Read user profile"
    },
    {
      "value": "write:profile", 
      "description": "Update user profile"
    },
    {
      "value": "read:projects",
      "description": "Read projects"
    },
    {
      "value": "write:projects",
      "description": "Create and update projects"
    },
    {
      "value": "admin:tenant",
      "description": "Tenant administration"
    }
  ]
}
```

## 🔑 Custom Claims Configuration

### **1. Create Auth0 Rule for Custom Claims**
```javascript
// Auth0 Dashboard > Auth Pipeline > Rules
function addCustomClaims(user, context, callback) {
  const namespace = 'https://mwap.local/';
  const assignedRoles = (context.authorization || {}).roles || [];
  
  // Get user metadata
  const userMetadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};
  
  // Add custom claims to token
  context.idToken[namespace + 'tenant_id'] = appMetadata.tenant_id;
  context.idToken[namespace + 'role'] = appMetadata.role || 'user';
  context.idToken[namespace + 'permissions'] = appMetadata.permissions || [];
  context.idToken[namespace + 'email_verified'] = user.email_verified;
  context.idToken[namespace + 'last_login'] = user.last_login;
  
  // Add to access token as well
  context.accessToken[namespace + 'tenant_id'] = appMetadata.tenant_id;
  context.accessToken[namespace + 'role'] = appMetadata.role || 'user';
  context.accessToken[namespace + 'permissions'] = appMetadata.permissions || [];
  
  callback(null, user, context);
}
```

### **2. Create Auth0 Action (New Auth Pipeline)**
```javascript
// Auth0 Dashboard > Actions > Flows > Login
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://mwap.local/';
  
  // Get user metadata
  const userMetadata = event.user.user_metadata || {};
  const appMetadata = event.user.app_metadata || {};
  
  // Set custom claims
  if (appMetadata.tenant_id) {
    api.idToken.setCustomClaim(`${namespace}tenant_id`, appMetadata.tenant_id);
    api.accessToken.setCustomClaim(`${namespace}tenant_id`, appMetadata.tenant_id);
  }
  
  if (appMetadata.role) {
    api.idToken.setCustomClaim(`${namespace}role`, appMetadata.role);
    api.accessToken.setCustomClaim(`${namespace}role`, appMetadata.role);
  }
  
  if (appMetadata.permissions) {
    api.idToken.setCustomClaim(`${namespace}permissions`, appMetadata.permissions);
    api.accessToken.setCustomClaim(`${namespace}permissions`, appMetadata.permissions);
  }
  
  // Add email verification status
  api.idToken.setCustomClaim(`${namespace}email_verified`, event.user.email_verified);
  
  // Add last login
  if (event.user.last_login) {
    api.idToken.setCustomClaim(`${namespace}last_login`, event.user.last_login);
  }
};
```

## 🖥️ Backend Integration

### **1. Environment Configuration**
```env
# .env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_spa_client_id
AUTH0_CLIENT_SECRET=your_m2m_client_secret
AUTH0_AUDIENCE=https://api.mwap.local
AUTH0_M2M_CLIENT_ID=your_m2m_client_id
AUTH0_M2M_CLIENT_SECRET=your_m2m_client_secret
```

### **2. Auth0 Configuration**
```typescript
// src/config/auth0.ts
import jwksClient from 'jwks-rsa';
import { env } from './env';

export const auth0Config = {
  domain: env.AUTH0_DOMAIN,
  clientId: env.AUTH0_CLIENT_ID,
  clientSecret: env.AUTH0_CLIENT_SECRET,
  audience: env.AUTH0_AUDIENCE,
  
  // Management API configuration
  management: {
    clientId: env.AUTH0_M2M_CLIENT_ID,
    clientSecret: env.AUTH0_M2M_CLIENT_SECRET,
    audience: `https://${env.AUTH0_DOMAIN}/api/v2/`
  }
};

export const jwksClient = jwksClient({
  jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 5
});
```

### **3. JWT Middleware Implementation**
```typescript
// src/middleware/auth.ts
import { expressjwt as jwt } from 'express-jwt';
import { Request, Response, NextFunction } from 'express';
import { auth0Config, jwksClient } from '../config/auth0';
import { logInfo, logError } from '../utils/logger';

export const authenticateJWT = () => {
  const middleware = jwt({
    secret: async (req) => {
      try {
        const token = req.headers.authorization?.split(' ')[1] || '';
        
        if (!token) {
          throw new Error('Missing authorization token');
        }
        
        const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
        const key = await jwksClient.getSigningKey(header.kid);
        
        return key.getPublicKey();
      } catch (error) {
        logError('JWT secret retrieval failed', { error });
        throw error;
      }
    },
    audience: auth0Config.audience,
    issuer: `https://${auth0Config.domain}/`,
    algorithms: ['RS256']
  });

  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err) => {
      if (err) {
        if (err.name === 'UnauthorizedError') {
          return res.status(401).json({
            success: false,
            error: {
              code: 'auth/unauthorized',
              message: 'Invalid or expired token'
            }
          });
        }
        return next(err);
      }
      
      logInfo('Authentication successful', {
        user: req.auth?.sub,
        endpoint: req.originalUrl
      });
      
      next();
    });
  };
};
```

### **4. Management API Client**
```typescript
// src/services/auth0Management.ts
import axios from 'axios';
import { auth0Config } from '../config/auth0';
import { logInfo, logError } from '../utils/logger';

class Auth0ManagementClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`https://${auth0Config.domain}/oauth/token`, {
        client_id: auth0Config.management.clientId,
        client_secret: auth0Config.management.clientSecret,
        audience: auth0Config.management.audience,
        grant_type: 'client_credentials'
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

      return this.accessToken;
    } catch (error) {
      logError('Failed to get Auth0 management token', { error });
      throw new Error('Auth0 management API authentication failed');
    }
  }

  async getUser(userId: string): Promise<any> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `https://${auth0Config.domain}/api/v2/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logError('Failed to get user from Auth0', { userId, error });
      throw error;
    }
  }

  async updateUser(userId: string, userData: any): Promise<any> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.patch(
        `https://${auth0Config.domain}/api/v2/users/${userId}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logError('Failed to update user in Auth0', { userId, userData, error });
      throw error;
    }
  }

  async assignUserToTenant(userId: string, tenantId: string, role: string): Promise<void> {
    const userData = {
      app_metadata: {
        tenant_id: tenantId,
        role: role,
        permissions: this.getRolePermissions(role)
      }
    };

    await this.updateUser(userId, userData);
    
    logInfo('User assigned to tenant', { userId, tenantId, role });
  }

  private getRolePermissions(role: string): string[] {
    const rolePermissions = {
      'tenant_owner': ['read:profile', 'write:profile', 'read:projects', 'write:projects', 'admin:tenant'],
      'project_admin': ['read:profile', 'write:profile', 'read:projects', 'write:projects'],
      'project_member': ['read:profile', 'write:profile', 'read:projects'],
      'user': ['read:profile', 'write:profile']
    };

    return rolePermissions[role] || rolePermissions['user'];
  }
}

export const auth0Management = new Auth0ManagementClient();
```

## 🌐 Frontend Integration

### **1. Install Auth0 SDK**
```bash
npm install @auth0/auth0-react
# or
yarn add @auth0/auth0-react
```

### **2. Auth0 Provider Setup**
```tsx
// src/providers/Auth0Provider.tsx
import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

interface Auth0ProviderWrapperProps {
  children: React.ReactNode;
}

export const Auth0ProviderWrapper: React.FC<Auth0ProviderWrapperProps> = ({ children }) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState?: any) => {
    navigate(appState?.returnTo || '/dashboard');
  };

  return (
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN!}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID!}
      authorizationParams={{
        redirect_uri: window.location.origin + '/callback',
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: 'openid profile email read:profile write:profile read:projects write:projects'
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
};
```

### **3. Authentication Hook**
```tsx
// src/hooks/useAuth.ts
import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useMemo } from 'react';

interface UserClaims {
  tenantId?: string;
  role?: string;
  permissions?: string[];
  emailVerified?: boolean;
  lastLogin?: string;
}

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
    getIdTokenClaims
  } = useAuth0();

  const getUserClaims = useCallback(async (): Promise<UserClaims> => {
    try {
      const claims = await getIdTokenClaims();
      const namespace = 'https://mwap.local/';
      
      return {
        tenantId: claims?.[`${namespace}tenant_id`],
        role: claims?.[`${namespace}role`],
        permissions: claims?.[`${namespace}permissions`] || [],
        emailVerified: claims?.[`${namespace}email_verified`],
        lastLogin: claims?.[`${namespace}last_login`]
      };
    } catch (error) {
      console.error('Failed to get user claims:', error);
      return {};
    }
  }, [getIdTokenClaims]);

  const getAccessToken = useCallback(async (): Promise<string> => {
    try {
      return await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: 'read:profile write:profile read:projects write:projects'
        }
      });
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  }, [getAccessTokenSilently]);

  const login = useCallback((returnTo?: string) => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin + '/callback'
      },
      appState: {
        returnTo: returnTo || '/dashboard'
      }
    });
  }, [loginWithRedirect]);

  const logoutUser = useCallback(() => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }, [logout]);

  const hasPermission = useCallback(async (permission: string): Promise<boolean> => {
    const claims = await getUserClaims();
    return claims.permissions?.includes(permission) || false;
  }, [getUserClaims]);

  const hasRole = useCallback(async (role: string): Promise<boolean> => {
    const claims = await getUserClaims();
    return claims.role === role;
  }, [getUserClaims]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout: logoutUser,
    getAccessToken,
    getUserClaims,
    hasPermission,
    hasRole
  };
};
```

### **4. Protected Route Component**
```tsx
// src/components/ProtectedRoute.tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole
}) => {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Additional permission/role checks would go here
  // This would typically involve checking the user's claims

  return <>{children}</>;
};
```

### **5. API Client with Auth**
```tsx
// src/services/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuth } from '../hooks/useAuth';

class ApiClient {
  private client: AxiosInstance;
  private getAccessToken: () => Promise<string>;

  constructor(getAccessToken: () => Promise<string>) {
    this.getAccessToken = getAccessToken;
    
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await this.getAccessToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('Failed to get access token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

// Hook to use API client
export const useApiClient = () => {
  const { getAccessToken } = useAuth();
  
  return useMemo(() => new ApiClient(getAccessToken), [getAccessToken]);
};
```

## 🔒 Multi-Factor Authentication

### **1. Enable MFA in Auth0**
```javascript
// Auth0 Dashboard > Security > Multi-factor Auth
{
  "policies": [
    {
      "name": "Confidence Score",
      "enabled": true,
      "confidence_score_threshold": 50
    },
    {
      "name": "IP Address",
      "enabled": true,
      "allowed_locations": ["trusted_locations"]
    }
  ],
  "providers": [
    {
      "name": "google-authenticator",
      "enabled": true
    },
    {
      "name": "sms",
      "enabled": true,
      "provider": "twilio"
    },
    {
      "name": "email",
      "enabled": true
    }
  ]
}
```

### **2. MFA Challenge Hook**
```tsx
// src/hooks/useMFA.ts
import { useAuth0 } from '@auth0/auth0-react';
import { useState, useCallback } from 'react';

export const useMFA = () => {
  const { user } = useAuth0();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<any>(null);

  const checkMFAStatus = useCallback(async () => {
    // Check if user has MFA enabled
    const mfaEnabled = user?.['https://mwap.local/mfa_enabled'];
    return mfaEnabled;
  }, [user]);

  const initiateMFAChallenge = useCallback(async (challengeType: 'otp' | 'sms' | 'email') => {
    try {
      // This would typically call your backend API
      // which then calls Auth0 Management API
      const response = await fetch('/api/v1/auth/mfa/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify({ challengeType })
      });

      const challenge = await response.json();
      setMfaChallenge(challenge);
      setMfaRequired(true);
      
      return challenge;
    } catch (error) {
      console.error('MFA challenge initiation failed:', error);
      throw error;
    }
  }, []);

  const verifyMFAChallenge = useCallback(async (code: string) => {
    try {
      const response = await fetch('/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify({ 
          challengeId: mfaChallenge?.id,
          code 
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMfaRequired(false);
        setMfaChallenge(null);
      }
      
      return result;
    } catch (error) {
      console.error('MFA verification failed:', error);
      throw error;
    }
  }, [mfaChallenge]);

  return {
    mfaRequired,
    mfaChallenge,
    checkMFAStatus,
    initiateMFAChallenge,
    verifyMFAChallenge
  };
};
```

## 🧪 Testing Auth0 Integration

### **1. Backend Tests**
```typescript
// src/middleware/__tests__/auth.test.ts
import { Request, Response } from 'express';
import { authenticateJWT } from '../auth';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      headers: {},
      originalUrl: '/api/v1/test'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should reject requests without authorization header', async () => {
    const middleware = authenticateJWT();
    
    await middleware(req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'auth/unauthorized',
        message: 'Invalid or expired token'
      }
    });
  });

  it('should validate valid JWT tokens', async () => {
    const validToken = jwt.sign(
      { 
        sub: 'auth0|123456789',
        aud: 'https://api.mwap.local',
        iss: 'https://test-tenant.auth0.com/',
        'https://mwap.local/tenant_id': 'tenant123',
        'https://mwap.local/role': 'user'
      },
      'test-secret'
    );

    req.headers = {
      authorization: `Bearer ${validToken}`
    };

    // Mock JWKS client
    jest.mock('../config/auth0', () => ({
      jwksClient: {
        getSigningKey: jest.fn().mockResolvedValue({
          getPublicKey: () => 'test-secret'
        })
      }
    }));

    const middleware = authenticateJWT();
    
    await middleware(req as Request, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.auth).toBeDefined();
  });
});
```

### **2. Frontend Tests**
```tsx
// src/hooks/__tests__/useAuth.test.tsx
import { renderHook } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../useAuth';

jest.mock('@auth0/auth0-react');

const mockUseAuth0 = useAuth0 as jest.MockedFunction<typeof useAuth0>;

describe('useAuth Hook', () => {
  beforeEach(() => {
    mockUseAuth0.mockReturnValue({
      user: {
        sub: 'auth0|123456789',
        email: 'test@example.com',
        name: 'Test User'
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      loginWithRedirect: jest.fn(),
      logout: jest.fn(),
      getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
      getIdTokenClaims: jest.fn().mockResolvedValue({
        'https://mwap.local/tenant_id': 'tenant123',
        'https://mwap.local/role': 'user',
        'https://mwap.local/permissions': ['read:profile']
      })
    } as any);
  });

  it('should return user claims correctly', async () => {
    const { result } = renderHook(() => useAuth());
    
    const claims = await result.current.getUserClaims();
    
    expect(claims).toEqual({
      tenantId: 'tenant123',
      role: 'user',
      permissions: ['read:profile'],
      emailVerified: undefined,
      lastLogin: undefined
    });
  });

  it('should check permissions correctly', async () => {
    const { result } = renderHook(() => useAuth());
    
    const hasPermission = await result.current.hasPermission('read:profile');
    const lacksPermission = await result.current.hasPermission('admin:tenant');
    
    expect(hasPermission).toBe(true);
    expect(lacksPermission).toBe(false);
  });
});
```

## 🚀 Deployment Considerations

### **1. Environment-Specific Configuration**
```bash
# Development
AUTH0_DOMAIN=dev-tenant.auth0.com
AUTH0_CLIENT_ID=dev_client_id
REACT_APP_AUTH0_DOMAIN=dev-tenant.auth0.com

# Staging
AUTH0_DOMAIN=staging-tenant.auth0.com
AUTH0_CLIENT_ID=staging_client_id
REACT_APP_AUTH0_DOMAIN=staging-tenant.auth0.com

# Production
AUTH0_DOMAIN=prod-tenant.auth0.com
AUTH0_CLIENT_ID=prod_client_id
REACT_APP_AUTH0_DOMAIN=prod-tenant.auth0.com
```

### **2. Security Checklist**
- [ ] HTTPS enabled in production
- [ ] Secure cookie settings configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] MFA enforced for admin users
- [ ] Regular security reviews scheduled
- [ ] Backup and recovery procedures tested

## 🔗 Related Documentation

- **[🔒 Auth Middleware](../04-Backend/auth-middleware.md)** - Backend authentication implementation
- **[🛡️ Security Architecture](../04-Backend/security-architecture.md)** - Overall security design
- **[🛡️ Security Patterns](../04-Backend/security-patterns.md)** - Security implementation patterns
- **[🔐 Frontend Auth Integration](../03-Frontend/auth0-integration.md)** - Client-side authentication
- **[⚙️ Environment Configuration](../07-Standards/.env-format.md)** - Environment setup

---

*This comprehensive Auth0 integration guide provides everything needed to implement secure authentication and authorization in the MWAP platform, from initial setup to production deployment.*