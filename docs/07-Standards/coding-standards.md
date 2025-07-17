# MWAP Coding Standards

This document defines the coding standards and conventions for the MWAP platform to ensure consistency, maintainability, and quality across the codebase.

## 🎯 Core Principles

### 1. Type Safety First
- **TypeScript strict mode**: All code must compile with `strict: true`
- **No implicit any**: Explicit typing required for all variables and functions
- **Runtime validation**: Use Zod schemas for API input validation
- **Type inference**: Leverage TypeScript's type inference where possible

### 2. Modern JavaScript/TypeScript
- **Native ESM modules**: Use `import`/`export` syntax exclusively
- **Async/await**: Prefer async/await over Promise chains
- **Modern syntax**: Use ES2020+ features (optional chaining, nullish coalescing)
- **No CommonJS**: Avoid `require()` and `module.exports`

### 3. Security by Default
- **Input validation**: Validate all external inputs
- **Error handling**: Never expose internal errors to clients
- **Authentication**: Require authentication for all non-public endpoints
- **Authorization**: Implement proper role-based access control

## 📁 File Organization

### Directory Structure

```
src/
├── features/              # Feature modules (domain-driven)
│   └── {feature}/
│       ├── {feature}.routes.ts      # Express routes
│       ├── {feature}.controller.ts  # Request handlers
│       ├── {feature}.service.ts     # Business logic
│       └── {feature}.types.ts       # TypeScript types
├── middleware/            # Express middleware
├── utils/                 # Shared utilities
├── schemas/              # Zod validation schemas
├── config/               # Configuration files
└── docs/                 # API documentation
```

### File Naming Conventions

- **Files**: Use kebab-case for file names (`user-service.ts`)
- **Directories**: Use kebab-case for directory names (`cloud-providers/`)
- **Components**: Use PascalCase for class names (`UserService`)
- **Functions**: Use camelCase for function names (`getUserById`)
- **Constants**: Use UPPER_SNAKE_CASE for constants (`MAX_RETRY_ATTEMPTS`)

## 🏗️ Architecture Patterns

### Feature Module Structure

Each feature must follow this structure:

```typescript
// {feature}.routes.ts
export function get{Feature}Router(): Router {
  const router = Router();
  // Route definitions
  return router;
}

// {feature}.controller.ts
export async function create{Feature}(req: Request, res: Response) {
  // Controller logic
}

// {feature}.service.ts
export class {Feature}Service {
  // Business logic
}

// {feature}.types.ts
export interface {Feature} {
  // Type definitions
}
```

### Dependency Injection Pattern

```typescript
// Service with injected dependencies
export class TenantService {
  constructor(
    private collection: Collection<Tenant>,
    private auditLogger: AuditLogger
  ) {}
  
  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    // Implementation
  }
}

// Factory function for service creation
export function createTenantService(): TenantService {
  return new TenantService(
    db.collection<Tenant>('tenants'),
    auditLogger
  );
}
```

## 🔧 TypeScript Standards

### Type Definitions

```typescript
// ✅ Good: Explicit interface definitions
interface CreateUserRequest {
  name: string;
  email: string;
  role?: UserRole;
}

// ✅ Good: Union types for enums
type UserRole = 'ADMIN' | 'USER' | 'GUEST';

// ✅ Good: Generic types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ❌ Bad: Using any
function processData(data: any): any {
  return data;
}

// ✅ Good: Proper typing
function processData<T>(data: T): T {
  return data;
}
```

### Function Signatures

```typescript
// ✅ Good: Clear parameter and return types
async function getUserById(
  id: string,
  includeDeleted: boolean = false
): Promise<User | null> {
  // Implementation
}

// ✅ Good: Destructured parameters with types
async function createUser({
  name,
  email,
  role = 'USER'
}: CreateUserRequest): Promise<User> {
  // Implementation
}
```

### Error Handling

```typescript
// ✅ Good: Custom error classes
export class ValidationError extends Error {
  constructor(
    public field: string,
    public value: unknown,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ Good: Proper error throwing
if (!user) {
  throw new NotFoundError('user', id);
}

// ✅ Good: Error handling in async functions
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new AppError('operation/failed', 'Operation could not be completed');
}
```

## 🎨 Code Style

### ESLint Configuration

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Formatting Rules

```typescript
// ✅ Good: Consistent formatting
const config = {
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME,
  },
  auth: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h',
  },
};

// ✅ Good: Proper indentation and spacing
if (user.role === 'ADMIN') {
  await performAdminAction();
} else if (user.role === 'USER') {
  await performUserAction();
} else {
  throw new UnauthorizedError('Invalid role');
}
```

### Import Organization

```typescript
// ✅ Good: Import order
// 1. Node.js built-ins
import { readFile } from 'fs/promises';

// 2. External libraries
import express from 'express';
import { z } from 'zod';

// 3. Internal modules (absolute paths)
import { authenticateJWT } from '../middleware/auth.js';
import { UserService } from '../services/user.service.js';

// 4. Relative imports
import { validateRequest } from './utils.js';
```

## 🔐 Security Standards

### Input Validation

```typescript
// ✅ Good: Zod schema validation
const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER', 'GUEST']).optional(),
});

// ✅ Good: Controller validation
export async function createUser(req: Request, res: Response) {
  const data = CreateUserSchema.parse(req.body);
  const user = await userService.create(data);
  res.json(SuccessResponse(user));
}
```

### Authentication & Authorization

```typescript
// ✅ Good: Middleware usage
router.post('/users', 
  authenticateJWT(),
  requireRole('ADMIN'),
  wrapAsyncHandler(createUser)
);

// ✅ Good: Authorization checks
export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.auth.sub;
  
  // Check if user can update this resource
  if (id !== userId && !req.auth.roles.includes('ADMIN')) {
    throw new ForbiddenError('Cannot update other users');
  }
  
  // Proceed with update
}
```

### Data Sanitization

```typescript
// ✅ Good: Sanitize sensitive data
function sanitizeUser(user: User): PublicUser {
  const { password, internalNotes, ...publicUser } = user;
  return publicUser;
}

// ✅ Good: Log sanitization
logger.info('User created', {
  userId: user.id,
  email: user.email,
  // Don't log sensitive data
});
```

## 📊 Database Standards

### Schema Design

```typescript
// ✅ Good: Clear interface definitions
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ✅ Good: Zod schema for validation
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER', 'GUEST']),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});
```

### Query Patterns

```typescript
// ✅ Good: Service layer for database operations
export class UserService {
  private collection: Collection<User>;
  
  async findById(id: string): Promise<User | null> {
    return await this.collection.findOne({ 
      id, 
      deletedAt: { $exists: false } 
    });
  }
  
  async create(data: CreateUserRequest): Promise<User> {
    const user: User = {
      id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await this.collection.insertOne(user);
    return user;
  }
}
```

## 🧪 Testing Standards

### Test Structure

```typescript
// ✅ Good: Descriptive test organization
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      
      // Act
      const user = await userService.create(userData);
      
      // Assert
      expect(user).toMatchObject(userData);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });
    
    it('should throw validation error for invalid email', async () => {
      // Arrange
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
      };
      
      // Act & Assert
      await expect(userService.create(invalidData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

### Mock Usage

```typescript
// ✅ Good: Type-safe mocks
const mockUserCollection = {
  findOne: vi.fn(),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
} as unknown as Collection<User>;

// ✅ Good: Mock setup
beforeEach(() => {
  vi.clearAllMocks();
  mockUserCollection.findOne.mockResolvedValue(null);
});
```

## 📝 Documentation Standards

### Code Comments

```typescript
// ✅ Good: JSDoc for public APIs
/**
 * Creates a new user in the system
 * @param data - User creation data
 * @param options - Additional options for user creation
 * @returns Promise resolving to the created user
 * @throws ValidationError when data is invalid
 * @throws ConflictError when email already exists
 */
export async function createUser(
  data: CreateUserRequest,
  options: CreateUserOptions = {}
): Promise<User> {
  // Implementation
}

// ✅ Good: Inline comments for complex logic
// Calculate the user's effective permissions based on role and tenant
const effectivePermissions = user.role === 'ADMIN' 
  ? ALL_PERMISSIONS 
  : tenant.permissions.filter(p => user.permissions.includes(p));
```

### API Documentation

```typescript
// ✅ Good: OpenAPI/Swagger annotations
/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
```

## 🚀 Performance Standards

### Async Operations

```typescript
// ✅ Good: Proper async/await usage
export async function getUsersWithProjects(userIds: string[]): Promise<UserWithProjects[]> {
  // Parallel execution for independent operations
  const [users, projects] = await Promise.all([
    userService.findByIds(userIds),
    projectService.findByUserIds(userIds),
  ]);
  
  // Combine results efficiently
  return users.map(user => ({
    ...user,
    projects: projects.filter(p => p.userId === user.id),
  }));
}

// ❌ Bad: Sequential execution
export async function getUsersWithProjectsSequential(userIds: string[]): Promise<UserWithProjects[]> {
  const users = await userService.findByIds(userIds);
  const projects = await projectService.findByUserIds(userIds); // Waits unnecessarily
  
  return users.map(user => ({
    ...user,
    projects: projects.filter(p => p.userId === user.id),
  }));
}
```

### Memory Management

```typescript
// ✅ Good: Streaming for large datasets
export async function exportUsers(res: Response): Promise<void> {
  const cursor = userCollection.find({}).stream();
  
  res.setHeader('Content-Type', 'application/json');
  res.write('[');
  
  let first = true;
  cursor.on('data', (user) => {
    if (!first) res.write(',');
    res.write(JSON.stringify(sanitizeUser(user)));
    first = false;
  });
  
  cursor.on('end', () => {
    res.write(']');
    res.end();
  });
}
```

## 🔄 Git Standards

### Commit Messages

```bash
# ✅ Good: Conventional commit format
feat(auth): add OAuth 2.0 integration for Google Drive
fix(users): resolve email validation edge case
docs(api): update authentication endpoint documentation
refactor(tenants): extract tenant validation logic
test(projects): add integration tests for project creation

# ❌ Bad: Unclear commit messages
fix bug
update code
changes
```

### Branch Naming

```bash
# ✅ Good: Descriptive branch names
feature/oauth-google-drive-integration
fix/user-email-validation-bug
docs/api-authentication-update
refactor/tenant-validation-extraction
```

## 📋 Code Review Checklist

### Before Submitting PR

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Tests pass locally
- [ ] Code follows naming conventions
- [ ] Security considerations addressed
- [ ] Documentation updated if needed
- [ ] No sensitive data in code
- [ ] Error handling implemented
- [ ] Input validation added

### During Code Review

- [ ] Code is readable and maintainable
- [ ] Business logic is correct
- [ ] Error handling is appropriate
- [ ] Security vulnerabilities addressed
- [ ] Performance considerations evaluated
- [ ] Tests cover edge cases
- [ ] Documentation is accurate
- [ ] Breaking changes are documented

## 🎯 Quality Metrics

### Code Quality Targets

- **TypeScript Coverage**: 100% (no `any` types)
- **Test Coverage**: 85%+ overall, 90%+ for services
- **ESLint Compliance**: 0 errors, minimal warnings
- **Documentation**: All public APIs documented
- **Security**: 0 known vulnerabilities

### Monitoring

```typescript
// ✅ Good: Structured logging for monitoring
logger.info('User action completed', {
  userId: req.auth.sub,
  action: 'create_project',
  projectId: project.id,
  duration: Date.now() - startTime,
  success: true,
});

// ✅ Good: Error tracking
logger.error('Database operation failed', {
  operation: 'user_creation',
  error: error.message,
  stack: error.stack,
  userId: req.auth.sub,
});
```

---
*These coding standards ensure consistency, maintainability, and quality across the MWAP codebase. All team members are expected to follow these guidelines.*