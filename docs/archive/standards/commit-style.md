# Git Commit Style Guide

This document defines the git commit message conventions used in the MWAP project to ensure clear, consistent, and informative commit history.

## 📏 Commit Message Format

### Basic Structure
```
type(scope): description

[optional body]

[optional footer(s)]
```

### Examples
```bash
feat(auth): add JWT validation middleware
fix(api): resolve tenant creation bug  
docs(readme): update installation instructions
test(users): add role validation tests
refactor(db): optimize query performance
```

## 🏷️ Commit Types

### Primary Types
```bash
feat     # New feature for the user
fix      # Bug fix for the user
docs     # Documentation changes
test     # Adding or updating tests
refactor # Code change that neither fixes a bug nor adds a feature
perf     # Performance improvements
style    # Formatting, missing semicolons, etc. (no code change)
chore    # Maintenance tasks, dependency updates
```

### Examples by Type
```bash
# Features
feat(tenants): add tenant archiving functionality
feat(api): implement project member management endpoints
feat(oauth): add Google Drive integration support

# Bug fixes
fix(auth): handle expired JWT tokens gracefully
fix(db): prevent duplicate tenant creation
fix(api): return correct error codes for validation failures

# Documentation
docs(api): add OAuth integration examples
docs(deployment): update Heroku configuration steps
docs(guides): add troubleshooting section

# Tests
test(tenants): add comprehensive tenant service tests
test(integration): add API endpoint validation tests
test(auth): add JWT middleware unit tests

# Refactoring
refactor(services): extract common database operations
refactor(middleware): simplify authorization logic
refactor(utils): consolidate error handling functions
```

## 🎯 Scope Guidelines

### Feature Scopes
```bash
# Core features
tenants       # Tenant management
projects      # Project operations
users         # User management
auth          # Authentication and authorization
oauth         # OAuth integrations

# Infrastructure
api           # General API changes
db            # Database operations
middleware    # Express middleware
config        # Configuration changes
docs          # Documentation
tests         # Test infrastructure
```

### Component Scopes
```bash
# Backend components
server        # Server configuration
routes        # Route definitions
controllers   # Request handlers
services      # Business logic
schemas       # Validation schemas
utils         # Utility functions

# DevOps and tooling
deploy        # Deployment configuration
ci            # CI/CD pipeline
docker        # Docker configuration
scripts       # Build and utility scripts
```

## 📝 Description Guidelines

### Writing Style
```bash
# ✅ Good descriptions
feat(auth): add JWT validation middleware
fix(api): resolve tenant creation race condition
docs(readme): update environment setup instructions
test(users): add role permission validation tests

# ❌ Poor descriptions
feat: stuff
fix: bug
docs: updates
test: tests
```

### Description Rules
1. **Use imperative mood**: "add" not "added" or "adds"
2. **No capitalization**: Start with lowercase letter
3. **No period**: Don't end with a period
4. **Be specific**: Describe what the commit does
5. **Keep concise**: Under 50 characters when possible

### Action Words
```bash
# Preferred action verbs
add           # Adding new functionality
remove        # Removing functionality
update        # Updating existing functionality
fix           # Fixing bugs
implement     # Implementing new features
improve       # Making improvements
optimize      # Performance optimizations
refactor      # Code restructuring
rename        # Renaming files/variables
move          # Moving files/code
```

## 📖 Commit Body (Optional)

### When to Use Body
- Explain the **why** behind the change
- Provide additional context
- Reference issues or tickets
- Document breaking changes

### Body Format
```bash
feat(auth): add role-based access control

Implement RBAC system with three user roles:
- SuperAdmin: platform-wide access
- Tenant Owner: tenant-specific management  
- Project Member: project-level permissions

This enables secure multi-tenant operations and proper
access isolation between different user types.

Closes #123
```

### Body Guidelines
```bash
# Wrap lines at 72 characters
# Use bullet points for lists
# Explain rationale and context
# Reference related issues
```

## 🔗 Commit Footer (Optional)

### Breaking Changes
```bash
feat(api)!: change tenant response format

BREAKING CHANGE: Tenant API responses now include additional metadata fields.
Update frontend to handle new response structure.

Before:
{
  "id": "123",
  "name": "Acme Corp"
}

After:
{
  "id": "123", 
  "name": "Acme Corp",
  "metadata": {
    "createdAt": "2023-01-01T00:00:00Z",
    "memberCount": 5
  }
}
```

### Issue References
```bash
# Closing issues
fix(auth): resolve token validation error

Closes #456
Fixes #789

# Referencing issues
feat(projects): add member invitation system

Related to #123
See also #456
```

## 🚨 Breaking Changes

### Marking Breaking Changes
```bash
# Method 1: Exclamation mark in type
feat(api)!: remove deprecated tenant endpoints

# Method 2: Footer notation
feat(api): update authentication flow

BREAKING CHANGE: Auth0 configuration now requires audience parameter
```

### Breaking Change Guidelines
- Always include `BREAKING CHANGE:` in footer
- Explain what changed and why
- Provide migration instructions
- Include before/after examples

## 📋 Complete Examples

### Feature Addition
```bash
feat(cloud-providers): add Dropbox integration

Implement Dropbox OAuth flow and file listing capabilities:
- Add Dropbox OAuth configuration
- Implement file listing API
- Add token refresh mechanism
- Include comprehensive error handling

Supports both personal and business Dropbox accounts
with proper scope validation and rate limiting.

Closes #234
```

### Bug Fix
```bash
fix(projects): prevent duplicate member addition

Resolves race condition where multiple requests could
add the same user to a project simultaneously.

Added database unique constraint and proper error
handling for duplicate member scenarios.

Fixes #567
```

### Documentation Update
```bash
docs(deployment): add Docker configuration guide

Include complete Docker setup instructions:
- Dockerfile configuration
- docker-compose setup
- Environment variable mapping
- Production deployment considerations

Addresses common deployment questions from #89
```

### Refactoring
```bash
refactor(services): extract common validation logic

Move shared validation functions to utils/validate.ts:
- Consolidate schema validation patterns
- Reduce code duplication across services
- Improve error message consistency
- Add comprehensive type safety

No functional changes to API behavior.
```

## 🛠️ Tools and Automation

### Commit Message Linting
```bash
# Install commitlint
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# .commitlintrc.json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "scope-enum": [2, "always", [
      "auth", "api", "db", "middleware", "config",
      "tenants", "projects", "users", "oauth",
      "docs", "tests", "deploy", "ci"
    ]]
  }
}
```

### Pre-commit Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# .husky/commit-msg
#!/bin/sh
npx commitlint --edit $1
```

### Git Aliases
```bash
# ~/.gitconfig
[alias]
  cf = "!f() { git commit -m \"feat($1): $2\"; }; f"
  cx = "!f() { git commit -m \"fix($1): $2\"; }; f"
  cd = "!f() { git commit -m \"docs($1): $2\"; }; f"
  ct = "!f() { git commit -m \"test($1): $2\"; }; f"

# Usage examples
git cf auth "add JWT validation middleware"
git cx api "resolve tenant creation bug"
```

## 📊 Commit History Best Practices

### Logical Commits
```bash
# ✅ Good: Logical, focused commits
feat(auth): add JWT middleware
test(auth): add JWT middleware tests
docs(auth): document JWT configuration

# ❌ Poor: Mixed concerns
feat(auth): add JWT middleware, fix bugs, update docs
```

### Commit Frequency
```bash
# Commit often with meaningful chunks
# Each commit should be a complete, testable change
# Avoid commits that break the build

# ✅ Good commit flow
feat(tenants): add tenant creation endpoint
test(tenants): add tenant creation tests
fix(tenants): handle validation errors correctly
docs(tenants): document tenant API endpoints
```

### Atomic Commits
```bash
# Each commit should represent one logical change
# Should be able to revert any commit safely
# Build should pass after each commit

# ✅ Atomic commits
git commit -m "feat(db): add tenant model"
git commit -m "feat(api): add tenant creation endpoint"  
git commit -m "test(api): add tenant endpoint tests"

# ❌ Non-atomic commit
git commit -m "feat(tenants): add model, endpoint, tests, and docs"
```

## 🔄 Rebase and History Management

### Interactive Rebase
```bash
# Clean up commit history before pushing
git rebase -i HEAD~3

# Squash related commits
pick abc123 feat(auth): add JWT middleware
squash def456 fix(auth): handle edge cases
squash ghi789 style(auth): fix formatting

# Results in single clean commit
feat(auth): add JWT validation middleware
```

### Commit Message Templates
```bash
# ~/.gitmessage
# <type>(<scope>): <description>
#
# <body>
#
# <footer>

# Configure git to use template
git config commit.template ~/.gitmessage
```

## 📖 Related Documentation

- **[Branching Strategy](branching.md)** - Git workflow and branch naming
- **[Development Guide](development-guide.md)** - General development practices
- **[Naming Guidelines](naming.md)** - Code and file naming conventions

---

*Consistent commit messages create a clear project history and enable powerful automation tools.* 