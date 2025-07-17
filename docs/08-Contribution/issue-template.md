# 📝 MWAP Issue Templates

## 🎯 Overview

Consistent issue reporting helps maintain project quality and enables efficient problem resolution. This guide provides comprehensive templates for different types of issues in the MWAP project.

## 🐛 Bug Report Template

### **GitHub Issue Template: Bug Report**
```markdown
---
name: Bug Report
about: Report a bug to help us improve MWAP
title: '[BUG] '
labels: bug, needs-triage
assignees: ''
---

## 🐛 Bug Description

### Summary
A clear and concise description of the bug.

### Expected Behavior
Describe what you expected to happen.

### Actual Behavior
Describe what actually happened instead.

## 🔄 Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Enter data '...'
4. See error

**Minimal Reproduction Case:**
If possible, provide a minimal code example that reproduces the issue.

```typescript
// Example code that demonstrates the bug
const user = await userService.createUser({
  name: "Test User",
  email: "invalid-email"  // This should be validated but isn't
});
```

## 🌍 Environment Information

### System Environment
- **OS**: [e.g., macOS 13.0, Ubuntu 20.04, Windows 11]
- **Node.js Version**: [e.g., 18.17.0]
- **npm Version**: [e.g., 9.6.7]
- **MWAP Version**: [e.g., 1.2.3]

### Browser (if applicable)
- **Browser**: [e.g., Chrome 115.0, Firefox 116.0, Safari 16.0]
- **Browser Version**: [e.g., 115.0.5790.170]

### Database
- **MongoDB Version**: [e.g., 6.0.8]
- **Connection Type**: [e.g., Local, Atlas, Docker]

### Authentication
- **Auth0 Tenant**: [e.g., dev-tenant.auth0.com]
- **User Role**: [e.g., SuperAdmin, TenantOwner, ProjectMember]

## 📋 Additional Context

### Error Messages
```
Paste full error messages and stack traces here
```

### Logs
```
Relevant application logs (remove sensitive information)
```

### Screenshots
If applicable, add screenshots to help explain the problem.

### Related Issues
- Related to #123
- Similar to #456

### Possible Solution
If you have ideas on how to fix the bug, please describe them here.

### Impact Assessment
- **Severity**: [Critical/High/Medium/Low]
- **Frequency**: [Always/Often/Sometimes/Rarely]
- **User Impact**: [All users/Specific role/Edge case]

## 🔒 Security Considerations

- [ ] This bug has security implications
- [ ] This bug exposes sensitive data
- [ ] This bug affects authentication/authorization

**Note**: If this is a security vulnerability, please email security@mwap.com instead of creating a public issue.

## ✅ Checklist

- [ ] I have searched existing issues to ensure this is not a duplicate
- [ ] I have provided all required environment information
- [ ] I have included steps to reproduce the issue
- [ ] I have included relevant error messages and logs
- [ ] I have assessed the security implications
```

## 💡 Feature Request Template

### **GitHub Issue Template: Feature Request**
```markdown
---
name: Feature Request
about: Suggest a new feature for MWAP
title: '[FEATURE] '
labels: enhancement, needs-triage
assignees: ''
---

## 💡 Feature Request

### Problem Statement
Describe the problem or limitation that this feature would solve.

**Is your feature request related to a problem?**
A clear description of what the problem is. Ex. I'm always frustrated when [...]

### Proposed Solution
Describe the solution you'd like to see implemented.

**Describe the feature you'd like:**
A clear and concise description of what you want to happen.

### Alternative Solutions
Describe any alternative solutions or features you've considered.

**Describe alternatives you've considered:**
A clear description of any alternative solutions or features you've considered.

## 🎯 Use Cases

### Primary Use Case
Describe the main scenario where this feature would be valuable.

### Additional Use Cases
- Use case 1: [Description]
- Use case 2: [Description]
- Use case 3: [Description]

### User Stories
- As a [user type], I want [functionality] so that [benefit]
- As a [user type], I want [functionality] so that [benefit]

## 🏗️ Implementation Considerations

### Technical Complexity
- **Estimated Complexity**: [Low/Medium/High/Very High]
- **Affected Components**: [List components that would be modified]
- **Dependencies**: [External libraries or services needed]

### Breaking Changes
- [ ] This feature would introduce breaking changes
- [ ] This feature is backward compatible
- [ ] Migration guide would be needed

### Performance Impact
- **Database**: [Impact on database queries/schema]
- **API**: [Impact on API response times]
- **Frontend**: [Impact on user interface performance]

### Security Implications
- **Authentication**: [Impact on authentication system]
- **Authorization**: [New permissions or roles needed]
- **Data Protection**: [Impact on data security]

## 📊 Success Criteria

### Acceptance Criteria
- [ ] Criterion 1: [Specific, measurable outcome]
- [ ] Criterion 2: [Specific, measurable outcome]
- [ ] Criterion 3: [Specific, measurable outcome]

### Definition of Done
- [ ] Feature implemented according to specifications
- [ ] Unit tests added with >80% coverage
- [ ] Integration tests added for API endpoints
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance impact assessed

## 🔗 Additional Context

### Related Issues
- Related to #123
- Depends on #456
- Blocks #789

### External References
- [Link to relevant documentation]
- [Link to similar implementations]
- [Link to user feedback or discussions]

### Mockups/Wireframes
If applicable, add mockups, wireframes, or diagrams to illustrate the feature.

### Priority Justification
Explain why this feature should be prioritized.

## 🏷️ Labels and Classification

### Feature Category
- [ ] Authentication/Authorization
- [ ] API Enhancement
- [ ] User Interface
- [ ] Performance
- [ ] Security
- [ ] Documentation
- [ ] Developer Experience
- [ ] Infrastructure

### Target Users
- [ ] SuperAdmin
- [ ] TenantOwner
- [ ] ProjectMember
- [ ] Developers
- [ ] All Users

### Effort Estimation
- [ ] Small (1-3 days)
- [ ] Medium (1-2 weeks)
- [ ] Large (2-4 weeks)
- [ ] Extra Large (1+ months)
```

## 📚 Documentation Issue Template

### **GitHub Issue Template: Documentation**
```markdown
---
name: Documentation Issue
about: Report issues with documentation or request documentation improvements
title: '[DOCS] '
labels: documentation, needs-triage
assignees: ''
---

## 📚 Documentation Issue

### Issue Type
- [ ] Missing documentation
- [ ] Incorrect documentation
- [ ] Outdated documentation
- [ ] Unclear documentation
- [ ] Documentation improvement

### Affected Documentation
- **File/Section**: [e.g., docs/api/authentication.md, README.md]
- **URL**: [Link to the documentation if online]
- **Section**: [Specific section or heading]

## 📝 Issue Description

### Current State
Describe what the documentation currently says or what's missing.

### Expected State
Describe what the documentation should say or include.

### Specific Problems
- Problem 1: [Description]
- Problem 2: [Description]
- Problem 3: [Description]

## 🎯 Proposed Solution

### Content Changes
Describe the specific changes needed to fix the documentation.

### Structure Changes
If the documentation structure needs to be changed, describe how.

### Additional Resources
List any additional resources that should be included (examples, diagrams, etc.).

## 👥 Target Audience

### Primary Audience
- [ ] New developers
- [ ] Experienced developers
- [ ] System administrators
- [ ] End users
- [ ] Contributors

### Use Case
Describe when and why someone would read this documentation.

## 📋 Additional Context

### Related Issues
- Related to #123
- Fixes #456

### External References
- [Link to relevant external documentation]
- [Link to related discussions]

### Screenshots
If applicable, add screenshots showing the current documentation issues.

## ✅ Acceptance Criteria

- [ ] Documentation is accurate and up-to-date
- [ ] Examples are working and tested
- [ ] Language is clear and concise
- [ ] Formatting is consistent
- [ ] Links are working
- [ ] Code examples follow project standards
```

## 🔒 Security Issue Template

### **GitHub Issue Template: Security**
```markdown
---
name: Security Issue
about: Report a security vulnerability (Use only for non-critical issues)
title: '[SECURITY] '
labels: security, needs-triage
assignees: ''
---

## ⚠️ Security Issue Notice

**IMPORTANT**: If this is a critical security vulnerability that could be exploited, please DO NOT create a public issue. Instead, email security@mwap.com with the details.

This template is for non-critical security improvements and general security concerns.

## 🔒 Security Issue Description

### Issue Type
- [ ] Security improvement
- [ ] Security configuration issue
- [ ] Security documentation issue
- [ ] Security best practice violation
- [ ] Dependency vulnerability (non-critical)

### Affected Component
- **Component**: [e.g., Authentication, API, Database]
- **File/Module**: [Specific file or module affected]
- **Scope**: [Local/System-wide impact]

## 📋 Issue Details

### Current Behavior
Describe the current security-related behavior or configuration.

### Security Concern
Explain why this is a security concern and what risks it might pose.

### Recommended Solution
Describe how this security issue should be addressed.

## 🎯 Impact Assessment

### Risk Level
- [ ] Low - Minor security improvement
- [ ] Medium - Moderate security concern
- [ ] High - Significant security issue

### Affected Users
- [ ] All users
- [ ] Specific user roles
- [ ] Administrators only
- [ ] Developers only

### Potential Impact
- [ ] Data exposure
- [ ] Unauthorized access
- [ ] Privilege escalation
- [ ] Information disclosure
- [ ] Other: [Describe]

## 🔧 Proposed Solution

### Implementation Steps
1. Step 1: [Description]
2. Step 2: [Description]
3. Step 3: [Description]

### Testing Requirements
- [ ] Security testing needed
- [ ] Penetration testing recommended
- [ ] Code review required
- [ ] Documentation update needed

## 📚 References

### Security Standards
- [ ] OWASP guidelines
- [ ] Industry best practices
- [ ] Compliance requirements
- [ ] Internal security policies

### Related Resources
- [Link to security documentation]
- [Link to relevant security advisories]
- [Link to best practice guides]

## ✅ Acceptance Criteria

- [ ] Security issue is resolved
- [ ] Solution doesn't introduce new vulnerabilities
- [ ] Security testing completed
- [ ] Documentation updated
- [ ] Team trained on new security measures (if applicable)
```

## 🚀 Performance Issue Template

### **GitHub Issue Template: Performance**
```markdown
---
name: Performance Issue
about: Report performance problems or suggest performance improvements
title: '[PERF] '
labels: performance, needs-triage
assignees: ''
---

## ⚡ Performance Issue

### Issue Type
- [ ] Slow response times
- [ ] High memory usage
- [ ] High CPU usage
- [ ] Database performance
- [ ] Network performance
- [ ] Frontend performance
- [ ] Performance regression

### Affected Component
- **Component**: [e.g., API endpoint, Database query, Frontend component]
- **Specific Area**: [e.g., /api/v1/projects, User dashboard, Project list]

## 📊 Performance Metrics

### Current Performance
- **Response Time**: [e.g., 2.5 seconds]
- **Memory Usage**: [e.g., 512MB]
- **CPU Usage**: [e.g., 80%]
- **Database Query Time**: [e.g., 1.2 seconds]

### Expected Performance
- **Target Response Time**: [e.g., <500ms]
- **Target Memory Usage**: [e.g., <256MB]
- **Target CPU Usage**: [e.g., <50%]
- **Target Query Time**: [e.g., <200ms]

### Measurement Method
Describe how you measured the performance issue.

```bash
# Example measurement commands
time curl -X GET "http://localhost:3000/api/v1/projects"
npm run benchmark
```

## 🔍 Analysis

### Root Cause Analysis
Describe what you think is causing the performance issue.

### Profiling Results
Include any profiling data or performance analysis results.

### Database Queries
If database-related, include slow query logs or explain plans.

```sql
-- Example slow query
EXPLAIN ANALYZE SELECT * FROM projects WHERE tenant_id = '123';
```

## 🎯 Proposed Solution

### Optimization Strategy
- [ ] Database optimization (indexes, query optimization)
- [ ] Caching implementation
- [ ] Code optimization
- [ ] Architecture changes
- [ ] Resource scaling

### Specific Changes
1. Change 1: [Description and expected impact]
2. Change 2: [Description and expected impact]
3. Change 3: [Description and expected impact]

### Performance Testing Plan
Describe how the performance improvement will be validated.

## 🌍 Environment Information

### System Specifications
- **CPU**: [e.g., Intel i7-9750H]
- **RAM**: [e.g., 16GB]
- **Storage**: [e.g., SSD]
- **Network**: [e.g., 1Gbps]

### Software Environment
- **Node.js Version**: [e.g., 18.17.0]
- **Database**: [e.g., MongoDB 6.0.8]
- **Load**: [e.g., 100 concurrent users]

## 📋 Additional Context

### Related Issues
- Related to #123
- Caused by #456

### Performance Benchmarks
Include any relevant performance benchmarks or comparisons.

### Impact on Users
Describe how this performance issue affects user experience.

## ✅ Success Criteria

- [ ] Performance meets target metrics
- [ ] No performance regression in other areas
- [ ] Performance tests added to prevent regression
- [ ] Documentation updated with performance considerations
```

## 🧪 Testing Issue Template

### **GitHub Issue Template: Testing**
```markdown
---
name: Testing Issue
about: Report issues with tests or request testing improvements
title: '[TEST] '
labels: testing, needs-triage
assignees: ''
---

## 🧪 Testing Issue

### Issue Type
- [ ] Test failure
- [ ] Missing test coverage
- [ ] Flaky test
- [ ] Test improvement
- [ ] Test infrastructure issue

### Affected Tests
- **Test File**: [e.g., src/features/auth/__tests__/auth.service.test.ts]
- **Test Suite**: [e.g., AuthService]
- **Specific Test**: [e.g., "should validate JWT token"]

## 📋 Issue Description

### Current Behavior
Describe what's currently happening with the tests.

### Expected Behavior
Describe what should happen with the tests.

### Test Output
```
Paste test output, error messages, or failure logs here
```

## 🔍 Analysis

### Root Cause
If known, describe what's causing the test issue.

### Reproduction Steps
1. Step 1: [How to reproduce the test issue]
2. Step 2: [Additional steps]
3. Step 3: [Final steps]

### Environment Factors
- **Test Environment**: [e.g., Local, CI/CD, Docker]
- **Test Runner**: [e.g., Vitest, Jest]
- **Node.js Version**: [e.g., 18.17.0]

## 🎯 Proposed Solution

### Fix Strategy
Describe how the test issue should be resolved.

### Test Improvements
- [ ] Add missing test cases
- [ ] Improve test reliability
- [ ] Enhance test coverage
- [ ] Optimize test performance
- [ ] Update test infrastructure

### Coverage Goals
- **Current Coverage**: [e.g., 65%]
- **Target Coverage**: [e.g., 80%]
- **Priority Areas**: [List areas needing test coverage]

## 📊 Test Metrics

### Coverage Report
```
Current test coverage statistics
```

### Performance Metrics
- **Test Execution Time**: [e.g., 45 seconds]
- **Target Execution Time**: [e.g., <30 seconds]

## ✅ Acceptance Criteria

- [ ] All tests pass consistently
- [ ] Test coverage meets requirements (>80%)
- [ ] Tests run within acceptable time limits
- [ ] Test documentation is updated
- [ ] CI/CD pipeline tests pass
```

## 🏷️ Issue Labels and Classification

### **Standard Labels**
```yaml
# Type labels
bug: Issues with existing functionality
enhancement: New features or improvements
documentation: Documentation issues
security: Security-related issues
performance: Performance problems
testing: Testing-related issues

# Priority labels
priority-critical: Must be fixed immediately
priority-high: Should be fixed soon
priority-medium: Normal priority
priority-low: Nice to have

# Status labels
needs-triage: Needs initial review
in-progress: Currently being worked on
blocked: Blocked by external factors
ready-for-review: Ready for code review
needs-info: Needs more information

# Component labels
component-auth: Authentication/authorization
component-api: API endpoints
component-db: Database related
component-ui: User interface
component-docs: Documentation
component-ci: CI/CD pipeline

# Effort labels
effort-small: 1-3 days
effort-medium: 1-2 weeks
effort-large: 2-4 weeks
effort-xl: 1+ months
```

### **Label Usage Guidelines**
```markdown
## Label Application Rules

### Required Labels
Every issue must have:
- One type label (bug, enhancement, etc.)
- One priority label
- At least one component label

### Optional Labels
- Effort estimation (for enhancements)
- Status labels (managed by maintainers)
- Special labels (good-first-issue, help-wanted)

### Label Maintenance
- Maintainers review and update labels during triage
- Contributors can suggest label changes in comments
- Labels are updated as issues progress through workflow
```

## 📊 Issue Metrics and Analytics

### **Issue Health Metrics**
```typescript
interface IssueMetrics {
  timeToTriage: number;        // Hours from creation to triage
  timeToAssignment: number;    // Hours from triage to assignment
  timeToResolution: number;    // Hours from assignment to closure
  reopenRate: number;          // Percentage of issues reopened
  satisfactionScore: number;   // Reporter satisfaction (1-5)
}

// Target metrics for healthy issue management
const targetMetrics = {
  timeToTriage: 24,           // Triage within 24 hours
  timeToAssignment: 72,       // Assign within 3 days
  timeToResolution: 168,      // Resolve within 1 week
  reopenRate: 5,              // <5% reopen rate
  satisfactionScore: 4.0      // >4.0 satisfaction
};
```

## 📚 Related Documentation

- [🤝 Contributing Guide](./contributing.md) - Complete contribution workflow
- [🌿 Branching Strategy](./branching.md) - Git branching conventions
- [📋 PR Guidelines](./PR-guidelines.md) - Pull request standards
- [🛠️ Development Guide](../07-Standards/development-guide.md) - Development standards

---

*These issue templates ensure consistent, high-quality issue reporting that enables efficient problem resolution and project improvement. Use the appropriate template for your specific issue type.*