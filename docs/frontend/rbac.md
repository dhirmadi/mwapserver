# MWAP Frontend Role-Based Access Control

This document outlines the implementation of role-based access control (RBAC) in the MWAP frontend application.

## Overview

MWAP implements a comprehensive role-based access control system to ensure that users can only access the features and data they are authorized to use. The RBAC system is implemented at multiple levels:

1. **Route level**: Restricting access to certain routes based on user roles
2. **Component level**: Showing or hiding UI elements based on user roles
3. **API level**: Validating permissions before making API calls
4. **Data level**: Filtering data based on user roles

## User Roles

MWAP supports three primary user roles, each with different permissions:

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

## Role Management

Roles are managed through the Auth context:

```tsx
// src/context/AuthContext.tsx
interface AuthContextType {
  // ...other properties
  isSuperAdmin: boolean;
  isTenantOwner: boolean;
  hasProjectRole: (projectId: string, role: string) => boolean;
}

export const AuthProvider: React.FC = ({ children }) => {
  // ...other state and functions
  
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
          
          // Set tenant owner status
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
  
  // ...rest of the provider
};
```

## Role-Based Routing

Role-based routing ensures that users can only access routes they are authorized for:

```tsx
// src/routes/RoleRoute.tsx
import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface RoleRouteProps {
  requiredRoles: ('superAdmin' | 'tenantOwner' | 'projectOwner' | 'projectDeputy' | 'projectMember')[];
  projectIdParam?: string; // URL parameter name for project ID
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ 
  requiredRoles,
  projectIdParam = 'id'
}) => {
  const { 
    isLoading, 
    isSuperAdmin, 
    isTenantOwner, 
    hasProjectRole 
  } = useAuth();
  
  const params = useParams();
  const projectId = params[projectIdParam];
  
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

Usage in route configuration:

```tsx
// src/routes/index.tsx
<Routes>
  {/* SuperAdmin routes */}
  <Route element={<RoleRoute requiredRoles={['superAdmin']} />}>
    <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
    <Route path="/admin/tenants" element={<TenantList />} />
    <Route path="/admin/project-types" element={<ProjectTypeList />} />
    <Route path="/admin/cloud-providers" element={<CloudProviderList />} />
  </Route>
  
  {/* Tenant Owner routes */}
  <Route element={<RoleRoute requiredRoles={['tenantOwner']} />}>
    <Route path="/tenant/dashboard" element={<TenantOwnerDashboard />} />
    <Route path="/tenant/settings" element={<TenantSettings />} />
    <Route path="/tenant/integrations" element={<IntegrationList />} />
  </Route>
  
  {/* Project routes with role-based access */}
  <Route path="/projects/:id/settings" element={
    <RoleRoute requiredRoles={['projectOwner', 'projectDeputy']}>
      <ProjectSettings />
    </RoleRoute>
  } />
  
  <Route path="/projects/:id/members" element={
    <RoleRoute requiredRoles={['projectOwner']}>
      <ProjectMembers />
    </RoleRoute>
  } />
</Routes>
```

## Role-Based UI Components

UI components adapt based on the user's role:

### 1. Conditional Rendering

```tsx
import { useAuth } from '../context/AuthContext';

export const ProjectActions: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { isSuperAdmin, hasProjectRole } = useAuth();
  const isOwner = hasProjectRole(projectId, 'OWNER');
  const isDeputy = hasProjectRole(projectId, 'DEPUTY');
  
  return (
    <div className="flex gap-2">
      {/* Available to all */}
      <Button variant="outline">View Details</Button>
      
      {/* Available to project owners and deputies */}
      {(isOwner || isDeputy) && (
        <Button variant="outline">Edit Project</Button>
      )}
      
      {/* Available to project owners only */}
      {isOwner && (
        <Button variant="outline">Manage Members</Button>
      )}
      
      {/* Available to super admins and project owners */}
      {(isSuperAdmin || isOwner) && (
        <Button variant="outline" color="red">Delete Project</Button>
      )}
    </div>
  );
};
```

### 2. Role-Based Navigation

```tsx
import { useAuth } from '../context/AuthContext';

export const Navigation: React.FC = () => {
  const { isSuperAdmin, isTenantOwner } = useAuth();
  
  return (
    <nav>
      <ul>
        {/* Common navigation items */}
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/projects">Projects</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        
        {/* Tenant owner navigation items */}
        {isTenantOwner && (
          <>
            <li><Link to="/tenant/settings">Tenant Settings</Link></li>
            <li><Link to="/tenant/integrations">Cloud Integrations</Link></li>
          </>
        )}
        
        {/* Super admin navigation items */}
        {isSuperAdmin && (
          <>
            <li><Link to="/admin/tenants">Tenants</Link></li>
            <li><Link to="/admin/project-types">Project Types</Link></li>
            <li><Link to="/admin/cloud-providers">Cloud Providers</Link></li>
            <li><Link to="/admin/settings">System Settings</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};
```

### 3. Role-Based Forms

```tsx
import { useAuth } from '../context/AuthContext';

export const ProjectForm: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { isSuperAdmin, hasProjectRole } = useAuth();
  const isOwner = hasProjectRole(projectId, 'OWNER');
  const isDeputy = hasProjectRole(projectId, 'DEPUTY');
  const canEdit = isSuperAdmin || isOwner || isDeputy;
  
  return (
    <form>
      <div>
        <label>Project Name</label>
        <input 
          type="text" 
          disabled={!canEdit} 
        />
      </div>
      
      <div>
        <label>Description</label>
        <textarea 
          disabled={!canEdit} 
        />
      </div>
      
      {/* Fields only visible to owners */}
      {isOwner && (
        <div>
          <label>Advanced Settings</label>
          <input type="checkbox" />
        </div>
      )}
      
      {/* Fields only visible to super admins */}
      {isSuperAdmin && (
        <div>
          <label>System Tags</label>
          <input type="text" />
        </div>
      )}
      
      {canEdit && (
        <button type="submit">Save Changes</button>
      )}
    </form>
  );
};
```

## Role-Based API Access

API access is controlled based on user roles:

### 1. Custom Hook for Role-Based API Calls

```tsx
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export const useRoleBasedApi = () => {
  const { isSuperAdmin, isTenantOwner, hasProjectRole } = useAuth();
  
  const deleteProject = async (projectId: string) => {
    // Check if user has permission to delete the project
    if (!isSuperAdmin && !hasProjectRole(projectId, 'OWNER')) {
      throw new Error('You do not have permission to delete this project');
    }
    
    return api.delete(`/projects/${projectId}`);
  };
  
  const updateProject = async (projectId: string, data: any) => {
    // Check if user has permission to update the project
    if (!isSuperAdmin && !hasProjectRole(projectId, 'OWNER') && !hasProjectRole(projectId, 'DEPUTY')) {
      throw new Error('You do not have permission to update this project');
    }
    
    return api.patch(`/projects/${projectId}`, data);
  };
  
  const createProjectType = async (data: any) => {
    // Check if user is a super admin
    if (!isSuperAdmin) {
      throw new Error('You do not have permission to create project types');
    }
    
    return api.post('/project-types', data);
  };
  
  return {
    deleteProject,
    updateProject,
    createProjectType,
    // Other role-based API methods...
  };
};
```

### 2. Role-Based Query Hooks

```tsx
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export const useProjects = () => {
  const { isSuperAdmin } = useAuth();
  
  return useQuery(['projects'], async () => {
    // Super admins can see all projects, others only see their own
    const endpoint = isSuperAdmin ? '/admin/projects' : '/projects';
    const response = await api.get(endpoint);
    return response.data;
  });
};
```

## Role-Based Dashboard

Different dashboards are shown based on the user's role:

```tsx
import { useAuth } from '../context/AuthContext';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { TenantOwnerDashboard } from './TenantOwnerDashboard';
import { ProjectMemberDashboard } from './ProjectMemberDashboard';

export const Dashboard: React.FC = () => {
  const { isSuperAdmin, isTenantOwner } = useAuth();
  
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }
  
  if (isTenantOwner) {
    return <TenantOwnerDashboard />;
  }
  
  return <ProjectMemberDashboard />;
};
```

## Role-Based Error Handling

Error messages are customized based on the user's role:

```tsx
import { useAuth } from '../context/AuthContext';

export const ErrorDisplay: React.FC<{ error: Error }> = ({ error }) => {
  const { isSuperAdmin } = useAuth();
  
  return (
    <div className="error-container">
      <h3>An error occurred</h3>
      
      {/* Show detailed error information to super admins */}
      {isSuperAdmin ? (
        <>
          <p>{error.message}</p>
          <pre>{error.stack}</pre>
        </>
      ) : (
        <p>Please try again or contact support if the problem persists.</p>
      )}
      
      <button>Retry</button>
    </div>
  );
};
```

## Testing Role-Based Access Control

RBAC is tested at multiple levels:

### 1. Unit Tests

```tsx
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext';
import { ProjectActions } from './ProjectActions';

describe('ProjectActions', () => {
  test('shows all actions for project owner', () => {
    render(
      <AuthContext.Provider value={{ 
        hasProjectRole: () => true,
        isSuperAdmin: false,
        // ...other context values
      }}>
        <ProjectActions projectId="123" />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Edit Project')).toBeInTheDocument();
    expect(screen.getByText('Manage Members')).toBeInTheDocument();
    expect(screen.getByText('Delete Project')).toBeInTheDocument();
  });
  
  test('shows limited actions for project member', () => {
    render(
      <AuthContext.Provider value={{ 
        hasProjectRole: (id, role) => role === 'MEMBER',
        isSuperAdmin: false,
        // ...other context values
      }}>
        <ProjectActions projectId="123" />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.queryByText('Edit Project')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage Members')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Project')).not.toBeInTheDocument();
  });
});
```

### 2. Integration Tests

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { QueryClientProvider } from 'react-query';
import { queryClient } from '../utils/queryClient';
import { App } from '../App';

// Mock Auth0 hook
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: true,
    user: { sub: 'user123', email: 'user@example.com' },
    // ...other Auth0 values
  }),
}));

// Mock API responses
jest.mock('../utils/api', () => ({
  api: {
    get: jest.fn((url) => {
      if (url === '/tenants/me') {
        return Promise.resolve({ 
          data: { 
            _id: 'tenant123', 
            name: 'Test Tenant',
            ownerId: 'user123'
          } 
        });
      }
      if (url === '/admin/check') {
        return Promise.resolve({ data: { isSuperAdmin: true } });
      }
      // ...other mocked responses
    }),
  },
}));

describe('Role-based routing', () => {
  test('super admin can access admin routes', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/admin/tenants']}>
            <App />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
    
    // Wait for the page to load
    expect(await screen.findByText('Tenant Management')).toBeInTheDocument();
  });
  
  // ...other tests
});
```

## Conclusion

MWAP implements a comprehensive role-based access control system that ensures users can only access the features and data they are authorized to use. This is implemented at multiple levels:

1. **Route level**: Using `RoleRoute` to restrict access to certain routes
2. **Component level**: Conditionally rendering UI elements based on user roles
3. **API level**: Validating permissions before making API calls
4. **Data level**: Filtering data based on user roles

This approach provides a secure, user-friendly experience that adapts to each user's role and permissions.