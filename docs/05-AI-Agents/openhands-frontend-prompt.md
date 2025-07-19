# MWAP Frontend Development Prompt for OpenHands

## Overview

This document serves as a comprehensive prompt for OpenHands with Anthropic Claude to build a React frontend for the MWAP (Modular Web Application Platform) API. The frontend should provide a modern, responsive, and secure user interface that leverages all the functionality provided by the existing backend API.

## Project Context

MWAP is a fullstack, secure, scalable SaaS framework designed for building dynamic, multi-tenant web applications with robust security and flexibility. The backend is built with Node.js, Express, and MongoDB, with Auth0 for authentication. The frontend should complement this architecture with a modern React application that follows best practices and provides a seamless user experience.

## Technical Requirements

### Stack

- **Framework**: React 18+ with TypeScript
- **State Management**: React Query for server state, Context API or Redux Toolkit for client state
- **Styling**: Tailwind CSS with a component library (Mantine or Chakra UI recommended)
- **Authentication**: Auth0 React SDK with PKCE flow
- **API Integration**: Axios or React Query's built-in fetching
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router v6+
- **Testing**: Vitest with React Testing Library

### Architecture

- **Feature-based organization**: Mirror the backend's domain-driven design
- **Atomic design principles**: Build reusable components from atoms to templates
- **Custom hooks**: Encapsulate business logic and API calls
- **Type safety**: Strict TypeScript throughout the application
- **Responsive design**: Mobile-first approach with responsive layouts

## User Roles and Permissions

The frontend must support three distinct user roles, each with different permissions and access levels:

### 1. SuperAdmin

SuperAdmins have platform-level access and can manage all aspects of the system:

- Manage all tenants (view, archive, unarchive)
- Manage all projects (view, archive, unarchive)
- Full CRUD operations for ProjectTypes
- Full CRUD operations for CloudProviders
- View system-wide analytics and metrics

### 2. Tenant Owner

Tenant Owners have full control over their tenant and associated projects:

- Manage their tenant (view, edit)
- Create and manage projects within their tenant
- Manage cloud provider integrations for their tenant
- Invite and manage project members
- View tenant-level analytics

### 3. Project Member

Project Members have limited access based on their role within a project:

- **Project Owner**: Full control over a specific project
- **Project Deputy**: Can edit project details and manage members
- **Project Member**: Can view and interact with project resources

## UI/UX Requirements

- **Clean, modern interface**: Professional look and feel with consistent branding
- **Responsive design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive navigation**: Clear information architecture with logical flow
- **Progressive disclosure**: Show complexity only when needed
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Fast load times and optimized rendering
- **Error handling**: Clear error messages and graceful degradation

## Core Features by Domain

### Authentication & User Management

- Auth0 integration with login/logout functionality
- User profile management
- Role-based access control
- Session management and token refresh

### Tenant Management

- Tenant dashboard with key metrics
- Tenant settings and configuration
- User invitation and management within tenant
- Tenant archiving/unarchiving (SuperAdmin only)

### Project Management

- Project creation with ProjectType selection
- Project dashboard with status and metrics
- Project settings and configuration
- Member management with role assignment
- Project archiving/unarchiving

### Cloud Provider Integration

- Connect to supported cloud providers (Google Drive, Dropbox, etc.)
- OAuth flow for authorization
- View and manage cloud provider connections
- Select cloud storage locations for projects

### File Management

- Browse files from connected cloud providers
- View file metadata and details
- Perform operations based on ProjectType
- Upload and download functionality where applicable

### ProjectType Configuration

- View available ProjectTypes
- Configure ProjectType-specific settings
- ProjectType CRUD operations (SuperAdmin only)

## API Integration

The frontend should make full use of the existing API endpoints as documented in the API contract. Here are the key endpoints by domain:

### Tenants

```
GET /api/v1/tenants/me
PATCH /api/v1/tenants/:id
POST /api/v1/tenants
```

### Projects

```
GET /api/v1/projects
GET /api/v1/projects/:id
POST /api/v1/projects
PATCH /api/v1/projects/:id
DELETE /api/v1/projects/:id
```

### Project Members

```
GET /api/v1/projects/:id/members
POST /api/v1/projects/:id/members
PATCH /api/v1/projects/:id/members/:userId
DELETE /api/v1/projects/:id/members/:userId
```

### Cloud Providers

```
GET /api/v1/cloud-providers
POST /api/v1/cloud-providers
PATCH /api/v1/cloud-providers/:id
DELETE /api/v1/cloud-providers/:id
```

### Cloud Provider Integrations

```
GET /api/v1/tenants/:id/integrations
POST /api/v1/tenants/:id/integrations
DELETE /api/v1/tenants/:id/integrations/:integrationId
```

### Project Types

```
GET /api/v1/project-types
POST /api/v1/project-types
PATCH /api/v1/project-types/:id
DELETE /api/v1/project-types/:id
```

### Files (Virtual)

```
GET /api/v1/projects/:id/files
```

## Component Structure

The frontend should follow a modular component structure:

```
/src
  /components
    /common          # Shared components (Button, Card, etc.)
    /layout          # Layout components (Sidebar, Header, etc.)
    /features        # Feature-specific components
      /auth          # Authentication components
      /tenants       # Tenant management components
      /projects      # Project management components
      /files         # File management components
      /cloud         # Cloud provider components
  /hooks             # Custom hooks for API calls and business logic
  /context           # React Context providers
  /utils             # Utility functions
  /types             # TypeScript type definitions
  /pages             # Page components
  /routes            # Route definitions
  /styles            # Global styles and theme configuration
  /assets            # Static assets (images, icons, etc.)
```

## Page Structure

The application should include the following pages:

### Public Pages

- Login/Signup
- Landing page
- About/Documentation

### Authenticated Pages

#### Common

- Dashboard (role-specific)
- User Profile
- Settings

#### SuperAdmin

- Tenant Management
- Project Type Management
- Cloud Provider Management
- System Analytics

#### Tenant Owner

- Tenant Dashboard
- Project Management
- Cloud Integration Management
- Tenant Settings

#### Project Member

- Project Dashboard
- Project Files
- Project Settings (based on role)

## Authentication Flow

1. User navigates to the application
2. If not authenticated, redirect to Auth0 login page
3. After successful authentication, Auth0 redirects back to the application
4. Application verifies the token and sets up the authenticated session
5. User is redirected to their role-specific dashboard

## Role-Based UI Adaptation

The UI should adapt based on the user's role:

- **Navigation**: Show only relevant menu items
- **Actions**: Enable/disable buttons based on permissions
- **Content**: Filter displayed information based on access level
- **Forms**: Show/hide fields based on role

## Error Handling

- Implement global error boundary
- Provide clear error messages for API failures
- Handle network errors gracefully
- Implement retry mechanisms where appropriate
- Log errors for debugging

## Security Considerations

- Implement proper CSRF protection
- Use HttpOnly cookies for token storage
- Implement proper input validation
- Sanitize all user inputs
- Follow OWASP security best practices
- Implement proper authorization checks on the client side

## Performance Optimization

- Implement code splitting for route-based components
- Use React.memo and useMemo for expensive computations
- Implement virtualization for long lists
- Optimize bundle size with tree shaking
- Implement proper caching strategies
- Use React Suspense for loading states

## Accessibility

- Ensure proper keyboard navigation
- Implement ARIA attributes
- Ensure sufficient color contrast
- Provide text alternatives for non-text content
- Ensure the application is screen reader friendly

## Internationalization

- Implement i18n support using react-i18next
- Support English as the default language
- Design with language expansion in mind

## Development Process

1. Set up the project with Create React App or Vite
2. Implement the authentication flow with Auth0
3. Create the core layout and navigation components
4. Implement the dashboard for each user role
5. Build feature-specific components and pages
6. Integrate with the API endpoints
7. Implement error handling and loading states
8. Add tests for critical components and functionality
9. Optimize performance and accessibility
10. Conduct user testing and gather feedback

## Example Component: TenantDashboard

```tsx
import React from 'react';
import { useQuery } from 'react-query';
import { useTenant } from '../hooks/useTenant';
import { useProjects } from '../hooks/useProjects';
import { Card, Grid, Text, Title, Button, Group } from '@mantine/core';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const TenantDashboard: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const { tenant, isLoading: tenantLoading, error: tenantError } = useTenant();
  const { 
    projects, 
    isLoading: projectsLoading, 
    error: projectsError,
    refetch: refetchProjects
  } = useProjects();

  if (tenantLoading || projectsLoading) {
    return <LoadingSpinner />;
  }

  if (tenantError || projectsError) {
    return <ErrorDisplay error={tenantError || projectsError} />;
  }

  return (
    <div>
      <Group position="apart" mb="xl">
        <div>
          <Title order={2}>{tenant.name} Dashboard</Title>
          <Text color="dimmed">Manage your projects and integrations</Text>
        </div>
        <Button 
          onClick={() => setCreateModalOpen(true)}
        >
          Create New Project
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={12}>
          <Card p="md" radius="md" withBorder>
            <Title order={4} mb="md">Tenant Overview</Title>
            <Text>Owner: {tenant.ownerName}</Text>
            <Text>Created: {new Date(tenant.createdAt).toLocaleDateString()}</Text>
            <Text>Projects: {projects.length}</Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Title order={3} mt="xl" mb="md">Your Projects</Title>
      
      {projects.length === 0 ? (
        <Text color="dimmed">No projects yet. Create your first project to get started.</Text>
      ) : (
        <Grid>
          {projects.map(project => (
            <Grid.Col key={project._id} xs={12} sm={6} md={4} lg={3}>
              <ProjectCard project={project} />
            </Grid.Col>
          ))}
        </Grid>
      )}

      <CreateProjectModal 
        open={createModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          refetchProjects();
        }}
      />
    </div>
  );
};
```

## Example Hook: useProjects

```tsx
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { Project } from '../types/project';

export const useProjects = () => {
  return useQuery<Project[], Error>('projects', async () => {
    const response = await api.get('/api/v1/projects');
    return response.data;
  });
};

export const useProject = (id: string) => {
  return useQuery<Project, Error>(['project', id], async () => {
    const response = await api.get(`/api/v1/projects/${id}`);
    return response.data;
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Project, Error, Omit<Project, '_id'>>(
    async (newProject) => {
      const response = await api.post('/api/v1/projects', newProject);
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
      const response = await api.patch(`/api/v1/projects/${id}`, updatedProject);
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
      await api.delete(`/api/v1/projects/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
      },
    }
  );
};
```

## Example: Role-Based Navigation Component

```tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, Stack, Text, ThemeIcon } from '@mantine/core';
import { 
  IconDashboard, 
  IconUsers, 
  IconFolder, 
  IconCloud, 
  IconSettings,
  IconPuzzle,
  IconBuildingSkyscraper
} from '@tabler/icons-react';

export const Navigation: React.FC = () => {
  const { user, isSuperAdmin, isTenantOwner } = useAuth();
  
  // Common navigation items for all authenticated users
  const commonNavItems = [
    { 
      label: 'Dashboard', 
      icon: <IconDashboard size={20} />, 
      to: '/dashboard' 
    },
    { 
      label: 'Profile', 
      icon: <IconUsers size={20} />, 
      to: '/profile' 
    },
  ];
  
  // Navigation items for tenant owners
  const tenantOwnerNavItems = [
    { 
      label: 'Projects', 
      icon: <IconFolder size={20} />, 
      to: '/projects' 
    },
    { 
      label: 'Cloud Integrations', 
      icon: <IconCloud size={20} />, 
      to: '/integrations' 
    },
    { 
      label: 'Tenant Settings', 
      icon: <IconSettings size={20} />, 
      to: '/tenant-settings' 
    },
  ];
  
  // Navigation items for super admins
  const superAdminNavItems = [
    { 
      label: 'Tenants', 
      icon: <IconBuildingSkyscraper size={20} />, 
      to: '/admin/tenants' 
    },
    { 
      label: 'Project Types', 
      icon: <IconPuzzle size={20} />, 
      to: '/admin/project-types' 
    },
    { 
      label: 'Cloud Providers', 
      icon: <IconCloud size={20} />, 
      to: '/admin/cloud-providers' 
    },
    { 
      label: 'System Settings', 
      icon: <IconSettings size={20} />, 
      to: '/admin/settings' 
    },
  ];
  
  // Combine navigation items based on user role
  const navItems = [
    ...commonNavItems,
    ...(isTenantOwner ? tenantOwnerNavItems : []),
    ...(isSuperAdmin ? superAdminNavItems : []),
  ];
  
  return (
    <Stack spacing="xs">
      {navItems.map((item) => (
        <NavLink 
          key={item.to} 
          to={item.to}
          style={({ isActive }) => ({
            backgroundColor: isActive ? 'var(--mantine-color-blue-light)' : 'transparent',
            borderRadius: '4px',
            textDecoration: 'none',
            color: 'inherit',
          })}
        >
          {({ isActive }) => (
            <Box 
              p="xs" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <ThemeIcon 
                variant={isActive ? 'filled' : 'light'} 
                color={isActive ? 'blue' : 'gray'}
                size="md" 
                mr="sm"
              >
                {item.icon}
              </ThemeIcon>
              <Text>{item.label}</Text>
            </Box>
          )}
        </NavLink>
      ))}
    </Stack>
  );
};
```

## Example: SuperAdmin Tenant Management

```tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Table, 
  Button, 
  Group, 
  Text, 
  Badge, 
  ActionIcon, 
  Menu, 
  Modal,
  TextInput,
  Stack,
  Switch
} from '@mantine/core';
import { useForm, zodResolver } from 'react-hook-form';
import { z } from 'zod';
import { IconDots, IconArchive, IconArchiveOff, IconTrash, IconEdit } from '@tabler/icons-react';
import { api } from '../utils/api';
import { Tenant } from '../types/tenant';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const tenantUpdateSchema = z.object({
  name: z.string().min(3).max(50),
  archived: z.boolean().optional(),
});

export const SuperAdminTenants: React.FC = () => {
  const [selectedTenant, setSelectedTenant] = React.useState<Tenant | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(tenantUpdateSchema),
  });
  
  const { data: tenants, isLoading, error } = useQuery<Tenant[], Error>(
    'tenants',
    async () => {
      const response = await api.get('/api/v1/tenants');
      return response.data;
    }
  );
  
  const updateTenantMutation = useMutation<Tenant, Error, { id: string, data: Partial<Tenant> }>(
    async ({ id, data }) => {
      const response = await api.patch(`/api/v1/tenants/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
        setEditModalOpen(false);
      },
    }
  );
  
  const deleteTenantMutation = useMutation<void, Error, string>(
    async (id) => {
      await api.delete(`/api/v1/tenants/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
      },
    }
  );
  
  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    reset({ name: tenant.name, archived: tenant.archived });
    setEditModalOpen(true);
  };
  
  const handleUpdateTenant = (data: any) => {
    if (selectedTenant) {
      updateTenantMutation.mutate({ 
        id: selectedTenant._id, 
        data 
      });
    }
  };
  
  const handleToggleArchive = (tenant: Tenant) => {
    updateTenantMutation.mutate({ 
      id: tenant._id, 
      data: { archived: !tenant.archived } 
    });
  };
  
  const handleDeleteTenant = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      deleteTenantMutation.mutate(id);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <div>
      <Group position="apart" mb="xl">
        <div>
          <h1>Tenant Management</h1>
          <Text color="dimmed">Manage all tenants in the system</Text>
        </div>
      </Group>
      
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner</th>
            <th>Created</th>
            <th>Status</th>
            <th>Projects</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants?.map((tenant) => (
            <tr key={tenant._id}>
              <td>{tenant.name}</td>
              <td>{tenant.ownerName || tenant.ownerId}</td>
              <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
              <td>
                <Badge 
                  color={tenant.archived ? 'gray' : 'green'}
                >
                  {tenant.archived ? 'Archived' : 'Active'}
                </Badge>
              </td>
              <td>{tenant.projectCount || 0}</td>
              <td>
                <Menu position="bottom-end" shadow="md">
                  <Menu.Target>
                    <ActionIcon>
                      <IconDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item 
                      icon={<IconEdit size={16} />}
                      onClick={() => handleEditTenant(tenant)}
                    >
                      Edit
                    </Menu.Item>
                    <Menu.Item 
                      icon={tenant.archived ? <IconArchiveOff size={16} /> : <IconArchive size={16} />}
                      onClick={() => handleToggleArchive(tenant)}
                    >
                      {tenant.archived ? 'Unarchive' : 'Archive'}
                    </Menu.Item>
                    <Menu.Item 
                      icon={<IconTrash size={16} />}
                      color="red"
                      onClick={() => handleDeleteTenant(tenant._id)}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Tenant"
      >
        <form onSubmit={handleSubmit(handleUpdateTenant)}>
          <Stack>
            <TextInput
              label="Tenant Name"
              placeholder="Enter tenant name"
              {...register('name')}
              error={errors.name?.message}
            />
            
            <Switch
              label="Archived"
              {...register('archived')}
            />
            
            <Group position="right" mt="md">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateTenantMutation.isLoading}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  );
};
```

## Conclusion

This prompt provides a comprehensive guide for building a React frontend for the MWAP API. By following these guidelines, OpenHands can create a modern, secure, and user-friendly application that leverages the full functionality of the backend API while providing a great user experience for all user roles.

The frontend should be built with a focus on:

1. **Role-based access control**: Different UIs and capabilities for SuperAdmins, Tenant Owners, and Project Members
2. **Type safety**: Strict TypeScript throughout the application
3. **Component reusability**: Building a library of reusable components
4. **API integration**: Making full use of the existing API endpoints
5. **Security**: Following best practices for authentication and authorization
6. **Performance**: Optimizing for speed and responsiveness
7. **Accessibility**: Ensuring the application is usable by everyone

By adhering to these principles, the resulting frontend will be a robust, maintainable, and user-friendly application that complements the existing backend API.