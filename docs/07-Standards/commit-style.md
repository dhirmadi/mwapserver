# 📋 MWAP Git Commit Style Guide

## 🎯 Overview

Consistent commit messages are essential for maintaining a clear project history, enabling automated tooling, and facilitating collaboration. This guide establishes comprehensive standards for Git commits, branching, and workflow in the MWAP project.

## 📝 Commit Message Format

### **Conventional Commits Standard**
MWAP follows the [Conventional Commits](https://www.conventionalcommits.org/) specification with MWAP-specific enhancements:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### **Commit Message Structure**
```bash
# Basic format
feat(auth): add JWT token validation

# With body and footer
feat(auth): add JWT token validation

Implement Auth0 JWT validation middleware with RS256 algorithm support.
Includes proper error handling and token expiration checks.

Closes #123
Breaking-change: Auth middleware now requires Auth0 configuration
```

## 🏷️ Commit Types

### **Primary Types**
```bash
feat:     # New features or functionality
fix:      # Bug fixes
docs:     # Documentation changes
style:    # Code formatting, missing semicolons, etc.
refactor: # Code refactoring without changing functionality
test:     # Adding or updating tests
chore:    # Maintenance tasks, dependency updates
```

### **Extended Types for MWAP**
```bash
security: # Security improvements or fixes
perf:     # Performance improvements
build:    # Build system or external dependencies
ci:       # CI/CD configuration changes
revert:   # Reverting previous commits
```

### **Type Usage Examples**
```bash
# Feature additions
feat(projects): add project creation endpoint
feat(auth): implement role-based access control
feat(ui): add project dashboard component

# Bug fixes
fix(api): resolve project deletion error
fix(auth): handle expired JWT tokens correctly
fix(db): fix MongoDB connection timeout issue

# Documentation
docs(api): update project endpoints documentation
docs(readme): add installation instructions
docs(contributing): update PR guidelines

# Refactoring
refactor(service): extract common validation logic
refactor(routes): simplify error handling middleware
refactor(types): consolidate TypeScript interfaces

# Security
security(auth): implement rate limiting for login
security(api): add input sanitization middleware
security(db): encrypt sensitive user data

# Performance
perf(db): optimize project query with indexes
perf(api): implement response caching
perf(frontend): lazy load dashboard components

# Testing
test(auth): add JWT validation unit tests
test(api): add integration tests for projects
test(e2e): add user authentication flow tests

# Maintenance
chore(deps): update dependencies to latest versions
chore(config): update ESLint configuration
chore(scripts): add database migration script
```

## 🎯 Scope Guidelines

### **MWAP-Specific Scopes**
```bash
# Backend scopes
auth          # Authentication and authorization
api           # API endpoints and middleware
db            # Database models and operations
config        # Configuration and environment
middleware    # Express middleware
validation    # Input validation and schemas
service       # Business logic services
utils         # Utility functions

# Feature scopes
projects      # Project management
tenants       # Tenant management
users         # User management
project-types # Project type system
cloud         # Cloud provider integration
files         # File management

# Frontend scopes (when applicable)
ui            # User interface components
components    # React components
hooks         # Custom React hooks
pages         # Page components
styles        # CSS and styling

# Infrastructure scopes
docker        # Docker configuration
k8s           # Kubernetes configuration
ci            # CI/CD pipelines
deploy        # Deployment scripts
monitoring    # Monitoring and logging

# Documentation scopes
docs          # General documentation
api-docs      # API documentation
guides        # Development guides
readme        # README files
```

### **Scope Selection Guidelines**
```bash
# Use the most specific scope available
feat(projects): add project creation          # ✅ Good - specific
feat(api): add project creation               # ⚠️ Less specific
feat: add project creation                    # ❌ Too generic

# Use multiple scopes for cross-cutting changes
feat(auth,api): implement RBAC middleware     # ✅ Good
refactor(service,validation): extract schemas # ✅ Good

# Omit scope for very broad changes
chore: update all dependencies                # ✅ Good
docs: restructure documentation               # ✅ Good
```

## 📖 Description Guidelines

### **Description Best Practices**
```bash
# Use imperative mood (present tense)
feat(auth): add JWT validation                # ✅ Good
feat(auth): added JWT validation              # ❌ Past tense
feat(auth): adds JWT validation               # ❌ Present continuous

# Start with lowercase letter
feat(auth): implement user authentication     # ✅ Good
feat(auth): Implement user authentication     # ❌ Capitalized

# Keep under 50 characters
feat(auth): add JWT token validation          # ✅ Good (32 chars)
feat(auth): implement comprehensive JWT token validation with Auth0 # ❌ Too long (67 chars)

# Be specific and descriptive
fix(db): resolve connection issue             # ✅ Good
fix(db): fix bug                             # ❌ Too vague
fix(db): resolve MongoDB connection timeout when pool size exceeds limit # ❌ Too detailed for subject
```

### **Common Description Patterns**
```bash
# Adding new functionality
feat(scope): add [feature/component/endpoint]
feat(projects): add project creation endpoint
feat(ui): add user dashboard component

# Fixing issues
fix(scope): resolve [specific issue]
fix(auth): resolve JWT token expiration handling
fix(api): resolve validation error for empty fields

# Improving existing functionality
refactor(scope): improve [aspect]
refactor(service): improve error handling
refactor(db): improve query performance

# Updating or changing
chore(scope): update [what was updated]
chore(deps): update TypeScript to v5.0
chore(config): update ESLint rules

# Removing functionality
feat(scope): remove [deprecated feature]
refactor(scope): remove [unused code]
```

## 📄 Commit Body Guidelines

### **When to Include a Body**
```bash
# Include body for:
- Complex changes that need explanation
- Breaking changes
- Security-related changes
- Performance improvements
- Architectural decisions

# Example with body
feat(auth): implement role-based access control

Add RBAC middleware to protect API endpoints based on user roles.
Supports SuperAdmin, TenantOwner, and ProjectMember roles with
hierarchical permissions. Includes tenant isolation for data security.

- SuperAdmin: Full system access
- TenantOwner: Full access to owned tenant
- ProjectMember: Limited access to assigned projects

Closes #45
```

### **Body Formatting**
```bash
# Use present tense and imperative mood
# Wrap lines at 72 characters
# Separate paragraphs with blank lines
# Use bullet points for lists
# Reference issues and PRs

feat(api): add project member management endpoints

Implement CRUD operations for project members with proper authorization.
Each endpoint validates user permissions and tenant isolation.

New endpoints:
- POST /api/v1/projects/:id/members - Add member
- DELETE /api/v1/projects/:id/members/:memberId - Remove member
- PATCH /api/v1/projects/:id/members/:memberId/role - Update role

Includes comprehensive validation using Zod schemas and proper error
handling with standardized error responses.

Closes #67
Related to #45, #52
```

## 🔗 Footer Guidelines

### **Footer Types**
```bash
# Issue references
Closes #123                    # Closes an issue
Fixes #456                     # Fixes a bug
Resolves #789                  # Resolves an issue
Related to #101, #102          # Related issues

# Breaking changes
BREAKING CHANGE: Auth middleware now requires Auth0 configuration
Breaking-change: API response format changed for error handling

# Co-authored commits
Co-authored-by: Jane Doe <jane@example.com>
Co-authored-by: John Smith <john@example.com>

# Reviewed by
Reviewed-by: Senior Developer <senior@example.com>

# Signed off
Signed-off-by: Developer Name <dev@example.com>
```

### **Breaking Changes**
```bash
# Always document breaking changes
feat(api): change error response format

Standardize all API error responses to use consistent structure
with success boolean, error object, and optional details.

BREAKING CHANGE: Error responses now use { success: false, error: { code, message } }
instead of { error: "message" }. Update client code accordingly.

Migration guide available in docs/migration/v2-to-v3.md

Closes #234
```

## 🌿 Branching Strategy

### **Branch Naming Convention**
```bash
# Format: <type>/<description>
feature/user-authentication
fix/project-creation-bug
docs/api-documentation-update
refactor/service-layer-cleanup
security/jwt-validation-improvement
perf/database-query-optimization

# Use kebab-case for descriptions
feature/multi-tenant-support        # ✅ Good
feature/multi_tenant_support        # ❌ Underscore
feature/multiTenantSupport          # ❌ CamelCase
feature/Multi-Tenant-Support        # ❌ Title case
```

### **Branch Types**
```bash
# Main branches
main                    # Production-ready code
develop                 # Integration branch for features

# Feature branches
feature/                # New features
fix/                   # Bug fixes
hotfix/                # Critical production fixes
docs/                  # Documentation updates
refactor/              # Code refactoring
test/                  # Test improvements
chore/                 # Maintenance tasks
security/              # Security improvements
perf/                  # Performance improvements

# Release branches
release/v1.2.0         # Release preparation
```

### **Branch Workflow**
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/project-dashboard

# Work on feature with atomic commits
git add .
git commit -m "feat(ui): add project dashboard layout"
git commit -m "feat(ui): implement project list component"
git commit -m "test(ui): add dashboard component tests"

# Push feature branch
git push -u origin feature/project-dashboard

# Create pull request to develop
# After review and approval, merge to develop

# For hotfixes, branch from main
git checkout main
git checkout -b hotfix/critical-security-fix
# ... make fixes ...
git push -u origin hotfix/critical-security-fix
# Create PR to main and develop
```

## 🔄 Commit Workflow

### **Atomic Commits**
```bash
# Make small, focused commits
git add src/auth/jwt-middleware.ts
git commit -m "feat(auth): add JWT validation middleware"

git add src/auth/auth.test.ts
git commit -m "test(auth): add JWT middleware unit tests"

git add docs/api/authentication.md
git commit -m "docs(auth): document JWT authentication flow"

# Avoid large, unfocused commits
git add .
git commit -m "feat: implement authentication system"  # ❌ Too broad
```

### **Commit Message Templates**
```bash
# Create commit message template
# ~/.gitmessage
<type>(<scope>): <description>

# Why is this change needed?
# 

# How does it address the issue?
# 

# What are the side effects?
# 

# Closes #

# Configure Git to use template
git config commit.template ~/.gitmessage
```

### **Pre-commit Hooks**
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm run test:unit

# Validate commit message format
npm run commitlint
```

### **Commit Message Validation**
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'security',
        'perf',
        'build',
        'ci',
        'revert'
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'api',
        'db',
        'config',
        'middleware',
        'validation',
        'service',
        'utils',
        'projects',
        'tenants',
        'users',
        'project-types',
        'cloud',
        'files',
        'ui',
        'components',
        'hooks',
        'pages',
        'styles',
        'docker',
        'k8s',
        'ci',
        'deploy',
        'monitoring',
        'docs',
        'api-docs',
        'guides',
        'readme'
      ]
    ],
    'subject-max-length': [2, 'always', 50],
    'body-max-line-length': [2, 'always', 72],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never']
  }
};
```

## 📊 Commit History Best Practices

### **Interactive Rebase for Clean History**
```bash
# Clean up commits before pushing
git rebase -i HEAD~3

# Squash related commits
pick a1b2c3d feat(auth): add JWT middleware
squash d4e5f6g feat(auth): fix JWT validation bug
squash g7h8i9j feat(auth): add error handling

# Result in single clean commit
feat(auth): add JWT validation middleware

Implement Auth0 JWT validation with proper error handling
and token expiration checks.

Closes #123
```

### **Commit Message Examples**

#### **Good Commit Messages**
```bash
feat(projects): add project creation endpoint
fix(auth): resolve JWT token expiration handling
docs(api): update authentication documentation
refactor(service): extract validation logic to utils
test(projects): add integration tests for CRUD operations
security(auth): implement rate limiting for login attempts
perf(db): optimize project queries with compound indexes
chore(deps): update TypeScript to version 5.0
```

#### **Bad Commit Messages**
```bash
fix bug                           # ❌ Too vague
Update files                      # ❌ Not descriptive
feat: stuff                       # ❌ Meaningless description
Fixed the thing that was broken   # ❌ Informal language
WIP                              # ❌ Work in progress (shouldn't be pushed)
asdf                             # ❌ Random characters
Merge branch 'feature'           # ❌ Default merge message
```

### **Semantic Versioning Integration**
```bash
# Commits drive semantic versioning
feat: minor version bump (1.1.0 -> 1.2.0)
fix: patch version bump (1.1.0 -> 1.1.1)
BREAKING CHANGE: major version bump (1.1.0 -> 2.0.0)

# Automated changelog generation
## [1.2.0] - 2024-01-15

### Features
- **auth**: add JWT token validation
- **projects**: implement project creation endpoint
- **ui**: add user dashboard component

### Bug Fixes
- **api**: resolve validation error handling
- **db**: fix MongoDB connection timeout

### Documentation
- **api**: update authentication endpoints
- **readme**: add installation instructions
```

## 🛠️ Tools and Automation

### **Recommended Git Configuration**
```bash
# Global Git configuration for MWAP
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Use VS Code as default editor
git config --global core.editor "code --wait"

# Enable automatic rebase for pulls
git config --global pull.rebase true

# Use more colors
git config --global color.ui auto

# Better diff algorithm
git config --global diff.algorithm patience

# Automatically prune remote branches
git config --global fetch.prune true

# Set default branch name
git config --global init.defaultBranch main
```

### **Git Aliases for MWAP**
```bash
# Useful Git aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status

# MWAP-specific aliases
git config --global alias.feature '!f() { git checkout develop && git pull && git checkout -b feature/$1; }; f'
git config --global alias.fix '!f() { git checkout develop && git pull && git checkout -b fix/$1; }; f'
git config --global alias.hotfix '!f() { git checkout main && git pull && git checkout -b hotfix/$1; }; f'

# Log aliases
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
git config --global alias.lol "log --graph --decorate --pretty=oneline --abbrev-commit"
```

### **Automated Commit Validation**
```json
// package.json
{
  "scripts": {
    "commit": "git-cz",
    "commitlint": "commitlint --from HEAD~1 --to HEAD --verbose"
  },
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix", "prettier --write"],
    "*.md": ["prettier --write"]
  }
}
```

## 📚 Related Documentation

- [🛠️ Development Guide](./development-guide.md) - Complete development standards
- [🔒 Coding Standards](./coding-standards.md) - Code quality guidelines
- [📝 Naming Conventions](./naming.md) - Naming standards and examples
- [🔧 Environment Format](./env-format.md) - Environment variable standards

---

*Consistent commit practices improve code quality, enable automation, and facilitate collaboration. Follow these guidelines to maintain a clean and professional Git history for the MWAP project.*