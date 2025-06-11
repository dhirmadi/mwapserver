# MWAP Frontend API Integration

This document outlines how the MWAP frontend integrates with the backend API.

## Overview

The MWAP frontend communicates with the backend API using a combination of Axios for HTTP requests and React Query for state management. This approach provides a clean, type-safe way to interact with the API while handling caching, loading states, and error handling.

## API Client Setup

### Base API Client

The base API client is configured using Axios:

```tsx
// src/utils/api.ts
import axios from 'axios';
import { getAccessToken } from './auth';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors (401, 403, 500, etc.)
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Redirect to login or refresh token
      } else if (status === 403) {
        // Handle forbidden access
      } else if (status >= 500) {
        // Handle server errors
      }
    } else if (error.request) {
      // Handle network errors
    }
    
    return Promise.reject(error);
  }
);
```

### React Query Setup

React Query is configured to work with the API client:

```tsx
// src/utils/queryClient.ts
import { QueryClient } from 'react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

## Custom Hooks for API Calls

API calls are encapsulated in custom hooks organized by domain:

### Tenant Hooks

```tsx
// src/hooks/useTenant.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { Tenant } from '../types/tenant';

export const useTenant = () => {
  return useQuery<Tenant, Error>('tenant', async () => {
    const response = await api.get('/tenants/me');
    return response.data;
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Tenant, Error, Partial<Tenant>>(
    async (updatedTenant) => {
      const response = await api.patch(`/tenants/${updatedTenant._id}`, updatedTenant);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenant');
      },
    }
  );
};
```

### Project Hooks

```tsx
// src/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { Project } from '../types/project';

export const useProjects = () => {
  return useQuery<Project[], Error>('projects', async () => {
    const response = await api.get('/projects');
    return response.data;
  });
};

export const useProject = (id: string) => {
  return useQuery<Project, Error>(['project', id], async () => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  }, {
    enabled: !!id, // Only run if id is provided
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Project, Error, Omit<Project, '_id'>>(
    async (newProject) => {
      const response = await api.post('/projects', newProject);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
      },
    }
  );
};

export const useUpdateProject = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<Project, Error, Partial<Project>>(
    async (updatedProject) => {
      const response = await api.patch(`/projects/${id}`, updatedProject);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        queryClient.invalidateQueries(['project', id]);
      },
    }
  );
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>(
    async (id) => {
      await api.delete(`/projects/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
      },
    }
  );
};
```

### Project Members Hooks

```tsx
// src/hooks/useProjectMembers.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { ProjectMember } from '../types/project';

export const useProjectMembers = (projectId: string) => {
  return useQuery<ProjectMember[], Error>(
    ['projectMembers', projectId], 
    async () => {
      const response = await api.get(`/projects/${projectId}/members`);
      return response.data;
    },
    {
      enabled: !!projectId, // Only run if projectId is provided
    }
  );
};

export const useAddProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { userId: string, role: string }>(
    async ({ userId, role }) => {
      await api.post(`/projects/${projectId}/members`, { userId, role });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projectMembers', projectId]);
      },
    }
  );
};

export const useUpdateProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { userId: string, role: string }>(
    async ({ userId, role }) => {
      await api.patch(`/projects/${projectId}/members/${userId}`, { role });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projectMembers', projectId]);
      },
    }
  );
};

export const useRemoveProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>(
    async (userId) => {
      await api.delete(`/projects/${projectId}/members/${userId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projectMembers', projectId]);
      },
    }
  );
};
```

### Cloud Provider Hooks

```tsx
// src/hooks/useCloudProviders.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { CloudProvider } from '../types/cloudProvider';

export const useCloudProviders = () => {
  return useQuery<CloudProvider[], Error>('cloudProviders', async () => {
    const response = await api.get('/cloud-providers');
    return response.data;
  });
};

export const useCloudProvider = (id: string) => {
  return useQuery<CloudProvider, Error>(
    ['cloudProvider', id], 
    async () => {
      const response = await api.get(`/cloud-providers/${id}`);
      return response.data;
    },
    {
      enabled: !!id, // Only run if id is provided
    }
  );
};

// SuperAdmin only
export const useCreateCloudProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation<CloudProvider, Error, Omit<CloudProvider, '_id'>>(
    async (newProvider) => {
      const response = await api.post('/cloud-providers', newProvider);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cloudProviders');
      },
    }
  );
};

// SuperAdmin only
export const useUpdateCloudProvider = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<CloudProvider, Error, Partial<CloudProvider>>(
    async (updatedProvider) => {
      const response = await api.patch(`/cloud-providers/${id}`, updatedProvider);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cloudProviders');
        queryClient.invalidateQueries(['cloudProvider', id]);
      },
    }
  );
};

// SuperAdmin only
export const useDeleteCloudProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>(
    async (id) => {
      await api.delete(`/cloud-providers/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cloudProviders');
      },
    }
  );
};
```

### Cloud Provider Integration Hooks

```tsx
// src/hooks/useCloudIntegrations.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { CloudProviderIntegration } from '../types/cloudProvider';

export const useCloudIntegrations = (tenantId: string) => {
  return useQuery<CloudProviderIntegration[], Error>(
    ['cloudIntegrations', tenantId], 
    async () => {
      const response = await api.get(`/tenants/${tenantId}/integrations`);
      return response.data;
    },
    {
      enabled: !!tenantId, // Only run if tenantId is provided
    }
  );
};

export const useCreateCloudIntegration = (tenantId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<CloudProviderIntegration, Error, Omit<CloudProviderIntegration, '_id'>>(
    async (newIntegration) => {
      const response = await api.post(`/tenants/${tenantId}/integrations`, newIntegration);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['cloudIntegrations', tenantId]);
      },
    }
  );
};

export const useDeleteCloudIntegration = (tenantId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>(
    async (integrationId) => {
      await api.delete(`/tenants/${tenantId}/integrations/${integrationId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['cloudIntegrations', tenantId]);
      },
    }
  );
};
```

### Project Type Hooks

```tsx
// src/hooks/useProjectTypes.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { ProjectType } from '../types/projectType';

export const useProjectTypes = () => {
  return useQuery<ProjectType[], Error>('projectTypes', async () => {
    const response = await api.get('/project-types');
    return response.data;
  });
};

export const useProjectType = (id: string) => {
  return useQuery<ProjectType, Error>(
    ['projectType', id], 
    async () => {
      const response = await api.get(`/project-types/${id}`);
      return response.data;
    },
    {
      enabled: !!id, // Only run if id is provided
    }
  );
};

// SuperAdmin only
export const useCreateProjectType = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ProjectType, Error, Omit<ProjectType, '_id'>>(
    async (newType) => {
      const response = await api.post('/project-types', newType);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projectTypes');
      },
    }
  );
};

// SuperAdmin only
export const useUpdateProjectType = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<ProjectType, Error, Partial<ProjectType>>(
    async (updatedType) => {
      const response = await api.patch(`/project-types/${id}`, updatedType);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projectTypes');
        queryClient.invalidateQueries(['projectType', id]);
      },
    }
  );
};

// SuperAdmin only
export const useDeleteProjectType = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>(
    async (id) => {
      await api.delete(`/project-types/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projectTypes');
      },
    }
  );
};
```

### File Hooks

```tsx
// src/hooks/useFiles.ts
import { useQuery } from 'react-query';
import { api } from '../utils/api';
import { File } from '../types/file';

export const useFiles = (
  projectId: string, 
  options?: { 
    folder?: string; 
    recursive?: boolean; 
    fileTypes?: string[]; 
    limit?: number; 
    page?: number;
  }
) => {
  return useQuery<File[], Error>(
    ['files', projectId, options], 
    async () => {
      const params = new URLSearchParams();
      
      if (options?.folder) params.append('folder', options.folder);
      if (options?.recursive) params.append('recursive', 'true');
      if (options?.fileTypes) params.append('fileTypes', options.fileTypes.join(','));
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.page) params.append('page', options.page.toString());
      
      const response = await api.get(`/projects/${projectId}/files?${params.toString()}`);
      return response.data;
    },
    {
      enabled: !!projectId, // Only run if projectId is provided
    }
  );
};
```

## Using API Hooks in Components

These hooks are used in components to fetch and manipulate data:

```tsx
// Example: Project List Component
import React from 'react';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProjectList: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const { data: projects, isLoading, error, refetch } = useProjects();
  const createProject = useCreateProject();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  const handleCreateProject = async (newProject) => {
    try {
      await createProject.mutateAsync(newProject);
      setCreateModalOpen(false);
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setCreateModalOpen(true)}
        >
          Create Project
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map(project => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
      
      <CreateProjectModal 
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        isLoading={createProject.isLoading}
      />
    </div>
  );
};
```

## Error Handling

API errors are handled at multiple levels:

1. **Global level**: Axios interceptors handle common errors (401, 403, 500, etc.)
2. **Query level**: React Query provides error states for each query
3. **Component level**: Components display appropriate error messages

Example of component-level error handling:

```tsx
import React from 'react';
import { useProjects } from '../hooks/useProjects';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProjectList: React.FC = () => {
  const { data: projects, isLoading, error, refetch } = useProjects();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        message="Failed to load projects"
        onRetry={refetch}
      />
    );
  }
  
  // Render projects...
};
```

## Optimistic Updates

For a better user experience, optimistic updates are used for mutations:

```tsx
export const useUpdateProject = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<Project, Error, Partial<Project>>(
    async (updatedProject) => {
      const response = await api.patch(`/projects/${id}`, updatedProject);
      return response.data;
    },
    {
      // Optimistically update the cache
      onMutate: async (updatedProject) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(['project', id]);
        
        // Snapshot the previous value
        const previousProject = queryClient.getQueryData<Project>(['project', id]);
        
        // Optimistically update to the new value
        if (previousProject) {
          queryClient.setQueryData<Project>(['project', id], {
            ...previousProject,
            ...updatedProject,
          });
        }
        
        return { previousProject };
      },
      // If the mutation fails, use the context returned from onMutate to roll back
      onError: (err, newProject, context) => {
        if (context?.previousProject) {
          queryClient.setQueryData<Project>(['project', id], context.previousProject);
        }
      },
      // Always refetch after error or success
      onSettled: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.invalidateQueries('projects');
      },
    }
  );
};
```

## Pagination and Filtering

For endpoints that support pagination and filtering:

```tsx
export const useProjects = (
  options?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc';
  }
) => {
  return useQuery<{ data: Project[]; total: number; page: number; limit: number }, Error>(
    ['projects', options], 
    async () => {
      const params = new URLSearchParams();
      
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.search) params.append('search', options.search);
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
      
      const response = await api.get(`/projects?${params.toString()}`);
      return response.data;
    },
    {
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );
};
```

## Conclusion

This API integration approach provides a clean, type-safe way to interact with the backend API while handling caching, loading states, and error handling. By encapsulating API calls in custom hooks, components can focus on rendering and user interaction, leading to a more maintainable and scalable codebase.