# 🛠️ MWAP Development Guide

## 🎯 Overview

This comprehensive development guide establishes the standards, practices, and workflows for building secure, scalable, and maintainable features in the MWAP platform. It serves as the definitive reference for all development activities.

## 🏗️ Development Philosophy

### **Core Principles**
1. **🔒 Security-First**: Every feature must implement proper authentication and authorization
2. **🧪 Type Safety**: Strict TypeScript with runtime validation using Zod
3. **📊 Consistency**: Standardized patterns across all features and components
4. **⚡ Performance**: Optimized code with proper indexing and caching strategies
5. **🧹 Maintainability**: Clean, readable code with comprehensive documentation
6. **🔄 Testability**: All code must be unit and integration testable

### **MWAP Standards Hierarchy**
```typescript
// 1. Security Standards (Non-negotiable)
- Auth0 JWT RS256 validation
- RBAC with tenant isolation
- Input validation with Zod
- No secrets in code

// 2. Code Quality Standards
- TypeScript strict mode
- ESM modules only
- Comprehensive error handling
- Proper logging

// 3. Architecture Standards
- Feature-based organization
- Domain-driven design
- Service layer pattern
- Repository pattern for data access
```

## 🔧 Development Environment Setup

### **Required Tools**
```bash
# Core development tools
Node.js 18+                    # Runtime environment
npm 9+                         # Package manager
TypeScript 5+                  # Type system
ESLint 8+                      # Code linting
Prettier 3+                    # Code formatting
Vitest 1+                      # Testing framework

# Development utilities
nodemon                        # Development server
concurrently                   # Run multiple commands
cross-env                      # Environment variables
tsx                           # TypeScript execution
```

### **IDE Configuration**
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.env": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

### **Git Configuration**
```bash
# Configure Git for MWAP development
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Set up Git hooks
npm run prepare

# Configure commit template
git config commit.template .gitmessage
```

## 📝 Code Style Standards

### **TypeScript Configuration**
```json
// tsconfig.json - Strict configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

### **ESLint Configuration**
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

### **Prettier Configuration**
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

## 🏛️ Architecture Patterns

### **Feature-Based Organization**
```typescript
// Feature structure pattern
src/features/projects/
├── project.model.ts           // MongoDB model
├── project.types.ts           // TypeScript interfaces
├── project.validation.ts      // Zod schemas
├── project.service.ts         // Business logic
├── project.controller.ts      // HTTP handlers
├── project.routes.ts          // Express routes
└── __tests__/                 // Feature tests
    ├── project.service.test.ts
    ├── project.controller.test.ts
    └── project.integration.test.ts
```

### **Service Layer Pattern**
```typescript
// Service class template
export class ProjectService {
  /**
   * Create a new project with validation and authorization
   */
  async createProject(
    tenantId: string,
    userId: string,
    data: CreateProjectRequest
  ): Promise<IProject> {
    // 1. Validate input data
    const validatedData = createProjectSchema.parse(data);
    
    // 2. Check authorization
    await this.checkCreatePermission(tenantId, userId);
    
    // 3. Business logic validation
    await this.validateProjectName(tenantId, validatedData.name);
    
    // 4. Create entity
    const project = new Project({
      ...validatedData,
      tenantId,
      createdBy: userId
    });
    
    // 5. Save and return
    await project.save();
    return project;
  }

  private async checkCreatePermission(tenantId: string, userId: string): Promise<void> {
    // Authorization logic
  }

  private async validateProjectName(tenantId: string, name: string): Promise<void> {
    // Business validation logic
  }
}
```

### **Controller Pattern**
```typescript
// Controller class template
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Extract and validate request data
      const validatedData = validateRequest(createProjectSchema, req.body);
      const { tenantId, userId } = req.user!;

      // 2. Call service layer
      const project = await this.projectService.createProject(
        tenantId,
        userId,
        validatedData
      );

      // 3. Return standardized response
      res.status(201).json(
        new SuccessResponse(project, 'Project created successfully')
      );
    } catch (error) {
      next(error); // Let global error handler manage
    }
  };
}
```

### **Validation Pattern**
```typescript
// Zod schema pattern
import { z } from 'zod';

// Base schema
export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  projectTypeId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid project type ID'),
  status: z.enum(['active', 'archived', 'draft']).default('active')
});

// Request schemas
export const createProjectSchema = projectSchema.omit({ status: true });
export const updateProjectSchema = projectSchema.partial();

// Response types
export type Project = z.infer<typeof projectSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectSchema>;
```

## 🔒 Security Implementation Standards

### **Authentication Middleware**
```typescript
// Standard JWT authentication
export const authenticateJWT = () => {
  return jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  });
};

// Usage in routes
router.use(authenticateJWT());
```

### **Authorization Patterns**
```typescript
// RBAC middleware patterns
export const requireSuperAdmin = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.isSuperAdmin) {
      throw new AppError('Super admin access required', 403);
    }
    next();
  };
};

export const requireTenantOwner = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.isTenantOwner) {
      throw new AppError('Tenant owner access required', 403);
    }
    next();
  };
};

export const requireProjectAccess = (role?: ProjectRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      const { userId } = req.user!;
      
      const hasAccess = await checkProjectAccess(projectId, userId, role);
      if (!hasAccess) {
        throw new AppError('Insufficient project permissions', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### **Input Validation Standards**
```typescript
// Validation middleware
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        error.errors
      );
    }
    throw error;
  }
};

// Usage in controllers
const validatedData = validateRequest(createProjectSchema, req.body);
```

## 🗄️ Database Standards

### **MongoDB Model Pattern**
```typescript
// Mongoose model with proper typing
import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  tenantId: mongoose.Types.ObjectId;
  status: 'active' | 'archived' | 'draft';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'draft'],
    default: 'active',
    index: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
ProjectSchema.index({ tenantId: 1, status: 1 });
ProjectSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Text search index
ProjectSchema.index({ name: 'text', description: 'text' });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
```

### **Query Optimization Standards**
```typescript
// Optimized query patterns
export class ProjectService {
  // Use lean() for read-only operations
  async getProjects(tenantId: string, filters: ProjectFilters) {
    return Project.find({ tenantId, ...filters })
      .populate('projectType', 'name description')
      .sort({ updatedAt: -1 })
      .lean(); // Returns plain objects, not Mongoose documents
  }

  // Use select() to limit fields
  async getProjectSummary(tenantId: string) {
    return Project.find({ tenantId, status: 'active' })
      .select('name status updatedAt')
      .lean();
  }

  // Use aggregation for complex queries
  async getProjectStats(tenantId: string) {
    return Project.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          lastUpdated: { $max: '$updatedAt' }
        }
      }
    ]);
  }
}
```

## 🧪 Testing Standards

### **Unit Testing Pattern**
```typescript
// Service unit test template
describe('ProjectService', () => {
  let projectService: ProjectService;
  
  beforeEach(() => {
    projectService = new ProjectService();
    vi.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project with valid data', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const userId = 'user-456';
      const projectData = {
        name: 'Test Project',
        description: 'Test description'
      };

      // Mock dependencies
      vi.mocked(Project.findOne).mockResolvedValue(null);
      vi.mocked(Project.prototype.save).mockResolvedValue(mockProject);

      // Act
      const result = await projectService.createProject(
        tenantId,
        userId,
        projectData
      );

      // Assert
      expect(result.name).toBe(projectData.name);
      expect(result.tenantId).toBe(tenantId);
      expect(result.createdBy).toBe(userId);
    });

    it('should throw error for duplicate name', async () => {
      // Arrange
      vi.mocked(Project.findOne).mockResolvedValue(mockExistingProject);

      // Act & Assert
      await expect(
        projectService.createProject(tenantId, userId, projectData)
      ).rejects.toThrow(AppError);
    });
  });
});
```

### **Integration Testing Pattern**
```typescript
// API integration test template
describe('Projects API', () => {
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    await connectTestDB();
    authToken = generateTestJWT();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestData();
    tenantId = await createTestTenant();
  });

  describe('POST /api/v1/projects', () => {
    it('should create project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test description'
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(projectData.name);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = { name: '' }; // Empty name

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

## 🚀 Performance Standards

### **Response Time Targets**
```typescript
// Performance benchmarks
const PERFORMANCE_TARGETS = {
  apiResponse: {
    simple: 100,      // Simple GET requests < 100ms
    complex: 500,     // Complex queries < 500ms
    creation: 200,    // POST/PUT requests < 200ms
    deletion: 150     // DELETE requests < 150ms
  },
  database: {
    simpleQuery: 50,  // Simple queries < 50ms
    complexQuery: 200, // Complex queries < 200ms
    aggregation: 300  // Aggregation queries < 300ms
  }
};
```

### **Caching Strategy**
```typescript
// Redis caching pattern
export class CacheService {
  private redis = new Redis(process.env.REDIS_URL);

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage in service
export class ProjectService {
  constructor(private cache: CacheService) {}

  async getProject(id: string): Promise<IProject> {
    const cacheKey = `project:${id}`;
    
    // Try cache first
    let project = await this.cache.get<IProject>(cacheKey);
    
    if (!project) {
      // Fetch from database
      project = await Project.findById(id).lean();
      
      if (project) {
        // Cache for 1 hour
        await this.cache.set(cacheKey, project, 3600);
      }
    }
    
    return project;
  }
}
```

## 📊 Monitoring & Logging

### **Logging Standards**
```typescript
// Structured logging with Winston
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mwap-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage in services
export class ProjectService {
  async createProject(data: CreateProjectRequest): Promise<IProject> {
    logger.info('Creating project', { 
      tenantId: data.tenantId, 
      projectName: data.name 
    });

    try {
      const project = await this.performCreate(data);
      
      logger.info('Project created successfully', { 
        projectId: project.id,
        tenantId: data.tenantId 
      });
      
      return project;
    } catch (error) {
      logger.error('Failed to create project', { 
        error: error.message,
        tenantId: data.tenantId,
        projectName: data.name 
      });
      throw error;
    }
  }
}
```

### **Error Handling Standards**
```typescript
// Centralized error handling
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.userId
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message
    }
  });
};
```

## 📚 Documentation Standards

### **Code Documentation**
```typescript
/**
 * Creates a new project with proper validation and authorization
 * 
 * @param tenantId - The tenant ID that will own the project
 * @param userId - The user ID creating the project
 * @param data - Project creation data
 * @returns Promise<IProject> - The created project
 * 
 * @throws {AppError} VALIDATION_ERROR - When input data is invalid
 * @throws {AppError} DUPLICATE_NAME - When project name already exists
 * @throws {AppError} INSUFFICIENT_PERMISSIONS - When user lacks permissions
 * 
 * @example
 * ```typescript
 * const project = await projectService.createProject(
 *   'tenant-123',
 *   'user-456',
 *   { name: 'My Project', description: 'Project description' }
 * );
 * ```
 */
export async function createProject(
  tenantId: string,
  userId: string,
  data: CreateProjectRequest
): Promise<IProject> {
  // Implementation
}
```

### **API Documentation**
```typescript
// OpenAPI documentation
/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
```

## 🔄 Development Workflow

### **Feature Development Process**
1. **Planning**: Create detailed implementation plan
2. **Design**: Design data models and API endpoints
3. **Implementation**: Follow TDD approach with tests first
4. **Review**: Code review with security and performance checks
5. **Testing**: Comprehensive testing including edge cases
6. **Documentation**: Update API docs and code comments
7. **Deployment**: Deploy to staging for integration testing

### **Code Review Checklist**
```markdown
## Security Review
- [ ] Authentication middleware applied
- [ ] Authorization checks implemented
- [ ] Input validation with Zod schemas
- [ ] No secrets in code
- [ ] Error handling doesn't expose internals

## Code Quality Review
- [ ] TypeScript strict mode compliance
- [ ] ESM imports/exports used
- [ ] Proper error handling
- [ ] Comprehensive logging
- [ ] Performance considerations

## Testing Review
- [ ] Unit tests cover business logic
- [ ] Integration tests cover API endpoints
- [ ] Edge cases tested
- [ ] Error scenarios tested
- [ ] Test coverage > 80%

## Documentation Review
- [ ] Code comments for complex logic
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] Migration guide if breaking changes
```

## 📚 Related Documentation

- [🔒 Coding Standards](./coding-standards.md) - Detailed coding conventions
- [📝 Naming Conventions](./naming.md) - Naming standards and examples
- [🔧 Environment Format](./env-format.md) - Environment variable guidelines
- [📋 Commit Style](./commit-style.md) - Git commit conventions

---

*This development guide ensures consistent, secure, and maintainable code across the entire MWAP platform. Follow these standards to contribute effectively to the project.*