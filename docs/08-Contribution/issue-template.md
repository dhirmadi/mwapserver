# Issue Templates

## Overview

This document provides templates and guidelines for creating well-structured issues in the MWAP platform repository. Clear, detailed issues help maintain project quality and facilitate effective collaboration.

## Issue Types

### Bug Report Template

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
- Node.js Version: [e.g. 18.17.0]
- Application Version: [e.g. 2.1.0]

## Additional Context
Add any other context about the problem here.

## Error Logs
```
Paste any relevant error logs here
```

## Reproduction Repository
If possible, provide a minimal reproduction repository or CodeSandbox link.

## Workaround
If you found a temporary workaround, please describe it here.
```

### Feature Request Template

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

## Labels
Please add relevant labels:
- Component: frontend, backend, database, docs, tests
- Priority: critical, high, medium, low
- Size: small, medium, large, epic
```

### Task/Chore Template

```markdown
---
name: Task/Chore
about: Development tasks, maintenance, or technical improvements
title: '[TASK] Brief description of the task'
labels: 'task, maintenance'
assignees: ''
---

## Task Description
Clear description of what needs to be done.

## Background/Context
Why is this task necessary? What's the background?

## Acceptance Criteria
- [ ] Specific deliverable 1
- [ ] Specific deliverable 2
- [ ] Specific deliverable 3

## Technical Details
- Affected components: [list]
- Estimated effort: [hours/days]
- Dependencies: [other issues/PRs]

## Definition of Done
- [ ] Code changes implemented
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] Verified in production
```

### Security Issue Template

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

## Additional Context
Any other relevant information.
```

### Documentation Issue Template

```markdown
---
name: Documentation Issue
about: Issues with documentation - missing, unclear, or incorrect
title: '[DOCS] Brief description'
labels: 'documentation'
assignees: ''
---

## Documentation Issue
What's wrong with the current documentation?

## Affected Documentation
- [ ] README files
- [ ] API documentation
- [ ] Setup guides
- [ ] User guides
- [ ] Developer guides
- [ ] Code comments

## Specific Location
- File: [path/to/file.md]
- Section: [section name]
- Line: [line number if applicable]

## Issue Type
- [ ] Missing documentation
- [ ] Incorrect information
- [ ] Unclear explanation
- [ ] Outdated content
- [ ] Broken links
- [ ] Formatting issues

## Suggested Improvement
How should this be improved?

## Additional Context
Any other relevant information.
```

## Issue Labeling System

### Priority Labels
- `critical` - Blocking operations, security issues
- `high` - Important for current sprint
- `medium` - Should be addressed soon
- `low` - Nice to have, future consideration

### Type Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to docs
- `question` - Further information is requested
- `task` - Development tasks, chores
- `security` - Security-related issues

### Component Labels
- `frontend` - React/UI related
- `backend` - Express/API related
- `database` - Database related
- `auth` - Authentication/authorization
- `cloud` - Cloud provider integrations
- `ai-agents` - AI agent functionality
- `testing` - Test-related issues
- `ci-cd` - Continuous integration/deployment

### Status Labels
- `needs-triage` - New issue, needs evaluation
- `needs-discussion` - Requires team discussion
- `ready-for-dev` - Ready to be worked on
- `in-progress` - Currently being worked on
- `blocked` - Cannot proceed, waiting for something
- `needs-review` - Implementation ready for review

### Size Labels
- `size/small` - Can be completed in a few hours
- `size/medium` - Requires 1-2 days of work
- `size/large` - Requires 3-5 days of work
- `size/epic` - Large feature requiring multiple PRs

## Issue Management Process

### 1. Issue Creation
- Use appropriate template
- Fill out all required sections
- Add relevant labels
- Assign to project if applicable

### 2. Triage Process
**Daily triage** for new issues:
1. **Validate**: Is this a real issue?
2. **Categorize**: Add type and component labels
3. **Prioritize**: Add priority label
4. **Size**: Estimate effort required
5. **Assign**: Add to appropriate milestone/project

### 3. Assignment Process
- Issues are assigned during sprint planning
- Self-assignment is encouraged for small tasks
- Complex issues should be discussed before assignment

### 4. Progress Tracking
- Update labels as status changes
- Add comments for significant updates
- Link related PRs and issues
- Close when completed with explanation

## Best Practices

### For Issue Creators

#### Before Creating an Issue
1. **Search existing issues** to avoid duplicates
2. **Check documentation** - issue might be addressed there
3. **Try latest version** - issue might already be fixed
4. **Gather information** - logs, screenshots, environment details

#### Writing Effective Issues
1. **Be specific** - vague issues are hard to address
2. **Provide context** - explain why this matters
3. **Include examples** - show expected vs actual behavior
4. **Use clear titles** - make them searchable
5. **Follow templates** - they ensure nothing is missed

### For Issue Triagers

#### Triage Guidelines
1. **Respond quickly** - acknowledge within 24 hours
2. **Ask clarifying questions** if information is missing
3. **Label appropriately** - helps with organization
4. **Close duplicates** and link to original
5. **Escalate security issues** to security team

#### Common Triage Actions
```markdown
<!-- Duplicate issue -->
Duplicate of #123. Closing this in favor of the original issue.

<!-- Needs more info -->
Thanks for the report! Could you provide more details about:
- Your environment (OS, browser, versions)
- Steps to reproduce
- Expected vs actual behavior

<!-- Invalid issue -->
This appears to be a usage question rather than a bug. Please use our discussion forum for usage questions.

<!-- Good to go -->
Confirmed bug. Added to backlog with priority label.
```

## Automated Issue Management

### GitHub Actions for Issues

```yaml
# .github/workflows/issue-management.yml
name: Issue Management

on:
  issues:
    types: [opened, labeled]

jobs:
  auto-assign:
    runs-on: ubuntu-latest
    steps:
      - name: Auto-assign security issues
        if: contains(github.event.issue.labels.*.name, 'security')
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.addAssignees({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              assignees: ['security-team-lead']
            });

      - name: Add to triage project
        if: contains(github.event.issue.labels.*.name, 'needs-triage')
        uses: actions/add-to-project@v0.3.0
        with:
          project-url: https://github.com/users/owner/projects/1
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
```

### Issue Templates Configuration

```yaml
# .github/ISSUE_TEMPLATE/config.yml
blank_issues_enabled: false
contact_links:
  - name: Discussion Forum
    url: https://github.com/org/repo/discussions
    about: Please ask and answer questions here
  - name: Security Issues
    url: https://github.com/org/repo/security/advisories/new
    about: Please report security vulnerabilities here
```

## Metrics and Analytics

### Track These Metrics
- Time to first response
- Time to resolution
- Issue volume by type
- Most common bug categories
- Feature request implementation rate

### Monthly Review Questions
1. What types of issues are most common?
2. Are our templates helping or hindering?
3. How can we prevent recurring issues?
4. What documentation gaps do issues reveal?
5. Are we responding quickly enough?

## Related Documents

- [Contributing Guide](./contributing.md)
- [PR Guidelines](./PR-guidelines.md)
- [Bug Triage Process](./bug-triage.md)
- [Security Policy](./security-policy.md) 