# Backend Documentation

This directory contains comprehensive documentation for the MWAP backend, covering API reference, development patterns, security, infrastructure, and feature implementation.

## 📚 Documentation

### API Documentation

#### [📖 API Reference](./api-reference.md)
**Complete API documentation** covering:
- Authentication and authorization patterns
- All endpoint specifications with request/response schemas
- Error handling and response formats
- Rate limiting and security considerations
- OAuth security monitoring endpoints
- OpenAPI management and validation endpoints
- Interactive documentation and testing guides

#### [⚡ API Quick Reference](./api-quickreference.md)
**Single-page quick reference** for:
- All 67 API endpoints with one-line descriptions
- Endpoint organization by feature area
- Authentication requirements at a glance
- Quick lookup table format

### [🔧 Backend Development Guide](./backend-guide.md)
**Complete development handbook** covering:
- System architecture and technology stack
- Project structure and organization patterns
- Express server setup and middleware configuration
- Feature development patterns and best practices
- Environment configuration and deployment

### [🔒 Security Guide](./security.md)
**Comprehensive security implementation** covering:
- Auth0 authentication and JWT token handling
- Role-based access control (RBAC) implementation
- Authorization middleware patterns and examples
- Security best practices and error handling
- Testing strategies for authentication and authorization

### [🏗️ Infrastructure Guide](./infrastructure.md)
**Complete infrastructure documentation** covering:
- MongoDB database design and schema
- Cloud provider integration patterns
- Background job processing architecture
- Performance optimization and monitoring
- Scalability considerations and caching strategies

### [🎯 Features Guide](./features.md)
**Comprehensive feature documentation** covering:
- Standard feature development patterns
- Core features: Tenants, Projects, Project Types
- Cloud integration features: Providers, Integrations, Virtual Files
- API endpoints, data models, and business rules for each feature
- Security patterns and common implementation guidelines

### Dynamic OpenAPI Specification
**Live OpenAPI 3.1 specification** available at:
- **Endpoint**: `GET /api/v1/openapi?format=yaml` or `GET /api/v1/openapi?format=json`
- **Interactive UI**: Navigate to `/docs` (requires authentication)
- **Use Cases**: API testing, client SDK generation, contract validation
- **Note**: Dynamically generated from actual implementation (no static files)

## 🚀 Quick Start

### For API Consumers
1. **Quick Lookup** - Start with [API Quick Reference](./api-quickreference.md) for fast endpoint lookup
2. **Detailed Integration** - Use [API Reference](./api-reference.md) for complete endpoint details
3. **Live Testing** - Navigate to `/docs` for interactive Swagger UI

### For Developers
1. **Set up Development** - Follow [Backend Development Guide](./backend-guide.md) for environment setup
2. **Implement Security** - Review [Security Guide](./security.md) for authentication patterns
3. **Build Features** - Use [Features Guide](./features.md) for development patterns
4. **Deploy Infrastructure** - Check [Infrastructure Guide](./infrastructure.md) for production setup

## 🎯 Key Technologies

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js with middleware stack
- **Database**: MongoDB Atlas with native Node.js driver
- **Authentication**: Auth0 JWT with RS256 validation
- **Validation**: Zod schemas for runtime validation
- **Security**: Helmet.js, CORS, rate limiting
- **Documentation**: OpenAPI 3.1 with Swagger UI

## 🔐 Security Features

- **Authentication**: Auth0 JWT tokens with automatic validation
- **Authorization**: Role-based access control with hierarchical permissions
- **Multi-tenancy**: Complete data isolation between tenants
- **Encryption**: Sensitive data encrypted at rest
- **Audit Logging**: Comprehensive security event tracking
- **Rate Limiting**: Protection against abuse and DDoS attacks

## 📊 Core Features

- **Tenants**: Multi-tenant organization management
- **Projects**: Application instance management with role-based access
- **Project Types**: Configurable project templates and schemas
- **Cloud Providers**: Integration with Google Drive, Dropbox, OneDrive
- **Cloud Integrations**: OAuth-based cloud storage connections
- **Virtual Files**: Real-time file access across cloud providers

## 🧩 Architecture Principles

- **Feature-based Organization**: Domain-driven module structure
- **Security-first Design**: Authentication and authorization at every layer
- **Type Safety**: Full TypeScript coverage with strict validation
- **Scalable Patterns**: Designed for horizontal scaling and performance
- **API-centric**: RESTful API design with comprehensive documentation
- **Developer Experience**: Clear patterns and comprehensive tooling

## 📖 Related Documentation

- [Frontend Integration Guide](../03-Frontend/frontend-guide.md) - React integration patterns
- [Architecture Overview](../02-Architecture/architecture.md) - System design and patterns
- [Getting Started Guide](../01-Getting-Started/getting-started.md) - Project setup and onboarding

---
*This backend documentation provides everything needed to develop, deploy, and maintain the MWAP platform backend.* 