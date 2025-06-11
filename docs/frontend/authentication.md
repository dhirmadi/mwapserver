# MWAP Frontend Authentication

This document outlines the authentication flow and security considerations for the MWAP frontend application.

## Authentication Flow

The MWAP frontend uses Auth0 for authentication, following the Authorization Code flow with PKCE (Proof Key for Code Exchange) for enhanced security. This flow is recommended for single-page applications (SPAs) and provides a secure way to authenticate users without exposing sensitive credentials.

### Authentication Process

1. **User Initiates Login**: User clicks the login button or attempts to access a protected route
2. **Redirect to Auth0**: The application redirects to Auth0's Universal Login page
3. **User Authentication**: User enters credentials or uses social login
4. **Authorization Code Generation**: Auth0 generates an authorization code
5. **Code Exchange**: The application exchanges the code for tokens using PKCE
6. **Token Storage**: Tokens are securely stored in memory (not localStorage)
7. **Authenticated State**: The application updates its state to reflect the authenticated user
8. **Token Refresh**: Refresh tokens are used to obtain new access tokens when needed
9. **Logout**: User session is terminated and tokens are cleared

### Auth0 Configuration

The Auth0 SDK is configured as follows:

```tsx
// src/auth/auth0-config.ts
import { Auth0Provider } from '@auth0/auth0-react';
import React from 'react';

export const Auth0ProviderWithHistory: React.FC = ({ children }) => {
  const domain = process.env.REACT_APP_AUTH0_DOMAIN || '';
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID || '';
  const audience = process.env.REACT_APP_AUTH0_AUDIENCE || '';
  const redirectUri = window.location.origin;
  
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: 'openid profile email',
      }}
      useRefreshTokens={true}
      cacheLocation="memory"
    >
      {children}
    </Auth0Provider>
  );
};
```

### Auth Context

A custom Auth context is created to provide authentication state and functions throughout the application:

```tsx
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '../utils/api';
import { User } from '../types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: Error | null;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  isSuperAdmin: boolean;
  isTenantOwner: boolean;
  hasProjectRole: (projectId: string, role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user: auth0User, 
    error, 
    loginWithRedirect, 
    logout: auth0Logout,
    getAccessTokenSilently 
  } = useAuth0();
  
  const [user, setUser] = useState<User | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isTenantOwner, setIsTenantOwner] = useState(false);
  const [projectRoles, setProjectRoles] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && auth0User) {
        try {
          // Fetch user data from the API
          const response = await api.get('/tenants/me');
          const userData = response.data;
          
          setUser({
            id: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
            tenantId: userData._id,
            tenantName: userData.name,
          });
          
          setIsTenantOwner(userData.ownerId === auth0User.sub);
          
          // Check if user is a super admin
          try {
            const adminResponse = await api.get('/admin/check');
            setIsSuperAdmin(adminResponse.data.isSuperAdmin);
          } catch (error) {
            setIsSuperAdmin(false);
          }
          
          // Fetch project roles
          const projectsResponse = await api.get('/projects');
          const projects = projectsResponse.data;
          
          const roles: Record<string, string> = {};
          projects.forEach((project: any) => {
            const member = project.members.find((m: any) => m.userId === auth0User.sub);
            if (member) {
              roles[project._id] = member.role;
            }
          });
          
          setProjectRoles(roles);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    
    fetchUserData();
  }, [isAuthenticated, auth0User]);
  
  const login = () => {
    loginWithRedirect();
  };
  
  const logout = () => {
    auth0Logout({ 
      logoutParams: {
        returnTo: window.location.origin 
      }
    });
    setUser(null);
    setIsSuperAdmin(false);
    setIsTenantOwner(false);
    setProjectRoles({});
  };
  
  const getAccessToken = async () => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  };
  
  const hasProjectRole = (projectId: string, role: string) => {
    const userRole = projectRoles[projectId];
    if (!userRole) return false;
    
    // Role hierarchy: OWNER > DEPUTY > MEMBER
    if (role === 'MEMBER') {
      return ['OWNER', 'DEPUTY', 'MEMBER'].includes(userRole);
    } else if (role === 'DEPUTY') {
      return ['OWNER', 'DEPUTY'].includes(userRole);
    } else if (role === 'OWNER') {
      return userRole === 'OWNER';
    }
    
    return false;
  };
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        error,
        login,
        logout,
        getAccessToken,
        isSuperAdmin,
        isTenantOwner,
        hasProjectRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Protected Routes

Protected routes ensure that only authenticated users can access certain parts of the application:

```tsx
// src/routes/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    // Redirect to login page, but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
};
```

## Role-Based Routes

Role-based routes restrict access based on the user's role:

```tsx
// src/routes/RoleRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface RoleRouteProps {
  requiredRoles: ('superAdmin' | 'tenantOwner' | 'projectOwner' | 'projectDeputy' | 'projectMember')[];
  projectId?: string;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ 
  requiredRoles,
  projectId
}) => {
  const { 
    isLoading, 
    isSuperAdmin, 
    isTenantOwner, 
    hasProjectRole 
  } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  const hasRequiredRole = requiredRoles.some(role => {
    if (role === 'superAdmin') return isSuperAdmin;
    if (role === 'tenantOwner') return isTenantOwner;
    if (role === 'projectOwner' && projectId) return hasProjectRole(projectId, 'OWNER');
    if (role === 'projectDeputy' && projectId) return hasProjectRole(projectId, 'DEPUTY');
    if (role === 'projectMember' && projectId) return hasProjectRole(projectId, 'MEMBER');
    return false;
  });
  
  if (!hasRequiredRole) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return <Outlet />;
};
```

## Route Configuration

The routes are configured to use these components:

```tsx
// src/routes/index.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { RoleRoute } from './RoleRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { SuperAdminDashboard } from '../pages/dashboard/SuperAdminDashboard';
import { TenantOwnerDashboard } from '../pages/dashboard/TenantOwnerDashboard';
import { ProjectMemberDashboard } from '../pages/dashboard/ProjectMemberDashboard';
import { NotFound } from '../pages/error/NotFound';
import { Forbidden } from '../pages/error/Forbidden';
import { ServerError } from '../pages/error/ServerError';
// Import other pages...

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            {/* Dashboard routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* SuperAdmin routes */}
            <Route element={<RoleRoute requiredRoles={['superAdmin']} />}>
              <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/admin/tenants" element={<TenantList />} />
              <Route path="/admin/project-types" element={<ProjectTypeList />} />
              <Route path="/admin/cloud-providers" element={<CloudProviderList />} />
              {/* Other SuperAdmin routes... */}
            </Route>
            
            {/* Tenant Owner routes */}
            <Route element={<RoleRoute requiredRoles={['tenantOwner']} />}>
              <Route path="/tenant/dashboard" element={<TenantOwnerDashboard />} />
              <Route path="/tenant/settings" element={<TenantSettings />} />
              <Route path="/tenant/integrations" element={<IntegrationList />} />
              {/* Other Tenant Owner routes... */}
            </Route>
            
            {/* Project routes */}
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            
            {/* Project Owner/Deputy routes */}
            <Route path="/projects/:id/settings" element={
              <RoleRoute 
                requiredRoles={['projectOwner', 'projectDeputy']} 
                projectId={/* Get from URL params */}
              >
                <ProjectSettings />
              </RoleRoute>
            } />
            
            {/* Project Owner routes */}
            <Route path="/projects/:id/members" element={
              <RoleRoute 
                requiredRoles={['projectOwner']} 
                projectId={/* Get from URL params */}
              >
                <ProjectMembers />
              </RoleRoute>
            } />
            
            {/* User profile */}
            <Route path="/profile" element={<UserProfile />} />
            
            {/* Error pages */}
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="/server-error" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
```

## Token Management

Access tokens are managed securely:

1. **Token Storage**: Tokens are stored in memory, not in localStorage or cookies
2. **Token Refresh**: Refresh tokens are used to obtain new access tokens
3. **Token Expiration**: Expired tokens trigger a refresh or redirect to login

```tsx
// src/utils/auth.ts
import { useAuth0 } from '@auth0/auth0-react';

export const useTokenManager = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const getAccessToken = async (): Promise<string | null> => {
    if (!isAuthenticated) {
      return null;
    }
    
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  };
  
  return {
    getAccessToken,
  };
};
```

## Security Considerations

### CSRF Protection

Cross-Site Request Forgery (CSRF) protection is implemented:

1. Auth0 uses state parameters to prevent CSRF during authentication
2. API requests include the JWT token, which is verified on the server

### XSS Protection

Cross-Site Scripting (XSS) protection measures:

1. React's built-in XSS protection (automatic escaping)
2. Content Security Policy (CSP) headers
3. Input validation and sanitization
4. Avoiding dangerous patterns like `dangerouslySetInnerHTML`

### Secure Token Handling

1. Tokens are stored in memory, not localStorage
2. Tokens are never exposed to JavaScript
3. Token refresh is handled securely

### Secure Communication

1. All API communication uses HTTPS
2. Sensitive data is never logged or exposed
3. Error messages don't reveal sensitive information

## Logout Process

The logout process ensures complete session termination:

1. Clear local application state
2. Redirect to Auth0 logout endpoint
3. Invalidate the session on the Auth0 side
4. Redirect back to the application

```tsx
const logout = () => {
  auth0Logout({ 
    logoutParams: {
      returnTo: window.location.origin 
    }
  });
  // Clear local state
  setUser(null);
  setIsSuperAdmin(false);
  setIsTenantOwner(false);
  setProjectRoles({});
};
```

## Conclusion

The MWAP frontend implements a secure, robust authentication system using Auth0 with the Authorization Code flow with PKCE. This approach provides a high level of security while maintaining a good user experience. Role-based access control ensures that users can only access the features and data they are authorized to use.