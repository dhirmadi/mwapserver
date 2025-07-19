# OpenHands Frontend Development Prompt

This document provides guidance and prompts for frontend development within the MWAP platform using OpenHands integration.

## 🎯 Frontend Development Context

### Project Overview
MWAP frontend is a React-based single-page application (SPA) that provides a modern, responsive interface for the MWAP backend services. The frontend follows component-based architecture with TypeScript, Vite, and modern React patterns.

### Technology Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Library**: Mantine for component library and theming
- **State Management**: React Query (TanStack Query) for server state
- **Authentication**: Auth0 React SDK
- **HTTP Client**: Axios for API communication
- **Routing**: React Router v6
- **Testing**: Vitest with React Testing Library

## 🏗️ Architecture Principles

### Component Design
```typescript
// Feature-based component organization
src/
├── components/           # Shared UI components
├── features/            # Feature-specific components
│   ├── auth/           # Authentication components
│   ├── tenants/        # Tenant management
│   ├── projects/       # Project components
│   ├── files/          # File management
│   └── integrations/   # Cloud integrations
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### State Management Strategy
- **Server State**: React Query for API data management
- **Local State**: React useState/useReducer for component state
- **Global State**: React Context for app-wide state (auth, theme)
- **Form State**: React Hook Form for complex forms

## 🔧 Development Prompts

### Component Creation Prompt
```
Create a React TypeScript component for [FEATURE_NAME] that:

Requirements:
- Uses Mantine UI components for consistent styling
- Implements proper TypeScript interfaces
- Includes error handling and loading states
- Follows accessibility best practices
- Uses React Query for data fetching
- Implements proper form validation with React Hook Form

Structure:
- Component file: [ComponentName].tsx
- Types file: [ComponentName].types.ts
- Styles file: [ComponentName].module.css (if needed)
- Tests file: [ComponentName].test.tsx

Example for Tenant Management:
- TenantList.tsx - Display list of tenants
- TenantForm.tsx - Create/edit tenant form
- TenantCard.tsx - Individual tenant display
- useTenants.ts - Custom hook for tenant operations
```

### API Integration Prompt
```
Create API integration for [FEATURE_NAME] that:

Requirements:
- Uses Axios with proper TypeScript types
- Implements request/response interceptors
- Handles authentication tokens automatically
- Provides proper error handling
- Uses React Query for caching and state management
- Implements optimistic updates where appropriate

Files to create:
- services/[feature]Api.ts - API service functions
- hooks/use[Feature].ts - React Query hooks
- types/[feature].types.ts - TypeScript interfaces
- queries/[feature]Keys.ts - Query key factory
```

### Authentication Integration Prompt
```
Implement Auth0 authentication integration that:

Requirements:
- Uses Auth0 React SDK
- Implements PKCE flow for security
- Handles token refresh automatically
- Provides authentication context
- Implements protected routes
- Includes proper error handling

Components needed:
- AuthProvider.tsx - Auth0 provider wrapper
- ProtectedRoute.tsx - Route protection component
- LoginButton.tsx - Login trigger component
- LogoutButton.tsx - Logout trigger component
- UserProfile.tsx - User information display
```

## 📱 Component Patterns

### Standard Component Template
```typescript
import React from 'react';
import { Box, Button, Text, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { [FeatureName]Props, [FeatureName]Data } from './[ComponentName].types';
import { use[FeatureName] } from '../hooks/use[FeatureName]';

interface [ComponentName]Props {
  // Component props interface
}

export const [ComponentName]: React.FC<[ComponentName]Props> = ({ 
  // destructured props 
}) => {
  // React Query hooks
  const { data, isLoading, error } = use[FeatureName]();

  // Event handlers
  const handleAction = async () => {
    try {
      // Implementation
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return <Loader />;
  }

  // Error state
  if (error) {
    return <Text color="red">Error: {error.message}</Text>;
  }

  // Main render
  return (
    <Box>
      {/* Component content */}
    </Box>
  );
};
```

### Custom Hook Template
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { [FeatureName]Api } from '../services/[feature]Api';
import { [FeatureName]Data, Create[FeatureName]Request } from '../types/[feature].types';

export const use[FeatureName]List = () => {
  return useQuery({
    queryKey: ['[feature]', 'list'],
    queryFn: [FeatureName]Api.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreate[FeatureName] = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: [FeatureName]Api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[feature]'] });
    },
  });
};
```

## 🎨 UI/UX Guidelines

### Design System Integration
```typescript
// Use Mantine theme system
import { MantineProvider, createTheme } from '@mantine/core';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Inter, sans-serif' },
});

// Component styling with Mantine
<Button
  variant="filled"
  color="blue"
  size="md"
  leftSection={<IconPlus size={16} />}
  onClick={handleCreate}
>
  Create New
</Button>
```

### Responsive Design
```typescript
import { useMediaQuery } from '@mantine/hooks';

const isMobile = useMediaQuery('(max-width: 768px)');

return (
  <Grid>
    <Grid.Col span={isMobile ? 12 : 8}>
      {/* Main content */}
    </Grid.Col>
    <Grid.Col span={isMobile ? 12 : 4}>
      {/* Sidebar */}
    </Grid.Col>
  </Grid>
);
```

## 🔐 Security Patterns

### Auth0 Integration
```typescript
import { useAuth0 } from '@auth0/auth0-react';

export const useAuthenticatedApi = () => {
  const { getAccessTokenSilently } = useAuth0();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getAccessTokenSilently();
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return { authenticatedFetch };
};
```

### Protected Route Implementation
```typescript
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

## 📊 Data Management

### React Query Configuration
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 3,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Error Handling Pattern
```typescript
import { notifications } from '@mantine/notifications';

export const useErrorHandler = () => {
  const handleError = (error: Error) => {
    notifications.show({
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
      color: 'red',
    });
    
    console.error('Application error:', error);
  };

  return { handleError };
};
```

## 🧪 Testing Patterns

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { [ComponentName] } from './[ComponentName]';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('[ComponentName]', () => {
  it('renders correctly', () => {
    renderWithProviders(<[ComponentName] />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    renderWithProviders(<[ComponentName] />);
    
    const button = screen.getByRole('button', { name: 'Action Button' });
    fireEvent.click(button);
    
    // Assertions
  });
});
```

## 🚀 Performance Optimization

### Code Splitting
```typescript
import { lazy, Suspense } from 'react';
import { Loader } from '@mantine/core';

const LazyComponent = lazy(() => import('./HeavyComponent'));

export const App = () => (
  <Suspense fallback={<Loader />}>
    <LazyComponent />
  </Suspense>
);
```

### Memoization Patterns
```typescript
import { memo, useMemo, useCallback } from 'react';

export const OptimizedComponent = memo<ComponentProps>(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveComputation(item),
    }));
  }, [data]);

  const handleClick = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} data={item} onClick={handleClick} />
      ))}
    </div>
  );
});
```

## 🔧 Development Workflow

### Component Development Process
1. **Design Review**: Confirm UI/UX requirements
2. **Type Definitions**: Create TypeScript interfaces
3. **Component Shell**: Build basic component structure
4. **API Integration**: Implement data fetching
5. **Styling**: Apply Mantine components and custom styles
6. **Testing**: Write component and integration tests
7. **Documentation**: Update component documentation

### Code Quality Checklist
- [ ] TypeScript strict mode compliance
- [ ] Proper error boundaries implementation
- [ ] Accessibility attributes (ARIA, semantic HTML)
- [ ] Responsive design implementation
- [ ] Loading and error states handled
- [ ] Form validation with proper user feedback
- [ ] Performance optimizations applied
- [ ] Tests written and passing

---

*This prompt guide ensures consistent, high-quality frontend development aligned with MWAP's architecture and standards.* 