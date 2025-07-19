# Frontend API Integration Guide

This directory contains practical guides for React developers integrating with the MWAP backend API.

## 🎯 Purpose

This documentation is specifically for **React developers** who need to integrate their frontend applications with the MWAP backend. It covers API usage, authentication, and backend integration patterns - not frontend architecture or component design.

## 📚 Contents

### Core Integration Guides
- **[API Integration](api-integration.md)** - Complete guide to making API calls with React
- **[Authentication](authentication.md)** - Auth0 integration and JWT token handling  
- **[Role-Based Access Control](rbac.md)** - Implementing RBAC on the frontend
- **[OAuth Integration](oauth-integration.md)** - Cloud provider OAuth flows

### Quick Reference
- **[API Endpoints](../04-Backend/API-v3.md)** - Complete backend API reference
- **[Error Handling](error-handling.md)** - API error patterns and responses

## 🚀 Getting Started

### Prerequisites
- React 18+ application
- TypeScript (recommended)
- Node.js environment

### Basic Setup
1. **Install Required Packages**
   ```bash
   npm install @auth0/auth0-react axios react-query
   ```

2. **Configure Environment Variables**
   ```env
   REACT_APP_API_URL=http://localhost:3000
   REACT_APP_AUTH0_DOMAIN=your-auth0-domain
   REACT_APP_AUTH0_CLIENT_ID=your-client-id
   REACT_APP_AUTH0_AUDIENCE=your-api-audience
   ```

3. **Set Up Authentication**
   ```tsx
   import { Auth0Provider } from '@auth0/auth0-react';
   
   function App() {
     return (
       <Auth0Provider
         domain={process.env.REACT_APP_AUTH0_DOMAIN}
         clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
         authorizationParams={{
           redirect_uri: window.location.origin,
           audience: process.env.REACT_APP_AUTH0_AUDIENCE,
         }}
       >
         {/* Your app */}
       </Auth0Provider>
     );
   }
   ```

4. **Make Your First API Call**
   ```tsx
   import { useAuth0 } from '@auth0/auth0-react';
   import { useEffect, useState } from 'react';

   function UserRoles() {
     const { getAccessTokenSilently } = useAuth0();
     const [roles, setRoles] = useState(null);

     useEffect(() => {
       const fetchRoles = async () => {
         const token = await getAccessTokenSilently();
         const response = await fetch('/api/v1/users/me/roles', {
           headers: { Authorization: `Bearer ${token}` }
         });
         setRoles(await response.json());
       };
       fetchRoles();
     }, []);

     return <div>{JSON.stringify(roles)}</div>;
   }
   ```

## 🔑 Authentication Flow

The MWAP backend uses **Auth0 JWT tokens** for authentication. Every API request requires a valid Bearer token:

```
Authorization: Bearer <jwt_token>
```

## 👥 User Roles

Understanding user roles is crucial for frontend development:

- **SuperAdmin**: Platform-wide access (manage all tenants, project types, cloud providers)
- **Tenant Owner**: Tenant-specific access (manage tenant, projects, integrations)  
- **Project Member**: Project-specific access (view/edit based on project role)

## 📡 Core API Patterns

### Standard Response Format
```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string
}

// Error Response  
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Common API Endpoints
```typescript
// User Information
GET /api/v1/users/me/roles

// Tenant Management
GET /api/v1/tenants/me
POST /api/v1/tenants

// Project Management  
GET /api/v1/projects
POST /api/v1/projects
GET /api/v1/projects/:id/files

// Cloud Integrations
GET /api/v1/tenants/:tenantId/integrations
POST /api/v1/tenants/:tenantId/integrations
```

## 🛠️ Recommended Libraries

- **@auth0/auth0-react**: Auth0 authentication
- **axios**: HTTP client with interceptors
- **react-query** or **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling
- **zod**: Schema validation

## 📖 Related Documentation

- [Backend API Reference](../04-Backend/API-v3.md) - Complete API documentation
- [Backend Authentication](../04-Backend/authentication.md) - Server-side auth details
- [Database Schema](../04-Backend/database.md) - Data models and relationships

---

*This guide focuses exclusively on backend integration. For frontend architecture, component design, or UI patterns, refer to your internal frontend documentation.*