# MWAP Glossary

This glossary defines key terms and concepts used throughout the MWAP (Modular Web Application Platform) project.

## 🔑 Core Terms

### MWAP
**Modular Web Application Platform** - The main project name. A fullstack, secure, scalable SaaS framework built with Node.js, Express, MongoDB Atlas, and Auth0.

### ESM
**ECMAScript Modules** - Native JavaScript module system used throughout the project. No CommonJS modules are allowed.

### JWT
**JSON Web Token** - Authentication tokens used for secure API access, validated using Auth0's RS256 algorithm with JWKS endpoints.

### JWKS
**JSON Web Key Set** - Public keys provided by Auth0 for validating JWT signatures.

### PKCE
**Proof Key for Code Exchange** - OAuth 2.0 security extension used with Auth0 for enhanced security in authentication flows.

## 🏗️ Architecture Terms

### Domain-Driven Design (DDD)
Architectural approach where the domain model drives the system design, with clear boundaries between business domains.

### Zero Trust Security
Security model where no request is automatically trusted, requiring verification for every access attempt.

### RBAC
**Role-Based Access Control** - Authorization system that grants permissions based on user roles within tenants and projects.

### Multi-Tenancy
Architecture pattern allowing multiple tenants (organizations) to share the same application instance while maintaining data isolation.

## 📊 Data Entities

### Tenant
The top-level organizational entity. Each tenant represents an organization or company using the platform.

### Project
A workspace within a tenant that contains files, integrations, and team members.

### Project Type
A template or blueprint that defines the structure and capabilities of projects.

### Cloud Provider
External cloud services (Google Drive, Dropbox, OneDrive) that can be integrated with projects.

### Cloud Integration
A connection between a tenant and a cloud provider, including OAuth tokens and configuration.

### Virtual File
File metadata representing files stored in cloud providers, without duplicating the actual file content.

### Project Member
A user who has been granted access to a specific project with defined roles and permissions.

## 🔧 Technical Terms

### Zod
TypeScript-first schema validation library used for request/response validation and type safety.

### Vitest
Testing framework used for unit and integration testing, chosen for its native ESM support.

### Auth0
Third-party authentication and authorization service providing JWT-based security.

### MongoDB Atlas
Cloud-hosted MongoDB database service used for data persistence.

### Express.js
Web application framework for Node.js used to build the REST API.

### Middleware
Functions that execute during the request-response cycle, used for authentication, authorization, and error handling.

## 🧪 Testing Terms

### Unit Tests
Tests that verify individual functions or components in isolation.

### Integration Tests
Tests that verify the interaction between different parts of the system.

### Mock
Fake implementations of external dependencies used during testing.

### Test Factory
Functions that generate consistent test data for use in test cases.

### Coverage
Metric indicating the percentage of code executed during testing.

## 🔐 Security Terms

### API Key
Secret tokens used to authenticate requests to external services.

### Encryption at Rest
Securing sensitive data (like OAuth tokens) when stored in the database.

### Rate Limiting
Controlling the number of requests a client can make within a specific time period.

### CORS
**Cross-Origin Resource Sharing** - Mechanism that allows restricted resources to be requested from another domain.

### Helmet
Security middleware that sets various HTTP headers to protect against common vulnerabilities.

## 📝 Documentation Terms

### OpenAPI
Specification format for describing REST APIs, used for generating API documentation.

### Swagger
Tools and UI for working with OpenAPI specifications.

### Markdown
Lightweight markup language used for all project documentation.

### Link Validation
Automated checking of internal documentation links to prevent broken references.

## 🚀 Deployment Terms

### Environment Variables
Configuration values that vary between deployment environments (development, staging, production).

### Health Check
Endpoint that reports the status of the application and its dependencies.

### Logging
Structured recording of application events for monitoring and debugging.

### Audit Trail
Record of all significant actions and changes within the system for compliance and security.

---

*This glossary is maintained as part of the MWAP documentation. Terms are added as the project evolves.* 