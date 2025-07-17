# 💬 MWAP Prompt Engineering Guide

## 🎯 Overview

This guide provides comprehensive patterns and best practices for effective prompt engineering in the MWAP development environment, specifically tailored for OpenHands AI agents and development workflows.

## 🧠 Prompt Engineering Principles

### **1. Context-First Approach**
```
Context: MWAP is a multi-tenant SaaS platform built with Node.js, Express, MongoDB, and Auth0
Task: [Specific development task]
Requirements:
- Follow TypeScript strict mode
- Implement tenant isolation
- Use existing patterns from /src/features/
```

### **2. Specificity and Constraints**
```
Task: Add user profile update endpoint
Constraints:
- Must validate input with Zod
- Require authentication middleware
- Include tenant isolation
- Follow existing error handling patterns
- Update only allowed fields: name, email, preferences
```

### **3. Reference Existing Patterns**
```
Reference: Follow the pattern in /src/features/projects/project.routes.ts
Task: Create similar route structure for user management
Include: Validation, authentication, error handling, response formatting
```

## 🛠️ MWAP-Specific Prompt Templates

### **Feature Development Template**
```
Context: MWAP multi-tenant platform with Express.js backend
Task: Implement [feature name] with the following requirements:

Architecture:
- Feature-based folder structure in /src/features/[feature]/
- Include: routes, controller, service, model, types, validation
- Follow existing patterns from /src/features/projects/

Security:
- JWT authentication with Auth0
- Tenant isolation (tenantId in all queries)
- Role-based permissions
- Input validation with Zod

Technical Requirements:
- TypeScript strict mode
- MongoDB with Mongoose
- Express.js routing
- Consistent error handling with AppError
- Structured logging

Files to create:
- [feature].routes.ts
- [feature].controller.ts
- [feature].service.ts
- [feature].model.ts
- [feature].types.ts
- [feature].validation.ts

Example similar feature: /src/features/projects/
```

### **API Endpoint Template**
```
Context: MWAP REST API with Express.js and MongoDB
Task: Create API endpoint for [operation]

Endpoint: [METHOD] /api/v1/[resource]
Authentication: Required (JWT)
Authorization: [Role requirements]

Request:
- Headers: Authorization: Bearer <token>
- Body: [Request schema]
- Validation: Zod schema

Response:
- Success: SuccessResponse<T> format
- Error: AppError with appropriate status codes

Implementation:
1. Route definition with middleware
2. Controller with error handling
3. Service with business logic
4. Database operations with tenant isolation
5. Response formatting

Reference: /src/features/projects/project.routes.ts
```

### **Database Model Template**
```
Context: MWAP MongoDB schema with Mongoose
Task: Create database model for [entity]

Requirements:
- Multi-tenant design (tenantId field)
- TypeScript interface
- Mongoose schema with validation
- Indexes for performance
- Audit fields (createdAt, updatedAt, createdBy)

Schema Structure:
- Primary fields
- Tenant isolation field
- Relationships (refs to other collections)
- Validation rules
- Indexes (compound indexes with tenantId)

Reference: /src/features/projects/project.model.ts
Security: Ensure all queries include tenantId filter
```

### **Testing Template**
```
Context: MWAP testing with Vitest and MongoDB Memory Server
Task: Create comprehensive tests for [feature]

Test Types:
1. Unit tests (service layer)
2. Integration tests (API endpoints)
3. Database tests (model operations)

Setup:
- Test database with memory server
- Mock Auth0 JWT tokens
- Test data fixtures
- Cleanup after each test

Test Cases:
- Happy path scenarios
- Error conditions
- Edge cases
- Security (tenant isolation, permissions)
- Validation (invalid inputs)

Reference: /src/features/projects/__tests__/
```

## 🎯 Effective Prompting Strategies

### **1. Progressive Refinement**
```
Initial Prompt: Create user management feature
Refinement 1: Add specific validation requirements
Refinement 2: Include error handling patterns
Refinement 3: Add comprehensive testing
Final: Complete feature with documentation
```

### **2. Component-Based Approach**
```
Phase 1: Database model and types
Phase 2: Service layer with business logic
Phase 3: Controller and routes
Phase 4: Validation and middleware
Phase 5: Tests and documentation
```

### **3. Reference-Driven Development**
```
Base Reference: Use /src/features/projects/ as template
Modifications: Adapt for [new feature] requirements
Consistency: Maintain same patterns and structure
Innovation: Only where specifically needed
```

## 🔧 Common Prompt Patterns

### **Code Review Prompt**
```
Context: MWAP code review for security and quality
Task: Review the following code for:

Security:
- Tenant isolation implementation
- Authentication/authorization
- Input validation
- SQL injection prevention
- XSS protection

Quality:
- TypeScript compliance
- Error handling
- Code organization
- Performance considerations
- Testing coverage

Standards:
- Follow MWAP coding standards
- Consistent naming conventions
- Proper documentation
- Clean code principles

Code to review:
[Insert code here]
```

### **Debugging Prompt**
```
Context: MWAP application debugging
Issue: [Describe the problem]
Environment: [Development/Staging/Production]

Current Behavior:
[What's happening]

Expected Behavior:
[What should happen]

Error Messages:
[Any error logs or messages]

Recent Changes:
[What was changed recently]

Investigation Steps:
1. Check authentication flow
2. Verify tenant isolation
3. Review database queries
4. Examine error logs
5. Test API endpoints

Reference: Similar working feature in /src/features/[working-feature]/
```

### **Refactoring Prompt**
```
Context: MWAP code refactoring for [reason]
Current Code: [Location and description]
Goal: [What needs to be improved]

Constraints:
- Maintain backward compatibility
- Preserve existing functionality
- Follow MWAP patterns
- Improve [performance/security/maintainability]

Steps:
1. Analyze current implementation
2. Identify improvement opportunities
3. Plan refactoring approach
4. Implement changes incrementally
5. Test thoroughly
6. Update documentation

Reference: Best practices from /src/features/[best-example]/
```

## 🚀 Advanced Prompting Techniques

### **Multi-Step Development**
```
Project: [Feature name] implementation
Context: MWAP multi-tenant platform

Step 1: Architecture Planning
- Define data model
- Plan API endpoints
- Identify security requirements
- Design component structure

Step 2: Implementation
- Create database models
- Implement service layer
- Build API endpoints
- Add validation and middleware

Step 3: Testing & Validation
- Unit tests
- Integration tests
- Security testing
- Performance testing

Step 4: Documentation & Deployment
- API documentation
- Code comments
- Deployment guide
- Monitoring setup

Each step should reference existing MWAP patterns and maintain consistency.
```

### **Problem-Solution Framework**
```
Problem: [Specific issue or requirement]
Context: MWAP platform constraints and requirements

Analysis:
- Current state assessment
- Requirements gathering
- Constraint identification
- Risk evaluation

Solution Options:
1. Option A: [Description, pros, cons]
2. Option B: [Description, pros, cons]
3. Option C: [Description, pros, cons]

Recommended Approach:
- Chosen solution with rationale
- Implementation plan
- Testing strategy
- Rollback plan

Reference: Similar solutions in MWAP codebase
```

## 📊 Prompt Effectiveness Metrics

### **Quality Indicators**
- **Specificity**: Clear, actionable requirements
- **Context**: Sufficient background information
- **Constraints**: Well-defined limitations
- **Examples**: Reference to existing patterns
- **Validation**: Testable outcomes

### **Common Pitfalls to Avoid**
- Vague requirements without context
- Missing security considerations
- Ignoring existing patterns
- Insufficient error handling
- No testing requirements
- Unclear success criteria

## 🔗 Related Documentation

- **[🤖 AI Agents Overview](./README.md)** - AI system overview
- **[🔧 Microagents System](./microagents.md)** - Microagent architecture
- **[🤝 OpenHands Integration](./openhands-integration.md)** - AI development tools
- **[🎯 Agent Patterns](./agent-patterns.md)** - Common AI agent patterns
- **[✨ Best Practices](./best-practices.md)** - AI development best practices

---

*This prompt engineering guide provides structured approaches for effective AI-assisted development in the MWAP platform, ensuring consistent, secure, and maintainable code generation.*