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

## Documentation

- [Architecture Reference](docs/v3-architecture-reference.md)
- [Domain Map](docs/v3-domainmap.md)
- [API Contract](docs/v3-api.md)
- [OpenAPI Schema](docs/v3-openAPI-schema.md)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the server: `npm start`

## Contributing

Please read our contribution guidelines and code of conduct before submitting pull requests.

## License

[Insert License Information]

## Let's Build Securely!