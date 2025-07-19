# Role-Based Access Control Guide

This guide shows React developers how to implement role-based access control (RBAC) in frontend applications using the MWAP backend.

## 🎭 RBAC Overview

MWAP implements a multi-level role system:

### Global Roles
- **SuperAdmin**: Platform-wide access to all features and data
- **Tenant Owner**: Full control over their tenant and associated projects

### Project Roles
- **Project Owner**: Full control over a specific project
- **Project Deputy**: Can edit project details and manage members  
- **Project Member**: Can view and interact with project resources

## 🔧 Role Management Setup

### User Roles Hook

```tsx
// src/hooks/useUserRoles.ts
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

### Role Checking Functions

```tsx
// src/hooks/useRoleCheck.ts
import { useUserRoles } from './useUserRoles';

export const useRoleCheck = () => {
  const { data: userRoles } = useUserRoles();

  const isSuperAdmin = userRoles?.isSuperAdmin || false;
  const isTenantOwner = userRoles?.isTenantOwner || false;

  const hasProjectRole = (projectId: string, requiredRole: 'OWNER' | 'DEPUTY' | 'MEMBER'): boolean => {
    if (isSuperAdmin) return true; // SuperAdmin has all permissions

    const projectRole = userRoles?.projectRoles.find(pr => pr.projectId === projectId);
    if (!projectRole) return false;

    // Role hierarchy: OWNER > DEPUTY > MEMBER
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

## 🛡️ Route Protection

### Role-Based Route Component

```tsx
// src/components/RoleRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useRoleCheck } from '../hooks/useRoleCheck';

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
  const { isSuperAdmin, isTenantOwner, hasProjectRole } = useRoleCheck();

  // Check global roles
  if (requiredRole === 'superadmin' && !isSuperAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredRole === 'tenant-owner' && !isTenantOwner && !isSuperAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check project-specific roles
  if (projectId && projectRole && !hasProjectRole(projectId, projectRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};
```

### Route Setup Example

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { RoleRoute } from './components/RoleRoute';

function AppRoutes() {
  return (
    <Routes>
      {/* SuperAdmin only routes */}
      <Route element={<RoleRoute requiredRole="superadmin" />}>
        <Route path="/admin/tenants" element={<TenantManagement />} />
        <Route path="/admin/project-types" element={<ProjectTypeManagement />} />
        <Route path="/admin/cloud-providers" element={<CloudProviderManagement />} />
      </Route>

      {/* Tenant Owner routes */}
      <Route element={<RoleRoute requiredRole="tenant-owner" />}>
        <Route path="/tenant/settings" element={<TenantSettings />} />
        <Route path="/integrations" element={<CloudIntegrations />} />
      </Route>

      {/* Project-specific routes with dynamic project ID */}
      <Route path="/projects/:projectId">
        <Route element={<RoleRoute projectRole="MEMBER" />}>
          <Route path="files" element={<ProjectFiles />} />
        </Route>
        <Route element={<RoleRoute projectRole="DEPUTY" />}>
          <Route path="settings" element={<ProjectSettings />} />
        </Route>
        <Route element={<RoleRoute projectRole="OWNER" />}>
          <Route path="members" element={<ProjectMembers />} />
        </Route>
      </Route>
    </Routes>
  );
}
```

## 🎨 Conditional UI Rendering

### Basic Role-Based Components

```tsx
// src/components/ProjectActions.tsx
import { useRoleCheck } from '../hooks/useRoleCheck';

interface ProjectActionsProps {
  projectId: string;
}

export const ProjectActions: React.FC<ProjectActionsProps> = ({ projectId }) => {
  const { hasProjectRole, isSuperAdmin } = useRoleCheck();

  return (
    <div className="project-actions">
      {/* All members can view */}
      {hasProjectRole(projectId, 'MEMBER') && (
        <button>View Files</button>
      )}

      {/* Deputies and above can edit */}
      {hasProjectRole(projectId, 'DEPUTY') && (
        <button>Edit Project</button>
      )}

      {/* Only owners can manage members */}
      {hasProjectRole(projectId, 'OWNER') && (
        <button>Manage Members</button>
      )}

      {/* SuperAdmin or owner can delete */}
      {(isSuperAdmin || hasProjectRole(projectId, 'OWNER')) && (
        <button className="danger">Delete Project</button>
      )}
    </div>
  );
};
```

### Role-Based Navigation

```tsx
// src/components/Navigation.tsx
import { useRoleCheck } from '../hooks/useRoleCheck';

export const Navigation: React.FC = () => {
  const { isSuperAdmin, isTenantOwner, canCreateProject } = useRoleCheck();

  return (
    <nav className="main-nav">
      {/* Common navigation */}
      <a href="/dashboard">Dashboard</a>
      <a href="/projects">Projects</a>

      {/* Project creation */}
      {canCreateProject && (
        <a href="/projects/new">Create Project</a>
      )}

      {/* Tenant management */}
      {isTenantOwner && (
        <>
          <a href="/tenant/settings">Tenant Settings</a>
          <a href="/integrations">Cloud Integrations</a>
        </>
      )}

      {/* Admin features */}
      {isSuperAdmin && (
        <details>
          <summary>Administration</summary>
          <a href="/admin/tenants">Manage Tenants</a>
          <a href="/admin/project-types">Project Types</a>
          <a href="/admin/cloud-providers">Cloud Providers</a>
        </details>
      )}
    </nav>
  );
};
```

### Form Field Permissions

```tsx
// src/components/ProjectForm.tsx
import { useRoleCheck } from '../hooks/useRoleCheck';

interface ProjectFormProps {
  projectId: string;
  project: Project;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, project }) => {
  const { hasProjectRole, isSuperAdmin } = useRoleCheck();
  
  const canEdit = hasProjectRole(projectId, 'DEPUTY') || isSuperAdmin;
  const canDelete = hasProjectRole(projectId, 'OWNER') || isSuperAdmin;

  return (
    <form>
      <div>
        <label>Project Name</label>
        <input 
          type="text" 
          defaultValue={project.name}
          readOnly={!canEdit}
        />
      </div>

      <div>
        <label>Description</label>
        <textarea 
          defaultValue={project.description}
          readOnly={!canEdit}
        />
      </div>

      {canEdit && (
        <button type="submit">Save Changes</button>
      )}

      {canDelete && (
        <button type="button" className="danger">
          Delete Project
        </button>
      )}
    </form>
  );
};
```

## 🔄 Dynamic Role Components

### Role-Based Dashboard

```tsx
// src/pages/Dashboard.tsx
import { useRoleCheck } from '../hooks/useRoleCheck';
import { useUserRoles } from '../hooks/useUserRoles';

export const Dashboard: React.FC = () => {
  const { isSuperAdmin, isTenantOwner } = useRoleCheck();
  const { data: userRoles } = useUserRoles();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* SuperAdmin panel */}
      {isSuperAdmin && (
        <section className="admin-panel">
          <h2>System Administration</h2>
          <div className="admin-cards">
            <a href="/admin/tenants" className="admin-card">
              <h3>Tenants</h3>
              <p>Manage all tenants</p>
            </a>
            <a href="/admin/project-types" className="admin-card">
              <h3>Project Types</h3>
              <p>Configure project templates</p>
            </a>
            <a href="/admin/cloud-providers" className="admin-card">
              <h3>Cloud Providers</h3>
              <p>Manage integrations</p>
            </a>
          </div>
        </section>
      )}

      {/* Tenant Owner panel */}
      {isTenantOwner && (
        <section className="tenant-panel">
          <h2>Tenant Management</h2>
          <div className="tenant-cards">
            <a href="/projects/new" className="tenant-card">
              <h3>Create Project</h3>
              <p>Start a new project</p>
            </a>
            <a href="/integrations" className="tenant-card">
              <h3>Cloud Integrations</h3>
              <p>Connect cloud providers</p>
            </a>
          </div>
        </section>
      )}

      {/* User projects */}
      <section className="projects-panel">
        <h2>Your Projects</h2>
        <div className="project-grid">
          {userRoles?.projectRoles?.map(({ projectId, role }) => (
            <div key={projectId} className="project-card">
              <h3>Project {projectId}</h3>
              <span className={`role-badge role-${role.toLowerCase()}`}>
                {role}
              </span>
              <a href={`/projects/${projectId}`}>Open Project</a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
```

## 🛠️ Helper Components

### Permission Gate Component

```tsx
// src/components/PermissionGate.tsx
import { ReactNode } from 'react';
import { useRoleCheck } from '../hooks/useRoleCheck';

interface PermissionGateProps {
  children: ReactNode;
  requiredRole?: 'superadmin' | 'tenant-owner';
  projectId?: string;
  projectRole?: 'OWNER' | 'DEPUTY' | 'MEMBER';
  fallback?: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requiredRole,
  projectId,
  projectRole,
  fallback = null,
}) => {
  const { isSuperAdmin, isTenantOwner, hasProjectRole } = useRoleCheck();

  let hasPermission = true;

  if (requiredRole === 'superadmin') {
    hasPermission = isSuperAdmin;
  } else if (requiredRole === 'tenant-owner') {
    hasPermission = isTenantOwner || isSuperAdmin;
  }

  if (projectId && projectRole) {
    hasPermission = hasPermission && hasProjectRole(projectId, projectRole);
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

// Usage example
export const SomeComponent = () => (
  <div>
    <h1>Project Dashboard</h1>
    
    <PermissionGate projectId="123" projectRole="DEPUTY">
      <button>Edit Project</button>
    </PermissionGate>
    
    <PermissionGate 
      requiredRole="superadmin" 
      fallback={<p>Admin access required</p>}
    >
      <AdminPanel />
    </PermissionGate>
  </div>
);
```

### Role Badge Component

```tsx
// src/components/RoleBadge.tsx
interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-red-100 text-red-800';
      case 'DEPUTY': return 'bg-blue-100 text-blue-800';
      case 'MEMBER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'sm': return 'px-2 py-1 text-xs';
      case 'lg': return 'px-4 py-2 text-base';
      default: return 'px-3 py-1 text-sm';
    }
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${getRoleColor(role)} ${getSizeClass(size)}
    `}>
      {role}
    </span>
  );
};
```

## 🔍 Best Practices

### 1. Always Check Permissions

```tsx
// ❌ Don't assume permissions
const deleteProject = () => {
  api.delete(`/projects/${projectId}`); // This will fail if unauthorized
};

// ✅ Check permissions first
const { hasProjectRole } = useRoleCheck();
const canDelete = hasProjectRole(projectId, 'OWNER');

const deleteProject = () => {
  if (!canDelete) return;
  api.delete(`/projects/${projectId}`);
};
```

### 2. Graceful Degradation

```tsx
// ❌ Don't show empty sections
{isSuperAdmin && (
  <section>
    <h2>Admin Tools</h2>
    {/* Empty if not admin */}
  </section>
)}

// ✅ Show appropriate content for each role
{isSuperAdmin ? (
  <AdminSection />
) : isTenantOwner ? (
  <TenantSection />
) : (
  <MemberSection />
)}
```

### 3. Server-Side Validation

```tsx
// Always remember: Frontend role checks are for UX only
// The backend must validate all permissions
const createProject = async (data) => {
  try {
    await api.post('/projects', data);
  } catch (error) {
    if (error.response?.status === 403) {
      alert('You do not have permission to create projects');
    }
  }
};
```

## 📖 Related Documentation

- [Authentication Guide](authentication.md) - Auth0 and user authentication
- [API Integration Guide](api-integration.md) - Making authenticated API calls
- [Error Handling Guide](error-handling.md) - Handling authorization errors
- [Backend RBAC Documentation](../04-Backend/authentication.md) - Server-side role validation

---

*This guide covers frontend RBAC implementation. Remember that all permissions must also be validated on the backend for security.*