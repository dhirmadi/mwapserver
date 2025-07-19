# Pull Request Guidelines

## Overview

This document outlines the pull request process and guidelines for the MWAP platform. Following these guidelines ensures code quality, maintainability, and smooth collaboration.

## PR Creation Process

### Before Creating a PR

1. **Ensure Your Branch is Up to Date**
   ```bash
   git checkout your-feature-branch
   git fetch origin
   git rebase origin/develop
   ```

2. **Run Tests Locally**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

3. **Review Your Changes**
   ```bash
   git diff develop...your-feature-branch
   ```

### PR Title Guidelines

Use descriptive, concise titles that follow this format:
```
type(scope): brief description
```

**Examples:**
- `feat(auth): add OAuth2 integration for Google`
- `fix(api): resolve user validation timeout issue`
- `docs(readme): update installation instructions`
- `refactor(agents): improve error handling in base agent`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### PR Description Template

Use this template for consistent PR descriptions:

```markdown
## Description
Brief description of what this PR does and why.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test improvements

## Related Issues
Closes #123
Relates to #456

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Screenshots (if applicable)
Add screenshots or GIFs for UI changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

## Code Review Guidelines

### For PR Authors

#### Pre-Review Checklist
- [ ] Code is self-documenting with clear variable/function names
- [ ] Complex logic is commented
- [ ] All tests pass
- [ ] No console.log statements in production code
- [ ] TypeScript strict mode compliance
- [ ] Security considerations addressed
- [ ] Performance impact considered

#### Responding to Feedback
1. **Be Receptive**: View feedback as helping improve the code
2. **Ask Questions**: If feedback is unclear, ask for clarification
3. **Explain Decisions**: If you disagree, explain your reasoning
4. **Make Changes**: Address feedback promptly
5. **Mark Resolved**: Mark conversations as resolved when addressed

### For Reviewers

#### Review Priorities
1. **Correctness**: Does the code do what it's supposed to do?
2. **Security**: Are there any security vulnerabilities?
3. **Performance**: Will this impact system performance?
4. **Maintainability**: Is the code easy to understand and modify?
5. **Testing**: Are there adequate tests?
6. **Style**: Does it follow coding standards?

#### Review Process
1. **Understand the Context**: Read the PR description and related issues
2. **Review the Code**: Look at the changes line by line
3. **Test Locally**: Pull the branch and test if needed
4. **Provide Feedback**: Use the feedback guidelines below
5. **Approve or Request Changes**: Make a clear decision

#### Feedback Guidelines

**Effective Feedback:**
```markdown
✅ Consider using a more descriptive variable name here. What about `userAuthenticationToken` instead of `token`?

✅ This function is getting large. Could we extract the validation logic into a separate method?

✅ Great error handling here! This will make debugging much easier.
```

**Ineffective Feedback:**
```markdown
❌ This is wrong.
❌ Bad code.
❌ Fix this.
```

**Feedback Categories:**
- **Must Fix**: Security issues, bugs, breaking changes
- **Should Fix**: Code quality, maintainability issues
- **Consider**: Suggestions for improvement
- **Praise**: Acknowledge good practices

## PR Size Guidelines

### Recommended Sizes
- **Small**: 1-50 lines changed (ideal)
- **Medium**: 51-200 lines changed (acceptable)
- **Large**: 201-500 lines changed (needs justification)
- **Extra Large**: 500+ lines changed (avoid if possible)

### Breaking Down Large PRs
If your PR is large, consider:
1. **Split by Feature**: Separate different features into different PRs
2. **Split by Layer**: Database changes, business logic, API changes
3. **Split by Component**: Different modules or services
4. **Preparatory PRs**: Infrastructure changes first, then features

## Testing Requirements

### Required Tests
- **Unit Tests**: For new functions and classes
- **Integration Tests**: For API endpoints
- **End-to-End Tests**: For critical user flows
- **Regression Tests**: For bug fixes

### Test Quality Guidelines
```typescript
// ✅ Good test
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
```

## Security Review Checklist

### Common Security Issues
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Authentication and authorization
- [ ] Sensitive data exposure
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Dependency vulnerabilities

### Security Review Questions
1. Are all inputs properly validated?
2. Is user authorization checked?
3. Are sensitive data properly encrypted?
4. Are error messages information leak-safe?
5. Are rate limits implemented where needed?

## Performance Considerations

### Performance Checklist
- [ ] Database queries optimized
- [ ] N+1 query problems avoided
- [ ] Caching implemented where appropriate
- [ ] Large datasets handled efficiently
- [ ] Memory usage considered
- [ ] Response times measured

### Performance Review
```typescript
// ❌ Potential N+1 problem
async function getProjectsWithFiles(userId: string): Promise<Project[]> {
  const projects = await projectRepo.findByUser(userId);
  
  for (const project of projects) {
    project.files = await fileRepo.findByProject(project.id); // N+1!
  }
  
  return projects;
}

// ✅ Optimized with single query
async function getProjectsWithFiles(userId: string): Promise<Project[]> {
  return projectRepo.findByUserWithFiles(userId); // Single query with JOIN
}
```

## Merge Requirements

### Automated Checks
- [ ] All CI checks pass
- [ ] Code coverage requirements met
- [ ] Security scan passes
- [ ] Linting passes
- [ ] Type checking passes

### Manual Requirements
- [ ] At least one approval from code owner
- [ ] Security review for sensitive changes
- [ ] Performance review for performance-critical changes
- [ ] Documentation updated

### Merge Strategies

#### Feature Branches → Develop
**Strategy**: Squash and Merge
```bash
# Creates clean commit history
git checkout develop
git merge --squash feature/my-feature
git commit -m "feat(scope): feature description"
```

#### Develop → Main
**Strategy**: Merge Commit
```bash
# Preserves development history
git checkout main
git merge --no-ff develop
```

## Special PR Types

### Documentation PRs
- Focus on clarity and accuracy
- Update related documentation
- Check for broken links
- Verify examples work

### Dependency Updates
- Review changelog for breaking changes
- Update related code if needed
- Test thoroughly
- Consider security implications

### Database Schema Changes
- Include migration scripts
- Test rollback procedures
- Consider performance impact
- Update documentation

### Security Fixes
- Mark as urgent
- Limit reviewer access if needed
- Test thoroughly
- Plan deployment strategy

## Common Issues and Solutions

### Merge Conflicts
```bash
# Resolve conflicts
git checkout feature-branch
git rebase develop
# Fix conflicts in files
git add .
git rebase --continue
git push --force-with-lease origin feature-branch
```

### Failed CI Checks
1. **Check Logs**: Review CI output for specific errors
2. **Fix Locally**: Reproduce and fix issues locally
3. **Push Fix**: Push the fix to update PR
4. **Request Re-run**: Re-run CI if it was a flaky test

### Large PR Feedback
1. **Acknowledge Size**: Explain why the PR is large
2. **Provide Context**: Link to design documents
3. **Offer Alternatives**: Suggest ways to review in parts
4. **Split if Possible**: Create smaller follow-up PRs

## Tools and Automation

### GitHub Settings
```yaml
# .github/PULL_REQUEST_TEMPLATE.md
name: Pull Request
about: Create a pull request to contribute to this project
title: '[Type]: Brief description'
labels: ''
assignees: ''
```

### Useful Scripts
```bash
# scripts/pr-check.sh
#!/bin/bash
echo "Running pre-PR checks..."
npm test
npm run lint
npm run type-check
echo "All checks passed! Ready for PR."
```

### Browser Extensions
- **Refined GitHub**: Enhanced GitHub interface
- **OctoTree**: File tree for GitHub
- **GitHub Code Folding**: Collapse code sections

## Metrics and Improvement

### Track These Metrics
- Average time from PR creation to merge
- Number of review cycles per PR
- PR size distribution
- Review response time
- Defect rate by reviewer

### Continuous Improvement
- Regular retrospectives on PR process
- Update guidelines based on learnings
- Share best practices in team meetings
- Automate repetitive checks

## Related Documents

- [Branching Strategy](./branching.md)
- [Commit Style Guide](./commit-style.md)
- [Contributing Guide](./contributing.md)
- [Code Review Checklist](./code-review-checklist.md) 