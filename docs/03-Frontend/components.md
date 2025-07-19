# Frontend Components

This document describes the component architecture, design patterns, and implementation guidelines for MWAP frontend components.

## 🏗️ Component Architecture

### Component Hierarchy

```
Application
├── App Layout
│   ├── Header
│   │   ├── Navigation
│   │   ├── User Menu
│   │   └── Notifications
│   ├── Sidebar
│   │   ├── Navigation Menu
│   │   └── Quick Actions
│   └── Main Content
│       ├── Page Header
│       ├── Content Area
│       └── Page Footer
└── Global Components
    ├── Error Boundary
    ├── Loading States
    ├── Modals
    └── Notifications
```

## 🧩 Component Categories

### 1. Layout Components

#### AppLayout
**Purpose**: Main application shell providing consistent layout structure.

```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
  fullWidth?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  hideNavigation = false,
  fullWidth = false
}) => {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: hideNavigation ? 0 : 250, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      
      {!hideNavigation && (
        <AppShell.Navbar>
          <Sidebar />
        </AppShell.Navbar>
      )}
      
      <AppShell.Main>
        <Container size={fullWidth ? '100%' : 'xl'}>
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};
```

#### Header
**Purpose**: Application header with navigation, user menu, and notifications.

```typescript
export const Header: React.FC = () => {
  const { user } = useAuth();
  const { data: notifications } = useNotifications();

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Logo />
        <MainNavigation />
      </Group>
      
      <Group>
        <NotificationButton count={notifications?.unread || 0} />
        <UserMenu user={user} />
      </Group>
    </Group>
  );
};
```

#### Sidebar
**Purpose**: Navigation sidebar with feature access and quick actions.

```typescript
export const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const { data: currentTenant } = useCurrentTenant();

  return (
    <NavLink
      href="/dashboard"
      label="Dashboard"
      leftSection={<IconDashboard size={16} />}
      active={pathname === '/dashboard'}
    />
    // Additional navigation items...
  );
};
```

### 2. UI Components

#### Button Components
**Purpose**: Consistent button styling and behavior across the application.

```typescript
interface ButtonProps extends MantineButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  ...props
}) => {
  const variantMap = {
    primary: { variant: 'filled', color: 'blue' },
    secondary: { variant: 'outline', color: 'blue' },
    danger: { variant: 'filled', color: 'red' },
    ghost: { variant: 'subtle', color: 'gray' },
  };

  return (
    <MantineButton
      {...variantMap[variant]}
      size={size}
      loading={loading}
      leftSection={icon}
      {...props}
    >
      {children}
    </MantineButton>
  );
};
```

#### Input Components
**Purpose**: Form input components with consistent validation and styling.

```typescript
interface InputFieldProps extends TextInputProps {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  required,
  error,
  helperText,
  ...props
}) => {
  return (
    <TextInput
      name={name}
      label={label}
      required={required}
      error={error}
      description={helperText}
      {...props}
    />
  );
};
```

#### Modal Components
**Purpose**: Consistent modal dialogs for various interactions.

```typescript
interface ModalWrapperProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  opened,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size={size}
      centered
    >
      {children}
    </Modal>
  );
};
```

### 3. Form Components

#### Form Wrapper
**Purpose**: Consistent form handling with validation and submission.

```typescript
interface FormWrapperProps<T> {
  initialValues: T;
  validationSchema: yup.ObjectSchema<T>;
  onSubmit: (values: T) => Promise<void>;
  children: (formik: FormikProps<T>) => React.ReactNode;
}

export const FormWrapper = <T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
  children
}: FormWrapperProps<T>) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {(formik) => (
        <form onSubmit={formik.handleSubmit}>
          {children(formik)}
        </form>
      )}
    </Formik>
  );
};
```

#### Field Components
**Purpose**: Form field components integrated with form state management.

```typescript
export const FormField: React.FC<{
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}> = ({ name, label, type = 'text', required }) => {
  const [field, meta] = useField(name);
  
  return (
    <TextInput
      {...field}
      label={label}
      type={type}
      required={required}
      error={meta.touched && meta.error ? meta.error : undefined}
    />
  );
};
```

### 4. Data Display Components

#### Table Component
**Purpose**: Consistent data table with sorting, filtering, and pagination.

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading,
  pagination,
  onRowClick
}: DataTableProps<T>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Box>
      <Table>
        <Table.Thead>
          {table.getHeaderGroups().map(headerGroup => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <Table.Th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </Table.Th>
              ))}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map(row => (
            <Table.Tr 
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {row.getVisibleCells().map(cell => (
                <Table.Td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      
      {pagination && (
        <Pagination
          value={pagination.page}
          onChange={pagination.onPageChange}
          total={Math.ceil(pagination.total / pagination.pageSize)}
        />
      )}
    </Box>
  );
};
```

#### Card Components
**Purpose**: Consistent card layouts for displaying information.

```typescript
interface CardWrapperProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
  title,
  subtitle,
  actions,
  children,
  loading
}) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      {(title || actions) && (
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <div>
              {title && <Text fw={500}>{title}</Text>}
              {subtitle && <Text size="sm" c="dimmed">{subtitle}</Text>}
            </div>
            {actions}
          </Group>
        </Card.Section>
      )}
      
      <Card.Section inheritPadding py="xs">
        {loading ? <Skeleton height={200} /> : children}
      </Card.Section>
    </Card>
  );
};
```

### 5. Feature-Specific Components

#### Tenant Components
**Purpose**: Components specific to tenant management functionality.

```typescript
// TenantCard Component
export const TenantCard: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  const { mutate: deleteTenant } = useDeleteTenant();

  return (
    <CardWrapper
      title={tenant.name}
      subtitle={`${tenant.projectCount} projects`}
      actions={
        <Menu>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDots />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit />}>Edit</Menu.Item>
            <Menu.Item 
              leftSection={<IconTrash />}
              color="red"
              onClick={() => deleteTenant(tenant.id)}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      }
    >
      <Text size="sm" c="dimmed">{tenant.description}</Text>
      <Group mt="md">
        <Badge variant="light">
          {tenant.settings.allowPublicProjects ? 'Public' : 'Private'}
        </Badge>
        <Badge variant="outline">
          {tenant.memberCount} members
        </Badge>
      </Group>
    </CardWrapper>
  );
};

// TenantForm Component
export const TenantForm: React.FC<{
  tenant?: Tenant;
  onSubmit: (data: TenantFormData) => void;
}> = ({ tenant, onSubmit }) => {
  const form = useForm({
    initialValues: {
      name: tenant?.name || '',
      description: tenant?.description || '',
      allowPublicProjects: tenant?.settings.allowPublicProjects || false,
    },
    validate: {
      name: (value) => value.length < 2 ? 'Name must be at least 2 characters' : null,
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput
          required
          label="Tenant Name"
          {...form.getInputProps('name')}
        />
        <Textarea
          label="Description"
          {...form.getInputProps('description')}
        />
        <Checkbox
          label="Allow public projects"
          {...form.getInputProps('allowPublicProjects', { type: 'checkbox' })}
        />
        <Group justify="flex-end">
          <Button type="submit">
            {tenant ? 'Update' : 'Create'} Tenant
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
```

#### Project Components
**Purpose**: Components for project management and collaboration.

```typescript
// ProjectDashboard Component
export const ProjectDashboard: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data: project, isLoading } = useProject(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: recentFiles } = useRecentFiles(projectId);

  if (isLoading) return <Skeleton height={400} />;

  return (
    <Grid>
      <Grid.Col span={8}>
        <Stack>
          <ProjectOverview project={project} />
          <RecentFiles files={recentFiles} />
        </Stack>
      </Grid.Col>
      <Grid.Col span={4}>
        <Stack>
          <ProjectMembers members={members} />
          <ProjectActivity projectId={projectId} />
        </Stack>
      </Grid.Col>
    </Grid>
  );
};

// FileExplorer Component
export const FileExplorer: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const { data: integrations } = useCloudIntegrations();
  const { data: files, isLoading } = useFiles(projectId, selectedProvider);

  return (
    <Stack>
      <Group>
        <Select
          placeholder="Select cloud provider"
          data={integrations?.map(i => ({ value: i.id, label: i.provider }))}
          value={selectedProvider}
          onChange={setSelectedProvider}
        />
        <Button leftSection={<IconRefresh />}>Refresh</Button>
      </Group>
      
      {isLoading ? (
        <Skeleton height={300} />
      ) : (
        <FileList files={files} onFileSelect={(file) => console.log(file)} />
      )}
    </Stack>
  );
};
```

## 🎨 Component Design Patterns

### 1. Compound Components
**Purpose**: Create flexible component APIs with related sub-components.

```typescript
interface CardCompoundProps {
  children: React.ReactNode;
}

const Card = ({ children }: CardCompoundProps) => {
  return <div className="card">{children}</div>;
};

Card.Header = ({ children }: { children: React.ReactNode }) => {
  return <div className="card-header">{children}</div>;
};

Card.Body = ({ children }: { children: React.ReactNode }) => {
  return <div className="card-body">{children}</div>;
};

Card.Footer = ({ children }: { children: React.ReactNode }) => {
  return <div className="card-footer">{children}</div>;
};

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

### 2. Render Props Pattern
**Purpose**: Share code between components using props whose value is a function.

```typescript
interface DataFetcherProps<T> {
  url: string;
  children: (data: {
    data: T | null;
    loading: boolean;
    error: Error | null;
  }) => React.ReactNode;
}

export const DataFetcher = <T,>({ url, children }: DataFetcherProps<T>) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [url],
    queryFn: () => fetch(url).then(res => res.json()),
  });

  return <>{children({ data, loading: isLoading, error })}</>;
};

// Usage
<DataFetcher<Tenant[]> url="/api/tenants">
  {({ data, loading, error }) => {
    if (loading) return <Skeleton />;
    if (error) return <Text color="red">Error loading data</Text>;
    return <TenantList tenants={data} />;
  }}
</DataFetcher>
```

### 3. Higher-Order Components (HOCs)
**Purpose**: Reuse component logic across different components.

```typescript
interface WithLoadingProps {
  loading: boolean;
}

export const withLoading = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P & WithLoadingProps) => {
    const { loading, ...otherProps } = props;
    
    if (loading) {
      return <Skeleton height={200} />;
    }
    
    return <Component {...(otherProps as P)} />;
  };
};

// Usage
const TenantListWithLoading = withLoading(TenantList);
```

### 4. Custom Hooks for Component Logic
**Purpose**: Extract and reuse component logic in custom hooks.

```typescript
export const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(prev => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return { value, toggle, setTrue, setFalse };
};

// Usage in component
export const CollapsibleCard: React.FC<{ title: string; children: React.ReactNode }> = ({ 
  title, 
  children 
}) => {
  const { value: isExpanded, toggle } = useToggle(true);
  
  return (
    <Card>
      <Card.Header>
        <Group justify="space-between">
          <Text>{title}</Text>
          <ActionIcon onClick={toggle}>
            {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
          </ActionIcon>
        </Group>
      </Card.Header>
      <Collapse in={isExpanded}>
        <Card.Body>{children}</Card.Body>
      </Collapse>
    </Card>
  );
};
```

## 🔧 Component Development Guidelines

### 1. Component Naming
- Use PascalCase for component names
- Use descriptive names that indicate purpose
- Prefix feature-specific components with feature name

### 2. Props Interface
- Define clear TypeScript interfaces for props
- Use optional props with default values when appropriate
- Extend existing interfaces when building upon base components

### 3. Component Structure
```typescript
// 1. Imports
import React from 'react';
import { Box, Button } from '@mantine/core';

// 2. Types and interfaces
interface ComponentProps {
  // prop definitions
}

// 3. Component implementation
export const Component: React.FC<ComponentProps> = ({
  // destructured props
}) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Event handlers
  const handleClick = () => {
    // implementation
  };
  
  // 6. Early returns (loading, error states)
  if (loading) return <Skeleton />;
  
  // 7. Main render
  return (
    <Box>
      {/* JSX content */}
    </Box>
  );
};
```

### 4. Performance Optimization
- Use React.memo for components that receive stable props
- Implement useMemo and useCallback for expensive computations
- Avoid inline functions and objects in JSX
- Use React.lazy for code splitting when appropriate

---

*This component architecture ensures consistent, maintainable, and reusable UI components across the MWAP frontend application.* 