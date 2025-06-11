# MWAP Frontend Architecture

This document outlines the architecture and design patterns for the MWAP frontend application.

## Overview

The MWAP frontend is a modern React application built with TypeScript, following a component-based architecture with a focus on type safety, reusability, and maintainability. The architecture is designed to support the multi-tenant, role-based nature of the application while providing a seamless user experience.

## Technical Stack

- **Framework**: React 18+ with TypeScript
- **State Management**: React Query for server state, Context API for client state
- **Styling**: Tailwind CSS with Mantine component library
- **Authentication**: Auth0 React SDK with PKCE flow
- **API Integration**: Axios with React Query
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router v6+
- **Testing**: Vitest with React Testing Library

## Architecture Principles

### 1. Feature-Based Organization

The codebase is organized around features that mirror the backend's domain-driven design:

```
/src
  /features
    /auth
    /tenants
    /projects
    /cloud-providers
    /project-types
    /files
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

## Data Flow

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

## Conclusion

The MWAP frontend architecture is designed to be modular, maintainable, and secure, while providing a great user experience. By following these architectural principles and patterns, the application can scale and evolve while maintaining code quality and performance.