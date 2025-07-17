# 🤝 Contributing to MWAP

## 🎯 Welcome Contributors

Thank you for your interest in contributing to MWAP (Modular Web Application Platform)! This comprehensive guide provides everything you need to know to contribute effectively to our secure, scalable, multi-tenant SaaS framework.

MWAP is built with security-first principles, TypeScript-strict standards, and follows domain-driven design patterns. We welcome contributions from developers of all experience levels who share our commitment to quality and security.

## 🌟 Ways to Contribute

### **Code Contributions**
- 🚀 **New Features**: Implement new functionality following our feature development lifecycle
- 🐛 **Bug Fixes**: Resolve issues and improve system reliability
- ⚡ **Performance**: Optimize queries, improve response times, reduce resource usage
- 🔒 **Security**: Enhance authentication, authorization, and data protection
- 🧪 **Testing**: Improve test coverage and quality assurance

### **Documentation Contributions**
- 📚 **API Documentation**: Improve endpoint documentation and examples
- 📖 **Guides**: Create or enhance development and deployment guides
- 🎯 **Tutorials**: Write step-by-step tutorials for common tasks
- 🔍 **Code Comments**: Improve inline documentation and code clarity

### **Community Contributions**
- 🐛 **Issue Reporting**: Report bugs with detailed reproduction steps
- 💡 **Feature Requests**: Propose new features with clear use cases
- 🤔 **Discussions**: Participate in architectural and design discussions
- 👥 **Code Reviews**: Review pull requests and provide constructive feedback

## 🚀 Quick Start for Contributors

### **Prerequisites**
```bash
# Required software
Node.js 18+                    # JavaScript runtime
npm 9+                         # Package manager
Git 2.30+                      # Version control
MongoDB 6+                     # Database (local or Atlas)

# Development tools
TypeScript 5+                  # Type system
ESLint 8+                      # Code linting
Prettier 3+                    # Code formatting
Vitest 1+                      # Testing framework

# Accounts needed
MongoDB Atlas account          # Database hosting
Auth0 account                  # Authentication service
GitHub account                 # Code hosting and collaboration
```

### **Development Environment Setup**
```bash
# 1. Fork the repository on GitHub
# Click "Fork" button on https://github.com/dhirmadi/mwapserver

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/mwapserver.git
cd mwapserver

# 3. Add upstream remote
git remote add upstream https://github.com/dhirmadi/mwapserver.git

# 4. Install dependencies
npm install

# 5. Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see Environment Setup section)

# 6. Verify setup
npm run type-check              # TypeScript compilation
npm run lint                    # Code linting
npm run test:unit              # Unit tests
npm run dev                    # Start development server

# 7. Verify application is running
curl http://localhost:3000/health
```

### **Environment Configuration**
```bash
# Required environment variables for development
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mwap_dev

# Auth0 configuration (create free account at auth0.com)
AUTH0_DOMAIN=your-dev-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://api.mwap.local

# Generate secure secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Development features
ENABLE_SWAGGER_UI=true
ENABLE_DEBUG_LOGGING=true
LOG_LEVEL=debug
```

## 🏗️ Development Workflow

### **Branch Strategy**
We use **Git Flow** with feature branches for all development:

```
main                           # Production-ready code (protected)
├── develop                    # Integration branch (protected)
├── feature/user-auth-rbac     # New features
├── fix/project-creation-bug   # Bug fixes
├── hotfix/security-patch      # Critical production fixes
├── docs/api-documentation     # Documentation updates
├── refactor/service-cleanup   # Code refactoring
├── test/integration-coverage  # Test improvements
└── chore/dependency-updates   # Maintenance tasks
```

### **Branch Naming Conventions**
```bash
# Feature development
feature/user-authentication    # New functionality
feature/project-dashboard      # UI components
feature/cloud-integration      # External integrations

# Bug fixes
fix/jwt-validation-error       # Bug resolution
fix/database-connection        # Infrastructure fixes
fix/api-response-format        # API corrections

# Hotfixes (critical production issues)
hotfix/security-vulnerability  # Security patches
hotfix/data-corruption         # Data integrity fixes

# Documentation
docs/api-endpoints             # API documentation
docs/deployment-guide          # Deployment instructions
docs/architecture-diagrams     # System documentation

# Refactoring
refactor/service-layer         # Code restructuring
refactor/database-schema       # Schema improvements
refactor/error-handling        # Code quality improvements

# Testing
test/unit-coverage             # Unit test improvements
test/integration-api           # Integration testing
test/performance-benchmarks    # Performance testing

# Maintenance
chore/dependency-updates       # Package updates
chore/build-optimization       # Build improvements
chore/ci-pipeline              # CI/CD improvements
```

### **Development Process**
```bash
# 1. Sync with upstream
git checkout develop
git pull upstream develop

# 2. Create feature branch
git checkout -b feature/project-dashboard

# 3. Develop with atomic commits
git add src/features/projects/
git commit -m "feat(projects): add project model and validation"

git add src/features/projects/project.service.ts
git commit -m "feat(projects): implement project service layer"

git add src/features/projects/__tests__/
git commit -m "test(projects): add comprehensive unit tests"

# 4. Keep branch updated
git fetch upstream
git rebase upstream/develop

# 5. Push feature branch
git push -u origin feature/project-dashboard

# 6. Create pull request
# Use GitHub UI to create PR from your fork to upstream/develop
```

## 📋 Contribution Guidelines

### **Code Quality Standards**
```typescript
// 1. TypeScript Strict Mode
// All code must compile with strict: true
interface User {
  id: string;                  // ✅ Explicit typing
  name: string;
  email?: string;              // ✅ Optional properties marked
}

const user: User = {           // ✅ Type annotation
  id: '123',
  name: 'John Doe'
};

// 2. ESM Modules Only
import { UserService } from './user.service.js';  // ✅ ESM import
export { UserController };                        // ✅ Named export

// 3. Async/Await Pattern
async function createUser(data: CreateUserRequest): Promise<User> {
  try {
    const validatedData = validateUserData(data);
    const user = await userService.create(validatedData);
    return user;
  } catch (error) {
    logger.error('User creation failed', { error: error.message });
    throw new AppError('Failed to create user', 500);
  }
}

// 4. Proper Error Handling
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### **Security Requirements**
```typescript
// 1. Authentication Required
router.use(authenticateJWT());              // ✅ Always authenticate

// 2. Authorization Checks
router.get('/projects', 
  requireTenantOwner(),                     // ✅ Role-based access
  projectController.getProjects
);

// 3. Input Validation
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),         // ✅ Zod validation
  description: z.string().max(500).optional()
});

// 4. No Secrets in Code
const config = {
  jwtSecret: process.env.JWT_SECRET!,       // ✅ Environment variables
  dbUri: process.env.MONGODB_URI!
};

// 5. Secure Error Responses
catch (error) {
  logger.error('Operation failed', { error: error.message });
  
  // Don't expose internal errors
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
    
  res.status(500).json({ success: false, error: { message } });
}
```

### **Testing Requirements**
```typescript
// 1. Unit Tests for Business Logic
describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create project with valid data', async () => {
      // Arrange
      const projectData = { name: 'Test Project' };
      vi.mocked(Project.findOne).mockResolvedValue(null);
      
      // Act
      const result = await projectService.createProject('tenant-1', 'user-1', projectData);
      
      // Assert
      expect(result.name).toBe(projectData.name);
      expect(result.tenantId).toBe('tenant-1');
    });
  });
});

// 2. Integration Tests for APIs
describe('Projects API', () => {
  it('should create project via POST /api/v1/projects', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Test Project' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test Project');
  });
});

// 3. Test Coverage Requirements
// Minimum 80% coverage for new code
// All error paths must be tested
// Security scenarios must be tested
```

## 🔍 Code Review Process

### **Pull Request Requirements**
```markdown
## Pull Request Checklist

### Code Quality
- [ ] TypeScript strict mode compliance
- [ ] ESLint passes without warnings
- [ ] Prettier formatting applied
- [ ] No console.log statements in production code
- [ ] Proper error handling implemented

### Security
- [ ] Authentication middleware applied to protected routes
- [ ] Authorization checks implemented
- [ ] Input validation with Zod schemas
- [ ] No secrets or sensitive data in code
- [ ] Security implications reviewed

### Testing
- [ ] Unit tests added for new functionality
- [ ] Integration tests for API endpoints
- [ ] Test coverage > 80% for new code
- [ ] All tests pass locally
- [ ] Edge cases and error scenarios tested

### Documentation
- [ ] Code comments for complex logic
- [ ] API documentation updated (if applicable)
- [ ] README updated (if needed)
- [ ] Migration guide (for breaking changes)

### Performance
- [ ] Database queries optimized
- [ ] No N+1 query problems
- [ ] Appropriate caching implemented
- [ ] Memory leaks prevented
```

### **Review Process**
1. **Automated Checks**: CI pipeline runs tests, linting, and security scans
2. **Peer Review**: At least one team member reviews the code
3. **Security Review**: Security-sensitive changes require additional review
4. **Documentation Review**: Documentation changes reviewed for accuracy
5. **Final Approval**: Maintainer approval required before merge

### **Review Criteria**
```typescript
// Code reviewers check for:
interface ReviewCriteria {
  functionality: {
    correctness: boolean;        // Does it work as intended?
    completeness: boolean;       // Are all requirements met?
    edgeCases: boolean;         // Are edge cases handled?
  };
  
  security: {
    authentication: boolean;     // Proper auth implementation?
    authorization: boolean;      // Correct permissions?
    inputValidation: boolean;    // All inputs validated?
    errorHandling: boolean;      // Secure error responses?
  };
  
  quality: {
    readability: boolean;        // Is code easy to understand?
    maintainability: boolean;    // Easy to modify and extend?
    performance: boolean;        // Efficient implementation?
    testability: boolean;        // Well-structured for testing?
  };
  
  standards: {
    conventions: boolean;        // Follows naming conventions?
    patterns: boolean;          // Uses established patterns?
    documentation: boolean;      // Adequately documented?
    consistency: boolean;        // Consistent with codebase?
  };
}
```

## 🐛 Issue Reporting

### **Bug Report Template**
```markdown
## Bug Report

### Description
A clear and concise description of the bug.

### Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

### Expected Behavior
A clear description of what you expected to happen.

### Actual Behavior
A clear description of what actually happened.

### Environment
- OS: [e.g., macOS 13.0, Ubuntu 20.04]
- Node.js version: [e.g., 18.17.0]
- Browser: [e.g., Chrome 115.0]
- MWAP version: [e.g., 1.2.3]

### Additional Context
- Error messages (full stack trace if available)
- Screenshots (if applicable)
- Related issues or PRs
- Possible solution (if you have ideas)

### Security Issues
If this is a security vulnerability, please email security@mwap.com instead of creating a public issue.
```

### **Feature Request Template**
```markdown
## Feature Request

### Problem Statement
A clear description of the problem this feature would solve.

### Proposed Solution
A detailed description of the feature you'd like to see implemented.

### Alternative Solutions
Any alternative solutions or features you've considered.

### Use Cases
Specific scenarios where this feature would be valuable.

### Implementation Considerations
- Technical complexity
- Breaking changes
- Migration requirements
- Performance impact

### Additional Context
- Related issues or discussions
- Examples from other projects
- Mockups or diagrams (if applicable)
```

## 🚀 Release Process

### **Version Management**
```bash
# Semantic versioning (MAJOR.MINOR.PATCH)
1.0.0 → 1.0.1    # Patch: Bug fixes
1.0.1 → 1.1.0    # Minor: New features (backward compatible)
1.1.0 → 2.0.0    # Major: Breaking changes

# Version bumping
npm version patch    # Bug fixes
npm version minor    # New features
npm version major    # Breaking changes
```

### **Release Workflow**
```bash
# 1. Create release branch
git checkout develop
git checkout -b release/v1.2.0

# 2. Update version and changelog
npm version minor
npm run changelog

# 3. Final testing
npm run test:all
npm run build
npm run test:e2e

# 4. Merge to main
git checkout main
git merge release/v1.2.0

# 5. Tag release
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin main --tags

# 6. Merge back to develop
git checkout develop
git merge main
```

## 🏆 Recognition

### **Contributor Levels**
- **🌱 First-time Contributor**: Welcome! Your first PR is merged
- **🔧 Regular Contributor**: Multiple PRs merged, active in discussions
- **🎯 Core Contributor**: Significant features implemented, helps with reviews
- **🚀 Maintainer**: Trusted with repository access, guides project direction

### **Hall of Fame**
Contributors are recognized in:
- `docs/00-Overview/contributors.md` - Contributor profiles and achievements
- GitHub repository contributors page
- Release notes acknowledgments
- Annual contributor appreciation posts

## 📞 Getting Help

### **Communication Channels**
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and architectural discussions
- **Pull Request Comments**: Code-specific discussions
- **Email**: security@mwap.com for security issues

### **Resources**
- [🛠️ Development Guide](../07-Standards/development-guide.md) - Complete development standards
- [🔒 Coding Standards](../07-Standards/coding-standards.md) - Code quality guidelines
- [📝 Naming Conventions](../07-Standards/naming.md) - Naming standards
- [📋 Commit Style](../07-Standards/commit-style.md) - Git commit conventions
- [🔧 Environment Setup](../01-Getting-Started/env-setup.md) - Environment configuration

### **Mentorship Program**
New contributors can request mentorship:
1. Comment on an issue tagged `good-first-issue`
2. Mention that you'd like guidance
3. A maintainer will provide support and code review

## 🙏 Thank You

Every contribution makes MWAP better! Whether you're fixing a typo, implementing a major feature, or helping other contributors, your efforts are valued and appreciated.

**Happy coding! 🚀**

---

*This contributing guide ensures high-quality contributions while maintaining MWAP's security, performance, and maintainability standards. Welcome to the MWAP community!*
- **Documentation**: `docs/topic-name`
- **Refactoring**: `refactor/component-name`
- **Hotfixes**: `hotfix/critical-issue`

### Development Process

#### 1. Create Feature Branch
```bash
# Always start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

#### 2. Development Guidelines

**Code Standards**
- **TypeScript-first**: Use strict typing, no `any` types
- **ESM modules**: Native ES modules only
- **Security-first**: Follow Auth0 JWT patterns
- **DRY principle**: No code duplication
- **Feature-based structure**: Organize by domain features

**File Organization**
```
src/features/your-feature/
├── routes.ts           # Express routes
├── service.ts          # Business logic
├── model.ts           # MongoDB models
├── validation.ts      # Zod schemas
└── types.ts           # TypeScript types
```

#### 3. Commit Standards

We follow **Conventional Commits** specification:

```bash
# Format: type(scope): description
git commit -m "feat(auth): add RBAC middleware for tenant isolation"
git commit -m "fix(api): resolve validation error in user creation"
git commit -m "docs(readme): update setup instructions"
git commit -m "refactor(db): optimize query performance"
```

**Commit Types**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code restructuring (no behavior changes)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### 4. Testing Requirements

**Before submitting PR:**
```bash
# Run all tests
npm run test

# Run linting
npm run lint

# Run type checking
npm run type-check

# Validate documentation links
npm run validate-docs
```

**Test Coverage Requirements**
- **Unit Tests**: All business logic functions
- **Integration Tests**: API endpoints and database operations
- **No Browser Tests**: Only local testing (no E2E)

#### 5. Pull Request Process

**PR Preparation**
```bash
# Ensure branch is up to date
git checkout main
git pull origin main
git checkout feature/your-feature
git rebase main

# Push feature branch
git push origin feature/your-feature
```

**PR Template**
```markdown
## 🎯 Description
Brief description of changes and motivation.

## 🔄 Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## ✅ Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Documentation updated

## 🔒 Security Checklist
- [ ] No secrets in code
- [ ] Auth0 patterns followed
- [ ] Input validation implemented
- [ ] RBAC permissions verified

## 📚 Documentation
- [ ] Code comments added
- [ ] API documentation updated
- [ ] README updated if needed
```

## 🔒 Security Guidelines

### Authentication & Authorization
- **Always use Auth0 JWT**: No custom authentication
- **Implement RBAC**: Role-based access control for all endpoints
- **Tenant Isolation**: Ensure data separation between tenants
- **Input Validation**: Use Zod schemas for all inputs

### Code Security
```typescript
// ✅ Good: Proper JWT validation
import { authenticateJWT, requireTenantOwner } from '../middleware/auth';

router.get('/projects', 
  authenticateJWT(),
  requireTenantOwner(),
  getProjects
);

// ❌ Bad: No authentication
router.get('/projects', getProjects);
```

### Environment Variables
```bash
# ✅ Good: Use environment variables
const mongoUri = process.env.MONGODB_URI;

# ❌ Bad: Hardcoded secrets
const mongoUri = "mongodb://user:pass@cluster.mongodb.net";
```

## 🧪 Testing Standards

### Unit Testing
```typescript
// Example unit test structure
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      const result = await userService.createUser(userData);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });

    it('should throw error for invalid email', async () => {
      const userData = { email: 'invalid-email', name: 'Test User' };
      
      await expect(userService.createUser(userData))
        .rejects.toThrow('Invalid email format');
    });
  });
});
```

### Integration Testing
```typescript
// Example API integration test
describe('POST /api/v1/users', () => {
  it('should create user with valid JWT', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${validJWT}`)
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201);

    expect(response.body.data.email).toBe('test@example.com');
  });

  it('should reject request without JWT', async () => {
    await request(app)
      .post('/api/v1/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(401);
  });
});
```

## 📚 Documentation Standards

### Code Documentation
```typescript
/**
 * Creates a new user with tenant association
 * @param userData - User information including email and name
 * @param tenantId - Tenant ID for user association
 * @returns Promise<User> - Created user object
 * @throws {ValidationError} - When user data is invalid
 * @throws {DuplicateError} - When user already exists
 */
export async function createUser(
  userData: CreateUserRequest,
  tenantId: string
): Promise<User> {
  // Implementation
}
```

### API Documentation
- Update OpenAPI schema for new endpoints
- Include request/response examples
- Document authentication requirements
- Specify error responses

## 🐛 Bug Reports

### Bug Report Template
```markdown
## 🐛 Bug Description
Clear description of the bug and expected behavior.

## 🔄 Steps to Reproduce
1. Step one
2. Step two
3. Step three

## 🌍 Environment
- Node.js version:
- MongoDB version:
- Auth0 configuration:
- Browser (if applicable):

## 📋 Additional Context
Any additional information, logs, or screenshots.
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## 🚀 Feature Description
Clear description of the proposed feature.

## 🎯 Problem Statement
What problem does this feature solve?

## 💭 Proposed Solution
Detailed description of the proposed implementation.

## 🔄 Alternatives Considered
Other solutions you've considered.

## 📊 Additional Context
Any additional information or mockups.
```

## 🏆 Recognition

### Contributor Levels
- **First-time Contributors**: Welcome package and mentorship
- **Regular Contributors**: Recognition in changelog and documentation
- **Core Contributors**: Maintainer privileges and decision-making input

### Contribution Types
- **Code Contributions**: Features, bug fixes, performance improvements
- **Documentation**: Guides, API docs, examples
- **Testing**: Test coverage, quality assurance
- **Design**: UI/UX improvements, architecture design
- **Community**: Issue triage, user support, mentorship

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community support
- **Code Reviews**: PR feedback and technical discussions

### Mentorship Program
- New contributors are paired with experienced maintainers
- Regular check-ins and guidance sessions
- Gradual increase in responsibility and complexity

## 🎉 Thank You

Your contributions make MWAP better for everyone. Whether you're fixing a typo, adding a feature, or improving documentation, every contribution is valued and appreciated.

---

## 📚 Related Documentation

- [Development Guide](../07-Standards/development-guide.md) - Detailed development practices
- [Coding Standards](../07-Standards/coding-standards.md) - Code style and conventions
- [API Documentation](../04-Backend/API-v3.md) - Complete API reference
- [Architecture Reference](../02-Architecture/system-design.md) - System architecture

---

*Together, we're building a secure, scalable, and maintainable platform that serves developers worldwide.*