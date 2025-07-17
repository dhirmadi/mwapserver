# MWAP Frontend Component Structure

This document outlines the component structure and organization for the MWAP frontend application.

## Directory Structure

The frontend follows a feature-based organization with a focus on modularity and reusability:

```
/src
  /components
    /common          # Shared components
    /layout          # Layout components
    /features        # Feature-specific components
  /hooks             # Custom hooks
  /context           # React Context providers
  /utils             # Utility functions
  /types             # TypeScript type definitions
  /pages             # Page components
  /routes            # Route definitions
  /styles            # Global styles and theme configuration
  /assets            # Static assets
```

## Common Components

Common components are reusable UI elements used throughout the application:

```
/components/common
  /Button
  /Card
  /Input
  /Select
  /Modal
  /Table
  /Tabs
  /Dropdown
  /ErrorDisplay
  /LoadingSpinner
  /Pagination
  /Toast
  /Avatar
  /Badge
  /Tooltip
```

Each component follows a consistent structure:

```
/components/common/Button
  Button.tsx         # Component implementation
  Button.test.tsx    # Component tests
  Button.types.ts    # Component types (if complex)
  index.ts           # Export file
```

## Layout Components

Layout components define the overall structure of the application:

```
/components/layout
  /AppShell          # Main application layout
  /Sidebar           # Navigation sidebar
  /Header            # Application header
  /Footer            # Application footer
  /PageContainer     # Container for page content
  /Card              # Card layout component
  /Grid              # Grid layout component
  /Flex              # Flex layout component
```

## Feature Components

Feature components are organized by domain and contain components specific to each feature:

```
/components/features
  /auth
    /LoginForm
    /SignupForm
    /PasswordReset
    /MFASetup
  /tenants
    /TenantDashboard
    /TenantForm
    /TenantList
    /TenantCard
  /projects
    /ProjectDashboard
    /ProjectForm
    /ProjectList
    /ProjectCard
    /ProjectMembers
  /cloud-providers
    /CloudProviderList
    /CloudProviderForm
    /IntegrationSetup
    /OAuthCallback
  /project-types
    /ProjectTypeList
    /ProjectTypeForm
    /ProjectTypeCard
  /files
    /FileExplorer
    /FileList
    /FileCard
    /FileUpload
```

## Custom Hooks

Custom hooks encapsulate business logic and API calls:

```
/hooks
  /useAuth.ts            # Authentication hooks
  /useTenant.ts          # Tenant-related hooks
  /useProjects.ts        # Project-related hooks
  /useCloudProviders.ts  # Cloud provider hooks
  /useProjectTypes.ts    # Project type hooks
  /useFiles.ts           # File-related hooks
  /useForm.ts            # Form handling hooks
  /useToast.ts           # Toast notification hooks
  /useModal.ts           # Modal management hooks
  /useApi.ts             # API client hooks
```

## Context Providers

Context providers manage global state:

```
/context
  /AuthContext.tsx       # Authentication state
  /ThemeContext.tsx      # Theme settings
  /ToastContext.tsx      # Toast notifications
  /ModalContext.tsx      # Modal management
  /FeatureFlagContext.tsx # Feature flags
```

## Pages

Pages represent complete screens in the application:

```
/pages
  /auth
    /Login.tsx
    /Signup.tsx
    /ForgotPassword.tsx
  /dashboard
    /SuperAdminDashboard.tsx
    /TenantOwnerDashboard.tsx
    /ProjectMemberDashboard.tsx
  /tenants
    /TenantList.tsx
    /TenantDetail.tsx
    /TenantEdit.tsx
  /projects
    /ProjectList.tsx
    /ProjectDetail.tsx
    /ProjectEdit.tsx
    /ProjectMembers.tsx
  /cloud-providers
    /CloudProviderList.tsx
    /CloudProviderDetail.tsx
    /CloudProviderEdit.tsx
    /IntegrationList.tsx
  /project-types
    /ProjectTypeList.tsx
    /ProjectTypeDetail.tsx
    /ProjectTypeEdit.tsx
  /files
    /FileExplorer.tsx
    /FileDetail.tsx
  /settings
    /UserProfile.tsx
    /TenantSettings.tsx
    /SystemSettings.tsx
  /error
    /NotFound.tsx
    /Forbidden.tsx
    /ServerError.tsx
```

## Routes

Routes define the application's navigation structure:

```
/routes
  /index.tsx             # Main router configuration
  /PrivateRoute.tsx      # Protected route component
  /RoleRoute.tsx         # Role-based route component
  /routes.ts             # Route definitions
```

## Types

TypeScript type definitions are organized by domain:

```
/types
  /auth.ts               # Authentication types
  /tenant.ts             # Tenant types
  /project.ts            # Project types
  /cloudProvider.ts      # Cloud provider types
  /projectType.ts        # Project type types
  /file.ts               # File types
  /api.ts                # API response types
  /common.ts             # Common utility types
```

## Component Patterns

### Atomic Design

Components follow the atomic design methodology:

1. **Atoms**: Basic UI elements (Button, Input, etc.)
2. **Molecules**: Combinations of atoms (Form fields, Search bars, etc.)
3. **Organisms**: Complex UI sections (Navigation, DataTable, etc.)
4. **Templates**: Page layouts with placeholders
5. **Pages**: Complete screens with real data

### Component Structure

Each component follows a consistent structure:

```tsx
import React from 'react';
import { useStyles } from './styles'; // If using CSS-in-JS
import { ComponentProps } from './types'; // If complex props

export const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  children,
  ...rest
}) => {
  // Component logic
  
  return (
    <div {...rest}>
      {/* Component JSX */}
    </div>
  );
};

// Default props if needed
Component.defaultProps = {
  prop1: 'default',
};
```

### Container/Presentation Pattern

For complex components, the container/presentation pattern is used:

```tsx
// Container component (handles data and logic)
export const ProjectListContainer: React.FC = () => {
  const { projects, isLoading, error } = useProjects();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  return <ProjectList projects={projects} />;
};

// Presentation component (handles rendering)
export const ProjectList: React.FC<{ projects: Project[] }> = ({ projects }) => {
  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project._id} project={project} />
      ))}
    </div>
  );
};
```

### Role-Based Components

Components adapt based on the user's role:

```tsx
export const ProjectActions: React.FC<{ project: Project }> = ({ project }) => {
  const { user, hasRole } = useAuth();
  const isOwner = hasRole('OWNER', project);
  const isDeputy = hasRole('DEPUTY', project);
  const isMember = hasRole('MEMBER', project);
  
  return (
    <div>
      {/* Actions available to all members */}
      <Button>View Details</Button>
      
      {/* Actions available to deputies and owners */}
      {(isOwner || isDeputy) && (
        <Button>Edit Project</Button>
      )}
      
      {/* Actions available only to owners */}
      {isOwner && (
        <>
          <Button>Manage Members</Button>
          <Button>Delete Project</Button>
        </>
      )}
    </div>
  );
};
```

## Conclusion

This component structure provides a solid foundation for building a modular, maintainable, and scalable frontend application. By following these patterns and organization principles, the MWAP frontend can grow and evolve while maintaining code quality and developer productivity.