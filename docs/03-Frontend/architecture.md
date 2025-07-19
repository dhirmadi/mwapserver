# MWAP Frontend Architecture

This document outlines the architecture, design patterns, and component structure for the MWAP frontend application.

## 🎯 Overview

The MWAP frontend is a modern React application built with TypeScript, following a component-based architecture with a focus on type safety, reusability, and maintainability. The architecture is designed to support the multi-tenant, role-based nature of the application while providing a seamless user experience.

## 🔧 Technical Stack

- **Framework**: React 18+ with TypeScript
- **State Management**: React Query for server state, Context API for client state
- **Styling**: Tailwind CSS with Mantine component library
- **Authentication**: Auth0 React SDK with PKCE flow
- **API Integration**: Axios with React Query
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router v6+
- **Testing**: Vitest with React Testing Library

## 🏗️ Architecture Principles

### 1. Feature-Based Organization

The codebase is organized around features that mirror the backend's domain-driven design:

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

Each feature contains its own components, hooks, and utilities, promoting modularity and separation of concerns.

### 2. Atomic Design

Components follow the atomic design methodology:

- **Atoms**: Basic building blocks (Button, Input, Card, etc.)
- **Molecules**: Combinations of atoms (Form fields, Search bars, etc.)
- **Organisms**: Complex UI sections (Navigation, DataTable, etc.)
- **Templates**: Page layouts with placeholders for content
- **Pages**: Complete screens with real data

This approach promotes reusability and consistency across the application.

### 3. Custom Hooks

Business logic and API calls are encapsulated in custom hooks:

- **Data fetching**: `useProjects`, `useTenant`, etc.
- **Mutations**: `useCreateProject`, `useUpdateTenant`, etc.
- **Authentication**: `useAuth`, `useRoles`, etc.
- **UI state**: `useModal`, `useForm`, etc.

This separation of concerns makes components cleaner and more focused on rendering.

### 4. Type Safety

The application uses TypeScript with strict mode enabled, ensuring type safety throughout the codebase:

- Shared types with the backend API
- Zod schemas for runtime validation
- Proper typing of component props and state
- Type-safe API calls and responses

### 5. Responsive Design

The UI is designed with a mobile-first approach:

- Responsive layouts using Flexbox and Grid
- Adaptive components that work across device sizes
- Touch-friendly interactions for mobile users
- Progressive enhancement for desktop users

## 📁 Detailed Component Structure

### Common Components

Reusable UI elements used throughout the application:

```
/components/common
  /Button            # Button component with variants
  /Card              # Card container component
  /Input             # Form input components
  /Select            # Dropdown selection component
  /Modal             # Modal dialog component
  /Table             # Data table component
  /Tabs              # Tab navigation component
  /Dropdown          # Dropdown menu component
  /ErrorDisplay      # Error message display
  /LoadingSpinner    # Loading indicator
  /Pagination        # Pagination controls
  /Toast             # Notification component
  /Avatar            # User avatar component
  /Badge             # Status badge component
  /Tooltip           # Tooltip component
```

Each component follows a consistent structure:

```
/components/common/Button
  Button.tsx         # Component implementation
  Button.test.tsx    # Component tests
  Button.types.ts    # Component types (if complex)
  index.ts           # Export file
```

### Layout Components

Components that define the overall structure of the application:

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

### Feature Components

Domain-specific components organized by business feature:

```
/components/features
  /auth
    /LoginForm       # User login form
    /SignupForm      # User registration form
    /PasswordReset   # Password reset form
    /MFASetup        # Multi-factor auth setup
  /tenants
    /TenantDashboard # Tenant overview dashboard
    /TenantForm      # Tenant creation/edit form
    /TenantList      # List of tenants
    /TenantCard      # Individual tenant card
  /projects
    /ProjectDashboard # Project overview dashboard
    /ProjectForm     # Project creation/edit form
    /ProjectList     # List of projects
    /ProjectCard     # Individual project card
    /ProjectMembers  # Project member management
  /cloud-providers
    /CloudProviderList # Available cloud providers
    /CloudProviderForm # Provider configuration form
    /IntegrationSetup  # OAuth integration setup
    /OAuthCallback     # OAuth callback handler
  /project-types
    /ProjectTypeList # Available project types
    /ProjectTypeForm # Project type configuration
    /ProjectTypeCard # Individual project type
  /files
    /FileExplorer    # File browser interface
    /FileList        # List of files
    /FileCard        # Individual file display
    /FileUpload      # File upload component
```

### Custom Hooks Organization

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

### Context Providers

Global state management through React Context:

```
/context
  /AuthContext.tsx       # Authentication state
  /ThemeContext.tsx      # Theme settings
  /ToastContext.tsx      # Toast notifications
  /ModalContext.tsx      # Modal management
  /FeatureFlagContext.tsx # Feature flags
```

### Pages Structure

Complete screens representing different application views:

```
/pages
  /auth
    /Login.tsx         # Login page
    /Signup.tsx        # Registration page
    /ForgotPassword.tsx # Password reset page
  /dashboard
    /SuperAdminDashboard.tsx    # SuperAdmin dashboard
    /TenantOwnerDashboard.tsx   # Tenant owner dashboard
    /ProjectMemberDashboard.tsx # Project member dashboard
  /tenants
    /TenantList.tsx    # Tenant listing page
    /TenantDetail.tsx  # Tenant details page
    /TenantEdit.tsx    # Tenant editing page
  /projects
    /ProjectList.tsx   # Project listing page
    /ProjectDetail.tsx # Project details page
    /ProjectEdit.tsx   # Project editing page
    /ProjectMembers.tsx # Project member management
  /cloud-providers
    /CloudProviderList.tsx   # Provider listing
    /CloudProviderDetail.tsx # Provider details
    /CloudProviderEdit.tsx   # Provider configuration
    /IntegrationList.tsx     # Integration management
  /project-types
    /ProjectTypeList.tsx   # Project type listing
    /ProjectTypeDetail.tsx # Project type details
    /ProjectTypeEdit.tsx   # Project type configuration
  /files
    /FileExplorer.tsx  # File browser page
    /FileDetail.tsx    # File details page
  /settings
    /UserProfile.tsx   # User profile settings
    /TenantSettings.tsx # Tenant configuration
    /SystemSettings.tsx # System administration
  /error
    /NotFound.tsx      # 404 error page
    /Forbidden.tsx     # 403 access denied page
    /ServerError.tsx   # 500 server error page
```

### TypeScript Types Organization

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

## 🔄 Component Patterns

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

### Component Structure Standard

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

## 📊 Data Flow

### Server State Management

React Query is used for server state management:

1. Components use custom hooks to fetch data
2. React Query handles caching, refetching, and invalidation
3. Loading and error states are managed automatically
4. Mutations update the cache when successful

Example:
```tsx
// Custom hook for fetching projects
export const useProjects = () => {
  return useQuery<Project[], Error>('projects', async () => {
    const response = await api.get('/api/v1/projects');
    return response.data;
  });
};

// Component using the hook
const ProjectList = () => {
  const { data: projects, isLoading, error } = useProjects();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project._id} project={project} />
      ))}
    </div>
  );
};
```

### Client State Management

React Context is used for client state that needs to be shared across components:

- Authentication state
- UI preferences
- Theme settings
- Feature flags

Example:
```tsx
// Auth context
export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Authentication logic...
  
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Authentication Flow

1. User navigates to the application
2. Auth0 SDK checks if the user is authenticated
3. If not, the user is redirected to the Auth0 login page
4. After successful authentication, Auth0 redirects back to the application
5. The application verifies the token and sets up the authenticated session
6. User is redirected to their role-specific dashboard

## Role-Based UI

The UI adapts based on the user's role:

- **Navigation**: Shows only relevant menu items
- **Actions**: Enables/disables buttons based on permissions
- **Content**: Filters displayed information based on access level
- **Forms**: Shows/hides fields based on role

This is implemented using a combination of:

- Role-based routing
- Conditional rendering
- Permission checks in components
- Role-specific hooks and utilities

## Error Handling

The application implements a comprehensive error handling strategy:

- Global error boundary for unexpected errors
- API error handling with clear user feedback
- Form validation errors with inline feedback
- Network error detection and retry mechanisms
- Error logging for debugging

## Performance Optimization

Performance is optimized through:

- Code splitting for route-based components
- Memoization of expensive computations
- Virtualization for long lists
- Bundle size optimization
- Proper caching strategies
- Lazy loading of components and resources

## Security Considerations

Security is a top priority:

- Proper CSRF protection
- HttpOnly cookies for token storage
- Input validation and sanitization
- Authorization checks on the client side
- Secure communication with the API
- Protection against common vulnerabilities

## 🎯 Conclusion

The MWAP frontend architecture provides a solid foundation for building a modular, maintainable, and scalable application. By following these architectural principles, component patterns, and organization guidelines, the frontend can:

- **Scale effectively** as new features are added
- **Maintain code quality** through consistent patterns
- **Support role-based functionality** with flexible component design
- **Ensure type safety** throughout the application
- **Provide excellent developer experience** with clear organization

This architecture enables the MWAP frontend to grow and evolve while maintaining high standards for performance, security, and user experience.

---
*For practical implementation guidance, see the [Frontend Integration Guide](./frontend-guide.md).*