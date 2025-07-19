# Frontend Folder Structure

This document describes the organization and structure of the MWAP frontend codebase.

## 📁 Project Root Structure

```
mwap-frontend/
├── public/                     # Static assets
│   ├── index.html             # Main HTML template
│   ├── favicon.ico            # Application favicon
│   ├── manifest.json          # PWA manifest
│   └── robots.txt             # SEO robots file
├── src/                       # Source code
├── tests/                     # Test utilities and setup
├── docs/                      # Frontend documentation
├── .env.example               # Environment variables template
├── .env.local                 # Local environment variables
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
├── vitest.config.ts           # Test configuration
└── README.md                  # Project documentation
```

## 🗂️ Source Code Structure (`src/`)

```
src/
├── components/                # Shared UI components
│   ├── ui/                   # Basic UI components
│   ├── layout/               # Layout components
│   ├── forms/                # Reusable form components
│   └── common/               # Common utility components
├── features/                 # Feature-specific code
│   ├── auth/                # Authentication feature
│   ├── tenants/             # Tenant management
│   ├── projects/            # Project management
│   ├── files/               # File management
│   ├── integrations/        # Cloud integrations
│   └── admin/               # Admin features
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts          # Authentication hooks
│   ├── useApi.ts           # API interaction hooks
│   └── useLocalStorage.ts  # Local storage hooks
├── services/                # API and external services
│   ├── api/                # API service layer
│   ├── auth/               # Authentication services
│   └── storage/            # Storage services
├── types/                   # TypeScript type definitions
│   ├── api.types.ts        # API response types
│   ├── auth.types.ts       # Authentication types
│   └── common.types.ts     # Common shared types
├── utils/                   # Utility functions
│   ├── formatting.ts       # Data formatting utilities
│   ├── validation.ts       # Validation helpers
│   └── constants.ts        # Application constants
├── styles/                  # Global styles and themes
│   ├── globals.css         # Global CSS styles
│   ├── theme.ts            # Mantine theme configuration
│   └── variables.css       # CSS custom properties
├── assets/                  # Static assets used in components
│   ├── images/             # Image files
│   ├── icons/              # Icon files
│   └── fonts/              # Custom fonts
├── App.tsx                  # Main application component
├── main.tsx                # Application entry point
└── vite-env.d.ts           # Vite environment types
```

## 🧩 Component Organization

### Shared Components (`components/`)

```
components/
├── ui/                      # Basic UI building blocks
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.types.ts
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Modal/
│   ├── Card/
│   └── Table/
├── layout/                  # Layout components
│   ├── Header/
│   │   ├── Header.tsx
│   │   ├── Header.module.css
│   │   └── index.ts
│   ├── Sidebar/
│   ├── Footer/
│   └── AppLayout/
├── forms/                   # Reusable form components
│   ├── FormField/
│   ├── FormSelect/
│   ├── FormDatePicker/
│   └── FormValidation/
└── common/                  # Common utility components
    ├── ErrorBoundary/
    ├── LoadingSpinner/
    ├── ConfirmDialog/
    └── NotificationProvider/
```

### Feature Components (`features/`)

```
features/
├── auth/                    # Authentication feature
│   ├── components/
│   │   ├── LoginForm/
│   │   ├── LogoutButton/
│   │   └── UserProfile/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useAuthRedirect.ts
│   ├── services/
│   │   └── authService.ts
│   ├── types/
│   │   └── auth.types.ts
│   └── index.ts
├── tenants/                 # Tenant management
│   ├── components/
│   │   ├── TenantList/
│   │   ├── TenantForm/
│   │   ├── TenantCard/
│   │   └── TenantSettings/
│   ├── hooks/
│   │   ├── useTenants.ts
│   │   └── useTenantForm.ts
│   ├── services/
│   │   └── tenantApi.ts
│   ├── types/
│   │   └── tenant.types.ts
│   └── index.ts
├── projects/                # Project management
│   ├── components/
│   │   ├── ProjectList/
│   │   ├── ProjectForm/
│   │   ├── ProjectCard/
│   │   ├── ProjectDashboard/
│   │   └── ProjectMembers/
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   ├── useProjectMembers.ts
│   │   └── useProjectForm.ts
│   ├── services/
│   │   ├── projectApi.ts
│   │   └── memberApi.ts
│   ├── types/
│   │   ├── project.types.ts
│   │   └── member.types.ts
│   └── index.ts
├── files/                   # File management
│   ├── components/
│   │   ├── FileList/
│   │   ├── FileViewer/
│   │   ├── FileUpload/
│   │   └── FileActions/
│   ├── hooks/
│   │   ├── useFiles.ts
│   │   └── useFileUpload.ts
│   ├── services/
│   │   └── fileApi.ts
│   ├── types/
│   │   └── file.types.ts
│   └── index.ts
└── integrations/            # Cloud integrations
    ├── components/
    │   ├── IntegrationList/
    │   ├── ConnectProvider/
    │   └── IntegrationStatus/
    ├── hooks/
    │   ├── useIntegrations.ts
    │   └── useOAuthFlow.ts
    ├── services/
    │   └── integrationApi.ts
    ├── types/
    │   └── integration.types.ts
    └── index.ts
```

## 📝 File Naming Conventions

### Component Files
- **Component**: `ComponentName.tsx`
- **Types**: `ComponentName.types.ts`
- **Tests**: `ComponentName.test.tsx`
- **Styles**: `ComponentName.module.css`
- **Index**: `index.ts` (for exports)

### Hook Files
- **Custom Hooks**: `use[HookName].ts`
- **Example**: `useAuth.ts`, `useProjects.ts`, `useTenants.ts`

### Service Files
- **API Services**: `[domain]Api.ts`
- **Other Services**: `[service]Service.ts`
- **Example**: `tenantApi.ts`, `authService.ts`

### Type Files
- **Domain Types**: `[domain].types.ts`
- **Common Types**: `common.types.ts`
- **API Types**: `api.types.ts`

### Utility Files
- **Utilities**: `[purpose].ts`
- **Example**: `formatting.ts`, `validation.ts`, `constants.ts`

## 🎨 Styling Organization

### CSS Module Structure
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.module.css
└── index.ts
```

### Global Styles
```
styles/
├── globals.css              # Global CSS reset and base styles
├── theme.ts                # Mantine theme configuration
├── variables.css           # CSS custom properties
└── responsive.css          # Global responsive utilities
```

### Theme Configuration
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
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Inter, sans-serif' },
});
```

## 🔧 Configuration Files

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/features/*": ["src/features/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
```

## 🧪 Testing Structure

### Test Organization
```
tests/
├── __mocks__/              # Mock implementations
│   ├── auth0.ts           # Auth0 mocks
│   ├── api.ts             # API mocks
│   └── localStorage.ts    # Local storage mocks
├── setup/                 # Test setup files
│   ├── setupTests.ts      # Global test setup
│   ├── testUtils.tsx      # Testing utilities
│   └── mockProviders.tsx  # Mock providers for testing
├── fixtures/              # Test data fixtures
│   ├── tenants.ts         # Tenant test data
│   ├── projects.ts        # Project test data
│   └── users.ts           # User test data
└── integration/           # Integration tests
    ├── auth.test.tsx      # Authentication flow tests
    ├── tenants.test.tsx   # Tenant management tests
    └── projects.test.tsx  # Project management tests
```

### Component Test Structure
```
// Each component includes its own test file
ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx    # Unit tests
├── ComponentName.types.ts
└── index.ts
```

## 📦 Build Output Structure

### Development Build
```
dist/
├── index.html              # Main HTML file
├── assets/                 # Bundled assets
│   ├── index.[hash].js    # Main JavaScript bundle
│   ├── index.[hash].css   # Main CSS bundle
│   └── vendor.[hash].js   # Vendor dependencies
└── static/                 # Static assets
    ├── images/            # Optimized images
    └── fonts/             # Font files
```

## 🔍 Code Organization Best Practices

### Import Organization
```typescript
// 1. React and external libraries
import React, { useState, useEffect } from 'react';
import { Box, Button, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

// 2. Internal imports (absolute paths)
import { useTenants } from '@/hooks/useTenants';
import { TenantCard } from '@/components/TenantCard';
import { Tenant } from '@/types/tenant.types';

// 3. Relative imports
import './TenantList.module.css';
```

### Export Patterns
```typescript
// Named exports for components
export const ComponentName: React.FC<Props> = () => {
  // Component implementation
};

// Default export from index files
// index.ts
export { ComponentName } from './ComponentName';
export { AnotherComponent } from './AnotherComponent';
```

### Folder Index Files
Each folder should include an `index.ts` file for clean imports:
```typescript
// features/tenants/index.ts
export { TenantList } from './components/TenantList';
export { TenantForm } from './components/TenantForm';
export { useTenants } from './hooks/useTenants';
export * from './types/tenant.types';
```

## 📚 Documentation Structure

### Component Documentation
Each component should include:
- Purpose and usage
- Props interface
- Examples
- Accessibility notes
- Testing guidelines

### Feature Documentation
Each feature should include:
- Overview and purpose
- Component hierarchy
- API integration points
- State management approach
- Testing strategy

---

*This folder structure ensures maintainable, scalable, and organized frontend development for the MWAP platform.* 