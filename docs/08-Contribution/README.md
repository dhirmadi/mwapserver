# Contributing to MWAP

Welcome to the MWAP contributing guide! We're excited to have you contribute to the Modular Web Application Platform.

## 🎯 How to Contribute

### Types of Contributions
- **Bug Fixes**: Help us squash bugs and improve stability
- **Feature Development**: Add new features and capabilities
- **Documentation**: Improve guides, tutorials, and API docs
- **Testing**: Write tests and improve test coverage
- **Performance**: Optimize code and improve performance
- **Security**: Identify and fix security vulnerabilities

## 🚀 Getting Started

### Prerequisites
Before contributing, ensure you have:
- Node.js 20+ installed
- Git configured with your GitHub account
- MongoDB Atlas account (for testing)
- Auth0 account (for authentication testing)
- Familiarity with TypeScript, React, and Node.js

### Development Setup
1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/mwap-server.git
   cd mwap-server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

For detailed setup instructions, see our [Quick Start Guide](../06-Guides/quick-start.md).

## 📋 Contribution Process

### 1. Planning Your Contribution

#### For Bug Fixes
- Check existing issues to avoid duplicates
- Create a new issue if one doesn't exist
- Include reproduction steps and environment details

#### For Features
- Create a feature request issue first
- Discuss the approach with maintainers
- Get approval before starting development
- Consider breaking large features into smaller PRs

#### For Documentation
- Identify gaps or improvements needed
- Follow our documentation standards
- Ensure examples are tested and working

### 2. Development Workflow

#### Branch Naming Convention
```bash
# Feature branches
feature/add-project-templates
feature/improve-oauth-flow

# Bug fix branches  
fix/authentication-error
fix/database-connection-timeout

# Documentation branches
docs/update-api-guide
docs/add-deployment-instructions
```

#### Making Changes
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow Coding Standards**
   - Read our [Coding Standards](../07-Standards/coding-standards.md)
   - Use TypeScript strict mode
   - Write meaningful commit messages
   - Add tests for new functionality

3. **Test Your Changes**
   ```bash
   npm test                 # Run all tests
   npm run test:watch       # Run tests in watch mode
   npm run lint            # Check code style
   npm run type-check      # TypeScript validation
   ```

4. **Update Documentation**
   - Update relevant documentation files
   - Add examples for new features
   - Update API documentation if needed

### 3. Pull Request Process

#### Before Creating PR
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Self-review completed
- [ ] Branch is up to date with main

#### Creating the Pull Request
1. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub**
   - Use our PR template
   - Provide clear description of changes
   - Link related issues
   - Add screenshots for UI changes

#### PR Template
```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] New tests added for new functionality
- [ ] All existing tests pass
- [ ] Manual testing completed

## Related Issues
Fixes #123
Related to #456

## Screenshots (if applicable)
Add screenshots here for UI changes.
```

## 🧪 Testing Guidelines

### Writing Tests
We use Vitest for testing. Follow these patterns:

#### Unit Tests
```typescript
// tests/services/userService.test.ts
describe('UserService', () => {
  it('should create user with valid data', async () => {
    // Arrange
    const userData = { name: 'John Doe', email: 'john@example.com' };
    
    // Act
    const user = await userService.create(userData);
    
    // Assert
    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
});
```

#### Integration Tests
```typescript
// tests/integration/api.test.ts
describe('Users API', () => {
  it('should create user via API', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ name: 'John Doe', email: 'john@example.com' })
      .expect(201);
      
    expect(response.body.success).toBe(true);
  });
});
```

### Test Requirements
- All new features must include tests
- Bug fixes should include regression tests
- Aim for >80% code coverage
- Test edge cases and error conditions

## 📝 Documentation Guidelines

### Documentation Types
- **API Documentation**: OpenAPI specs and examples
- **User Guides**: Step-by-step instructions
- **Developer Guides**: Technical implementation details
- **Architecture Docs**: System design and patterns

### Documentation Standards
- Use clear, concise language
- Include code examples
- Test all examples before publishing
- Follow our markdown style guide
- Update table of contents when needed

## 🔒 Security Guidelines

### Security Requirements
- Never commit secrets or credentials
- Use environment variables for configuration
- Follow OWASP security guidelines
- Validate all user inputs
- Implement proper authorization checks

### Security Review Process
All security-related changes require:
- Security-focused code review
- Penetration testing (for major changes)
- Documentation of security implications
- Approval from security team member

## 📊 Code Review Process

### Review Criteria
Reviewers will check for:
- **Functionality**: Does it work as intended?
- **Code Quality**: Follows coding standards?
- **Testing**: Adequate test coverage?
- **Documentation**: Properly documented?
- **Security**: No security vulnerabilities?
- **Performance**: No performance regressions?

### Review Timeline
- Initial review within 2 business days
- Address feedback within 1 week
- Final approval within 1 business day of updates

### Getting Your PR Reviewed
- Request review from relevant team members
- Respond to feedback promptly
- Make requested changes in new commits
- Re-request review after addressing feedback

## 🎉 Recognition

### Contributor Recognition
- Contributors listed in CONTRIBUTORS.md
- Recognition in release notes
- Special badges for significant contributions
- Annual contributor appreciation events

### Types of Recognition
- **First-time Contributor**: Your first merged PR
- **Bug Hunter**: Finding and fixing critical bugs
- **Feature Champion**: Delivering major features
- **Documentation Hero**: Significant doc improvements
- **Testing Advocate**: Improving test coverage

## 🤝 Community Guidelines

### Code of Conduct
We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/). Please:
- Be respectful and inclusive
- Welcome newcomers
- Focus on what's best for the community
- Show empathy towards others

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code review and collaboration
- **Discord/Slack**: Real-time communication (if available)

### Getting Help
- Check existing documentation first
- Search existing issues and discussions
- Create detailed issue with reproduction steps
- Join community discussions
- Reach out to maintainers if needed

## 📚 Resources for Contributors

### Essential Reading
- [Quick Start Guide](../06-Guides/quick-start.md)
- [Coding Standards](../07-Standards/coding-standards.md)
- [Architecture Overview](../02-Architecture/overview.md)
- [Testing Guide](../06-Guides/how-to-test.md)
- [Security Guide](../06-Guides/security-guide.md)

### Development Tools
- **VS Code Extensions**: TypeScript, ESLint, Prettier
- **Database Tools**: MongoDB Compass, Studio 3T
- **API Testing**: Postman, Thunder Client
- **Git Tools**: GitKraken, SourceTree, GitHub Desktop

### Learning Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Node.js Guides](https://nodejs.org/en/docs/guides/)
- [MongoDB University](https://university.mongodb.com/)
- [Auth0 Documentation](https://auth0.com/docs/)

## 🔄 Release Process

### Version Management
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Schedule
- **Patch releases**: As needed for critical fixes
- **Minor releases**: Monthly feature releases
- **Major releases**: Quarterly with breaking changes

### Release Notes
Contributors help by:
- Writing clear commit messages
- Updating CHANGELOG.md
- Highlighting breaking changes
- Documenting new features

## 🚧 Common Issues and Solutions

### Development Issues
```bash
# Port already in use
kill -9 $(lsof -ti:3000)

# Dependency issues
rm -rf node_modules package-lock.json
npm install

# TypeScript errors
npm run type-check
```

### Git Issues
```bash
# Sync with upstream
git remote add upstream https://github.com/original/mwap-server.git
git fetch upstream
git checkout main
git merge upstream/main

# Rebase feature branch
git checkout feature/my-feature
git rebase main
```

## 📞 Contact

### Maintainers
- **Lead Maintainer**: [GitHub username]
- **Backend Lead**: [GitHub username]  
- **Frontend Lead**: [GitHub username]
- **Security Lead**: [GitHub username]

### Support Channels
- Create GitHub issue for bugs/features
- Use GitHub discussions for questions
- Email security@mwap.dev for security issues

---

**Thank you for contributing to MWAP! Your contributions help make this platform better for everyone.** 🙏

*This contribution guide ensures a smooth and productive experience for all contributors to the MWAP platform.* 