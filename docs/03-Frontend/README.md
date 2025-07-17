# 🎨 MWAP Frontend Documentation

## 🎯 Overview

The MWAP frontend is a modern React application that provides a secure, responsive, and intuitive user interface for the MWAP platform. Built with TypeScript-first principles and following atomic design patterns, it delivers role-based experiences for different user types while maintaining strict security and accessibility standards.

## 📚 Documentation Contents

### **Core Documentation**
- [🏗️ Architecture](./architecture.md) - Frontend architecture and design patterns
- [🧩 Component Structure](./component-structure.md) - Component organization and atomic design
- [🔌 API Integration](./api-integration.md) - Backend API integration patterns
- [🔐 Authentication](./authentication.md) - Auth0 integration and security flows
- [👥 Role-Based Access Control](./rbac.md) - RBAC implementation in UI

### **Development Resources**
- [🤖 OpenHands Prompt](./openhands-prompt.md) - AI-assisted development guide
- [📱 PWA Features](./PWA-features.md) - Progressive Web App capabilities
- [🎨 UI Components](./components.md) - Component library and design system

## 🏗️ Architecture Overview

### **Technology Stack**
```typescript
// Core Technologies
React 18+              // UI framework with concurrent features
TypeScript 5+          // Type safety and developer experience
Vite                   // Build tool and development server
React Query            // Server state management
React Router v6        // Client-side routing
React Hook Form        // Form handling with validation
Zod                    // Runtime type validation
```

### **Design Principles**
1. **🔒 Security-First**: Auth0 integration with JWT validation
2. **📱 Mobile-First**: Responsive design for all devices
3. **♿ Accessibility**: WCAG 2.1 AA compliance
4. **⚡ Performance**: Code splitting and lazy loading
5. **🧪 Type Safety**: Strict TypeScript throughout
6. **🔄 Real-time**: WebSocket integration for live updates

### **Architecture Characteristics**
- **Feature-Based Organization**: Mirrors backend domain structure
- **Atomic Design**: Reusable components from atoms to templates
- **Custom Hooks**: Encapsulated business logic and API calls
- **Context Providers**: Global state management
- **Error Boundaries**: Graceful error handling
- **Progressive Enhancement**: Works without JavaScript

## 👥 User Role System

### **🔧 SuperAdmin Dashboard**
**Platform-level management interface**
- **Tenant Management**: View, create, archive all tenants
- **System Analytics**: Platform-wide metrics and reporting
- **User Management**: Global user administration
- **Configuration**: System-wide settings and features

```typescript
interface SuperAdminPermissions {
  tenants: 'full';
  projects: 'full';
  users: 'full';
  analytics: 'full';
  system: 'full';
}
```

### **🏢 Tenant Owner Dashboard**
**Organization management interface**
- **Tenant Settings**: Organization configuration and branding
- **Project Management**: Create, manage, and archive projects
- **Team Management**: Invite and manage team members
- **Billing & Usage**: Subscription and usage monitoring

```typescript
interface TenantOwnerPermissions {
  tenant: 'own';
  projects: 'tenant';
  members: 'tenant';
  billing: 'own';
}
```

### **👤 Project Member Dashboard**
**Project-focused interface**
- **Project Access**: Role-based project functionality
- **Collaboration**: Team communication and file sharing
- **Task Management**: Project-specific task tracking
- **Profile Management**: Personal settings and preferences

```typescript
interface ProjectMemberPermissions {
  projects: 'assigned';
  files: 'project';
  tasks: 'assigned';
  profile: 'own';
}
```

## 🚀 Development Workflow

### **1. Environment Setup**
```bash
# Create React application with TypeScript
npm create vite@latest mwap-frontend -- --template react-ts

# Install core dependencies
npm install @auth0/auth0-react @tanstack/react-query
npm install react-router-dom react-hook-form @hookform/resolvers
npm install zod axios @mantine/core @mantine/hooks

# Install development dependencies
npm install -D @types/node @vitejs/plugin-react
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### **2. Project Structure**
```
src/
├── components/          # Reusable UI components
│   ├── atoms/          # Basic building blocks
│   ├── molecules/      # Component combinations
│   ├── organisms/      # Complex components
│   └── templates/      # Page layouts
├── features/           # Feature-based modules
│   ├── auth/          # Authentication components
│   ├── dashboard/     # Dashboard components
│   ├── projects/      # Project management
│   └── tenants/       # Tenant management
├── hooks/             # Custom React hooks
├── services/          # API integration
├── types/             # TypeScript definitions
├── utils/             # Utility functions
└── contexts/          # React contexts
```

### **3. Authentication Integration**
```typescript
// Auth0 Provider Setup
import { Auth0Provider } from '@auth0/auth0-react';

const auth0Config = {
  domain: process.env.VITE_AUTH0_DOMAIN!,
  clientId: process.env.VITE_AUTH0_CLIENT_ID!,
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: process.env.VITE_AUTH0_AUDIENCE,
  },
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return <>{children}</>;
};
```

### **4. API Integration Pattern**
```typescript
// Custom hook for API calls
export const useProjects = () => {
  const { getAccessTokenSilently } = useAuth0();
  
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = await getAccessTokenSilently();
      const response = await axios.get('/api/v1/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  });
};
```

## 🎨 UI/UX Guidelines

### **Design System**
- **Color Palette**: Consistent brand colors with accessibility compliance
- **Typography**: Clear hierarchy with readable fonts
- **Spacing**: 8px grid system for consistent layouts
- **Components**: Reusable component library with variants
- **Icons**: Consistent icon set with semantic meaning

### **Responsive Breakpoints**
```css
/* Mobile First Approach */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### **Accessibility Standards**
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliance (4.5:1 ratio)
- **Focus Management**: Clear focus indicators
- **Alternative Text**: Descriptive alt text for images

## 🔧 Development Best Practices

### **Code Quality**
```typescript
// TypeScript strict configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### **Performance Optimization**
- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Memoization**: React.memo and useMemo for expensive operations
- **Bundle Analysis**: Regular bundle size monitoring
- **Image Optimization**: WebP format with fallbacks

### **Testing Strategy**
```typescript
// Component testing example
import { render, screen } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';

test('displays project information correctly', () => {
  const project = { id: '1', name: 'Test Project', status: 'active' };
  render(<ProjectCard project={project} />);
  
  expect(screen.getByText('Test Project')).toBeInTheDocument();
  expect(screen.getByText('active')).toBeInTheDocument();
});
```

## 📊 Performance Metrics

### **Core Web Vitals Targets**
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8s

### **Bundle Size Targets**
- **Initial Bundle**: < 200KB gzipped
- **Route Chunks**: < 50KB gzipped each
- **Vendor Bundle**: < 150KB gzipped

## 🔗 Related Documentation

### **Backend Integration**
- [🔌 API Documentation](../04-Backend/API-v3.md) - Complete API reference
- [🏗️ Architecture Reference](../02-Architecture/system-design.md) - System architecture
- [🗺️ Domain Model](../02-Architecture/v3-domainmap.md) - Data relationships

### **Development Resources**
- [🚀 Getting Started](../01-Getting-Started/getting-started.md) - Setup instructions
- [🔒 Security Guidelines](../07-Standards/coding-standards.md) - Security best practices
- [🧪 Testing Guide](../06-Guides/how-to-test.md) - Testing strategies

### **AI Development**
- [🤖 Microagents](../05-AI-Agents/microagents.md) - AI-assisted development
- [📝 Prompt Engineering](../05-AI-Agents/prompt-engineering.md) - Effective AI prompting

---

*The MWAP frontend provides a secure, scalable, and user-friendly interface that leverages the full power of the MWAP platform while maintaining the highest standards of security, accessibility, and performance.*