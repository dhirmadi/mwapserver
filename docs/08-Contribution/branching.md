# Branching Strategy

## Overview

This document outlines the Git branching strategy used for the MWAP platform development. Our approach balances development velocity with code quality and deployment stability.

## Branch Types

### Main Branches

#### `main`
- **Purpose**: Production-ready code
- **Protection**: Protected, requires PR approval
- **Deployment**: Automatically deploys to production
- **Merge Strategy**: Squash and merge from `develop`

#### `develop`
- **Purpose**: Integration branch for ongoing development
- **Protection**: Protected, requires PR approval
- **Deployment**: Automatically deploys to staging
- **Merge Strategy**: Merge commits from feature branches

### Supporting Branches

#### Feature Branches
- **Naming**: `feature/description` or `feature/ISSUE-123-description`
- **Purpose**: Develop new features or enhancements
- **Branch from**: `develop`
- **Merge to**: `develop`
- **Lifetime**: Temporary, deleted after merge

Example:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication
# Development work
git push origin feature/user-authentication
# Create PR to develop
```

#### Bugfix Branches
- **Naming**: `bugfix/description` or `bugfix/ISSUE-123-description`
- **Purpose**: Fix bugs in development
- **Branch from**: `develop`
- **Merge to**: `develop`
- **Lifetime**: Temporary, deleted after merge

#### Hotfix Branches
- **Naming**: `hotfix/description` or `hotfix/ISSUE-123-description`
- **Purpose**: Critical fixes for production
- **Branch from**: `main`
- **Merge to**: `main` and `develop`
- **Lifetime**: Temporary, deleted after merge

Example:
```bash
git checkout main
git pull origin main
git checkout -b hotfix/security-vulnerability
# Fix the issue
git push origin hotfix/security-vulnerability
# Create PR to main
# Also merge back to develop
```

#### Release Branches
- **Naming**: `release/v1.2.0`
- **Purpose**: Prepare releases and final testing
- **Branch from**: `develop`
- **Merge to**: `main` and `develop`
- **Lifetime**: Temporary, deleted after release

## Workflow Process

### Feature Development Flow

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-new-feature
   ```

2. **Development**
   - Make commits with descriptive messages
   - Follow [commit conventions](./commit-style.md)
   - Rebase regularly to keep history clean
   - Push to remote branch regularly

3. **Prepare for Review**
   ```bash
   # Rebase and clean up commits
   git rebase -i develop
   
   # Update with latest develop
   git checkout develop
   git pull origin develop
   git checkout feature/my-new-feature
   git rebase develop
   ```

4. **Create Pull Request**
   - Target: `develop` branch
   - Include clear description
   - Link related issues
   - Add appropriate labels
   - Request reviewers

5. **Code Review & Merge**
   - Address review feedback
   - Ensure CI passes
   - Merge when approved
   - Delete feature branch

### Release Flow

1. **Create Release Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.2.0
   ```

2. **Release Preparation**
   - Update version numbers
   - Update CHANGELOG.md
   - Final testing and bug fixes
   - Documentation updates

3. **Deploy to Staging**
   - Test thoroughly
   - Performance testing
   - Security testing

4. **Merge to Main**
   ```bash
   # Create PR to main
   git checkout main
   git pull origin main
   git merge --no-ff release/v1.2.0
   git tag v1.2.0
   git push origin main --tags
   ```

5. **Merge Back to Develop**
   ```bash
   git checkout develop
   git merge --no-ff release/v1.2.0
   git push origin develop
   ```

### Hotfix Flow

1. **Create Hotfix Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-security-fix
   ```

2. **Apply Fix**
   - Minimal changes
   - Focus on the specific issue
   - Add tests if possible

3. **Test Thoroughly**
   - Verify fix works
   - Ensure no regression
   - Quick security review

4. **Merge to Main**
   ```bash
   git checkout main
   git merge --no-ff hotfix/critical-security-fix
   git tag v1.2.1
   git push origin main --tags
   ```

5. **Merge to Develop**
   ```bash
   git checkout develop
   git merge --no-ff hotfix/critical-security-fix
   git push origin develop
   ```

## Branch Protection Rules

### Main Branch
- Require pull request reviews (2 reviewers)
- Require status checks to pass
- Require up-to-date branches
- Include administrators in restrictions
- Allow force pushes: No
- Allow deletions: No

### Develop Branch
- Require pull request reviews (1 reviewer)
- Require status checks to pass
- Require up-to-date branches
- Allow force pushes: No
- Allow deletions: No

## Naming Conventions

### Branch Names
- Use lowercase letters
- Use hyphens to separate words
- Include issue number when applicable
- Be descriptive but concise

Examples:
- `feature/user-profile-management`
- `feature/ISSUE-123-oauth-integration`
- `bugfix/login-validation-error`
- `hotfix/security-token-validation`
- `release/v2.1.0`

### Commit Messages
Follow the [commit style guide](./commit-style.md):
```
type(scope): description

feat(auth): add OAuth2 integration
fix(api): resolve user validation error
docs(readme): update installation instructions
```

## Merge Strategies

### Feature to Develop
**Strategy**: Merge commit
- Preserves feature branch history
- Clear indication of feature completion
- Easy to revert if needed

### Release/Hotfix to Main
**Strategy**: Merge commit with tag
- Creates clear release points
- Preserves release branch history
- Tags mark versions

### Develop to Main
**Strategy**: Squash and merge
- Clean main branch history
- Easier to understand changes
- Simplifies git log

## Continuous Integration

### Branch-Based CI/CD

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
      
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: npm run deploy:staging
        
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: npm run deploy:production
```

## Best Practices

### For Developers

1. **Keep Branches Fresh**
   ```bash
   # Regularly sync with develop
   git checkout feature/my-feature
   git fetch origin
   git rebase origin/develop
   ```

2. **Clean Commit History**
   ```bash
   # Interactive rebase before PR
   git rebase -i HEAD~3
   ```

3. **Meaningful Commits**
   - One logical change per commit
   - Clear commit messages
   - Include tests with features

### For Reviewers

1. **Timely Reviews**
   - Review PRs within 24 hours
   - Provide constructive feedback
   - Approve when ready

2. **Quality Checks**
   - Verify tests pass
   - Check code quality
   - Ensure documentation updates

### For Team

1. **Communication**
   - Use PR descriptions effectively
   - Link issues and discussions
   - Update status in team chat

2. **Consistency**
   - Follow naming conventions
   - Use consistent merge strategies
   - Maintain clean history

## Troubleshooting

### Common Issues

#### Merge Conflicts
```bash
# Resolve conflicts during rebase
git rebase develop
# Edit conflicted files
git add .
git rebase --continue
```

#### Wrong Branch Target
```bash
# Change PR target branch in GitHub
# Or recreate branch from correct base
git checkout correct-base-branch
git checkout -b new-feature-branch
git cherry-pick commit-hash
```

#### Accidental Commits to Wrong Branch
```bash
# Move commits to correct branch
git checkout wrong-branch
git reset --hard HEAD~1
git checkout correct-branch
git cherry-pick commit-hash
```

## Tools and Scripts

### Useful Git Aliases
```bash
# Add to ~/.gitconfig
[alias]
    co = checkout
    br = branch
    ci = commit
    st = status
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = !gitk
    sync = !git checkout develop && git pull origin develop
    cleanup = !git branch --merged | grep -v '\\*\\|main\\|develop' | xargs -n 1 git branch -d
```

### Branch Management Script
```bash
#!/bin/bash
# scripts/create-feature.sh
BRANCH_NAME="feature/$1"
git checkout develop
git pull origin develop
git checkout -b $BRANCH_NAME
echo "Created feature branch: $BRANCH_NAME"
```

## Monitoring and Metrics

Track these metrics to improve workflow:
- Average PR size (lines of code)
- Time from PR creation to merge
- Number of commits per PR
- Frequency of hotfixes
- Build success rate by branch

## Related Documents

- [Contributing Guide](./contributing.md)
- [Commit Style Guide](./commit-style.md)
- [PR Guidelines](./PR-guidelines.md)
- [Development Guide](../07-Standards/development-guide.md) 