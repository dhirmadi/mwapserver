# API Integration Guide

This guide shows React developers how to integrate with the MWAP backend API using modern patterns with Axios and React Query.

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install axios @tanstack/react-query @auth0/auth0-react
```

### 2. API Client Configuration

```tsx
// src/utils/api.ts
import axios from 'axios';
import { getAccessToken } from './auth';

export const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiry - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. React Query Setup

```tsx
// src/utils/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

## 🔐 Authentication Integration

```tsx
// src/utils/auth.ts
import { useAuth0 } from '@auth0/auth0-react';

export const getAccessToken = async (): Promise<string | null> => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  if (!isAuthenticated) return null;
  
  try {
    return await getAccessTokenSilently();
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};
```

## 📡 API Hooks by Domain

### User Hooks

```tsx
// src/hooks/useUser.ts
import { useQuery } from '@tanstack/react-query';
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

export const useUserRoles = () => {
  return useQuery<UserRoles>({
    queryKey: ['user', 'roles'],
    queryFn: async () => {
      const response = await api.get('/users/me/roles');
      return response.data.data;
    },
  });
};
```

### Tenant Hooks

```tsx
// src/hooks/useTenant.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

interface Tenant {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  settings: Record<string, any>;
}

export const useTenant = () => {
  return useQuery<Tenant>({
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
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await api.post('/tenants', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Tenant>) => {
      const response = await api.patch(`/tenants/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
  });
};
```

### Project Hooks

```tsx
// src/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

interface Project {
  _id: string;
  name: string;
  description?: string;
  tenantId: string;
  projectTypeId: string;
  settings: Record<string, any>;
}

export const useProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.data;
    },
  });
};

export const useProject = (id: string) => {
  return useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Project, '_id'>) => {
      const response = await api.post('/projects', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Project>) => {
      const response = await api.patch(`/projects/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
```

### Cloud Provider Hooks

```tsx
// src/hooks/useCloudProviders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

interface CloudProvider {
  _id: string;
  name: string;
  slug: string;
  oauth: {
    authUrl: string;
    tokenUrl: string;
    scope: string[];
  };
}

// Available to all authenticated users
export const useCloudProviders = () => {
  return useQuery<CloudProvider[]>({
    queryKey: ['cloudProviders'],
    queryFn: async () => {
      const response = await api.get('/cloud-providers');
      return response.data.data;
    },
  });
};

// SuperAdmin only
export const useCreateCloudProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<CloudProvider, '_id'>) => {
      const response = await api.post('/cloud-providers', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloudProviders'] });
    },
  });
};
```

### Cloud Integration Hooks

```tsx
// src/hooks/useCloudIntegrations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

interface CloudIntegration {
  _id: string;
  name: string;
  providerId: string;
  tenantId: string;
  status: 'pending' | 'active' | 'error';
  lastSyncAt?: string;
}

export const useCloudIntegrations = (tenantId: string) => {
  return useQuery<CloudIntegration[]>({
    queryKey: ['cloudIntegrations', tenantId],
    queryFn: async () => {
      const response = await api.get(`/tenants/${tenantId}/integrations`);
      return response.data.data;
    },
    enabled: !!tenantId,
  });
};

export const useCreateCloudIntegration = (tenantId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { providerId: string; name: string }) => {
      const response = await api.post(`/tenants/${tenantId}/integrations`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloudIntegrations', tenantId] });
    },
  });
};

export const useRefreshIntegrationToken = (tenantId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await api.post(`/tenants/${tenantId}/integrations/${integrationId}/refresh-token`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloudIntegrations', tenantId] });
    },
  });
};
```

### File Hooks

```tsx
// src/hooks/useFiles.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

interface VirtualFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  providerId: string;
  cloudFileId: string;
  lastModified: string;
}

export const useProjectFiles = (projectId: string, options?: {
  path?: string;
  provider?: string;
  search?: string;
}) => {
  return useQuery<VirtualFile[]>({
    queryKey: ['files', projectId, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.path) params.append('path', options.path);
      if (options?.provider) params.append('provider', options.provider);
      if (options?.search) params.append('search', options.search);
      
      const response = await api.get(`/projects/${projectId}/files?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!projectId,
  });
};
```

## 🎯 Usage Examples

### Component Integration

```tsx
// src/components/ProjectList.tsx
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useUserRoles } from '../hooks/useUser';

export const ProjectList: React.FC = () => {
  const { data: projects, isLoading, error } = useProjects();
  const { data: userRoles } = useUserRoles();
  const createProject = useCreateProject();
  
  const canCreateProject = userRoles?.isTenantOwner || userRoles?.isSuperAdmin;
  
  const handleCreateProject = async (projectData: any) => {
    try {
      await createProject.mutateAsync(projectData);
      // Success handled by React Query cache invalidation
    } catch (error) {
      // Error handling
      console.error('Failed to create project:', error);
    }
  };
  
  if (isLoading) return <div>Loading projects...</div>;
  if (error) return <div>Error loading projects</div>;
  
  return (
    <div>
      <h2>Projects</h2>
      {canCreateProject && (
        <button onClick={() => handleCreateProject(/* data */)}>
          Create Project
        </button>
      )}
      <ul>
        {projects?.map(project => (
          <li key={project._id}>{project.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

### Form with Validation

```tsx
// src/components/CreateTenantForm.tsx
import { useForm } from 'react-hook-form';
import { useCreateTenant } from '../hooks/useTenant';

interface TenantFormData {
  name: string;
  description?: string;
}

export const CreateTenantForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<TenantFormData>();
  const createTenant = useCreateTenant();
  
  const onSubmit = async (data: TenantFormData) => {
    try {
      await createTenant.mutateAsync(data);
      // Navigate to tenant dashboard
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name">Tenant Name</label>
        <input
          id="name"
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && <span>{errors.name.message}</span>}
      </div>
      
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          {...register('description')}
        />
      </div>
      
      <button type="submit" disabled={createTenant.isPending}>
        {createTenant.isPending ? 'Creating...' : 'Create Tenant'}
      </button>
    </form>
  );
};
```

## 🚨 Error Handling

### Global Error Handling

```tsx
// src/hooks/useApiError.ts
import { useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export const useApiError = () => {
  const { loginWithRedirect } = useAuth0();
  
  const handleError = useCallback((error: any) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      loginWithRedirect();
    } else if (error.response?.status === 403) {
      // Insufficient permissions
      alert('You do not have permission to perform this action');
    } else if (error.response?.status >= 500) {
      // Server error
      alert('Server error. Please try again later.');
    } else {
      // Other errors
      alert(error.response?.data?.error?.message || 'An error occurred');
    }
  }, [loginWithRedirect]);
  
  return { handleError };
};
```

### Component Error States

```tsx
// Error handling in components
const { data, isLoading, error, refetch } = useProjects();

if (isLoading) return <LoadingSpinner />;

if (error) {
  return (
    <div className="error-state">
      <p>Failed to load projects</p>
      <button onClick={() => refetch()}>Try Again</button>
    </div>
  );
}
```

## 📖 Related Documentation

- [Authentication Guide](authentication.md) - Auth0 integration details
- [Error Handling Guide](error-handling.md) - Comprehensive error handling patterns
- [OAuth Integration Guide](oauth-integration.md) - Cloud provider OAuth flows
- [Backend API Reference](../04-Backend/API-v3.md) - Complete API endpoint documentation

---

*This guide covers the core patterns for integrating with the MWAP backend API. For advanced patterns and specific use cases, refer to the related documentation.*