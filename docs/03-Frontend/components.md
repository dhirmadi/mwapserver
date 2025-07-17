# 🎨 MWAP UI Components Library

## 🎯 Overview

The MWAP component library follows atomic design principles, providing a comprehensive set of reusable, accessible, and type-safe React components. Built with TypeScript-first approach and designed for multi-tenant applications with role-based access control.

## 🏗️ Component Architecture

### **Atomic Design Structure**
```
components/
├── atoms/           # Basic building blocks
│   ├── Button/
│   ├── Input/
│   ├── Icon/
│   └── Badge/
├── molecules/       # Component combinations
│   ├── SearchBox/
│   ├── UserAvatar/
│   ├── StatusCard/
│   └── FormField/
├── organisms/       # Complex components
│   ├── Navigation/
│   ├── ProjectCard/
│   ├── UserTable/
│   └── Dashboard/
└── templates/       # Page layouts
    ├── AuthLayout/
    ├── DashboardLayout/
    └── ProjectLayout/
```

### **Component Standards**
```typescript
// Component Interface Pattern
interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  'data-testid'?: string;
}

// Component Implementation Pattern
export const Component: React.FC<ComponentProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  'data-testid': testId,
  ...props
}) => {
  const classes = cn(
    'base-styles',
    variants[variant],
    sizes[size],
    { 'disabled-styles': disabled },
    { 'loading-styles': loading },
    className
  );

  return (
    <element
      className={classes}
      disabled={disabled}
      data-testid={testId}
      {...props}
    >
      {loading ? <LoadingSpinner /> : children}
    </element>
  );
};
```

## ⚛️ Atoms - Basic Building Blocks

### **Button Component**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className,
  ...props
}) => {
  const classes = cn(
    'inline-flex items-center justify-center font-medium rounded-md transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      'px-3 py-1.5 text-sm': size === 'sm',
      'px-4 py-2 text-sm': size === 'md',
      'px-6 py-3 text-base': size === 'lg',
    },
    {
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
      'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500': variant === 'secondary',
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
      'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
    },
    {
      'w-full': fullWidth,
      'opacity-50 cursor-not-allowed': disabled || loading,
    },
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// Usage Examples
<Button variant="primary" size="md">Save Project</Button>
<Button variant="danger" loading={isDeleting}>Delete</Button>
<Button variant="ghost" icon={<PlusIcon />}>Add Item</Button>
```

### **Input Component**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const inputClasses = cn(
    'block w-full rounded-md border-gray-300 shadow-sm',
    'focus:border-blue-500 focus:ring-blue-500',
    'disabled:bg-gray-50 disabled:text-gray-500',
    {
      'pl-10': leftIcon,
      'pr-10': rightIcon,
      'border-red-300 focus:border-red-500 focus:ring-red-500': error,
    },
    className
  );

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm">{leftIcon}</span>
          </div>
        )}
        
        <input
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-gray-400 sm:text-sm">{rightIcon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};
```

### **Badge Component**
```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className
}) => {
  const classes = cn(
    'inline-flex items-center font-medium rounded-full',
    {
      'px-2 py-0.5 text-xs': size === 'sm',
      'px-2.5 py-0.5 text-sm': size === 'md',
      'px-3 py-1 text-sm': size === 'lg',
    },
    {
      'bg-gray-100 text-gray-800': variant === 'default',
      'bg-green-100 text-green-800': variant === 'success',
      'bg-yellow-100 text-yellow-800': variant === 'warning',
      'bg-red-100 text-red-800': variant === 'danger',
      'bg-blue-100 text-blue-800': variant === 'info',
    },
    className
  );

  return (
    <span className={classes}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          {
            'bg-gray-400': variant === 'default',
            'bg-green-400': variant === 'success',
            'bg-yellow-400': variant === 'warning',
            'bg-red-400': variant === 'danger',
            'bg-blue-400': variant === 'info',
          }
        )} />
      )}
      {children}
    </span>
  );
};
```

## 🧬 Molecules - Component Combinations

### **SearchBox Component**
```typescript
interface SearchBoxProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  loading?: boolean;
  suggestions?: string[];
  className?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  onSearch,
  loading = false,
  suggestions = [],
  className
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        onChange(suggestions[selectedIndex]);
      }
      onSearch?.(value);
      setShowSuggestions(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        leftIcon={<SearchIcon className="h-4 w-4" />}
        rightIcon={loading ? <LoadingSpinner className="h-4 w-4" /> : null}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className={cn(
                "w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100",
                { "bg-blue-50": index === selectedIndex }
              )}
              onClick={() => {
                onChange(suggestion);
                onSearch?.(suggestion);
                setShowSuggestions(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### **UserAvatar Component**
```typescript
interface UserAvatarProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showEmail?: boolean;
  online?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showName = false,
  showEmail = false,
  online,
  className
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className="relative">
        {user.avatar ? (
          <img
            className={cn(
              "rounded-full object-cover",
              sizeClasses[size]
            )}
            src={user.avatar}
            alt={user.name}
          />
        ) : (
          <div className={cn(
            "rounded-full bg-gray-500 flex items-center justify-center text-white font-medium",
            sizeClasses[size],
            {
              'text-xs': size === 'sm',
              'text-sm': size === 'md',
              'text-base': size === 'lg',
              'text-lg': size === 'xl'
            }
          )}>
            {getInitials(user.name)}
          </div>
        )}
        
        {online !== undefined && (
          <span className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
            {
              'h-1.5 w-1.5': size === 'sm',
              'h-2 w-2': size === 'md',
              'h-2.5 w-2.5': size === 'lg',
              'h-3 w-3': size === 'xl'
            },
            online ? 'bg-green-400' : 'bg-gray-400'
          )} />
        )}
      </div>
      
      {(showName || showEmail) && (
        <div className="min-w-0 flex-1">
          {showName && (
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
          )}
          {showEmail && user.email && (
            <p className="text-sm text-gray-500 truncate">
              {user.email}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
```

## 🏢 Organisms - Complex Components

### **ProjectCard Component**
```typescript
interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'archived' | 'draft';
    type: string;
    members: number;
    lastActivity: Date;
    owner: {
      name: string;
      avatar?: string;
    };
  };
  onEdit?: (projectId: string) => void;
  onArchive?: (projectId: string) => void;
  onView?: (projectId: string) => void;
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onArchive,
  onView,
  className
}) => {
  const statusColors = {
    active: 'success',
    archived: 'default',
    draft: 'warning'
  } as const;

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {project.name}
            </h3>
            <Badge variant={statusColors[project.status]} size="sm">
              {project.status}
            </Badge>
          </div>
          
          {project.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {project.description}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <UsersIcon className="h-4 w-4 mr-1" />
              {project.members} members
            </span>
            <span className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatDistanceToNow(project.lastActivity)} ago
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <UserAvatar user={project.owner} size="sm" />
          
          <div className="flex items-center space-x-1">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(project.id)}
                aria-label="View project"
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
            )}
            
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(project.id)}
                aria-label="Edit project"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            )}
            
            {onArchive && project.status !== 'archived' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onArchive(project.id)}
                aria-label="Archive project"
              >
                <ArchiveIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### **Navigation Component**
```typescript
interface NavigationProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    role: 'superadmin' | 'tenant_owner' | 'project_member';
  };
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  user,
  currentPath,
  onNavigate,
  onLogout
}) => {
  const getNavigationItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
      { path: '/projects', label: 'Projects', icon: FolderIcon },
      { path: '/profile', label: 'Profile', icon: UserIcon }
    ];

    if (user.role === 'superadmin') {
      return [
        ...baseItems,
        { path: '/admin/tenants', label: 'Tenants', icon: BuildingOfficeIcon },
        { path: '/admin/users', label: 'Users', icon: UsersIcon },
        { path: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon }
      ];
    }

    if (user.role === 'tenant_owner') {
      return [
        ...baseItems,
        { path: '/tenant/settings', label: 'Tenant Settings', icon: CogIcon },
        { path: '/tenant/members', label: 'Team Members', icon: UsersIcon },
        { path: '/tenant/billing', label: 'Billing', icon: CreditCardIcon }
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white border-r border-gray-200 w-64 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <UserAvatar user={user} size="md" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-1">
          {navigationItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <button
                  onClick={() => onNavigate(item.path)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          fullWidth
          onClick={onLogout}
          className="justify-start"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
};
```

## 📄 Templates - Page Layouts

### **DashboardLayout Template**
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  title?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  title,
  actions,
  breadcrumbs
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth0();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 flex z-40 md:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <Navigation
            user={user}
            currentPath={location.pathname}
            onNavigate={(path) => {
              navigate(path);
              setSidebarOpen(false);
            }}
            onLogout={() => logout({ returnTo: window.location.origin })}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Navigation
          user={user}
          currentPath={location.pathname}
          onNavigate={navigate}
          onLogout={() => logout({ returnTo: window.location.origin })}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              {breadcrumbs && (
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-4">
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index}>
                        <div className="flex items-center">
                          {index > 0 && (
                            <ChevronRightIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-4" />
                          )}
                          {crumb.href ? (
                            <a
                              href={crumb.href}
                              className="text-sm font-medium text-gray-500 hover:text-gray-700"
                            >
                              {crumb.label}
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {crumb.label}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              
              {title && (
                <h1 className="text-2xl font-semibold text-gray-900 mt-2">
                  {title}
                </h1>
              )}
            </div>
            
            {actions && (
              <div className="ml-4 flex items-center space-x-4">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
```

## 🎨 Design System

### **Color Palette**
```typescript
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a'
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309'
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  }
};
```

### **Typography Scale**
```typescript
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }]
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
};
```

### **Spacing System**
```typescript
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
};
```

## 🧪 Component Testing

### **Testing Utilities**
```typescript
// Test utilities for components
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Component test example
describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
    description: 'Test description',
    status: 'active' as const,
    type: 'web',
    members: 5,
    lastActivity: new Date(),
    owner: { name: 'John Doe' }
  };

  it('renders project information correctly', () => {
    render(
      <ProjectCard project={mockProject} />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('5 members')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    
    render(
      <ProjectCard project={mockProject} onEdit={onEdit} />,
      { wrapper: TestWrapper }
    );

    fireEvent.click(screen.getByLabelText('Edit project'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

## 📚 Related Documentation

- [🏗️ Frontend Architecture](./architecture.md) - Overall architecture patterns
- [🔐 Authentication](./authentication.md) - Auth0 integration
- [🔌 API Integration](./api-integration.md) - Backend integration patterns
- [📱 PWA Features](./PWA-features.md) - Progressive Web App capabilities

---

*The MWAP component library provides a comprehensive, accessible, and maintainable foundation for building consistent user interfaces across the entire platform.*