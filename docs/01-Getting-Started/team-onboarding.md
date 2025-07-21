# Team Onboarding

This guide helps new team members get up to speed with the MWAP project, documentation structure, and development practices.

## Welcome to MWAP! 👋

### What You'll Learn
- Project structure and architecture
- Development workflow and tools
- Documentation organization
- Team collaboration practices
- Code quality standards

## Documentation Overview

### Quick Navigation
```
docs/
├── 00-Overview/           # Project vision and tech stack
├── 01-Getting-Started/    # Setup and onboarding (you are here)
├── 02-Architecture/       # System design and architecture
├── 03-Frontend/           # Frontend development guides
├── 04-Backend/            # Backend API and services
├── 05-AI-Agents/          # AI agent development
├── 06-Guides/             # How-to guides and tutorials
├── 07-Standards/          # Coding standards and conventions
├── 08-Contribution/       # Git workflow and contribution
└── 09-Reports-and-History/ # Project history and reports
```

### Essential Reading (Priority Order)
1. **[Getting Started](./getting-started.md)** - Complete development setup
2. **[System Design](../02-Architecture/architecture.md)** - Understand the architecture
3. **[API Documentation](../04-Backend/api-reference.md)** - Learn the API endpoints
4. **[Contributing Guide](../08-Contribution/contributing-guide.md)** - Git workflow
5. **[Coding Standards](../07-Standards/development-standards.md)** - Code style guidelines

## Development Environment Setup

### 1. Complete Basic Setup
Follow the [Getting Started Guide](./getting-started.md) to set up your development environment.

### 2. IDE Configuration

#### VS Code Extensions (Required)
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "humao.rest-client"
  ]
}
```

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.strictMode": true
}
```

### 3. Git Configuration
```bash
# Set up your Git identity
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Configure line endings
git config --global core.autocrlf input  # macOS/Linux
git config --global core.autocrlf true   # Windows
```

## Project Architecture Overview

### Technology Stack
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: Auth0 + JWT
- **Testing**: Jest + Supertest
- **API**: RESTful with OpenAPI docs
- **AI**: Custom agents + OpenHands integration

### Key Concepts

#### Multi-Tenancy
```typescript
// Every API request includes tenant context
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tenantId: string;  // ← Tenant isolation
    roles: string[];
  };
}
```

#### Role-Based Access Control (RBAC)
- **SuperAdmin**: Platform-wide access
- **TenantAdmin**: Tenant management
- **ProjectManager**: Project-level control
- **TeamMember**: Limited project access
- **Viewer**: Read-only access

#### AI Agent Framework
- **Microagents**: Small, focused AI tasks
- **Agent Patterns**: Reusable AI workflows
- **OpenHands Integration**: Advanced AI development

## Development Workflow

### 1. Daily Workflow
```bash
# 1. Start your day
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start development
npm run dev  # Start server
npm run test:watch  # Run tests in watch mode

# 4. Make changes and commit
git add .
git commit -m "feat(scope): description"

# 5. Push and create PR
git push origin feature/your-feature-name
# Create PR via GitHub/GitLab
```

### 2. Code Quality Checks
```bash
# Before committing, always run:
npm run lint        # Check code style
npm run type-check  # TypeScript validation
npm test           # Full test suite
npm run build      # Ensure builds successfully
```

### 3. Testing Strategy
- **Unit Tests**: Individual functions and classes
- **Integration Tests**: API endpoints and services
- **E2E Tests**: Critical user workflows
- **Performance Tests**: Load and stress testing

## Code Standards

### TypeScript Best Practices
```typescript
// ✅ Good: Strong typing
interface CreateProjectRequest {
  name: string;
  description?: string;
  tenantId: string;
}

// ❌ Bad: Weak typing
function createProject(data: any) { ... }

// ✅ Good: Proper error handling
async function getProject(id: string): Promise<Result<Project, ProjectError>> {
  try {
    const project = await projectService.findById(id);
    return Result.ok(project);
  } catch (error) {
    return Result.err(new ProjectError(error.message));
  }
}
```

### API Design Patterns
```typescript
// ✅ Standard response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}
```

### Database Patterns
```typescript
// ✅ Good: Tenant-aware queries
async function getProjects(tenantId: string): Promise<Project[]> {
  return await Project.find({ tenantId }).exec();
}

// ❌ Bad: No tenant isolation
async function getProjects(): Promise<Project[]> {
  return await Project.find().exec(); // Leaks across tenants!
}
```

## Collaboration Guidelines

### Communication Channels
- **Daily Standups**: 9:00 AM team sync
- **Slack**: `#mwap-dev` for development discussions
- **Code Reviews**: All PRs require 1+ approvals
- **Documentation**: Update docs with code changes

### Pull Request Process
1. **Create PR** with descriptive title and description
2. **Link Issues** using `Closes #123` in description
3. **Request Review** from appropriate team members
4. **Address Feedback** promptly and thoroughly
5. **Merge** only after approval and CI passes

### Issue Management
- **Bug Reports**: Use bug template with reproduction steps
- **Feature Requests**: Include user stories and acceptance criteria
- **Tasks**: Break down into small, manageable chunks

## Security Awareness

### Key Security Practices
- **Never commit secrets** to version control
- **Validate all inputs** using Zod schemas
- **Implement proper RBAC** for all endpoints
- **Use HTTPS** for all external communications
- **Regular dependency updates** to patch vulnerabilities

### Environment Variables
```bash
# ✅ Good: Use environment variables
AUTH0_CLIENT_SECRET=your_secret_here

# ❌ Bad: Hardcoded secrets in code
const clientSecret = "abc123_secret"; // Never do this!
```

## Common Pitfalls & Solutions

### 1. Tenant Isolation Issues
```typescript
// ❌ Problem: Forgetting tenant filter
const projects = await Project.find({ userId });

// ✅ Solution: Always include tenant
const projects = await Project.find({ userId, tenantId });
```

### 2. Missing Error Handling
```typescript
// ❌ Problem: Unhandled promises
async function updateProject(id: string, data: any) {
  const project = await Project.findById(id); // Can throw!
  return project.update(data);
}

// ✅ Solution: Proper error handling
async function updateProject(id: string, data: ProjectUpdate): Promise<Result<Project, Error>> {
  try {
    const project = await Project.findById(id);
    if (!project) {
      return Result.err(new NotFoundError('Project not found'));
    }
    const updated = await project.update(data);
    return Result.ok(updated);
  } catch (error) {
    return Result.err(error);
  }
}
```

### 3. Performance Issues
```typescript
// ❌ Problem: N+1 queries
for (const project of projects) {
  project.files = await File.find({ projectId: project.id });
}

// ✅ Solution: Use aggregation or includes
const projects = await Project.aggregate([
  { $lookup: { from: 'files', localField: '_id', foreignField: 'projectId', as: 'files' } }
]);
```

## Resources & Support

### Learning Resources
- **Documentation**: All docs are in `/docs` folder
- **API Examples**: See `/tests/integration` for real usage
- **Code Examples**: Check existing features for patterns
- **External**: TypeScript handbook, MongoDB docs, Auth0 guides

### Getting Help
1. **Check Documentation** first (it's comprehensive!)
2. **Search Issues** on GitHub/GitLab for similar problems
3. **Ask in Slack** `#mwap-dev` channel
4. **Pair Programming** sessions with team members
5. **Office Hours** with senior developers (Tuesdays 2-4 PM)

### Emergency Contacts
- **Technical Lead**: For architecture decisions
- **DevOps**: For deployment and infrastructure issues
- **Security**: For security concerns or incidents

## Next Steps

### Week 1: Foundation
- [ ] Complete development environment setup
- [ ] Read essential documentation
- [ ] Review existing codebase structure
- [ ] Complete first small task/bug fix

### Week 2: Integration
- [ ] Implement your first feature
- [ ] Participate in code reviews
- [ ] Join team meetings and planning sessions
- [ ] Set up monitoring and debugging tools

### Week 3: Contribution
- [ ] Take on larger features or improvements
- [ ] Mentor other new team members
- [ ] Contribute to documentation improvements
- [ ] Propose process or tooling improvements

Welcome to the team! 🚀 