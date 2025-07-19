# MWAP Frontend Documentation

This directory contains documentation and resources for the MWAP frontend application.

## Contents

- [OpenHands Frontend Prompt](openhands-frontend-prompt.md): Comprehensive prompt for building the React frontend with OpenHands and Anthropic Claude
- [Architecture](architecture.md): Frontend architecture and design patterns
- [Component Structure](component-structure.md): Overview of the component structure and organization
- [API Integration](api-integration.md): How the frontend integrates with the backend API
- [Authentication](authentication.md): Authentication flow and security considerations
- [Role-Based Access Control](rbac.md): Implementation of role-based access control in the UI

## Frontend Architecture

The MWAP frontend is designed as a modern React application with the following key characteristics:

1. **TypeScript-first**: Strict type safety throughout the application
2. **Component-based**: Modular, reusable components following atomic design principles
3. **Feature-oriented**: Organization mirrors the backend's domain-driven design
4. **Role-based**: Different UIs and capabilities for different user roles
5. **API-driven**: Makes full use of the existing backend API endpoints
6. **Responsive**: Works seamlessly on desktop, tablet, and mobile devices
7. **Accessible**: Follows WCAG 2.1 AA compliance guidelines

## User Roles

The frontend supports three distinct user roles:

1. **SuperAdmin**: Platform-level access to manage all aspects of the system
2. **Tenant Owner**: Full control over their tenant and associated projects
3. **Project Member**: Limited access based on their role within a project

Each role has a different UI experience tailored to their permissions and responsibilities.

## Getting Started

To start developing the frontend:

1. Set up the project with Create React App or Vite
2. Implement the authentication flow with Auth0
3. Create the core layout and navigation components
4. Implement the dashboard for each user role
5. Build feature-specific components and pages
6. Integrate with the API endpoints

## Best Practices

- Follow the TypeScript strict mode guidelines
- Use React Query for server state management
- Implement proper error handling and loading states
- Use React Hook Form with Zod validation for forms
- Follow the component structure outlined in the documentation
- Implement proper authorization checks on the client side
- Optimize for performance and accessibility

## Related Documentation

- [Backend API Documentation](../v3-api.md)
- [Domain Model](../v3-domainmap.md)
- [Architecture Reference](../v3-architecture-reference.md)