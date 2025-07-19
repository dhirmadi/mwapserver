# Git Branching Strategy

This document defines the git branching strategy and workflow used in the MWAP project to ensure organized, collaborative development.

## 🌳 Branching Model

### Core Branches
```
main
├── develop
├── feature/add-tenant-archiving
├── feature/oauth-google-drive
├── hotfix/auth-token-validation
└── release/v1.2.0
```

### Branch Types
```bash
main                    # Production-ready code
develop                 # Integration branch for features
feature/*              # New features and enhancements
hotfix/*               # Critical production fixes
release/*              # Release preparation
bugfix/*               # Non-critical bug fixes
```

## 🎯 Branch Naming Conventions

### Feature Branches
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

### Bug Fix Branches
```bash
# Format: bugfix/description-or-issue
bugfix/tenant-creation-validation
bugfix/project-member-duplicate
bugfix/789-auth-middleware-error

# Hotfixes for production
hotfix/critical-jwt-validation
hotfix/database-connection-leak
hotfix/security-header-missing
```

### Release Branches
```bash
# Format: release/version
release/v1.0.0
release/v1.1.0
release/v2.0.0-beta
```

### Other Branch Types
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

## 🔄 Workflow Process

### 1. Feature Development
```bash
# Start from latest develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/add-tenant-archiving

# Work on feature with regular commits
git add .
git commit -m "feat(tenants): add archiving functionality"

# Keep branch updated
git checkout develop
git pull origin develop
git checkout feature/add-tenant-archiving
git rebase develop

# Push feature branch
git push origin feature/add-tenant-archiving
```

### 2. Pull Request Process
```bash
# Create pull request from feature branch to develop
# Title: feat(tenants): add tenant archiving functionality

# PR Description Template:
## Summary
Brief description of changes

## Changes Made
- Add archiving endpoint
- Update tenant model
- Add validation rules

## Testing
- Unit tests added
- Integration tests passing
- Manual testing completed

## Related Issues
Closes #123

## Breaking Changes
None
```

### 3. Code Review
```bash
# Reviewer checklist:
□ Code follows naming conventions
□ Tests cover new functionality
□ Documentation updated
□ No breaking changes without approval
□ Security considerations reviewed
□ Performance impact assessed
```

### 4. Merge Strategy
```bash
# Squash and merge for features
git checkout develop
git merge --squash feature/add-tenant-archiving
git commit -m "feat(tenants): add tenant archiving functionality"

# Delete feature branch
git branch -d feature/add-tenant-archiving
git push origin --delete feature/add-tenant-archiving
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
```

### 2. Release Preparation
```bash
# Update changelog
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
```

### 3. Release Testing
```bash
# Deploy to staging environment
# Run full test suite
# Perform manual testing
# Security scan
# Performance testing
```

### 4. Release Deployment
```bash
# Merge release to main
git checkout main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.2.0

# Deploy to production
git push origin main --tags
git push origin develop

# Delete release branch
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
```

## 🚨 Hotfix Process

### 1. Hotfix Creation
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-jwt-validation

# Fix the issue
git add .
git commit -m "fix(auth): resolve JWT token validation error"

# Test fix thoroughly
npm test
```

### 2. Hotfix Deployment
```bash
# Merge to main
git checkout main
git merge --no-ff hotfix/critical-jwt-validation
git tag -a v1.2.1 -m "Hotfix: JWT validation"

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-jwt-validation

# Deploy immediately
git push origin main --tags
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-jwt-validation
```

## 🔒 Branch Protection Rules

### Main Branch Protection
```bash
# Require pull request reviews
- Require 2 approving reviews
- Dismiss stale reviews when new commits are pushed
- Require review from code owners

# Require status checks
- Require branches to be up to date before merging
- Require CI/CD pipeline to pass
- Require security scan to pass

# Restrictions
- Restrict who can push to matching branches
- Include administrators in restrictions
```

### Develop Branch Protection
```bash
# Require pull request reviews
- Require 1 approving review
- Allow specified people to bypass requirements

# Require status checks
- Require CI/CD pipeline to pass
- Require basic security checks
```

## 📋 Branch Management

### Regular Maintenance
```bash
# Weekly cleanup of merged feature branches
git branch --merged develop | grep -v develop | xargs git branch -d

# Monthly cleanup of remote tracking branches
git remote prune origin

# Quarterly review of long-running branches
git for-each-ref --format='%(refname:short) %(committerdate)' refs/heads | sort -k2
```

### Stale Branch Policy
```bash
# Feature branches older than 30 days
# → Review and either merge or delete

# Abandoned branches (no commits for 60 days)
# → Delete after team notification

# Experiment branches
# → Delete after conclusion regardless of outcome
```

## 🔧 Git Configuration

### Global Settings
```bash
# Configure user information
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Set default branch name
git config --global init.defaultBranch main

# Configure merge strategy
git config --global merge.ff false
git config --global pull.rebase true
```

### Repository Settings
```bash
# .gitconfig in repository root
[core]
    autocrlf = input
    ignorecase = false

[branch]
    autosetupmerge = always
    autosetuprebase = always

[push]
    default = simple
    followTags = true
```

### Useful Aliases
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
    
    # Cleanup
    cleanup = "!git branch --merged develop | grep -v develop | xargs git branch -d"
```

## 📊 Workflow Examples

### Feature Development Workflow
```bash
# 1. Start new feature
git feature add-oauth-integration

# 2. Work and commit regularly
git add .
git commit -m "feat(oauth): add provider configuration"

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

# 6. Squash and merge via PR
# Branch automatically deleted
```

### Bug Fix Workflow
```bash
# 1. Create bug fix branch
git checkout develop
git pull origin develop
git checkout -b bugfix/tenant-validation-error

# 2. Fix and test
git add .
git commit -m "fix(tenants): resolve validation error for special characters"

# 3. Create PR and merge
git push origin bugfix/tenant-validation-error
# Create PR and follow review process
```

### Emergency Hotfix Workflow
```bash
# 1. Create hotfix immediately
git hotfix critical-security-fix

# 2. Implement fix
git add .
git commit -m "fix(security): resolve authentication bypass vulnerability"

# 3. Test thoroughly
npm test
npm run test:security

# 4. Fast-track merge
git checkout main
git merge --no-ff hotfix/critical-security-fix
git tag -a v1.2.1 -m "Security hotfix"

# 5. Deploy immediately
git push origin main --tags

# 6. Merge back to develop
git checkout develop
git merge --no-ff hotfix/critical-security-fix
git push origin develop
```

## 📖 Related Documentation

- **[Commit Style Guide](commit-style.md)** - Commit message conventions
- **[Development Guide](development-guide.md)** - General development practices
- **[Naming Guidelines](naming.md)** - Code and file naming standards

---

*A well-defined branching strategy enables efficient collaboration and maintains code quality across the development lifecycle.* 