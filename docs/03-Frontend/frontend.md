# Frontend Development Guide

This comprehensive guide covers the frontend development approach, implementation details, and best practices for the MWAP platform.

## 🎯 Frontend Overview

### Platform Vision
MWAP frontend is a modern, responsive web application that provides an intuitive interface for managing multi-tenant projects, cloud integrations, and file operations. The frontend emphasizes user experience, performance, and maintainability.

### Key Features
- **Multi-tenant Management**: Tenant creation, configuration, and user management
- **Project Collaboration**: Project creation, member management, and role-based access
- **Cloud Integration**: OAuth-based integration with Google Drive, Dropbox, OneDrive
- **File Management**: Virtual file operations across multiple cloud providers
- **Authentication**: Secure Auth0-based authentication with PKCE flow
- **Real-time Updates**: Live data synchronization and notifications

## 🏗️ Architecture Overview

### Frontend Stack
```
┌─────────────────────────────────────────────────────┐
│                 Presentation Layer                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │    React    │ │   Mantine   │ │    Vite     │   │
│  │ Components  │ │  UI Library │ │ Build Tool  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                  State Management                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │React Query  │ │   Context   │ │Local State  │   │
│  │Server State │ │Global State │ │Component    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                 Communication Layer                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │    Axios    │ │   Auth0     │ │WebSockets   │   │
│  │  HTTP API   │ │    Auth     │ │(Future)     │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Core Technologies
- **React 18+**: Modern React with hooks, concurrent features, and Suspense
- **TypeScript**: Strict type checking and enhanced developer experience
- **Vite**: Fast development server and optimized production builds
- **Mantine**: Comprehensive UI component library with theming
- **React Query**: Server state management and caching
- **React Router**: Client-side routing and navigation
- **Auth0**: Authentication and authorization
- **Axios**: HTTP client for API communication

## 🚀 Getting Started

### Development Environment Setup

#### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Git 2.25+
- Modern code editor (VS Code recommended)

#### Initial Setup
```bash
# Clone the frontend repository
git clone <frontend-repo-url>
cd mwap-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

#### Environment Configuration
```bash
# .env.local
VITE_API_URL=http://localhost:3000/api/v1
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.mwap.dev
VITE_AUTH0_REDIRECT_URI=http://localhost:5173/callback
```

### Project Structure
```
src/
├── components/          # Reusable UI components
├── features/           # Feature-specific modules
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # Global styles and themes
└── assets/             # Static assets
```

## 🎨 UI/UX Implementation

### Design System
MWAP uses Mantine as the primary UI library, customized with a consistent design system:

```typescript
// styles/theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';

const primaryColor: MantineColorsTuple = [
  '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6',
  '#42a5f5', '#2196f3', '#1e88e5', '#1976d2',
  '#1565c0', '#0d47a1'
];

export const theme = createTheme({
  primaryColor: 'blue',
  colors: { blue: primaryColor },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  headings: { fontFamily: 'Inter, sans-serif' },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radius: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
});
```

### Component Standards
```typescript
// Consistent component structure
export const ComponentName: React.FC<ComponentProps> = ({ 
  // Props with defaults
  variant = 'default',
  size = 'md',
  loading = false,
  ...props 
}) => {
  // Hooks at the top
  const { data, error, isLoading } = useQuery();
  const theme = useMantineTheme();
  
  // Event handlers
  const handleAction = useCallback(() => {
    // Implementation
  }, []);
  
  // Early returns for loading/error states
  if (isLoading) return <Skeleton height={200} />;
  if (error) return <ErrorMessage error={error} />;
  
  // Main render
  return (
    <Box {...props}>
      {/* Component content */}
    </Box>
  );
};
```

### Responsive Design
```typescript
// Mobile-first responsive approach
import { useMediaQuery } from '@mantine/hooks';

export const ResponsiveComponent: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
        <MainContent />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
        {!isMobile && <Sidebar />}
      </Grid.Col>
    </Grid>
  );
};
```

## 🔄 State Management

### React Query for Server State
```typescript
// API data management
export const useTenants = () => {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tenantApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      notifications.show({
        title: 'Success',
        message: 'Tenant created successfully',
        color: 'green',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    },
  });
};
```

### Context for Global State
```typescript
// Authentication context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  const login = () => loginWithRedirect();
  const logout = () => auth0Logout({ returnTo: window.location.origin });

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Form State Management
```typescript
// React Hook Form integration
export const TenantForm: React.FC<TenantFormProps> = ({ tenant, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    control,
  } = useForm<TenantFormData>({
    defaultValues: {
      name: tenant?.name || '',
      description: tenant?.description || '',
      settings: {
        allowPublicProjects: tenant?.settings?.allowPublicProjects || false,
        maxProjects: tenant?.settings?.maxProjects || 10,
      },
    },
    resolver: yupResolver(tenantSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing="md">
        <TextInput
          label="Tenant Name"
          error={errors.name?.message}
          {...register('name')}
        />
        
        <Controller
          name="settings.allowPublicProjects"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Allow public projects"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        
        <Button type="submit" loading={isSubmitting}>
          {tenant ? 'Update' : 'Create'} Tenant
        </Button>
      </Stack>
    </form>
  );
};
```

## 🔐 Authentication Implementation

### Auth0 Integration
```typescript
// Auth0 provider setup
import { Auth0Provider } from '@auth0/auth0-react';

export const AuthProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
};
```

### Protected Routes
```typescript
// Route protection
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Router setup with protection
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tenants" element={<TenantsPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};
```

## 🌐 API Integration

### HTTP Client Setup
```typescript
// API client with interceptors
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor for auth token
export const useApiClient = () => {
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use(
      async (config) => {
        try {
          const token = await getAccessTokenSilently();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('Failed to get access token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
    };
  }, [getAccessTokenSilently]);

  return apiClient;
};
```

### API Service Layer
```typescript
// Tenant API service
export const tenantApi = {
  getAll: async (): Promise<Tenant[]> => {
    const response = await apiClient.get('/tenants');
    return response.data.data;
  },

  getById: async (id: string): Promise<Tenant> => {
    const response = await apiClient.get(`/tenants/${id}`);
    return response.data.data;
  },

  create: async (data: CreateTenantRequest): Promise<Tenant> => {
    const response = await apiClient.post('/tenants', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateTenantRequest): Promise<Tenant> => {
    const response = await apiClient.patch(`/tenants/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenants/${id}`);
  },
};
```

## 🎨 Feature Implementation

### Tenant Management
```typescript
// Tenant management page
export const TenantsPage: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: tenants, isLoading } = useTenants();
  const createTenant = useCreateTenant();

  const handleCreateTenant = async (data: CreateTenantRequest) => {
    await createTenant.mutateAsync(data);
    setCreateModalOpen(false);
  };

  return (
    <Container size="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Tenants</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Tenant
        </Button>
      </Group>

      {isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={200} />
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {tenants?.map((tenant) => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
        </SimpleGrid>
      )}

      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Tenant"
        size="md"
      >
        <TenantForm onSubmit={handleCreateTenant} />
      </Modal>
    </Container>
  );
};
```

### Cloud Integration
```typescript
// Cloud integration component
export const CloudIntegrationsPage: React.FC = () => {
  const { data: integrations, isLoading } = useCloudIntegrations();
  const { data: providers } = useCloudProviders();
  const connectProvider = useConnectProvider();

  const handleConnect = async (providerId: string) => {
    try {
      const authUrl = await connectProvider.mutateAsync(providerId);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate OAuth flow:', error);
    }
  };

  return (
    <Container size="xl">
      <Title order={2} mb="lg">Cloud Integrations</Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card>
            <Card.Section withBorder inheritPadding py="xs">
              <Text fw={500}>Connected Providers</Text>
            </Card.Section>
            
            <Card.Section inheritPadding py="xs">
              {isLoading ? (
                <Stack>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={60} />
                  ))}
                </Stack>
              ) : integrations?.length ? (
                <Stack>
                  {integrations.map((integration) => (
                    <IntegrationCard 
                      key={integration.id} 
                      integration={integration} 
                    />
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  No integrations connected yet
                </Text>
              )}
            </Card.Section>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card>
            <Card.Section withBorder inheritPadding py="xs">
              <Text fw={500}>Available Providers</Text>
            </Card.Section>
            
            <Card.Section inheritPadding py="xs">
              <Stack>
                {providers?.map((provider) => (
                  <ProviderCard 
                    key={provider.id} 
                    provider={provider}
                    onConnect={() => handleConnect(provider.id)}
                  />
                ))}
              </Stack>
            </Card.Section>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
};
```

## 🧪 Testing Implementation

### Component Testing
```typescript
// Component test example
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { TenantCard } from './TenantCard';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        {component}
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('TenantCard', () => {
  const mockTenant = {
    id: '1',
    name: 'Test Tenant',
    description: 'Test Description',
    projectCount: 5,
    memberCount: 3,
    settings: { allowPublicProjects: true },
  };

  it('renders tenant information correctly', () => {
    renderWithProviders(<TenantCard tenant={mockTenant} />);
    
    expect(screen.getByText('Test Tenant')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('5 projects')).toBeInTheDocument();
    expect(screen.getByText('3 members')).toBeInTheDocument();
  });

  it('handles edit action', async () => {
    const onEdit = jest.fn();
    renderWithProviders(<TenantCard tenant={mockTenant} onEdit={onEdit} />);
    
    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(onEdit).toHaveBeenCalledWith(mockTenant);
    });
  });
});
```

### Integration Testing
```typescript
// Integration test for API
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTenants } from './useTenants';
import { tenantApi } from '../services/tenantApi';

jest.mock('../services/tenantApi');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTenants', () => {
  it('fetches tenants successfully', async () => {
    const mockTenants = [
      { id: '1', name: 'Tenant 1' },
      { id: '2', name: 'Tenant 2' },
    ];
    
    (tenantApi.getAll as jest.Mock).mockResolvedValue(mockTenants);
    
    const { result } = renderHook(() => useTenants(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toEqual(mockTenants);
  });
});
```

## 🚀 Performance Optimization

### Code Splitting
```typescript
// Lazy loading for route components
import { lazy, Suspense } from 'react';
import { Loader } from '@mantine/core';

const TenantsPage = lazy(() => import('../pages/TenantsPage'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));

export const LazyRoute: React.FC<{ component: React.ComponentType }> = ({ 
  component: Component 
}) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);
```

### Memoization
```typescript
// Optimized list component
export const TenantList = memo<TenantListProps>(({ 
  tenants, 
  onTenantSelect,
  selectedTenantId 
}) => {
  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => !tenant.archived);
  }, [tenants]);

  const handleTenantClick = useCallback((tenant: Tenant) => {
    onTenantSelect(tenant.id);
  }, [onTenantSelect]);

  return (
    <Stack>
      {filteredTenants.map(tenant => (
        <TenantCard
          key={tenant.id}
          tenant={tenant}
          onClick={handleTenantClick}
          selected={tenant.id === selectedTenantId}
        />
      ))}
    </Stack>
  );
});
```

## 📱 Progressive Web App Features

See [PWA Features](./PWA-features.md) for detailed implementation of Progressive Web App capabilities.

## 🔧 Build and Deployment

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze
```

### Environment Configuration
```typescript
// Environment-specific configuration
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  auth0: {
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  },
  features: {
    enablePWA: import.meta.env.VITE_ENABLE_PWA === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
};
```

---

*This frontend guide provides comprehensive coverage of MWAP's frontend architecture, implementation patterns, and best practices for building a modern, scalable web application.* 