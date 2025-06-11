# MWAP Server

## Project Overview

MWAP (Modular Web Application Platform) is a fullstack, secure, scalable SaaS framework designed for building dynamic, multi-tenant web applications with robust security and flexibility.

## Technical Stack

- **Runtime**: Node.js (v18+)
- **Web Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: Auth0 JWT (RS256, JWKS)
- **Schema Validation**: Zod

## Security Principles

- **Zero Trust Model**: Strict role-based access control
- **JWT Authentication** with RS256 and JWKS endpoint validation
- **Multi-Factor Authentication** via Auth0
- **Field-Level Encryption** in MongoDB
- **Rate Limiting** on all APIs
- **Secure Headers** with Helmet

## Architecture

### Domain-Driven Design

The server is organized around core domain entities:
- `Tenant`: User workspace and logical isolation
- `Project`: Application instance with fixed configuration
- `ProjectType`: Defines application behavior
- `CloudProvider`: Supported cloud storage integrations

### Folder Structure

```
/src
  /features         → Domain-specific logic
  /middleware       → Authentication and security
  /services         → Shared business logic
  /schemas          → Zod schema definitions
  /utils            → Helper methods
  /config           → Environment and connection setup
```

## Key Features

- Multi-tenant architecture
- Dynamic project type configuration
- Cloud provider integrations
- Microservice-friendly design
- Comprehensive audit logging

## API Contract

Full API specification available in `/docs/v3-api.md`. Key endpoints include:
- `/api/v1/tenants`: Tenant management
- `/api/v1/projects`: Project CRUD operations
- `/api/v1/cloud-providers`: Cloud integration management

## 🧪 Testing (Planned)

> 🧼 All legacy tests and configurations have been removed to enable a clean, consistent setup.

This project will use **[Vitest](https://vitest.dev/)** for unit and service-level testing, aligned with the following principles:

- ✅ Pure ESM support (no CommonJS)
- ✅ Centralized `tests/` folder (no co-located tests)
- ✅ Simple mocks for MongoDB and Auth0 (no DB containers or test factories)
- ✅ Focused tests for service logic, middleware, and schema validation

### Planned Setup

- `vitest.config.ts` with global `setupTests.ts`
- Code coverage via `vitest run --coverage`
- Test structure mirrors `/src/features`
- No framework-specific dependencies like Jest or legacy mocks


## Documentation

- [Documentation Guide](docs/documentation-guide.md)
- [Architecture Reference](docs/v3-architecture-reference.md)
- [Domain Map](docs/v3-domainmap.md)
- [API Contract](docs/v3-api.md)
- [OpenAPI Schema](docs/v3-openAPI-schema.md)
- [Project Status](docs/STATUS.md)

### API Documentation

The project includes interactive API documentation accessible at `/docs` when the server is running. This documentation:

- Provides a comprehensive overview of all API endpoints
- Includes request/response schemas and authentication requirements
- Supports interactive testing via Swagger UI (when installed)
- Is secured behind authentication to prevent information disclosure

To access the API documentation:

1. Start the server: `npm run dev`
2. Navigate to `http://localhost:3000/docs` (requires authentication)
3. For a raw OpenAPI specification: `http://localhost:3000/docs/json`

**Security Note**: API documentation is protected by authentication to prevent exposing sensitive system information. This is a security best practice to reduce attack surface and limit information disclosure.

### Documentation Structure

- **Architecture Documentation**: Detailed information about the system architecture, design patterns, and coding standards
- **API Documentation**: Interactive documentation for all API endpoints with request/response schemas
- **Domain Model**: Comprehensive documentation of the domain entities and their relationships
- **Status Updates**: Current project status, completed features, and planned enhancements
- **Security Guidelines**: Best practices for securing the application and protecting sensitive information

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the server: `npm run dev` for development or `npm start` for production

## Contributing

Please read our contribution guidelines and code of conduct before submitting pull requests.

## License

[Insert License Information]

## Let's Build Securely!