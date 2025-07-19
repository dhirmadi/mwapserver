# MWAP Documentation Guide

This guide provides an overview of the documentation structure for the MWAP (Modular Web Application Platform) project.

## Documentation Structure

The MWAP documentation is organized into several categories:

### 1. Architecture Documentation

- **[Architecture Reference](v3-architecture-reference.md)**: Comprehensive overview of the system architecture, design patterns, and coding standards.
- **[Domain Map](v3-domainmap.md)**: Detailed documentation of the domain entities and their relationships.

### 2. API Documentation

- **[API Contract](v3-api.md)**: Detailed specification of all API endpoints, including request/response schemas and authentication requirements.
- **[OpenAPI Schema](v3-openAPI-schema.md)**: OpenAPI specification for the API.
- **Interactive API Documentation**: Available at `/docs` when the server is running, providing an interactive interface for exploring and testing the API.

### 3. Feature Documentation

- **[Features](features/feature-pattern.md)**: Documentation for each feature module, including tenants, projects, cloud providers, and more.
- **Implementation Details**: Specific implementation details for each feature, including controllers, services, and routes.

### 4. Security Documentation

- **[Authentication](architecture/utility/auth.md)**: Documentation for the authentication system, including JWT validation and role-based access control.
- **Security Best Practices**: Guidelines for securing the application and protecting sensitive information.

### 5. Project Status

- **[Status](STATUS.md)**: Current project status, completed features, completed phases, and planned enhancements.
- **Recent Changes**: Documentation of recent changes and updates to the project.

## Documentation Conventions

### Markdown Format

All documentation is written in Markdown format for consistency and ease of maintenance. This allows for:

- Easy version control with Git
- Rendering in GitHub and other Markdown viewers
- Conversion to other formats if needed

### Code Examples

Code examples are provided in TypeScript and follow the same coding standards as the project:

```typescript
// Example of a service function
export async function getTenantById(id: string): Promise<Tenant> {
  const tenant = await TenantModel.findById(id);
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }
  return tenant;
}
```

### API Documentation

API endpoints are documented with:

- HTTP method
- URL path
- Required authentication/roles
- Request schema
- Response schema
- Error codes and responses

Example:
```
GET /api/v1/tenants/:id
Role: Authenticated
Response: TenantSchema
```

## Maintaining Documentation

When making changes to the codebase:

1. Update the relevant documentation files
2. Ensure the API documentation is up-to-date
3. Update the STATUS.md file with the changes
4. Follow the established documentation conventions

## Interactive Documentation

The interactive API documentation is available when the server is running:

1. Start the server: `npm run dev`
2. Navigate to `http://localhost:3000/docs` (requires authentication)
3. For a raw OpenAPI specification: `http://localhost:3000/docs/json`

This documentation is protected by authentication to prevent exposing sensitive system information.