# Prompt Engineering

## Overview

Effective prompt engineering is crucial for maximizing the performance of AI agents within the MWAP platform. This guide covers best practices, patterns, and techniques for creating prompts that generate accurate, reliable, and contextually appropriate responses.

## Core Principles

### 1. Clarity and Specificity
- Use clear, unambiguous language
- Provide specific requirements and constraints
- Define expected output format explicitly
- Include relevant context and background information

### 2. Context Awareness
- Include tenant-specific information when relevant
- Provide project structure and architecture context
- Reference existing code patterns and conventions
- Consider user roles and permissions

### 3. Iterative Refinement
- Start with basic prompts and refine based on results
- A/B test different prompt variations
- Collect feedback and analyze performance metrics
- Maintain a prompt version history

## Prompt Structure

### Basic Template
```typescript
interface PromptTemplate {
  role: string;           // System role definition
  context: string;        // Background information
  task: string;          // Specific task description
  constraints: string[];  // Limitations and requirements
  examples?: string[];    // Input/output examples
  format: string;        // Expected output format
}
```

### Example Implementation
```typescript
const codeGenerationPrompt: PromptTemplate = {
  role: "You are an expert TypeScript developer specializing in Express.js applications with multi-tenant architecture.",
  
  context: `The MWAP platform is a multi-tenant project management system with:
  - Tenant-aware data isolation
  - Role-based access control (RBAC)
  - Cloud provider integrations (AWS, Azure, GCP)
  - RESTful API architecture`,
  
  task: "Generate a new API endpoint for project file management",
  
  constraints: [
    "Must include tenant validation",
    "Implement proper RBAC checks",
    "Follow existing code patterns",
    "Include comprehensive error handling",
    "Add TypeScript type definitions"
  ],
  
  examples: [
    "Input: Create endpoint to upload project files",
    "Output: Complete controller, route, and service implementation"
  ],
  
  format: "Return TypeScript code with inline comments explaining tenant-aware logic"
};
```

## Domain-Specific Prompts

### Tenant-Aware Code Generation

#### Template
```typescript
const tenantAwarePrompt = `
Role: Expert in multi-tenant SaaS architecture and TypeScript development.

Context: 
- Platform: MWAP multi-tenant project management
- Database: PostgreSQL with tenant isolation
- Authentication: Auth0 JWT with tenant claims
- Architecture: Express.js with service layer pattern

Task: Generate [SPECIFIC_FEATURE] with complete tenant isolation.

Requirements:
1. Extract tenant ID from JWT token
2. Validate tenant access permissions
3. Scope all database queries to tenant
4. Implement proper error handling for tenant violations
5. Include audit logging for tenant operations

Code Style:
- Use async/await patterns
- Implement proper TypeScript typing
- Follow existing service/controller structure
- Include comprehensive JSDoc comments

Output Format:
- Controller with route handlers
- Service layer with business logic
- Type definitions for request/response
- Error handling middleware integration

Example tenant extraction:
\`\`\`typescript
const tenantId = req.user.tenantId;
await this.validateTenantAccess(tenantId, req.user.id);
\`\`\`
`;
```

#### Usage Example
```typescript
const tenantFeaturePrompt = tenantAwarePrompt
  .replace('[SPECIFIC_FEATURE]', 'project file sharing between team members');

const result = await aiService.generateCode(tenantFeaturePrompt);
```

### Cloud Integration Prompts

#### AWS Integration Template
```typescript
const awsIntegrationPrompt = `
Role: AWS solutions architect and TypeScript developer.

Context: MWAP platform integrating with AWS services for file storage and processing.

Task: Create AWS [SERVICE_NAME] integration with tenant isolation.

AWS Services Context:
- S3: Tenant-isolated buckets with prefix patterns
- IAM: Role-based access with tenant boundaries
- CloudWatch: Tenant-specific logging and metrics
- Lambda: Event-driven processing functions

Security Requirements:
1. Use IAM roles with least privilege
2. Implement S3 bucket policies for tenant isolation
3. Enable CloudTrail logging for audit trails
4. Use KMS for encryption with tenant-specific keys

Integration Patterns:
- Use AWS SDK v3 with proper error handling
- Implement retry logic with exponential backoff
- Include CloudWatch metrics for monitoring
- Handle rate limiting and throttling

Code Structure:
\`\`\`typescript
class AWSService {
  private s3Client: S3Client;
  private tenantPrefix: string;
  
  async operation(tenantId: string, params: any): Promise<Result> {
    // Implementation with tenant isolation
  }
}
\`\`\`
`;
```

### RBAC Implementation Prompts

#### Role-Based Access Control Template
```typescript
const rbacPrompt = `
Role: Security expert specializing in role-based access control systems.

Context: MWAP platform with hierarchical role system:
- Super Admin: Platform-wide access
- Tenant Admin: Tenant-level management
- Project Manager: Project-level control
- Team Member: Limited project access
- Viewer: Read-only access

Task: Implement RBAC for [RESOURCE_TYPE] operations.

Permission Model:
- Permissions: create, read, update, delete, manage
- Resources: projects, files, users, integrations
- Scopes: global, tenant, project, personal

Implementation Requirements:
1. Create permission checking middleware
2. Implement role hierarchy validation
3. Add resource-level permission checks
4. Include audit logging for access attempts
5. Handle permission inheritance

Code Pattern:
\`\`\`typescript
@CheckPermission('projects:update')
@TenantScope()
async updateProject(
  @Param('id') projectId: string,
  @Body() updateData: ProjectUpdateDto,
  @CurrentUser() user: User
): Promise<ApiResponse<Project>> {
  // Implementation
}
\`\`\`
`;
```

## Advanced Prompting Techniques

### Chain-of-Thought Prompting

#### Example for Complex Features
```typescript
const chainOfThoughtPrompt = `
Role: Senior architect breaking down complex feature implementation.

Task: Plan and implement multi-cloud file synchronization.

Think through this step by step:

1. **Analysis Phase**:
   - What are the core requirements?
   - Which cloud providers need support?
   - How to handle conflicts and versioning?

2. **Architecture Design**:
   - What components are needed?
   - How to ensure data consistency?
   - What are the failure scenarios?

3. **Implementation Strategy**:
   - Which patterns to use for each component?
   - How to handle async operations?
   - What testing approach to take?

4. **Code Generation**:
   - Start with interfaces and types
   - Implement core service logic
   - Add error handling and logging
   - Create integration tests

For each step, explain your reasoning and show the code implementation.
`;
```

### Few-Shot Learning

#### Code Pattern Examples
```typescript
const fewShotPrompt = `
Role: TypeScript developer following MWAP platform patterns.

Here are examples of our coding patterns:

Example 1 - Controller Pattern:
\`\`\`typescript
@Controller('/api/v1/projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get('/:id')
  @Auth()
  @CheckPermission('projects:read')
  async getProject(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<ApiResponse<Project>> {
    try {
      const project = await this.projectService.findById(id, user.tenantId);
      return { success: true, data: project };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
\`\`\`

Example 2 - Service Pattern:
\`\`\`typescript
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    private logger: Logger
  ) {}

  async findById(id: string, tenantId: string): Promise<Project> {
    this.logger.debug(\`Finding project \${id} for tenant \${tenantId}\`);
    
    const project = await this.projectRepo.findOne({
      where: { id, tenantId },
      relations: ['files', 'members']
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }
}
\`\`\`

Now implement a similar pattern for [NEW_FEATURE] following these examples.
`;
```

### Constraint-Based Prompting

#### Security-Focused Constraints
```typescript
const securityConstrainedPrompt = `
Role: Security-conscious TypeScript developer.

SECURITY CONSTRAINTS (MANDATORY):
1. ✅ NEVER expose sensitive data in logs
2. ✅ ALWAYS validate input parameters
3. ✅ MUST include rate limiting for public endpoints
4. ✅ REQUIRE authentication for all operations
5. ✅ IMPLEMENT proper SQL injection prevention
6. ✅ USE HTTPS-only for all communications
7. ✅ SANITIZE all user inputs
8. ✅ IMPLEMENT CSRF protection

Task: Create secure user authentication endpoint.

Security Checklist:
- [ ] Input validation with Joi/Zod
- [ ] Password hashing with bcrypt
- [ ] JWT token generation with expiry
- [ ] Rate limiting implementation
- [ ] Audit logging for security events
- [ ] Error messages don't leak information

Code must pass security review. Explain security measures taken.
`;
```

## Prompt Optimization

### Performance Considerations

#### Token Efficiency
```typescript
const optimizedPrompt = `
🎯 TASK: Generate Express.js route for file upload

📋 CONTEXT:
- Platform: MWAP (multi-tenant)
- Tech: TypeScript, Express, PostgreSQL
- Auth: JWT with tenant claims

⚡ REQUIREMENTS:
1. Tenant isolation ✅
2. RBAC validation ✅  
3. File type validation ✅
4. Error handling ✅

📦 OUTPUT: Controller + Service + Types

🔧 PATTERN:
\`\`\`typescript
// Use existing patterns from codebase
@Post('/upload') @Auth() @CheckPermission()
\`\`\`
`;
```

#### Context Reduction
```typescript
// Instead of full context, use focused context
const focusedPrompt = `
Context: Multi-tenant Express.js API
Task: Add file deletion endpoint
Constraints: Tenant isolation, RBAC, audit logging
Pattern: Follow existing FileController structure
`;
```

### A/B Testing Framework

#### Prompt Variants
```typescript
interface PromptVariant {
  id: string;
  description: string;
  prompt: string;
  performance: {
    accuracy: number;
    relevance: number;
    completeness: number;
  };
}

const promptVariants: PromptVariant[] = [
  {
    id: 'detailed-context',
    description: 'Comprehensive context with examples',
    prompt: detailedContextPrompt,
    performance: { accuracy: 0.85, relevance: 0.90, completeness: 0.88 }
  },
  {
    id: 'concise-focused',
    description: 'Minimal context with clear constraints',
    prompt: conciseFocusedPrompt,
    performance: { accuracy: 0.82, relevance: 0.95, completeness: 0.75 }
  }
];
```

#### Testing Implementation
```typescript
class PromptTester {
  async runVariantTest(task: string, variants: PromptVariant[]): Promise<TestResult> {
    const results = await Promise.all(
      variants.map(variant => this.testVariant(task, variant))
    );
    
    return this.analyzeResults(results);
  }

  private async testVariant(task: string, variant: PromptVariant): Promise<VariantResult> {
    const response = await this.aiService.generate(variant.prompt + task);
    
    return {
      variantId: variant.id,
      response,
      metrics: await this.evaluateResponse(response)
    };
  }
}
```

## Domain Knowledge Integration

### MWAP Platform Context

#### System Architecture Context
```typescript
const architectureContext = `
MWAP Platform Architecture:
┌─ API Layer (Express.js + TypeScript)
├─ Service Layer (Business Logic)
├─ Data Layer (PostgreSQL + TypeORM)
├─ Auth Layer (Auth0 + JWT)
├─ Cloud Layer (AWS/Azure/GCP)
└─ AI Layer (OpenHands + Custom Agents)

Key Patterns:
- Controllers handle HTTP concerns
- Services contain business logic
- Repositories manage data access
- Middleware handles cross-cutting concerns
- DTOs for data transfer
- Schemas for validation
`;
```

#### Tenant Model Context
```typescript
const tenantModelContext = `
Tenant Isolation Strategy:
1. Database: Row-level security with tenant_id
2. API: JWT contains tenant claims
3. Storage: Tenant-prefixed paths
4. Caching: Tenant-scoped keys
5. Logging: Tenant-tagged events

Tenant Hierarchy:
Organization → Tenants → Projects → Files
- Organizations can have multiple tenants
- Each tenant has isolated data
- Projects belong to single tenant
- Files inherit tenant from project
`;
```

### Code Quality Standards

#### Quality-Focused Prompts
```typescript
const qualityPrompt = `
Code Quality Requirements:
1. 📝 TypeScript strict mode compliance
2. 🧪 Unit test coverage > 80%
3. 📋 JSDoc comments for public APIs
4. 🔍 ESLint/Prettier formatting
5. 🚫 No console.log in production code
6. ⚡ Async/await over promises
7. 🛡️ Input validation with proper types
8. 📊 Structured logging with context

Generate code that meets all quality standards.
Include example unit tests.
`;
```

## Monitoring and Analytics

### Prompt Performance Tracking

#### Metrics Collection
```typescript
interface PromptMetrics {
  promptId: string;
  timestamp: Date;
  responseTime: number;
  tokenUsage: number;
  quality: {
    syntaxErrors: number;
    logicalErrors: number;
    completeness: number;
    relevance: number;
  };
  userFeedback?: {
    rating: number;
    comments: string;
  };
}

class PromptAnalytics {
  async trackPromptUsage(metrics: PromptMetrics): Promise<void> {
    await this.metricsStore.store(metrics);
    await this.updatePromptPerformance(metrics.promptId, metrics);
  }

  async getPromptPerformance(promptId: string): Promise<PerformanceReport> {
    const metrics = await this.metricsStore.getMetrics(promptId);
    return this.generateReport(metrics);
  }
}
```

### Continuous Improvement

#### Feedback Loop
```typescript
class PromptImprovement {
  async collectFeedback(promptId: string, response: string, feedback: UserFeedback): Promise<void> {
    await this.feedbackStore.store({
      promptId,
      response,
      feedback,
      timestamp: new Date()
    });

    // Trigger analysis if enough feedback collected
    const feedbackCount = await this.getFeedbackCount(promptId);
    if (feedbackCount % 10 === 0) {
      await this.analyzeAndImprove(promptId);
    }
  }

  private async analyzeAndImprove(promptId: string): Promise<void> {
    const feedback = await this.getFeedback(promptId);
    const analysis = await this.analyzeFeedback(feedback);
    
    if (analysis.needsImprovement) {
      const improvedPrompt = await this.generateImprovedPrompt(promptId, analysis);
      await this.schedulePromptTest(improvedPrompt);
    }
  }
}
```

## Best Practices Summary

### Do's ✅
1. **Be Specific**: Clearly define requirements and constraints
2. **Provide Context**: Include relevant system architecture and patterns
3. **Use Examples**: Show expected input/output patterns
4. **Test Iteratively**: Refine prompts based on results
5. **Track Performance**: Monitor success rates and quality metrics
6. **Version Control**: Maintain prompt history and changes
7. **Security First**: Always include security considerations
8. **Quality Standards**: Enforce coding standards and best practices

### Don'ts ❌
1. **Vague Instructions**: Avoid ambiguous or unclear requirements
2. **Overwhelming Context**: Don't include irrelevant information
3. **Single Shot**: Don't expect perfect results without iteration
4. **Ignore Feedback**: Don't skip user feedback collection
5. **Static Prompts**: Don't use unchanging prompts without optimization
6. **Skip Validation**: Don't deploy without testing generated code
7. **Ignore Security**: Don't overlook security implications
8. **Manual Only**: Don't rely solely on manual prompt creation

## Tools and Utilities

### Prompt Template Engine
```typescript
class PromptTemplateEngine {
  private templates: Map<string, PromptTemplate> = new Map();

  register(name: string, template: PromptTemplate): void {
    this.templates.set(name, template);
  }

  render(templateName: string, variables: Record<string, any>): string {
    const template = this.templates.get(templateName);
    if (!template) throw new Error(`Template ${templateName} not found`);

    return this.interpolate(template, variables);
  }

  private interpolate(template: PromptTemplate, variables: Record<string, any>): string {
    let prompt = `Role: ${template.role}\n\n`;
    prompt += `Context: ${template.context}\n\n`;
    prompt += `Task: ${this.replaceVariables(template.task, variables)}\n\n`;
    
    if (template.constraints.length > 0) {
      prompt += `Constraints:\n`;
      template.constraints.forEach(constraint => {
        prompt += `- ${this.replaceVariables(constraint, variables)}\n`;
      });
      prompt += '\n';
    }

    prompt += `Output Format: ${template.format}`;
    
    return prompt;
  }

  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\[(\w+)\]/g, (match, key) => variables[key] || match);
  }
}
```

### Prompt Validation
```typescript
class PromptValidator {
  validate(prompt: string): ValidationResult {
    const issues: string[] = [];

    // Check prompt length
    if (prompt.length > 8000) {
      issues.push('Prompt exceeds recommended length');
    }

    // Check for security keywords
    if (!this.containsSecurityConsiderations(prompt)) {
      issues.push('Missing security considerations');
    }

    // Check for context clarity
    if (!this.hassClearContext(prompt)) {
      issues.push('Context is unclear or missing');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions: this.generateSuggestions(issues)
    };
  }
}
```

## Future Enhancements

### Planned Features
- AI-powered prompt optimization
- Automated A/B testing framework
- Context-aware prompt selection
- Real-time prompt performance monitoring
- Collaborative prompt development tools

### Research Areas
- Multi-modal prompting (text + code + diagrams)
- Adaptive prompting based on user expertise
- Cross-domain prompt knowledge transfer
- Automated prompt debugging and improvement
- Integration with code analysis tools 