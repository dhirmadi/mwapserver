# MWAP Development Standards

This comprehensive guide outlines development practices, coding standards, naming conventions, and best practices for the MWAP platform to ensure maintainable, readable, and high-quality code.

## 🎯 Overview

### Code Quality Principles
- **Readability**: Code should be self-documenting and easy to understand
- **Consistency**: Follow established patterns and conventions throughout the codebase
- **Simplicity**: Prefer simple, clear solutions over complex ones
- **DRY (Don't Repeat Yourself)**: Avoid code duplication and promote reusability
- **SOLID Principles**: Write maintainable and extensible code
- **Performance**: Consider performance implications of code decisions
- **Security**: Implement security best practices at every level
- **TypeScript First**: All code must be written in TypeScript with strict type checking

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** and npm
- **MongoDB 6.0+**
- **Git** with proper configuration
- **Auth0 account** (development tenant)
- **Code Editor** (VS Code recommended with extensions)

### Initial Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd mwapserver

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env.local
# Edit .env.local with your values

# 4. Start development server
npm run dev

# 5. Verify setup
curl http://localhost:3000/health
```

### Development Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format with Prettier
npm run type-check   # Check TypeScript types
```

## 🏗️ Project Structure and Organization

### Directory Organization
```
mwapserver/
├── src/
│   ├── features/          # Feature-based modules (kebab-case)
│   │   └── cloud-providers/
│   │       ├── cloudProviders.controller.ts
│   │       ├── cloudProviders.service.ts
│   │       ├── cloudProviders.routes.ts
│   │       └── cloudProviders.types.ts
│   ├── middleware/        # Express middleware
│   ├── config/           # Configuration files
│   ├── utils/            # Shared utilities
│   ├── schemas/          # Zod validation schemas
│   └── services/         # Business logic services
├── docs/                 # Documentation (kebab-case)
├── tests/               # Test files (mirror src structure)
│   ├── integration/     # API endpoint tests
│   ├── unit/           # Individual function tests
│   ├── fixtures/       # Test data
│   └── utils/          # Test utilities
└── scripts/            # Build and utility scripts
```

### Feature Module Structure
```
src/features/example-feature/
├── exampleFeature.routes.ts     # Express routes
├── exampleFeature.controller.ts # HTTP handlers
├── exampleFeature.service.ts    # Business logic
├── exampleFeature.types.ts      # TypeScript interfaces
└── __tests__/                   # Feature-specific tests
    ├── exampleFeature.service.test.ts
    └── exampleFeature.controller.test.ts
```

## 📁 File and Directory Naming Standards

### File Naming Conventions
```bash
# Source files: kebab-case for directories, camelCase for files
src/features/project-types/projectTypes.routes.ts
src/middleware/error-handler.ts
src/config/auth0.ts

# React components: PascalCase
UserProfile.tsx
ProjectMemberList.tsx

# Test files: match source + .test
src/utils/validate.test.ts
tests/integration/cloud-providers.test.ts

# Documentation: kebab-case
docs/04-Backend/api-reference.md
docs/06-Guides/deployment-guide.md

# Configuration files
tsconfig.json
vitest.config.ts
package.json
.env.local
.env.production
```

### Directory Structure Standards
```bash
# Feature modules: kebab-case
src/features/cloud-providers/
src/features/project-types/
src/features/cloud-integrations/

# Utility directories: camelCase or kebab-case
src/middleware/
src/schemas/
src/services/openapi/

# Frontend directories: camelCase
src/components/shared/
src/hooks/useAuth/
src/utils/apiClient/
```

## 💻 TypeScript and Code Standards

### Type Definitions
```typescript
// Use interfaces for object shapes
interface User {
  readonly id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Use types for unions, primitives, and computed types
type UserRole = 'OWNER' | 'DEPUTY' | 'MEMBER' | 'VIEWER';
type ProjectStatus = 'active' | 'archived' | 'deleted';
type UserWithRole = User & { role: UserRole };

// Prefer readonly for immutable data
interface ReadonlyConfig {
  readonly apiUrl: string;
  readonly features: readonly string[];
}

// Use generics for reusable types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Generic type parameters: single uppercase letters, starting with T
function validate<T>(schema: z.Schema<T>, data: unknown): T {}
interface Repository<T extends { _id: string }> {}
type ServiceResult<T, E = ApiError> = Promise<T | E>;
```

### Variable and Function Naming

#### Variables
```typescript
// camelCase for variables and properties
const projectId = req.params.id;
const featureModules = ['tenants', 'projects'];
const basePaths: Record<string, string> = {};

// Boolean variables: is/has/can prefix
const isAuthenticated = true;
const hasPermission = false;
const canEdit = checkPermissions();

// Array variables: plural nouns
const users = await getUserList();
const tenantIds = projects.map(p => p.tenantId);

// Constants: SCREAMING_SNAKE_CASE
export const ERROR_CODES = {
  VALIDATION: {
    INVALID_INPUT: 'validation/invalid-input'
  },
  AUTH: {
    INSUFFICIENT_PERMISSIONS: 'auth/insufficient-permissions'
  }
} as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_PAGE_SIZE = 20;
```

#### Functions
```typescript
// camelCase with descriptive verbs
export function createTenant(data: CreateTenantData) {}
export function getUserFromToken(req: Request) {}
export async function validateWithSchema(schema: z.Schema, data: any) {}

// Boolean functions: is/has/can prefix
function isValidObjectId(id: string): boolean {}
function hasProjectAccess(userId: string, projectId: string): boolean {}
function canUserEdit(user: User, resource: Resource): boolean {}

// Router factory functions: get + PascalCase + Router
export function getTenantRouter(): Router {}
export function getProjectsRouter(): Router {}
export function getOpenAPIRouter(): Router {}

// Use function expressions with explicit return types
const getUserById = async (id: string): Promise<User | null> => {
  const user = await userService.findById(id);
  return user;
};

// Use arrow functions for simple operations
const isValidEmail = (email: string): boolean => /\S+@\S+\.\S+/.test(email);
```

### Function Standards and Patterns
```typescript
// ✅ Proper async/await instead of promises
const fetchUser = async (id: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new UserNotFoundError(`User ${id} not found`);
  }
};

// ❌ Avoid promise chaining in new code
const fetchUser = (id: string): Promise<User> => {
  return api.get(`/users/${id}`)
    .then(response => response.data)
    .catch(error => {
      throw new UserNotFoundError(`User ${id} not found`);
    });
};
```

### Class and Interface Naming
```typescript
// Classes: PascalCase
export class TenantService {}
export class RouteDiscoveryServiceImpl implements RouteDiscoveryService {}
export class OpenAPIDocumentBuilder {}

// Error classes: descriptive + Error suffix
export class ApiError extends Error {}
export class ValidationError extends Error {}
export class PermissionError extends Error {}

// Custom error classes with proper structure
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
```

### Error Handling Standards
```typescript
// Proper error handling in async functions
const createUser = async (userData: CreateUserRequest): Promise<User> => {
  try {
    validateUserData(userData);
    const user = await userService.create(userData);
    return user;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error; // Re-throw known errors
    }
    throw new AppError('Failed to create user', 500, 'USER_CREATION_FAILED');
  }
};

// Use consistent error patterns
throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

// Wrap async route handlers
router.get('/', wrapAsyncHandler(getUsers));
```

## 🌐 API and Database Naming Standards

### API Endpoint Conventions
```bash
# REST conventions with kebab-case
GET    /api/v1/tenants                    # List tenants
POST   /api/v1/tenants                    # Create tenant
GET    /api/v1/tenants/{id}              # Get tenant by ID
PATCH  /api/v1/tenants/{id}              # Update tenant (preferred over PUT)
DELETE /api/v1/tenants/{id}              # Delete tenant

# Nested resources
GET    /api/v1/projects/{id}/members      # Project members
POST   /api/v1/projects/{id}/members      # Add project member
DELETE /api/v1/projects/{id}/members/{userId}  # Remove member

# Multi-word resources: kebab-case
GET    /api/v1/project-types              # Project types
GET    /api/v1/cloud-providers            # Cloud providers
POST   /api/v1/cloud-integrations         # Cloud integrations

# Special endpoints
GET    /api/v1/tenants/me                 # Current user's resource
POST   /api/v1/oauth/callback             # Action endpoints
GET    /api/v1/users/{id}/roles           # Related data
```

### Query Parameters
```typescript
// camelCase for query parameters
GET /api/v1/projects?includeArchived=true&pageSize=50&sortBy=name

interface ProjectQuery {
  includeArchived?: boolean;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  tenantId?: string;
}
```

### Database Naming Standards

#### Collection Names
```bash
# Singular, camelCase for compound names
tenants
projects
users
superadmins
cloudProviders           # camelCase for compound names
projectTypes
cloudProviderIntegrations
```

#### Field Names
```typescript
// camelCase for document fields
{
  _id: ObjectId,
  tenantId: ObjectId,      // Foreign keys: entityId
  projectTypeId: ObjectId,
  name: string,
  createdAt: Date,         // Timestamps: past tense
  updatedAt: Date,
  createdBy: string,       // User references: past tense + By
  ownerId: string,         // Ownership: entityId
  members: [               // Arrays: plural nouns
    {
      userId: string,
      role: string,
      addedAt: Date
    }
  ]
}
```

#### MongoDB Indexes
```javascript
// Descriptive index names
db.projects.createIndex(
  { tenantId: 1, name: 1 }, 
  { name: "tenant_name_idx" }
);
db.projects.createIndex(
  { "members.userId": 1 }, 
  { name: "project_members_idx" }
);
db.tenants.createIndex(
  { ownerId: 1 }, 
  { name: "tenant_owner_idx" }
);
```

## ⚛️ Frontend/React Standards

### Component Standards
```typescript
// Use function components with proper typing
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
  className,
}) => {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;

  return (
    <div className={className}>
      {/* Component content */}
    </div>
  );
};
```

### Hook Standards
```typescript
// Custom hooks should start with 'use'
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
};
```

### Performance Optimization
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo<Props>(({ data, onUpdate }) => {
  // Expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => expensiveCalculation(item));
  }, [data]);

  // Stable callbacks
  const handleUpdate = useCallback((id: string) => {
    onUpdate(id);
  }, [onUpdate]);

  return <div>{/* Component content */}</div>;
});

// Use proper key props for lists
{items.map(item => (
  <ItemComponent 
    key={item.id} // Use stable, unique keys
    item={item} 
  />
))}
```

## 🚀 Backend/Express Standards

### Controller Standards
```typescript
// Controller class structure
export class UsersController {
  constructor(private userService: UserService) {}

  // Use arrow functions to maintain 'this' context
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getById(id);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body as CreateUserRequest;
      const user = await this.userService.create(userData);
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

// ✅ Good API handler pattern
export async function getUsers(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const users = await userService.getAllUsers();
  return jsonResponse(res, users);
}

// ❌ Avoid inline business logic
export async function getUsers(req: Request, res: Response) {
  const users = await db.collection('users').find().toArray();
  res.json(users);
}
```

### Service Layer Standards
```typescript
// Service class structure
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getById(id: string): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new ValidationError('Invalid user ID format');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async create(userData: CreateUserRequest): Promise<User> {
    // Validate input
    await this.validateCreateUserData(userData);
    
    // Check for existing user
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return user;
  }

  private async validateCreateUserData(data: CreateUserRequest): Promise<void> {
    // Use Zod for validation
    const result = CreateUserSchema.safeParse(data);
    if (!result.success) {
      throw new ValidationError('Invalid user data', result.error.message);
    }
  }
}
```

### Database Best Practices
```typescript
// ✅ Use service layer
const user = await userService.createUser(userData);

// ✅ Validate input with Zod
const validatedData = createUserSchema.parse(req.body);

// ✅ Use proper database patterns
const getUserSummary = async (id: string) => {
  return await db.collection('users').findOne(
    { _id: new ObjectId(id) },
    { projection: { name: 1, email: 1, _id: 1 } }
  );
};

// ❌ Direct database access in controllers
// const user = await db.collection('users').insertOne(userData);
```

## 🔍 Validation and Schema Standards

### Zod Schema Naming
```typescript
// camelCase with descriptive suffix
export const createTenantSchema = z.object({...});
export const updateTenantSchema = z.object({...});
export const tenantResponseSchema = z.object({...});
export const projectMemberSchema = z.object({...});

// Query schemas
export const fileQuerySchema = z.object({...});
export const paginationSchema = z.object({...});
```

### Error Code Conventions
```typescript
// Hierarchical with forward slashes
const ERROR_CODES = {
  VALIDATION: {
    INVALID_INPUT: 'validation/invalid-input',
    MISSING_FIELD: 'validation/missing-field'
  },
  AUTH: {
    INVALID_TOKEN: 'auth/invalid-token',
    INSUFFICIENT_PERMISSIONS: 'auth/insufficient-permissions'
  },
  TENANT: {
    NOT_FOUND: 'tenant/not-found',
    NAME_EXISTS: 'tenant/name-exists'
  }
} as const;
```

## 🧪 Testing Standards

### Test Structure and Naming
```bash
# Test files: match source + .test suffix
src/utils/validate.ts → src/utils/validate.test.ts
src/features/tenants/tenants.service.ts → src/features/tenants/tenants.service.test.ts
```

### Test Case Organization
```typescript
// Descriptive test names: should + behavior
describe('TenantService', () => {
  let tenantService: TenantService;
  let mockTenantRepository: jest.Mocked<TenantRepository>;

  beforeEach(() => {
    mockTenantRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      findByName: jest.fn(),
    } as any;
    
    tenantService = new TenantService(mockTenantRepository);
  });

  describe('createTenant', () => {
    it('should create tenant with valid data', async () => {
      // Arrange
      const tenantData = { name: 'Test Tenant' };
      const expectedTenant = { id: '1', ...tenantData };
      mockTenantRepository.create.mockResolvedValue(expectedTenant);

      // Act
      const result = await tenantService.createTenant(tenantData);

      // Assert
      expect(result).toEqual(expectedTenant);
      expect(mockTenantRepository.create).toHaveBeenCalledWith(tenantData);
    });

    it('should throw error when name already exists', async () => {
      // Arrange
      const tenantData = { name: 'Existing Tenant' };
      mockTenantRepository.findByName.mockResolvedValue({ id: '1', name: 'Existing Tenant' });

      // Act & Assert
      await expect(tenantService.createTenant(tenantData))
        .rejects
        .toThrow(ConflictError);
    });
  });
});

// Integration test names
describe('POST /api/v1/tenants', () => {
  it('should create tenant successfully', async () => {
    const response = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Test Tenant' })
      .expect(201);
      
    expect(response.body.data.name).toBe('Test Tenant');
  });

  it('should return 400 for invalid input', async () => {
    await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: '' })
      .expect(400);
  });

  it('should require authentication', async () => {
    await request(app)
      .post('/api/v1/tenants')
      .send({ name: 'Test Tenant' })
      .expect(401);
  });
});
```

### Test Categories and Coverage
- **Unit Tests**: Test individual functions/methods (target: 90%+ coverage)
- **Integration Tests**: Test component interactions (target: 80%+ coverage)
- **E2E Tests**: Test complete user workflows (target: 70%+ coverage)
- **Performance Tests**: Test performance characteristics

## 🔐 Security Standards

### Authentication and Authorization
```typescript
// All API endpoints require JWT authentication
// Use getUserFromToken(req) to extract user information
// Apply role-based middleware for authorization

// ✅ Safe error messages
throw new ApiError('Invalid credentials', 401, 'AUTH_INVALID');

// ❌ Don't expose internals
// throw new Error(`Database connection failed: ${dbError.message}`);
```

### Input Validation
```typescript
// ✅ Always validate input
const validatedData = createUserSchema.parse(req.body);

// ✅ Sanitize database queries
const user = await db.collection('users').findOne({ 
  _id: new ObjectId(userId) 
});

// ❌ Never trust user input directly
// const query = { name: req.query.name }; // Potential injection
```

## 📝 Documentation Standards

### Code Documentation
```typescript
/**
 * Creates a new tenant with the specified data
 * 
 * @param userId - Auth0 user ID of the tenant owner
 * @param data - Tenant creation data
 * @returns Promise resolving to created tenant object
 * 
 * @throws {ValidationError} When tenant data is invalid
 * @throws {ConflictError} When tenant name already exists
 * 
 * @example
 * ```typescript
 * const tenant = await createTenant('auth0|123', { 
 *   name: 'My Company',
 *   settings: { allowPublicProjects: false }
 * });
 * console.log(tenant.id);
 * ```
 */
export async function createTenant(
  userId: string, 
  data: CreateTenantData
): Promise<Tenant> {
  // Implementation
}

// Single-line comments: sentence case with periods
// Check if user has permission to access this resource.
const hasAccess = await checkPermission(user.sub, resourceId);

// TODO comments: descriptive and actionable
// TODO: Implement caching for frequently accessed tenants
// FIXME: Handle edge case when user has no tenant assigned
```

### API Documentation
- Document all endpoints in OpenAPI format
- Include request/response examples
- Specify authentication requirements
- Document error responses and status codes

## 🛠️ Tool Configuration

### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## 🔄 Development Workflow

### Git Workflow
```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/add-user-management

# 2. Make changes with descriptive commits
git add .
git commit -m "feat(auth): add user role validation middleware"

# 3. Keep branch updated
git pull origin main
git rebase main

# 4. Push and create pull request
git push origin feature/add-user-management
```

### Pre-commit Checklist
- [ ] Code follows project conventions
- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation is updated
- [ ] Environment variables are documented

## 🐛 Debugging and Performance

### Structured Logging
```typescript
// Use structured logging throughout
import { logInfo, logError } from '../utils/logger';

logInfo('Processing user request', { 
  userId: user.sub, 
  endpoint: req.path,
  method: req.method,
  timestamp: new Date().toISOString()
});

// Track performance
const startTime = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - startTime;

logInfo('Operation completed', { 
  operation: 'expensiveOperation',
  duration,
  success: true 
});

// Never log sensitive information
logInfo('User authenticated', {
  userId: user.id,
  // DON'T LOG: password, tokens, personal data
});
```

### Performance Best Practices
```typescript
// Use database indexes for frequent queries
await db.collection('users').createIndex({ email: 1 }, { unique: true });

// Implement pagination
const getUsers = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  return await db.collection('users')
    .find({})
    .skip(skip)
    .limit(limit)
    .toArray();
};

// Use projection to limit returned fields
const getUserSummary = async (id: string) => {
  return await db.collection('users').findOne(
    { _id: new ObjectId(id) },
    { projection: { name: 1, email: 1, _id: 1 } }
  );
};
```

## ⚠️ Anti-Patterns to Avoid

### Poor Naming Examples
```typescript
// ❌ Avoid these patterns
const d = new Date();           // Use: const createdAt = new Date();
const u = getUserFromToken();   // Use: const user = getUserFromToken();
const temp = data.filter();     // Use: const validProjects = data.filter();

function process(x) {}          // Use: function validateTenant(tenantData) {}
function doStuff() {}          // Use: function updateProjectMembers() {}

// ❌ Inconsistent naming
const user_id = '123';         // Use: const userId = '123';
const UserService = class {};  // Use: class UserService {}
const get_user = () => {};     // Use: const getUser = () => {};
```

### API Anti-Patterns
```bash
# ❌ Avoid these URL patterns
GET /api/v1/getUsers           # Use: GET /api/v1/users
POST /api/v1/createTenant      # Use: POST /api/v1/tenants
GET /api/v1/user_profiles      # Use: GET /api/v1/user-profiles
```

### Code Anti-Patterns
```typescript
// ❌ Don't let errors crash the app
async function handler() { 
  await riskyOperation(); // Missing try/catch
}

// ❌ Direct database access in controllers
const user = await db.collection('users').insertOne(userData);

// ❌ Inconsistent error handling
if (error) {
  console.log(error); // Use proper logging
  res.status(500).send('Error'); // Use structured error responses
}
```

## 📋 Code Review Standards

### Review Checklist

#### General Quality
- [ ] Code follows TypeScript strict mode requirements
- [ ] No `any` types without justification and documentation
- [ ] Proper error handling implemented throughout
- [ ] Code is properly tested with good coverage
- [ ] Documentation updated where needed
- [ ] Follows established naming conventions

#### Security Review
- [ ] Input validation implemented for all user inputs
- [ ] No hardcoded secrets or sensitive data
- [ ] Proper authorization checks in place
- [ ] SQL/NoSQL injection prevention measures
- [ ] Sensitive data properly handled and not logged

#### Performance Review
- [ ] No unnecessary re-renders (React components)
- [ ] Proper database query optimization
- [ ] Appropriate use of caching where beneficial
- [ ] Memory leak prevention considerations
- [ ] Efficient algorithms and data structures

#### Maintainability Review
- [ ] Code follows established architectural patterns
- [ ] Functions are small, focused, and single-purpose
- [ ] Proper separation of concerns
- [ ] Consistent with existing codebase patterns
- [ ] Good test coverage with meaningful test cases

### Review Process
1. **Self-review**: Author reviews their own code before requesting review
2. **Automated checks**: All CI checks must pass (tests, linting, type checking)
3. **Peer review**: At least one team member reviews the code thoroughly
4. **Testing**: Manual testing of new features and edge cases
5. **Documentation**: Update relevant documentation and README files

## ✅ Best Practices Summary

### Code Quality
1. **Consistency**: Use the same naming patterns throughout the codebase
2. **Descriptive**: Names should clearly indicate purpose and content
3. **Conventional**: Follow established patterns in the JavaScript/TypeScript ecosystem
4. **Searchable**: Avoid abbreviations that make code hard to search
5. **Pronounceable**: Choose names that are easy to say and discuss in meetings
6. **Contextual**: Consider the context where the name will be used

### Development Process
1. **Test-Driven**: Write tests for new functionality
2. **Security-First**: Consider security implications of all code changes
3. **Performance-Aware**: Consider performance impact of implementation choices
4. **Documentation**: Keep documentation current with code changes
5. **Incremental**: Make small, focused commits with clear messages

### Team Collaboration
1. **Code Reviews**: All changes go through peer review
2. **Knowledge Sharing**: Document decisions and share learning
3. **Consistent Standards**: Follow agreed-upon conventions
4. **Constructive Feedback**: Provide helpful, actionable review comments
5. **Continuous Improvement**: Regularly review and update standards

---
*These development standards ensure consistency, maintainability, and quality across the entire MWAP platform codebase while promoting effective team collaboration.* 