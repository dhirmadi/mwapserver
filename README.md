# MWAP Documentation

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
    /tenants        → Tenant management
    /projects       → Project operations
    /cloud-providers → Cloud provider management
    /oauth          → OAuth 2.0 implementation
  /middleware       → Authentication and security
  /services         → Shared business logic
  /schemas          → Zod schema definitions
  /utils            → Helper methods
  /config           → Environment and connection setup
```

## Key Features

- Multi-tenant architecture
- Dynamic project type configuration
- **Enhanced OAuth-based cloud provider integrations**
  - **NEW**: OAuth flow initiation endpoint for consistent redirect URI construction
  - **FIXED**: Dropbox OAuth redirect URI mismatch errors
  - **IMPROVED**: Express proxy configuration for Heroku environments
  - Dedicated OAuth callback endpoint with enhanced security
  - Secure token exchange and storage with HTTP Basic Auth
  - Standardized OAuth 2.0 flow with provider-specific parameters
- Field-level encryption for sensitive data
- Microservice-friendly design
- Comprehensive audit logging

## API Contract

Full API specification available in `/docs/04-Backend/v3-api.md`. Key endpoints include:
- `/api/v1/tenants`: Tenant management
- `/api/v1/projects`: Project CRUD operations
- `/api/v1/cloud-providers`: Cloud integration management
- `/api/v1/oauth/callback`: OAuth 2.0 callback handling
- `/api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh`: Token refresh

## 🧪 Testing

This project uses **[Vitest](https://vitest.dev/)** for unit and service-level testing, aligned with the following principles:

- ✅ Pure ESM support (no CommonJS)
- ✅ Centralized `tests/` folder (no co-located tests)
- ✅ Simple mocks for MongoDB and Auth0 (no DB containers or test factories)
- ✅ Focused tests for service logic, middleware, and schema validation

### Setup

- `vitest.config.ts` with global `setupTests.ts`
- Code coverage via `vitest run --coverage`
- Test structure mirrors `/src/features`

## 📚 Documentation

Comprehensive documentation is organized into 10 main sections:

### Quick Navigation

| Section | Description | Key Documents |
|---------|-------------|---------------|
| **[00-Overview](docs/00-Overview/)** | Project vision, tech stack, and changelog | `vision.md`, `tech-stack.md`, `changelog.md` |
| **[01-Getting-Started](docs/01-Getting-Started/)** | Setup, installation, and onboarding | `getting-started.md`, `env-setup.md`, `DEVELOPER_ONBOARDING.md` |
| **[02-Architecture](docs/02-Architecture/)** | System design and architecture | `overview.md`, `system-design.md`, `v3-architecture-reference.md` |
| **[03-Frontend](docs/03-Frontend/)** | Frontend development guides | `authentication.md`, `api-integration.md`, `rbac.md` |
| **[04-Backend](docs/04-Backend/)** | Backend API and server documentation | `express-structure.md`, `auth0.md`, `rbac.md`, `cloud-providers.md` |
| **[05-AI-Agents](docs/05-AI-Agents/)** | AI agent framework and patterns | `microagents.md`, `openhands-integration.md`, `prompt-engineering.md` |
| **[06-Guides](docs/06-Guides/)** | How-to guides and tutorials | `how-to-deploy.md`, `debugging.md`, `optimization-report.md` |
| **[07-Standards](docs/07-Standards/)** | Coding standards and conventions | `naming.md`, `commit-style.md`, `branching.md`, `development-guide.md` |
| **[08-Contribution](docs/08-Contribution/)** | Contribution guidelines | `contributing.md`, `documentation-guide.md` |
| **[09-Reports-and-History](docs/09-Reports-and-History/)** | Project status and reports | `STATUS.md`, `REORGANIZATION_SUMMARY.md` |

### Core Documentation

#### Backend Development
- **[Express Server Structure](docs/04-Backend/express-structure.md)** - Complete server architecture guide
- **[Auth0 Integration](docs/04-Backend/auth0.md)** - Authentication implementation
- **[RBAC Implementation](docs/04-Backend/rbac.md)** - Role-based access control
- **[Cloud Provider Patterns](docs/04-Backend/cloud-providers.md)** - OAuth integration patterns
- **[Background Jobs](docs/04-Backend/queues.md)** - Background processing patterns
- **[API Configuration](docs/06-Guides/API-configuration.md)** - OpenAPI generation and setup

#### Development Workflow
- **[Development Guide](docs/07-Standards/development-guide.md)** - Complete development workflow
- **[Environment Setup](docs/07-Standards/.env-format.md)** - Environment variable standards
- **[Naming Conventions](docs/07-Standards/naming.md)** - Codebase naming standards
- **[Git Workflow](docs/07-Standards/branching.md)** - Branching strategy and git conventions
- **[Commit Style](docs/07-Standards/commit-style.md)** - Commit message standards

#### Operations and Deployment
- **[Deployment Guide](docs/06-Guides/how-to-deploy.md)** - Production deployment procedures
- **[Debugging Guide](docs/06-Guides/debugging.md)** - Troubleshooting and debugging
- **[Performance Optimization](docs/06-Guides/optimization-report.md)** - Performance tuning strategies
- **[Auth0 Integration Guide](docs/06-Guides/how-to-integrate-auth0.md)** - Complete Auth0 setup

#### AI Agents Framework
- **[Microagents](docs/05-AI-Agents/microagents.md)** - AI agent framework overview
- **[OpenHands Integration](docs/05-AI-Agents/openhands-integration.md)** - AI-powered development assistance
- **[Prompt Engineering](docs/05-AI-Agents/prompt-engineering.md)** - Best practices for AI prompts
- **[Agent Patterns](docs/05-AI-Agents/agent-patterns.md)** - Proven agent implementation patterns
- **[Best Practices](docs/05-AI-Agents/best-practices.md)** - AI agent development guidelines
- **[How to Add Agents](docs/06-Guides/how-to-add-agent.md)** - Step-by-step agent creation guide

## API Documentation

The project includes interactive API documentation accessible at `/docs` when the server is running. This documentation:

- Provides comprehensive overview of all API endpoints
- Includes request/response schemas and authentication requirements
- Supports interactive testing via Swagger UI (when installed)
- Is secured behind authentication to prevent information disclosure

To access the API documentation:

1. Start the server: `npm run dev`
2. Navigate to `http://localhost:3001/docs` (requires authentication)
3. For raw OpenAPI specification: `http://localhost:3001/docs/json`

**Security Note**: API documentation is protected by authentication to prevent exposing sensitive system information.

## Getting Started

### Prerequisites
1. **Node.js** (v18 or higher)
2. **MongoDB Atlas** account and connection string
3. **Auth0** account with application configured
4. **Git** for version control

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd mwapserver

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations (if any)
npm run migrate

# Start development server
npm run dev

# Run tests
npm test
```

### Environment Setup
See **[Environment Setup Guide](docs/01-Getting-Started/env-setup.md)** for detailed configuration instructions.

## Project Status

✅ **Core Infrastructure**: Complete  
✅ **Authentication & RBAC**: Complete  
✅ **Cloud Provider Integration**: Complete  
✅ **API Documentation**: Complete  
✅ **Deployment Procedures**: Complete  
🚧 **AI Agents Framework**: In Progress  
📋 **Testing Infrastructure**: Planned  

For detailed status information, see **[Project Status](docs/09-Reports-and-History/STATUS.md)**.

## Contributing

We welcome contributions! Please read our **[Contributing Guidelines](docs/08-Contribution/contributing.md)** and follow our **[Development Standards](docs/07-Standards/development-guide.md)**.

### Development Workflow
1. Read the **[Development Guide](docs/07-Standards/development-guide.md)**
2. Follow **[Naming Conventions](docs/07-Standards/naming.md)**
3. Use **[Git Workflow](docs/07-Standards/branching.md)** and **[Commit Standards](docs/07-Standards/commit-style.md)**
4. Test thoroughly using **[Testing Guide](docs/06-Guides/how-to-test.md)**

## Support and Documentation

- **Questions?** Check the **[FAQ](docs/01-Getting-Started/faq.md)**
- **Issues?** See **[Troubleshooting](docs/01-Getting-Started/troubleshooting.md)**
- **Debugging?** Use the **[Debugging Guide](docs/06-Guides/debugging.md)**
- **Deploying?** Follow the **[Deployment Guide](docs/06-Guides/how-to-deploy.md)**

## License

[Insert License Information]

---

## Let's Build Securely! 🔒

*This documentation is maintained as part of the MWAP project. For updates and improvements, see the [documentation guide](docs/08-Contribution/documentation-guide.md).*