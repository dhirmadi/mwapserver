# Authentication Integration Guide

This guide shows React developers how to integrate Auth0 authentication with the MWAP backend API.

## 🔐 Overview

MWAP uses **Auth0** with the **Authorization Code flow with PKCE** for secure authentication. This provides:
- Secure token handling (stored in memory, not localStorage)
- Automatic token refresh
- Role-based access control
- Multi-tenant support

## 🚀 Setup

### 1. Install Auth0 SDK

```bash
npm install @auth0/auth0-react
```

### 2. Environment Variables

```env
REACT_APP_AUTH0_DOMAIN=your-tenant.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your_client_id
REACT_APP_AUTH0_AUDIENCE=https://api.yourapp.com
```

### 3. Auth0Provider Setup

```tsx
// src/App.tsx
import { Auth0Provider } from '@auth0/auth0-react';

function App() {
  return (
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN!}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID!}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      }}
      useRefreshTokens={true}
      cacheLocation="memory" // Secure - no localStorage
    >
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
    </Auth0Provider>
  );
}
```

## 🎭 Auth Context with Roles

Create a custom auth context that integrates with the MWAP backend:

```tsx
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '../utils/api';

interface UserRoles {
  isSuperAdmin: boolean;
  isTenantOwner: boolean;
  tenantId: string | null;
  projectRoles: Record<string, 'OWNER' | 'DEPUTY' | 'MEMBER'>;
}

interface AuthContextType {
  // Auth0 state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  error: Error | null;
  
  // Auth methods
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  
  // MWAP roles
  userRoles: UserRoles | null;
  hasProjectRole: (projectId: string, requiredRole: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isAuthenticated,
    isLoading: auth0Loading,
    user,
    error,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [userRoles, setUserRoles] = useState<UserRoles | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Fetch user roles when authenticated
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!isAuthenticated || !user) return;

      setRolesLoading(true);
      try {
        const token = await getAccessTokenSilently();
        const response = await api.get('/users/me/roles', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const roles = response.data.data;
        
        // Convert project roles array to record for easier lookup
        const projectRoles: Record<string, string> = {};
        roles.projectRoles?.forEach((pr: any) => {
          projectRoles[pr.projectId] = pr.role;
        });

        setUserRoles({
          isSuperAdmin: roles.isSuperAdmin,
          isTenantOwner: roles.isTenantOwner,
          tenantId: roles.tenantId,
          projectRoles,
        });
      } catch (error) {
        console.error('Failed to fetch user roles:', error);
        setUserRoles(null);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchUserRoles();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  const login = () => {
    loginWithRedirect();
  };

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
    setUserRoles(null);
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (!isAuthenticated) return null;

    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  };

  const hasProjectRole = (projectId: string, requiredRole: string): boolean => {
    if (!userRoles) return false;

    // SuperAdmin has all permissions
    if (userRoles.isSuperAdmin) return true;

    const userRole = userRoles.projectRoles[projectId];
    if (!userRole) return false;

    // Role hierarchy: OWNER > DEPUTY > MEMBER
    const roleHierarchy = { OWNER: 3, DEPUTY: 2, MEMBER: 1 };
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading: auth0Loading || rolesLoading,
    user,
    error,
    login,
    logout,
    getAccessToken,
    userRoles,
    hasProjectRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 🛡️ Protected Routes

### Basic Authentication Route

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
```

### Role-Based Route Protection

```tsx
// src/components/RoleRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleRouteProps {
  requiredRole?: 'superadmin' | 'tenant-owner';
  projectId?: string;
  projectRole?: 'OWNER' | 'DEPUTY' | 'MEMBER';
  fallbackPath?: string;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  requiredRole,
  projectId,
  projectRole,
  fallbackPath = '/unauthorized',
}) => {
  const { userRoles, hasProjectRole, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!userRoles) {
    return <Navigate to="/login" replace />;
  }

  // Check global roles
  if (requiredRole === 'superadmin' && !userRoles.isSuperAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredRole === 'tenant-owner' && !userRoles.isTenantOwner && !userRoles.isSuperAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check project-specific roles
  if (projectId && projectRole && !hasProjectRole(projectId, projectRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};
```

### Route Setup

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Tenant owner routes */}
        <Route element={<RoleRoute requiredRole="tenant-owner" />}>
          <Route path="/tenant/settings" element={<TenantSettings />} />
          <Route path="/integrations" element={<CloudIntegrations />} />
        </Route>

        {/* SuperAdmin routes */}
        <Route element={<RoleRoute requiredRole="superadmin" />}>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Route>

        {/* Project-specific routes */}
        <Route path="/projects/:projectId/*" element={<ProjectRoutes />} />
      </Route>
    </Routes>
  );
}
```

## 🔑 Token Management

### API Integration

```tsx
// src/utils/api.ts
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Create API instance
export const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api/v1`,
});

// Hook for authenticated API calls
export const useAuthenticatedApi = () => {
  const { getAccessToken, logout } = useAuth();

  // Add auth token to requests
  api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle auth errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid - force re-login
        logout();
      }
      return Promise.reject(error);
    }
  );

  return api;
};
```

## 🎯 Usage Examples

### Login Page

```tsx
// src/pages/LoginPage.tsx
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="login-page">
      <h1>Welcome to MWAP</h1>
      <p>Please log in to continue</p>
      <button onClick={login} className="login-button">
        Log In
      </button>
    </div>
  );
};
```

### Dashboard with Role-Based Content

```tsx
// src/pages/Dashboard.tsx
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, userRoles, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <button onClick={logout}>Logout</button>
      </header>

      <main className="dashboard-content">
        {/* SuperAdmin panel */}
        {userRoles?.isSuperAdmin && (
          <section className="admin-panel">
            <h2>System Administration</h2>
            <nav>
              <a href="/admin/tenants">Manage Tenants</a>
              <a href="/admin/project-types">Manage Project Types</a>
              <a href="/admin/cloud-providers">Manage Cloud Providers</a>
            </nav>
          </section>
        )}

        {/* Tenant Owner panel */}
        {userRoles?.isTenantOwner && (
          <section className="tenant-panel">
            <h2>Tenant Management</h2>
            <nav>
              <a href="/tenant/settings">Tenant Settings</a>
              <a href="/integrations">Cloud Integrations</a>
              <a href="/projects">Manage Projects</a>
            </nav>
          </section>
        )}

        {/* Projects */}
        <section className="projects-panel">
          <h2>Your Projects</h2>
          {Object.entries(userRoles?.projectRoles || {}).map(([projectId, role]) => (
            <div key={projectId} className="project-card">
              <h3>Project {projectId}</h3>
              <span className="role-badge">Role: {role}</span>
              <a href={`/projects/${projectId}`}>Open Project</a>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};
```

### Conditional Component Rendering

```tsx
// src/components/ProjectActions.tsx
import { useAuth } from '../context/AuthContext';

interface ProjectActionsProps {
  projectId: string;
}

export const ProjectActions: React.FC<ProjectActionsProps> = ({ projectId }) => {
  const { hasProjectRole } = useAuth();

  return (
    <div className="project-actions">
      {/* All members can view */}
      {hasProjectRole(projectId, 'MEMBER') && (
        <button>View Files</button>
      )}

      {/* Deputies and owners can edit */}
      {hasProjectRole(projectId, 'DEPUTY') && (
        <button>Edit Project</button>
      )}

      {/* Only owners can delete */}
      {hasProjectRole(projectId, 'OWNER') && (
        <button className="danger">Delete Project</button>
      )}
    </div>
  );
};
```

## 🔒 Security Best Practices

### Token Storage
- ✅ Tokens stored in memory (not localStorage)
- ✅ Automatic token refresh
- ✅ Secure cookie-based refresh tokens

### Error Handling
- ✅ Automatic logout on token expiry
- ✅ Graceful handling of auth errors
- ✅ No sensitive data in error messages

### Route Protection
- ✅ Protected routes require authentication
- ✅ Role-based route restrictions
- ✅ Redirect to login when unauthorized

## 📖 Related Documentation

- [API Integration Guide](api-integration.md) - Using authenticated API calls
- [Error Handling Guide](error-handling.md) - Handling auth errors
- [OAuth Integration Guide](oauth-integration.md) - Cloud provider OAuth flows
- [RBAC Guide](rbac.md) - Role-based access control implementation

---

*This guide covers Auth0 integration for the MWAP platform. For backend authentication details, refer to the backend documentation.*