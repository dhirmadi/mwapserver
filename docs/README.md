# MWAP Documentation

Welcome to the MWAP (Modular Web Application Platform) documentation. This comprehensive guide covers all aspects of the platform's architecture, development, and deployment.

## 📚 Documentation Structure

### [00-Overview](./00-Overview/)
High-level project information and context
- [Vision](./00-Overview/vision.md) - Project vision and goals
- [Tech Stack](./00-Overview/tech-stack.md) - Technology choices and rationale
- [Glossary](./00-Overview/glossary.md) - Key terms and definitions
- [Contributors](./00-Overview/contributors.md) - Team and contribution guidelines
- [Changelog](./00-Overview/changelog.md) - Version history and updates

### [01-Getting-Started](./01-Getting-Started/)
Everything needed to start developing with MWAP
- [Prerequisites](./01-Getting-Started/prerequisites.md) - System requirements
- [Getting Started](./01-Getting-Started/getting-started.md) - Quick setup guide
- [Environment Setup](./01-Getting-Started/env-setup.md) - Configuration details
- [Migration & Deployment](./01-Getting-Started/migration-deployment-guide.md) - Deployment strategies
- [Troubleshooting](./01-Getting-Started/troubleshooting.md) - Common issues and solutions
- [FAQ](./01-Getting-Started/faq.md) - Frequently asked questions

### [02-Architecture](./02-Architecture/)
System design and architectural decisions
- [Overview](./02-Architecture/overview.md) - High-level architecture
- [System Design](./02-Architecture/system-design.md) - Detailed system design
- [Component Structure](./02-Architecture/component-structure.md) - Component organization
- [User Flows](./02-Architecture/user-flows.md) - User interaction patterns
- [Domain Map](./02-Architecture/v3-domainmap.md) - Domain model and relationships
- [Diagrams](./02-Architecture/diagrams/) - Visual architecture representations

### [03-Frontend](./03-Frontend/)
Backend API integration guides for React developers
- [API Integration](./03-Frontend/api-integration.md) - Complete API integration guide
- [Authentication](./03-Frontend/authentication.md) - Auth0 integration and JWT handling
- [Role-Based Access Control](./03-Frontend/rbac.md) - Implementing RBAC on frontend
- [OAuth Integration](./03-Frontend/oauth-integration.md) - Cloud provider OAuth flows
- [Error Handling](./03-Frontend/error-handling.md) - API error patterns and responses

### [04-Backend](./04-Backend/)
Backend API and server architecture
- [Express Structure](./04-Backend/express-structure.md) - Server organization
- [API v3](./04-Backend/API-v3.md) - Complete API documentation
- [API Configuration](./04-Backend/API-configuration.md) - API setup and configuration
- [Auth0 Integration](./04-Backend/auth0.md) - Authentication implementation
- [RBAC](./04-Backend/rbac.md) - Role-based access control
- [Cloud Providers](./04-Backend/cloud-providers.md) - Cloud integration patterns
- [Queues](./04-Backend/queues.md) - Background job processing

### [05-AI-Agents](./05-AI-Agents/)
AI integration and agent development
- [Microagents](./05-AI-Agents/microagents.md) - Agent architecture
- [OpenHands Integration](./05-AI-Agents/openhands-integration.md) - AI development tools
- [Prompt Engineering](./05-AI-Agents/prompt-engineering.md) - Effective prompting
- [Agent Patterns](./05-AI-Agents/agent-patterns.md) - Common patterns
- [Best Practices](./05-AI-Agents/best-practices.md) - Development guidelines

### [06-Guides](./06-Guides/)
Step-by-step implementation guides
- [Auth0 Integration](./06-Guides/how-to-integrate-auth0.md) - Authentication setup
- [Adding Agents](./06-Guides/how-to-add-agent.md) - Agent development
- [Deployment](./06-Guides/how-to-deploy.md) - Production deployment
- [Testing](./06-Guides/how-to-test.md) - Testing strategies
- [Debugging](./06-Guides/debugging.md) - Troubleshooting techniques
- [Optimization](./06-Guides/optimization-report.md) - Performance optimization

### [07-Standards](./07-Standards/)
Development standards and conventions
- [Development Guide](./07-Standards/development-guide.md) - General development practices
- [Coding Standards](./07-Standards/coding-standards.md) - Code style and conventions
- [Naming Conventions](./07-Standards/naming.md) - Naming guidelines
- [Environment Format](./07-Standards/.env-format.md) - Environment variable standards
- [Commit Style](./07-Standards/commit-style.md) - Git commit conventions

### [08-Contribution](./08-Contribution/)
Contributing to the project
- [Contributing Guide](./08-Contribution/contributing.md) - How to contribute
- [Branching Strategy](./08-Contribution/branching.md) - Git workflow
- [PR Guidelines](./08-Contribution/PR-guidelines.md) - Pull request process
- [Issue Templates](./08-Contribution/issue-template.md) - Bug reports and features

### [09-Reports-and-History](./09-Reports-and-History/)
Historical documentation and reports
- [Refactoring Reports](./09-Reports-and-History/refactoring/) - Code refactoring history
- [API Migration](./09-Reports-and-History/api-migration.md) - API evolution
- [Audit Reports](./09-Reports-and-History/audit-reports.md) - Security and compliance
- [Changelogs](./09-Reports-and-History/changelogs/) - Detailed version history

## 🚀 Quick Start

1. **New Developers**: Start with [Getting Started](./01-Getting-Started/getting-started.md)
2. **Architecture Overview**: Review [System Design](./02-Architecture/system-design.md)
3. **API Development**: Check [API v3](./04-Backend/API-v3.md)
4. **Frontend API Integration**: See [API Integration Guide](./03-Frontend/api-integration.md)
5. **Contributing**: Follow [Contributing Guide](./08-Contribution/contributing.md)

## 🔍 Finding Information

| Need | Go To |
|------|-------|
| Project overview | [Vision](./00-Overview/vision.md) |
| Setup instructions | [Getting Started](./01-Getting-Started/getting-started.md) |
| API endpoints | [API v3](./04-Backend/API-v3.md) |
| Authentication | [Auth0 Integration](./04-Backend/auth0.md) |
| Frontend API integration | [API Integration Guide](./03-Frontend/api-integration.md) |
| Testing | [Testing Guide](./06-Guides/how-to-test.md) |
| Deployment | [Deployment Guide](./06-Guides/how-to-deploy.md) |
| Contributing | [Contributing Guide](./08-Contribution/contributing.md) |

## 📝 Documentation Standards

All documentation follows these principles:
- **Factual and Verified**: All information is grounded in actual implementation
- **Well-Structured**: Clear headings, examples, and cross-references
- **Up-to-Date**: Regular updates to reflect current system state
- **Developer-Focused**: Practical information for implementation

## 🤝 Contributing to Documentation

When updating documentation:
1. Follow the [Development Guide](./07-Standards/development-guide.md)
2. Ensure all information is factually accurate
3. Include practical examples where helpful
4. Update cross-references when moving or renaming files
5. Test all code examples and API calls

---
*Last updated: 2025-07-17*