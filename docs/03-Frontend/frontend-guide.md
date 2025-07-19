# MWAP Frontend Integration Guide

This comprehensive guide covers everything React developers need to integrate with the MWAP backend API, including authentication, API calls, role-based access control, OAuth flows, and error handling.

## 🎯 Overview

This guide is specifically for **React developers** integrating with the MWAP backend. It covers:
- Complete Auth0 authentication setup
- API integration patterns with React Query
- Role-based access control implementation
- Cloud provider OAuth integration
- Comprehensive error handling
- TypeScript best practices

## 🚀 Quick Setup

### Prerequisites
- React 18+ application
- TypeScript (recommended)
- Node.js environment

### Install Dependencies
```bash
npm install @auth0/auth0-react axios @tanstack/react-query react-hook-form zod
```

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_AUTH0_DOMAIN=your-auth0-domain
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=your-api-audience
```

## 🔐 Authentication Setup

### 1. Auth0 Provider Configuration

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
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Your routes */}
          </Routes>
        </Router>
      </QueryClientProvider>
    </Auth0Provider>
  );
}
```

### 2. Custom Auth Context with MWAP Roles

```tsx
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '../utils/api';

interface UserRoles {
  isSuperAdmin: boolean;
  isTenantOwner: boolean;
  tenantId: string | null;
  projectRoles: Array<{
    projectId: string;
    role: 'OWNER' | 'DEPUTY' | 'MEMBER';
  }>;
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
  const [isLoading, setIsLoading] = useState(true);

  const getAccessToken = async (): Promise<string | null> => {
    if (!isAuthenticated) return null;
    
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  };

  const fetchUserRoles = async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      const response = await api.get('/users/me/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRoles(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !auth0Loading) {
      fetchUserRoles().finally(() => setIsLoading(false));
    } else {
      setIsLoading(auth0Loading);
    }
  }, [isAuthenticated, auth0Loading]);

  const hasProjectRole = (projectId: string, requiredRole: 'OWNER' | 'DEPUTY' | 'MEMBER'): boolean => {
    if (userRoles?.isSuperAdmin) return true;

    const projectRole = userRoles?.projectRoles.find(pr => pr.projectId === projectId);
    if (!projectRole) return false;

    const roleHierarchy = { OWNER: 3, DEPUTY: 2, MEMBER: 1 };
    const userLevel = roleHierarchy[projectRole.role];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  };

  const login = () => loginWithRedirect();
  const logout = () => auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      error,
      login,
      logout,
      getAccessToken,
      userRoles,
      hasProjectRole,
    }}>
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

## 📡 API Integration

### 1. API Client Setup

```tsx
// src/utils/api.ts
import axios, { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const { getAccessTokenSilently } = useAuth0();
  
  try {
    const token = await getAccessTokenSilently();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Failed to get access token for request:', error);
  }
  
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Network error
    if (!error.response) {
      throw new AppError(
        'NETWORK_ERROR',
        'Network error or server unavailable',
        0,
        { originalError: error.message }
      );
    }

    const { status, data } = error.response;
    
    // API error response
    if (data && typeof data === 'object' && 'error' in data) {
      const apiError = data.error as any;
      throw new AppError(
        apiError.code || 'API_ERROR',
        apiError.message || 'An error occurred',
        status,
        apiError.details
      );
    }

    // Generic HTTP error
    throw new AppError(
      `HTTP_${status}`,
      `HTTP ${status} error`,
      status
    );
  }
);
```

### 2. React Query Setup

```tsx
// src/utils/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error instanceof AppError && error.statusCode === 401) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});
```

### 3. API Hooks by Domain

#### User Hooks
```tsx
// src/hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export const useUserRoles = () => {
  return useQuery({
    queryKey: ['user', 'roles'],
    queryFn: async () => {
      const response = await api.get('/users/me/roles');
      return response.data.data;
    },
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data.data;
    },
  });
};
```

#### Tenant Hooks
```tsx
// src/hooks/useTenant.ts
export const useTenant = () => {
  return useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const response = await api.get('/tenants/me');
      return response.data.data;
    },
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTenantData) => {
      const response = await api.post('/tenants', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
  });
};
```

#### Project Hooks
```tsx
// src/hooks/useProjects.ts
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.data;
    },
  });
};

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.data;
    },
    enabled: !!projectId,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const response = await api.post('/projects', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
```

## 🛡️ Role-Based Access Control

### 1. Role Checking Hook

```tsx
// src/hooks/useRoleCheck.ts
import { useAuth } from '../context/AuthContext';

export const useRoleCheck = () => {
  const { userRoles } = useAuth();

  const isSuperAdmin = userRoles?.isSuperAdmin || false;
  const isTenantOwner = userRoles?.isTenantOwner || false;

  const hasProjectRole = (projectId: string, requiredRole: 'OWNER' | 'DEPUTY' | 'MEMBER'): boolean => {
    if (isSuperAdmin) return true;

    const projectRole = userRoles?.projectRoles.find(pr => pr.projectId === projectId);
    if (!projectRole) return false;

    const roleHierarchy = { OWNER: 3, DEPUTY: 2, MEMBER: 1 };
    const userLevel = roleHierarchy[projectRole.role];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  };

  const canCreateProject = isSuperAdmin || isTenantOwner;
  const canManageCloudProviders = isSuperAdmin;
  const canManageProjectTypes = isSuperAdmin;

  return {
    isSuperAdmin,
    isTenantOwner,
    hasProjectRole,
    canCreateProject,
    canManageCloudProviders,
    canManageProjectTypes,
  };
};
```

### 2. Route Protection

```tsx
// src/components/RoleRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { useAuth } from '../context/AuthContext';

interface RoleRouteProps {
  requiredRole?: 'superadmin' | 'tenant-owner';
  projectId?: string;
  projectRole?: 'OWNER' | 'DEPUTY' | 'MEMBER';
  fallback?: string;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  requiredRole,
  projectId,
  projectRole,
  fallback = '/unauthorized',
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isSuperAdmin, isTenantOwner, hasProjectRole } = useRoleCheck();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check global roles
  if (requiredRole === 'superadmin' && !isSuperAdmin) {
    return <Navigate to={fallback} />;
  }

  if (requiredRole === 'tenant-owner' && !isTenantOwner && !isSuperAdmin) {
    return <Navigate to={fallback} />;
  }

  // Check project roles
  if (projectId && projectRole && !hasProjectRole(projectId, projectRole)) {
    return <Navigate to={fallback} />;
  }

  return <Outlet />;
};
```

### 3. Conditional Components

```tsx
// src/components/ConditionalRender.tsx
interface ConditionalProps {
  role?: 'superadmin' | 'tenant-owner';
  projectId?: string;
  projectRole?: 'OWNER' | 'DEPUTY' | 'MEMBER';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalProps> = ({
  role,
  projectId,
  projectRole,
  fallback = null,
  children,
}) => {
  const { isSuperAdmin, isTenantOwner, hasProjectRole } = useRoleCheck();

  let hasAccess = true;

  if (role === 'superadmin') {
    hasAccess = isSuperAdmin;
  } else if (role === 'tenant-owner') {
    hasAccess = isTenantOwner || isSuperAdmin;
  }

  if (projectId && projectRole) {
    hasAccess = hasAccess && hasProjectRole(projectId, projectRole);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
```

## 🔗 OAuth Integration

### 1. Cloud Provider Integration

```tsx
// src/hooks/useCloudProviders.ts
export const useCloudProviders = () => {
  return useQuery({
    queryKey: ['cloud-providers'],
    queryFn: async () => {
      const response = await api.get('/cloud-providers');
      return response.data.data;
    },
  });
};

export const useCloudIntegrations = (tenantId: string) => {
  return useQuery({
    queryKey: ['tenants', tenantId, 'integrations'],
    queryFn: async () => {
      const response = await api.get(`/tenants/${tenantId}/integrations`);
      return response.data.data;
    },
    enabled: !!tenantId,
  });
};
```

### 2. OAuth Flow Component

```tsx
// src/components/OAuthIntegration.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface OAuthIntegrationProps {
  providerId: string;
  providerName: string;
  tenantId: string;
}

export const OAuthIntegration: React.FC<OAuthIntegrationProps> = ({
  providerId,
  providerName,
  tenantId,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  const createIntegration = useMutation({
    mutationFn: async (data: { providerId: string; clientId: string; clientSecret: string }) => {
      const response = await api.post(`/tenants/${tenantId}/integrations`, data);
      return response.data.data;
    },
    onSuccess: (integration) => {
      // Redirect to OAuth provider
      window.location.href = integration.authUrl;
    },
    onError: (error) => {
      console.error('Failed to create integration:', error);
      setIsConnecting(false);
    },
  });

  const handleConnect = () => {
    setIsConnecting(true);
    
    // In a real app, you'd get these from a form
    createIntegration.mutate({
      providerId,
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    });
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{providerName}</h3>
      <p className="text-gray-600 text-sm mb-4">
        Connect your {providerName} account to access files
      </p>
      
      <button
        onClick={handleConnect}
        disabled={isConnecting || createIntegration.isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isConnecting || createIntegration.isPending ? 'Connecting...' : `Connect ${providerName}`}
      </button>
    </div>
  );
};
```

### 3. OAuth Callback Handler

```tsx
// src/pages/OAuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const handleCallback = useMutation({
    mutationFn: async (params: { code: string; state?: string }) => {
      const response = await api.post('/oauth/callback', params);
      return response.data.data;
    },
    onSuccess: () => {
      navigate('/integrations', { 
        state: { message: 'Integration connected successfully!' }
      });
    },
    onError: (error) => {
      console.error('OAuth callback failed:', error);
      navigate('/integrations', { 
        state: { error: 'Failed to connect integration' }
      });
    },
  });

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      navigate('/integrations', { 
        state: { error: 'Integration was cancelled or failed' }
      });
      return;
    }

    if (code) {
      handleCallback.mutate({ code, state: state || undefined });
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Completing integration...</p>
      </div>
    </div>
  );
};
```

## 🚨 Error Handling

### 1. Error Types and Codes

```typescript
// src/types/errors.ts
export const ERROR_CODES = {
  // Authentication
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  
  // Authorization
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  TENANT_ACCESS_DENIED: 'TENANT_ACCESS_DENIED',
  PROJECT_ACCESS_DENIED: 'PROJECT_ACCESS_DENIED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // External Services
  OAUTH_ERROR: 'OAUTH_ERROR',
  CLOUD_PROVIDER_ERROR: 'CLOUD_PROVIDER_ERROR',
  
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;
```

### 2. Error Handling Components

```tsx
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Report to error tracking service
    // reportError(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Error Display Components

```tsx
// src/components/ErrorDisplay.tsx
import { AppError } from '../utils/api';

interface ErrorDisplayProps {
  error: AppError | Error;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  className = '',
}) => {
  const isAppError = error instanceof AppError;
  
  const getErrorMessage = () => {
    if (isAppError) {
      switch (error.code) {
        case 'AUTH_TOKEN_EXPIRED':
          return 'Your session has expired. Please log in again.';
        case 'INSUFFICIENT_PERMISSIONS':
          return 'You don\'t have permission to perform this action.';
        case 'NETWORK_ERROR':
          return 'Network error. Please check your connection and try again.';
        case 'VALIDATION_ERROR':
          return 'Please check your input and try again.';
        default:
          return error.message;
      }
    }
    
    return 'An unexpected error occurred.';
  };

  const getErrorTitle = () => {
    if (isAppError) {
      switch (error.code) {
        case 'AUTH_TOKEN_EXPIRED':
          return 'Session Expired';
        case 'INSUFFICIENT_PERMISSIONS':
          return 'Permission Denied';
        case 'NETWORK_ERROR':
          return 'Connection Error';
        case 'VALIDATION_ERROR':
          return 'Invalid Input';
        default:
          return 'Error';
      }
    }
    
    return 'Error';
  };

  return (
    <div className={`border border-red-200 bg-red-50 rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="text-red-400 text-xl mr-3">⚠️</div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {getErrorTitle()}
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {getErrorMessage()}
          </p>
          {isAppError && error.details && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">
                Technical Details
              </summary>
              <pre className="mt-1 text-xs text-red-600 overflow-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

## 🎨 Usage Examples

### Complete Component Example

```tsx
// src/components/ProjectList.tsx
import React from 'react';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { ConditionalRender } from './ConditionalRender';
import { ErrorDisplay } from './ErrorDisplay';

export const ProjectList: React.FC = () => {
  const { data: projects, isLoading, error, refetch } = useProjects();
  const createProject = useCreateProject();
  const { canCreateProject } = useRoleCheck();

  const handleCreateProject = () => {
    createProject.mutate({
      name: 'New Project',
      description: 'A new project',
      projectTypeId: 'some-type-id',
    });
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading projects...</div>;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projects</h1>
        
        <ConditionalRender role="tenant-owner">
          <button
            onClick={handleCreateProject}
            disabled={createProject.isPending}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {createProject.isPending ? 'Creating...' : 'Create Project'}
          </button>
        </ConditionalRender>
      </div>

      <div className="grid gap-4">
        {projects?.map(project => (
          <div key={project._id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-gray-600">{project.description}</p>
            
            <ConditionalRender 
              projectId={project._id} 
              projectRole="DEPUTY"
              fallback={<span className="text-sm text-gray-500">View only</span>}
            >
              <button className="mt-2 text-blue-600 hover:text-blue-800">
                Edit Project
              </button>
            </ConditionalRender>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 📋 Best Practices

### 1. Type Safety
- Use TypeScript with strict mode
- Define interfaces for all API responses
- Use Zod for runtime validation
- Type your React Query hooks

### 2. Error Handling
- Always handle loading and error states
- Provide meaningful error messages
- Use retry mechanisms appropriately
- Log errors for debugging

### 3. Performance
- Use React Query for server state
- Implement proper caching strategies
- Use optimistic updates for mutations
- Implement loading states and skeletons

### 4. Security
- Store tokens securely (memory, not localStorage)
- Validate permissions on both client and server
- Handle token expiration gracefully
- Use HTTPS in production

### 5. User Experience
- Provide loading indicators
- Show progress for long operations
- Implement proper error boundaries
- Use optimistic updates when possible

## 📖 API Reference

### Standard Response Format
```typescript
// Success Response
{
  success: true;
  data: T;
  message?: string;
}

// Error Response  
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Common Endpoints
- `GET /api/v1/users/me/roles` - Get user roles
- `GET /api/v1/tenants/me` - Get user's tenant
- `GET /api/v1/projects` - Get projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/cloud-providers` - Get available providers
- `POST /api/v1/tenants/:id/integrations` - Create cloud integration

---
*This comprehensive guide covers all aspects of integrating a React frontend with the MWAP backend API. For backend-specific documentation, refer to the [Backend API Reference](../04-Backend/API-v3.md).* 