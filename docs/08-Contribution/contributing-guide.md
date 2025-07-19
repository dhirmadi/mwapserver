# MWAP Contributing Guide

Welcome to the MWAP contributing guide! We're excited to have you contribute to the Modular Web Application Platform. This comprehensive guide covers everything you need to know about contributing effectively to the project.

## 🎯 How to Contribute

### Types of Contributions
We welcome and value all types of contributions:

- **🐛 Bug Fixes**: Help us squash bugs and improve stability
- **✨ Feature Development**: Add new features and capabilities
- **📚 Documentation**: Improve guides, tutorials, and API docs
- **🧪 Testing**: Write tests and improve test coverage
- **⚡ Performance**: Optimize code and improve performance
- **🔒 Security**: Identify and fix security vulnerabilities
- **🎨 UI/UX**: Improve user interface and experience
- **🔧 Infrastructure**: Improve build tools, CI/CD, and deployment

### Contribution Values
- **Quality First**: We prioritize code quality and maintainability
- **Security Focused**: Security considerations in all contributions
- **User-Centric**: Features and fixes that benefit end users
- **Collaborative**: Open communication and constructive feedback
- **Learning**: Everyone learns and grows together
- **Documentation**: Keep docs current with code changes

## 🚀 Getting Started

### Prerequisites
Before contributing, ensure you have:

- **Node.js 20+** installed
- **Git** configured with your GitHub account
- **MongoDB Atlas** account (for testing)
- **Auth0** account (for authentication testing)
- **Code Editor** (VS Code recommended)
- **Familiarity** with TypeScript, React, and Node.js

### Initial Development Setup

#### 1. Fork and Clone Repository
```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/mwap-server.git
cd mwap-server

# Add upstream remote for syncing
git remote add upstream https://github.com/original/mwap-server.git
```

#### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm run build
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
vim .env.local

# Required variables:
# NODE_ENV=development
# PORT=3001
# MONGODB_URI=mongodb://localhost:27017/mwap_dev
# AUTH0_DOMAIN=your-dev-tenant.auth0.com
# AUTH0_CLIENT_ID=your_client_id
# AUTH0_CLIENT_SECRET=your_client_secret
# AUTH0_AUDIENCE=https://localhost:3001
```

#### 4. Database Setup
```bash
# Start MongoDB (if running locally)
brew services start mongodb/brew/mongodb-community

# Or use MongoDB Atlas connection string in .env.local
```

#### 5. Start Development Server
```bash
# Start the development server
npm run dev

# Verify server is running
curl http://localhost:3001/health
```

#### 6. Run Tests
```bash
# Run full test suite
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.ts
```

For detailed setup instructions, see our [Development Guide](../06-Guides/development-guide.md).

## 📋 Contribution Workflow

### Planning Your Contribution

#### For Bug Fixes
1. **Search Issues**: Check existing issues to avoid duplicates
2. **Create Issue**: If none exists, create detailed bug report
3. **Get Assignment**: Comment on issue to get assigned
4. **Understand Scope**: Clarify requirements with maintainers

#### For New Features  
1. **Feature Request**: Create feature request issue first
2. **Discussion**: Discuss approach with maintainers
3. **Design Document**: For large features, create design doc
4. **Approval**: Get explicit approval before starting
5. **Break Down**: Consider splitting large features into smaller PRs

#### For Documentation
1. **Identify Gaps**: Find missing or unclear documentation
2. **Check Standards**: Follow our [Documentation Guide](./documentation-guide.md)
3. **Test Examples**: Ensure all code examples work
4. **Cross-Reference**: Update related documentation

### Development Process

#### 1. Create Feature Branch

Follow our branching strategy for consistent development:

```bash
# Sync with latest develop
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/descriptive-name

# For bug fixes
git checkout -b bugfix/issue-description

# For documentation
git checkout -b docs/update-guide-name
```

**Branch Naming Conventions:**
- `feature/add-project-templates`
- `feature/ISSUE-123-oauth-integration`
- `bugfix/authentication-timeout`
- `bugfix/ISSUE-456-validation-error`
- `docs/update-api-guide`
- `docs/add-deployment-instructions`

#### 2. Follow Development Standards

Adhere to our comprehensive development standards:

**Code Quality:**
- Use **TypeScript strict mode** for all code
- Follow our [Development Standards](../07-Standards/development-standards.md)
- Write **self-documenting code** with clear naming
- Add **comprehensive tests** for new functionality
- Include **proper error handling** with informative messages

**Commit Standards:**
Follow our [Git Workflow](../07-Standards/git-workflow.md) conventions:

```bash
# Commit message format
type(scope): description

# Examples
feat(auth): add OAuth2 integration for Google Drive
fix(api): resolve user validation timeout issue
docs(readme): update installation instructions
test(users): add comprehensive role validation tests
refactor(db): optimize query performance for large datasets
```

#### 3. Testing Requirements

**Test Coverage Requirements:**
- **Unit Tests**: All new functions and classes (target: 90%+ coverage)
- **Integration Tests**: All new API endpoints (target: 80%+ coverage)  
- **End-to-End Tests**: Critical user workflows (target: 70%+ coverage)
- **Regression Tests**: All bug fixes must include regression tests

**Testing Examples:**
```typescript
// Unit test example
describe('UserService.createUser', () => {
  it('should create user with valid data and return user object', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      tenantId: 'tenant-123'
    };
    
    // Act
    const result = await userService.createUser(userData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data.email).toBe(userData.email);
    expect(result.data.id).toBeDefined();
  });
  
  it('should reject invalid email format', async () => {
    // Arrange
    const userData = {
      email: 'invalid-email',
      name: 'Test User',
      tenantId: 'tenant-123'
    };
    
    // Act & Assert
    await expect(userService.createUser(userData))
      .rejects.toThrow('Invalid email format');
  });
});

// Integration test example
describe('POST /api/v1/users', () => {
  it('should create user successfully with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .expect(201);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('John Doe');
  });
});
```

#### 4. Documentation Updates

**Required Documentation:**
- Update **API documentation** for new/changed endpoints
- Add **code examples** for new features
- Update **relevant guides** and tutorials
- Include **migration notes** for breaking changes
- Add **troubleshooting** information for complex features

**Documentation Standards:**
- Use **clear, concise language**
- Include **practical examples**
- Test all **code examples** before publishing
- Follow our **markdown style guide**
- Update **table of contents** when needed

### Pre-Pull Request Checklist

Before creating your pull request:

- [ ] **All tests pass** locally (`npm test`)
- [ ] **Code follows style guidelines** (`npm run lint`)
- [ ] **TypeScript compiles** without errors (`npm run type-check`)
- [ ] **Documentation updated** for any changes
- [ ] **Self-review completed** - review your own code first
- [ ] **Branch is up to date** with develop
- [ ] **Commit messages** follow conventions
- [ ] **No sensitive data** committed (keys, passwords, etc.)

```bash
# Pre-PR validation commands
npm test                 # Run all tests
npm run test:coverage    # Check test coverage
npm run lint            # Check code style
npm run type-check      # TypeScript validation
npm run build           # Verify build works
```

## 📝 Pull Request Process

### Creating Pull Requests

#### 1. Push Your Branch
```bash
# Push feature branch to your fork
git push origin feature/your-feature-name

# If branch already exists and you've rebased
git push --force-with-lease origin feature/your-feature-name
```

#### 2. Create Pull Request on GitHub

Use this comprehensive PR template:

```markdown
## Description
Brief description of what this PR does and why it's needed.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test improvements
- [ ] Chore (maintenance, dependency updates)

## Related Issues
Closes #123
Relates to #456
Fixes #789

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All existing tests pass
- [ ] Manual testing completed
- [ ] Performance impact assessed
- [ ] Security implications reviewed

## Screenshots (if applicable)
Add screenshots or GIFs for UI changes.

## Breaking Changes
If this introduces breaking changes, describe them here and provide migration instructions.

## Documentation
- [ ] Code comments added/updated
- [ ] API documentation updated
- [ ] User guides updated
- [ ] README updated if needed
- [ ] CHANGELOG updated

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Additional Notes
Any additional information that reviewers should know.
```

### Pull Request Guidelines

#### PR Title Guidelines
Use descriptive, concise titles following this format:
```
type(scope): brief description
```

**Examples:**
- `feat(auth): add OAuth2 integration for Google Drive`
- `fix(api): resolve user validation timeout issue`
- `docs(readme): update installation instructions`
- `refactor(agents): improve error handling in base agent`

#### PR Size Guidelines
- **Small (1-50 lines)**: Ideal size, fast review
- **Medium (51-200 lines)**: Acceptable, reasonable review time
- **Large (201-500 lines)**: Needs justification and careful review
- **Extra Large (500+ lines)**: Avoid if possible, consider splitting

#### Breaking Down Large PRs
If your PR is large, consider:
1. **Split by Feature**: Separate different features
2. **Split by Layer**: Database, business logic, API changes
3. **Split by Component**: Different modules or services
4. **Preparatory PRs**: Infrastructure changes first, then features

### Code Review Process

#### For PR Authors

**Responding to Feedback:**
1. **Be Receptive**: View feedback as helping improve the code
2. **Ask Questions**: If feedback is unclear, ask for clarification
3. **Explain Decisions**: If you disagree, explain your reasoning respectfully
4. **Make Changes**: Address feedback promptly and thoroughly
5. **Mark Resolved**: Mark conversations as resolved when addressed

**Updating Your PR:**
```bash
# Make requested changes
git add .
git commit -m "fix(review): address code review feedback"

# Update PR
git push origin feature/your-feature-name

# If you need to squash commits
git rebase -i HEAD~3  # Interactive rebase
git push --force-with-lease origin feature/your-feature-name
```

#### For Reviewers

**Review Priorities:**
1. **Correctness**: Does the code do what it's supposed to do?
2. **Security**: Are there any security vulnerabilities?
3. **Performance**: Will this impact system performance?
4. **Maintainability**: Is the code easy to understand and modify?
5. **Testing**: Are there adequate tests?
6. **Standards**: Does it follow coding standards?

**Review Process:**
1. **Understand Context**: Read PR description and related issues
2. **Review Code**: Look at changes line by line
3. **Test Locally**: Pull branch and test if needed
4. **Provide Feedback**: Use constructive feedback guidelines
5. **Make Decision**: Approve, request changes, or comment

**Effective Feedback Examples:**
```markdown
✅ Consider using a more descriptive variable name here. 
   What about `userAuthenticationToken` instead of `token`?

✅ This function is getting large. Could we extract the 
   validation logic into a separate method?

✅ Great error handling here! This will make debugging much easier.

✅ Security concern: This endpoint doesn't validate user permissions.
   Should we add authorization middleware?
```

**Feedback Categories:**
- **Must Fix**: Security issues, bugs, breaking changes
- **Should Fix**: Code quality, maintainability issues  
- **Consider**: Suggestions for improvement
- **Praise**: Acknowledge good practices

### Merge Requirements

#### Automated Checks
All PRs must pass:
- [ ] **CI/CD pipeline** passes
- [ ] **All tests** pass
- [ ] **Code coverage** requirements met
- [ ] **Security scan** passes
- [ ] **Linting** passes
- [ ] **TypeScript** compilation succeeds

#### Manual Requirements
- [ ] **At least one approval** from code owner
- [ ] **Security review** for security-related changes
- [ ] **Performance review** for performance-critical changes
- [ ] **Documentation** updated where needed
- [ ] **Breaking changes** approved by maintainers

#### Merge Strategies

**Feature Branches → Develop:**
```bash
# Strategy: Squash and Merge (creates clean history)
git checkout develop
git merge --squash feature/my-feature
git commit -m "feat(scope): feature description"
```

**Develop → Main:**
```bash
# Strategy: Merge Commit (preserves development history)
git checkout main
git merge --no-ff develop
```

## 🐛 Issue Management

### Creating Issues

We use specific templates for different types of issues to ensure consistency and completeness.

#### Bug Report Template

```markdown
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] Brief description of the issue'
labels: 'bug, needs-triage'
assignees: ''
---

## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. macOS 13.0, Windows 11, Ubuntu 22.04]
- Browser: [e.g. Chrome 118, Firefox 119, Safari 17]
- Node.js Version: [e.g. 20.17.0]
- Application Version: [e.g. 2.1.0]

## Error Logs
```
Paste any relevant error logs here
```

## Reproduction Repository
If possible, provide a minimal reproduction repository or CodeSandbox link.

## Workaround
If you found a temporary workaround, please describe it here.
```

#### Feature Request Template

```markdown
---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] Brief description of the feature'
labels: 'enhancement, needs-discussion'
assignees: ''
---

## Feature Summary
A clear and concise description of the feature you'd like to see implemented.

## Problem Statement
What problem does this feature solve? What use case does it address?

## Proposed Solution
Describe the solution you'd like to see implemented.

## Alternative Solutions
Describe any alternative solutions or features you've considered.

## User Stories
- As a [user type], I want [functionality] so that [benefit/goal]
- As a [user type], I want [functionality] so that [benefit/goal]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Considerations
- Performance impact: [High/Medium/Low/None]
- Breaking changes: [Yes/No]
- Dependencies: [List any new dependencies]
- Database changes: [Yes/No - describe if yes]

## Mockups/Wireframes
If applicable, add mockups, wireframes, or visual examples.

## Priority
- [ ] Critical - Blocking operations
- [ ] High - Important for next release
- [ ] Medium - Would be nice to have
- [ ] Low - Future consideration
```

#### Security Issue Template

```markdown
---
name: Security Issue
about: Report a security vulnerability (use private reporting if severe)
title: '[SECURITY] Brief description'
labels: 'security, urgent'
assignees: '@security-team'
---

## ⚠️ Security Issue

**Please use GitHub's private vulnerability reporting for severe security issues.**

## Issue Description
Brief description of the security concern.

## Affected Components
- [ ] Authentication system
- [ ] API endpoints
- [ ] Database
- [ ] File handling
- [ ] User permissions
- [ ] Third-party integrations

## Severity Assessment
- [ ] Critical - Immediate action required
- [ ] High - Should be fixed soon
- [ ] Medium - Important but not urgent
- [ ] Low - Minor security improvement

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Impact Assessment
What could an attacker achieve with this vulnerability?

## Mitigation Suggestions
Any immediate steps to reduce risk?
```

### Issue Labeling System

#### Priority Labels
- `critical` - Blocking operations, security issues
- `high` - Important for current sprint  
- `medium` - Should be addressed soon
- `low` - Nice to have, future consideration

#### Type Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to docs
- `question` - Further information is requested
- `task` - Development tasks, chores
- `security` - Security-related issues

#### Component Labels
- `frontend` - React/UI related
- `backend` - Express/API related
- `database` - Database related
- `auth` - Authentication/authorization
- `cloud` - Cloud provider integrations
- `ai-agents` - AI agent functionality
- `testing` - Test-related issues
- `ci-cd` - Continuous integration/deployment

#### Status Labels
- `needs-triage` - New issue, needs evaluation
- `needs-discussion` - Requires team discussion
- `ready-for-dev` - Ready to be worked on
- `in-progress` - Currently being worked on
- `blocked` - Cannot proceed, waiting for something
- `needs-review` - Implementation ready for review

## 🌿 Branching Strategy for Contributors

### Branch Types and Workflow

Our branching strategy balances development velocity with code quality:

#### Main Branches
- **`main`**: Production-ready code, automatically deploys to production
- **`develop`**: Integration branch for ongoing development, deploys to staging

#### Contributing Branches
- **Feature branches** (`feature/description`): New features and enhancements
- **Bugfix branches** (`bugfix/description`): Non-critical bug fixes
- **Hotfix branches** (`hotfix/description`): Critical production fixes
- **Documentation branches** (`docs/description`): Documentation updates

### Contribution Workflow

#### 1. Feature Development Flow

```bash
# 1. Start from latest develop
git checkout develop
git pull upstream develop

# 2. Create feature branch
git checkout -b feature/my-new-feature

# 3. Development cycle
# - Make commits with clear messages
# - Push regularly to backup work
# - Rebase periodically to stay current

# 4. Keep branch updated
git fetch upstream
git rebase upstream/develop

# 5. Final cleanup before PR
git rebase -i upstream/develop  # Interactive rebase to clean commits

# 6. Push and create PR
git push origin feature/my-new-feature
```

#### 2. Bug Fix Workflow

```bash
# 1. Create bugfix branch from develop
git checkout develop
git pull upstream develop
git checkout -b bugfix/fix-validation-error

# 2. Fix the issue
# - Write failing test first (if possible)
# - Implement fix
# - Verify test passes
# - Add regression test

# 3. Create PR to develop
```

#### 3. Hotfix Workflow (for critical production issues)

```bash
# 1. Create hotfix from main
git checkout main
git pull upstream main
git checkout -b hotfix/critical-security-fix

# 2. Apply minimal fix
# - Focus only on the critical issue
# - Add test if possible
# - Keep changes minimal

# 3. Create PR to main (expedited review)
# 4. After merge, ensure fix is also in develop
```

### Branch Management Best Practices

#### Keeping Branches Clean
```bash
# Regular maintenance
git fetch upstream
git checkout develop
git merge upstream/develop
git push origin develop

# Clean up merged branches
git branch --merged develop | grep -v develop | xargs git branch -d
```

#### Handling Merge Conflicts
```bash
# During rebase
git rebase upstream/develop
# Edit conflicted files
git add .
git rebase --continue

# If rebase gets complex, abort and try merge
git rebase --abort
git merge upstream/develop
```

## 🔒 Security Guidelines

### Security Requirements
All contributions must adhere to security best practices:

- **Input Validation**: Validate and sanitize all user inputs
- **Authentication**: Verify user identity for protected operations
- **Authorization**: Check user permissions for specific actions
- **Data Protection**: Encrypt sensitive data and use secure communication
- **Error Handling**: Don't expose sensitive information in error messages
- **Dependencies**: Keep dependencies updated and scan for vulnerabilities

### Security Review Process
Security-related changes require:
- **Security-focused code review** from security team member
- **Penetration testing** for major security changes
- **Documentation** of security implications
- **Approval** from security team lead

### Security Best Practices
```typescript
// ✅ Good: Input validation
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['OWNER', 'MEMBER', 'VIEWER'])
});

const userData = createUserSchema.parse(req.body);

// ✅ Good: Authorization check
if (!hasPermission(user, 'users:create', tenantId)) {
  throw new ForbiddenError('Insufficient permissions');
}

// ✅ Good: Safe error messages
catch (error) {
  if (error instanceof ValidationError) {
    throw new BadRequestError('Invalid input data');
  }
  throw new InternalServerError('Operation failed');
}

// ❌ Bad: Exposing internal details
catch (error) {
  throw new Error(`Database error: ${error.message}`);
}
```

## 📊 Performance Considerations

### Performance Requirements
Consider performance impact for all contributions:

- **Database Queries**: Optimize queries and use appropriate indexes
- **API Response Times**: Keep response times under acceptable limits
- **Memory Usage**: Avoid memory leaks and excessive memory consumption
- **Caching**: Implement caching where appropriate
- **Bundle Size**: Keep client-side bundle sizes reasonable

### Performance Testing
```typescript
// Performance test example
describe('User API Performance', () => {
  it('should handle 100 concurrent user creation requests', async () => {
    const startTime = Date.now();
    
    const promises = Array.from({ length: 100 }, (_, i) =>
      request(app)
        .post('/api/v1/users')
        .send({ name: `User ${i}`, email: `user${i}@test.com` })
    );
    
    await Promise.all(promises);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
});
```

## 🎉 Recognition and Community

### Contributor Recognition
We value all contributions and recognize contributors through:

- **Contributors List**: Listed in CONTRIBUTORS.md
- **Release Notes**: Recognition in release notes for significant contributions
- **Special Badges**: Badges for different types of contributions
- **Annual Events**: Contributor appreciation events

### Types of Recognition
- **First-time Contributor**: Your first merged PR
- **Bug Hunter**: Finding and fixing critical bugs
- **Feature Champion**: Delivering major features
- **Documentation Hero**: Significant documentation improvements
- **Testing Advocate**: Improving test coverage significantly
- **Security Guardian**: Finding and fixing security issues

### Community Guidelines
We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/). Please:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome newcomers and diverse perspectives
- **Be Constructive**: Focus on what's best for the community
- **Be Empathetic**: Show understanding towards others
- **Be Patient**: Help others learn and grow

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code review and collaboration
- **Discord/Slack**: Real-time communication (if available)

### Getting Help
If you need assistance:

1. **Check Documentation**: Review existing guides and documentation
2. **Search Issues**: Look for similar issues and solutions
3. **Create Issue**: Create detailed issue with reproduction steps
4. **Join Discussions**: Participate in community discussions
5. **Contact Maintainers**: Reach out for guidance when needed

## 📚 Essential Resources

### Development Resources
- **[Development Standards](../07-Standards/development-standards.md)** - Comprehensive coding standards
- **[Git Workflow](../07-Standards/git-workflow.md)** - Git workflow and conventions
- **[Environment Standards](../07-Standards/environment-standards.md)** - Environment configuration
- **[Testing Guide](../06-Guides/testing-guide.md)** - Testing strategies and implementation
- **[Security Guide](../06-Guides/security-guide.md)** - Security implementation guide

### API and Architecture
- **[API Reference](../04-Backend/api-reference.md)** - Complete API documentation
- **[Architecture Overview](../02-Architecture/architecture.md)** - System design and patterns
- **[Frontend Guide](../03-Frontend/frontend-guide.md)** - Frontend development guide

### Learning Resources
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript documentation
- **[React Documentation](https://react.dev/)** - React development guide
- **[Node.js Guides](https://nodejs.org/en/docs/guides/)** - Node.js best practices
- **[MongoDB University](https://university.mongodb.com/)** - Database training
- **[Auth0 Documentation](https://auth0.com/docs/)** - Authentication guide

### Development Tools
- **VS Code Extensions**: TypeScript, ESLint, Prettier, GitLens
- **Database Tools**: MongoDB Compass, Studio 3T
- **API Testing**: Postman, Thunder Client, Insomnia
- **Git Tools**: GitKraken, SourceTree, GitHub Desktop

## 🚧 Common Issues and Solutions

### Development Issues

#### Port Already in Use
```bash
# Find and kill process using port
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm run dev
```

#### Dependency Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npm run type-check

# Rebuild TypeScript
npm run build

# Clear TypeScript cache
rm -rf dist/ .tsbuildinfo
```

### Git Issues

#### Sync Fork with Upstream
```bash
# Add upstream remote (if not added)
git remote add upstream https://github.com/original/mwap-server.git

# Sync with upstream
git fetch upstream
git checkout develop
git merge upstream/develop
git push origin develop
```

#### Rebase Feature Branch
```bash
# Update feature branch with latest develop
git checkout feature/my-feature
git fetch upstream
git rebase upstream/develop

# If conflicts, resolve and continue
git add .
git rebase --continue

# Force push to update PR
git push --force-with-lease origin feature/my-feature
```

#### Undo Last Commit (not pushed)
```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Undo last commit, discard changes
git reset --hard HEAD~1
```

## 📞 Contact and Support

### Maintainers
- **Lead Maintainer**: [GitHub username]
- **Backend Lead**: [GitHub username]
- **Frontend Lead**: [GitHub username]
- **Security Lead**: [GitHub username]
- **Documentation Lead**: [GitHub username]

### Support Channels
- **Bug Reports**: Create GitHub issue with bug template
- **Feature Requests**: Create GitHub issue with feature template
- **Questions**: Use GitHub discussions
- **Security Issues**: Email security@mwap.dev
- **General Support**: GitHub discussions or community chat

### Response Times
- **Security Issues**: 24 hours
- **Bug Reports**: 2-3 business days
- **Feature Requests**: 1 week
- **Pull Requests**: 2-3 business days for initial review
- **Questions**: 1-2 business days

## 🔄 Release Process

### Version Management
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR (x.0.0)**: Breaking changes
- **MINOR (x.y.0)**: New features (backward compatible)
- **PATCH (x.y.z)**: Bug fixes (backward compatible)

### Release Schedule
- **Patch Releases**: As needed for critical fixes
- **Minor Releases**: Monthly feature releases
- **Major Releases**: Quarterly with breaking changes

### How Contributors Help
- **Clear Commit Messages**: Enable automatic changelog generation
- **Update CHANGELOG.md**: Document user-facing changes
- **Highlight Breaking Changes**: Use conventional commit format
- **Document Features**: Provide clear feature documentation

### Release Notes
Contributors help by:
- Writing descriptive commit messages
- Updating documentation
- Highlighting breaking changes
- Providing migration examples

---

## 📋 Quick Reference

### Essential Commands
```bash
# Setup
git clone https://github.com/YOUR_USERNAME/mwap-server.git
npm install
cp .env.example .env.local
npm run dev

# Development
npm test                 # Run tests
npm run test:watch       # Tests in watch mode
npm run lint            # Check code style
npm run type-check      # TypeScript validation
npm run build           # Build production

# Git workflow
git checkout -b feature/my-feature    # Create feature branch
git commit -m "feat(scope): description"  # Standard commit
git rebase upstream/develop          # Update with latest
git push origin feature/my-feature   # Push for PR
```

### Standards Checklist
```bash
# Before submitting PR
□ All tests pass (npm test)
□ Code follows style guidelines (npm run lint)
□ TypeScript compiles (npm run type-check)
□ Documentation updated
□ Commit messages follow conventions
□ Branch rebased with develop
□ Self-review completed
□ Security considerations addressed
```

### Getting Help Checklist
```bash
# Before asking for help
□ Checked existing documentation
□ Searched GitHub issues
□ Tried suggested solutions
□ Can reproduce the issue
□ Have environment details ready
□ Can provide minimal reproduction
```

---

**Thank you for contributing to MWAP! Your contributions help make this platform better for everyone.** 🙏

*This comprehensive guide ensures a smooth and productive contribution experience for all MWAP contributors, from first-time contributors to experienced maintainers.* 