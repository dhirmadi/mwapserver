# MWAP Git Workflow Guide

This comprehensive guide defines the Git workflow, branching strategy, and commit message conventions used in the MWAP project to ensure organized, collaborative development and clear project history.

## 🎯 Workflow Overview

### Git Flow Philosophy
MWAP uses a **simplified Git Flow** approach that balances collaboration efficiency with code quality:

- **`main`** - Production-ready code, always deployable
- **`develop`** - Integration branch for feature development
- **Feature branches** - Individual feature development
- **Hotfix branches** - Critical production fixes
- **Release branches** - Release preparation and stabilization

### Workflow Benefits
- **Clear History**: Organized commit history with meaningful messages
- **Parallel Development**: Multiple features developed simultaneously
- **Release Management**: Controlled release preparation and deployment
- **Emergency Response**: Fast hotfix deployment when needed
- **Code Quality**: Review process ensures quality standards

## 🌳 Branching Strategy

### Branch Structure
```
main (production)
├── develop (integration)
├── feature/add-tenant-archiving
├── feature/oauth-google-drive
├── bugfix/tenant-validation-error
├── hotfix/critical-jwt-validation
└── release/v1.2.0
```

### Branch Types and Purposes

#### Core Branches
```bash
main                    # Production-ready code, protected
develop                 # Integration branch for features
```

#### Temporary Branches
```bash
feature/*              # New features and enhancements
bugfix/*               # Non-critical bug fixes
hotfix/*               # Critical production fixes
release/*              # Release preparation
docs/*                 # Documentation updates
refactor/*             # Code refactoring
experiment/*           # Experimental features
```

### Branch Naming Conventions

#### Feature Branches
```bash
# Format: feature/description-with-dashes
feature/add-tenant-archiving
feature/oauth-google-drive-integration
feature/project-member-permissions
feature/cloud-provider-dropbox
feature/api-rate-limiting

# Include issue number if applicable
feature/123-add-user-roles
feature/456-implement-file-upload
```

#### Bug Fix Branches
```bash
# Format: bugfix/description-or-issue
bugfix/tenant-creation-validation
bugfix/project-member-duplicate
bugfix/789-auth-middleware-error
```

#### Hotfix Branches
```bash
# Format: hotfix/critical-description
hotfix/critical-jwt-validation
hotfix/database-connection-leak
hotfix/security-header-missing
```

#### Release Branches
```bash
# Format: release/version
release/v1.0.0
release/v1.1.0
release/v2.0.0-beta
```

#### Other Branch Types
```bash
# Documentation updates
docs/update-api-guide
docs/deployment-instructions

# Refactoring
refactor/extract-auth-middleware
refactor/optimize-database-queries

# Experiments
experiment/new-authentication-flow
experiment/redis-caching
```

## 📝 Commit Message Standards

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer(s)]
```

### Commit Message Examples
```bash
feat(auth): add JWT validation middleware
fix(api): resolve tenant creation bug  
docs(readme): update installation instructions
test(users): add role validation tests
refactor(db): optimize query performance
```

### Commit Types

#### Primary Types
```bash
feat     # New feature for the user
fix      # Bug fix for the user
docs     # Documentation changes
test     # Adding or updating tests
refactor # Code change that neither fixes a bug nor adds a feature
perf     # Performance improvements
style    # Formatting, missing semicolons, etc. (no code change)
chore    # Maintenance tasks, dependency updates
ci       # CI/CD pipeline changes
build    # Build system changes
```

#### Detailed Examples by Type
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

### Scope Guidelines

#### Feature Scopes
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

#### Component Scopes
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

### Description Guidelines

#### Writing Style Rules
1. **Use imperative mood**: "add" not "added" or "adds"
2. **No capitalization**: Start with lowercase letter
3. **No period**: Don't end with a period
4. **Be specific**: Describe what the commit does
5. **Keep concise**: Under 50 characters when possible

#### Action Words
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

#### Examples
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

### Commit Body (Optional)

#### When to Use Body
- Explain the **why** behind the change
- Provide additional context
- Reference issues or tickets
- Document breaking changes

#### Body Format Example
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

### Breaking Changes

#### Marking Breaking Changes
```bash
# Method 1: Exclamation mark in type
feat(api)!: remove deprecated tenant endpoints

# Method 2: Footer notation
feat(api): update authentication flow

BREAKING CHANGE: Auth0 configuration now requires audience parameter
```

#### Breaking Change Example
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

## 🔄 Development Workflow

### 1. Feature Development

#### Starting a Feature
```bash
# Start from latest develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/add-tenant-archiving

# Set up tracking
git push -u origin feature/add-tenant-archiving
```

#### Working on Feature
```bash
# Work on feature with regular commits
git add .
git commit -m "feat(tenants): add archiving functionality"

# Continue development
git add .
git commit -m "test(tenants): add archiving tests"

# Keep branch updated with develop
git checkout develop
git pull origin develop
git checkout feature/add-tenant-archiving
git rebase develop

# Push updates
git push origin feature/add-tenant-archiving
```

#### Completing Feature
```bash
# Final push
git push origin feature/add-tenant-archiving

# Create pull request via GitHub/GitLab UI
# Title: feat(tenants): add tenant archiving functionality
```

### 2. Pull Request Process

#### PR Description Template
```markdown
## Summary
Brief description of changes

## Changes Made
- Add archiving endpoint
- Update tenant model
- Add validation rules
- Include comprehensive tests

## Testing
- Unit tests added
- Integration tests passing
- Manual testing completed

## Related Issues
Closes #123

## Breaking Changes
None

## Screenshots (if applicable)
[Include UI screenshots for frontend changes]
```

#### Code Review Checklist
```bash
# Reviewer checklist:
□ Code follows naming conventions
□ Commit messages follow standards
□ Tests cover new functionality
□ Documentation updated
□ No breaking changes without approval
□ Security considerations reviewed
□ Performance impact assessed
□ Error handling implemented
```

### 3. Merge Strategy

#### Feature Merge
```bash
# Squash and merge for features (preferred)
git checkout develop
git merge --squash feature/add-tenant-archiving
git commit -m "feat(tenants): add tenant archiving functionality"

# Clean up
git branch -d feature/add-tenant-archiving
git push origin --delete feature/add-tenant-archiving
```

#### Alternative: Merge Commit
```bash
# For complex features with meaningful commit history
git checkout develop
git merge --no-ff feature/add-tenant-archiving
```

## 🚀 Release Process

### 1. Release Branch Creation
```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Update version numbers
npm version 1.2.0
git add package.json package-lock.json
git commit -m "chore(release): bump version to 1.2.0"

# Push release branch
git push -u origin release/v1.2.0
```

### 2. Release Preparation

#### Update Changelog
```markdown
# CHANGELOG.md
## [1.2.0] - 2024-01-15

### Added
- Tenant archiving functionality
- Google Drive OAuth integration
- Project member permission system

### Fixed
- JWT token validation edge cases
- Database connection pooling issues

### Changed
- Updated API response format for tenants

### Deprecated
- Old tenant status endpoints (use /status instead)

### Removed
- Legacy authentication methods

### Security
- Enhanced token validation
```

#### Release Testing
```bash
# Deploy to staging environment
npm run deploy:staging

# Run full test suite
npm test
npm run test:integration
npm run test:e2e

# Perform manual testing
# Security scan
# Performance testing
# Documentation review
```

### 3. Release Deployment
```bash
# Merge release to main
git checkout main
git pull origin main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.2.0

# Deploy to production
git push origin main --tags
git push origin develop

# Clean up release branch
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
```

## 🚨 Hotfix Process

### 1. Emergency Hotfix Creation
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-jwt-validation

# Fix the issue with focused commits
git add .
git commit -m "fix(auth): resolve JWT token validation error"

# Test fix thoroughly
npm test
npm run test:security
```

### 2. Hotfix Testing and Deployment
```bash
# Deploy to staging for verification
npm run deploy:staging

# After verification, merge to main
git checkout main
git merge --no-ff hotfix/critical-jwt-validation
git tag -a v1.2.1 -m "Hotfix: JWT validation"

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-jwt-validation

# Deploy immediately
git push origin main --tags
git push origin develop

# Clean up hotfix branch
git branch -d hotfix/critical-jwt-validation
git push origin --delete hotfix/critical-jwt-validation
```

## 🔒 Branch Protection and Configuration

### Branch Protection Rules

#### Main Branch Protection
```yaml
# GitHub/GitLab branch protection settings
require_pull_request_reviews: true
required_approving_review_count: 2
dismiss_stale_reviews: true
require_code_owner_reviews: true

require_status_checks: true
require_up_to_date_branches: true
required_status_checks:
  - ci/tests
  - ci/security-scan
  - ci/build

restrictions:
  push_restrictions: true
  include_administrators: true
```

#### Develop Branch Protection
```yaml
require_pull_request_reviews: true
required_approving_review_count: 1
dismiss_stale_reviews: false

require_status_checks: true
required_status_checks:
  - ci/tests
  - ci/lint
```

### Git Configuration

#### Global Settings
```bash
# Configure user information
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Set default branch name
git config --global init.defaultBranch main

# Configure merge strategy
git config --global merge.ff false
git config --global pull.rebase true

# Configure push behavior
git config --global push.default simple
git config --global push.followTags true
```

#### Repository Settings
```bash
# .gitconfig in repository root
[core]
    autocrlf = input
    ignorecase = false
    editor = code --wait

[branch]
    autosetupmerge = always
    autosetuprebase = always

[merge]
    tool = vscode

[diff]
    tool = vscode
```

### Useful Git Aliases
```bash
# ~/.gitconfig
[alias]
    # Branch management
    co = checkout
    br = branch
    sw = switch
    
    # Status and logs
    st = status
    lg = log --oneline --graph --decorate --all
    
    # Quick operations
    cm = commit -m
    ca = commit -am
    
    # Branch operations
    feature = "!f() { git checkout develop && git pull && git checkout -b feature/$1; }; f"
    hotfix = "!f() { git checkout main && git pull && git checkout -b hotfix/$1; }; f"
    bugfix = "!f() { git checkout develop && git pull && git checkout -b bugfix/$1; }; f"
    
    # Cleanup
    cleanup = "!git branch --merged develop | grep -v develop | xargs git branch -d"
    
    # Commit shortcuts
    cf = "!f() { git commit -m \"feat($1): $2\"; }; f"
    cx = "!f() { git commit -m \"fix($1): $2\"; }; f"
    cd = "!f() { git commit -m \"docs($1): $2\"; }; f"
    ct = "!f() { git commit -m \"test($1): $2\"; }; f"
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
    ]],
    "subject-case": [2, "never", ["upper-case"]],
    "subject-full-stop": [2, "never", "."],
    "body-max-line-length": [2, "always", 72],
    "header-max-length": [2, "always", 50]
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

# .husky/pre-commit
#!/bin/sh
npm run lint
npm run type-check

# .husky/pre-push
#!/bin/sh
npm test
```

### Commit Message Templates
```bash
# ~/.gitmessage
# <type>(<scope>): <description>
#
# <body>
#
# <footer>
#
# Types: feat, fix, docs, style, refactor, test, chore
# Scopes: auth, api, db, tenants, projects, users, oauth
# Description: imperative, lowercase, no period, <50 chars

# Configure git to use template
git config commit.template ~/.gitmessage
```

## 📋 Workflow Examples

### Complete Feature Development Example
```bash
# 1. Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/add-oauth-integration

# 2. Work with regular commits
git add src/features/oauth/
git commit -m "feat(oauth): add provider configuration"

git add tests/oauth/
git commit -m "test(oauth): add provider configuration tests"

git add docs/
git commit -m "docs(oauth): add integration guide"

# 3. Keep updated with develop
git checkout develop && git pull
git checkout feature/add-oauth-integration
git rebase develop

# 4. Push and create PR
git push origin feature/add-oauth-integration
# Create PR via GitHub/GitLab UI

# 5. Address review feedback
git add .
git commit -m "fix(oauth): handle edge cases in provider config"
git push origin feature/add-oauth-integration

# 6. After approval, squash and merge
# (Done via PR interface or by maintainer)
```

### Bug Fix Example
```bash
# 1. Create bug fix branch
git checkout develop
git pull origin develop
git checkout -b bugfix/tenant-validation-error

# 2. Fix and test
git add .
git commit -m "fix(tenants): resolve validation error for special characters"

git add tests/
git commit -m "test(tenants): add validation tests for special characters"

# 3. Create PR and merge
git push origin bugfix/tenant-validation-error
# Follow standard review process
```

### Emergency Hotfix Example
```bash
# 1. Create hotfix immediately
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# 2. Implement fix
git add .
git commit -m "fix(security): resolve authentication bypass vulnerability"

# 3. Test thoroughly
npm test
npm run test:security

# 4. Fast-track deployment
git checkout main
git merge --no-ff hotfix/critical-security-fix
git tag -a v1.2.1 -m "Security hotfix"

# 5. Deploy immediately
git push origin main --tags

# 6. Merge back to develop
git checkout develop
git merge --no-ff hotfix/critical-security-fix
git push origin develop

# 7. Clean up
git branch -d hotfix/critical-security-fix
```

## 📊 Best Practices and Guidelines

### Commit Best Practices

#### Logical Commits
```bash
# ✅ Good: Logical, focused commits
feat(auth): add JWT middleware
test(auth): add JWT middleware tests
docs(auth): document JWT configuration

# ❌ Poor: Mixed concerns
feat(auth): add JWT middleware, fix bugs, update docs
```

#### Atomic Commits
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

#### Commit Frequency
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

### Branch Management

#### Regular Maintenance
```bash
# Weekly cleanup of merged feature branches
git branch --merged develop | grep -v -E "(develop|main)" | xargs git branch -d

# Monthly cleanup of remote tracking branches
git remote prune origin

# Quarterly review of long-running branches
git for-each-ref --format='%(refname:short) %(committerdate)' refs/heads | sort -k2
```

#### Stale Branch Policy
- **Feature branches**: Review after 30 days, merge or delete
- **Abandoned branches**: Delete after 60 days with team notification
- **Experiment branches**: Delete after conclusion regardless of outcome

### History Management

#### Interactive Rebase
```bash
# Clean up commit history before pushing
git rebase -i HEAD~3

# Example: Squash related commits
pick abc123 feat(auth): add JWT middleware
squash def456 fix(auth): handle edge cases
squash ghi789 style(auth): fix formatting

# Results in single clean commit:
# feat(auth): add JWT validation middleware
```

#### Rebase vs Merge Guidelines
- **Feature branches**: Use rebase to maintain linear history
- **Release/hotfix to main**: Use merge commits for traceability
- **Regular sync**: Use rebase to avoid unnecessary merge commits

## 📖 Quick Reference

### Common Commands
```bash
# Start new feature
git checkout develop && git pull && git checkout -b feature/my-feature

# Regular commit
git add . && git commit -m "feat(scope): description"

# Update feature branch
git checkout develop && git pull && git checkout feature/my-feature && git rebase develop

# Clean commit history
git rebase -i HEAD~n

# Emergency hotfix
git checkout main && git pull && git checkout -b hotfix/critical-fix
```

### Commit Message Quick Reference
```bash
# Structure
type(scope): description

# Types
feat fix docs test refactor perf style chore ci build

# Scopes  
auth api db tenants projects users oauth middleware config docs tests deploy

# Examples
feat(auth): add JWT validation
fix(api): resolve race condition  
docs(readme): update setup guide
test(users): add validation tests
```

---
*A well-defined Git workflow enables efficient collaboration, maintains code quality, and provides clear project history for the entire development lifecycle.* 