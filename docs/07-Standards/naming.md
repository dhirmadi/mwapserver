# 📝 MWAP Naming Conventions

## 🎯 Overview

Consistent naming conventions are crucial for maintainable code. This document establishes comprehensive naming standards for all aspects of MWAP development, from files and directories to variables and functions.

## 📁 File & Directory Naming

### **File Naming Conventions**
```typescript
// Use kebab-case for all file names
user-service.ts              // ✅ Good
userService.ts               // ❌ Bad
user_service.ts              // ❌ Bad

// Feature files follow pattern: {feature}.{type}.ts
project.model.ts             // MongoDB model
project.types.ts             // TypeScript interfaces
project.validation.ts        // Zod schemas
project.service.ts           // Business logic
project.controller.ts        // HTTP handlers
project.routes.ts            // Express routes

// Test files include .test or .spec
project.service.test.ts      // Unit tests
project.integration.test.ts  // Integration tests
project.e2e.spec.ts         // End-to-end tests

// Configuration files
tsconfig.json               // TypeScript config
eslint.config.js           // ESLint config
vitest.config.ts           // Vitest config
```

### **Directory Naming Conventions**
```bash
# Use kebab-case for directory names
src/features/cloud-providers/    # ✅ Good
src/features/cloudProviders/     # ❌ Bad
src/features/cloud_providers/    # ❌ Bad

# Feature directories
src/features/
├── tenants/                     # Tenant management
├── projects/                    # Project management
├── project-types/               # Project type definitions
├── cloud-providers/             # Cloud provider integrations
├── virtual-files/               # File management
└── user-management/             # User operations

# Utility directories
src/middleware/                  # Express middleware
src/utils/                       # Shared utilities
src/config/                      # Configuration files
src/types/                       # Global TypeScript types
```

### **Documentation Structure**
```bash
docs/
├── 00-Overview/                 # Project overview
├── 01-Getting-Started/          # Setup guides
├── 02-Architecture/             # System architecture
├── 03-Frontend/                 # Frontend documentation
├── 04-Backend/                  # Backend documentation
├── 05-AI-Agents/               # AI integration
├── 06-Guides/                  # Development guides
├── 07-Standards/               # Coding standards
├── 08-Contribution/            # Contribution workflow
└── 09-Reports-and-History/     # Historical content
```

## 🔤 Code Naming Conventions

### **Variables & Functions**
```typescript
// Use camelCase for variables and functions
const userName = 'john_doe';           // ✅ Good
const user_name = 'john_doe';          // ❌ Bad
const UserName = 'john_doe';           // ❌ Bad

// Function names should be descriptive verbs
function getUserById(id: string) {}     // ✅ Good
function user(id: string) {}           // ❌ Bad
function getUser(id: string) {}        // ⚠️ Acceptable but less specific

// Boolean variables should be questions
const isAuthenticated = true;          // ✅ Good
const hasPermission = false;           // ✅ Good
const canEdit = true;                  // ✅ Good
const authenticated = true;            // ❌ Bad

// Array variables should be plural
const users = [];                      // ✅ Good
const userList = [];                   // ⚠️ Acceptable
const user = [];                       // ❌ Bad

// Event handlers should start with 'handle' or 'on'
const handleSubmit = () => {};         // ✅ Good
const onUserClick = () => {};          // ✅ Good
const submitForm = () => {};           // ❌ Bad
```

### **Constants**
```typescript
// Use UPPER_SNAKE_CASE for constants
const MAX_RETRY_ATTEMPTS = 3;          // ✅ Good
const API_BASE_URL = 'https://api.mwap.com'; // ✅ Good
const maxRetryAttempts = 3;            // ❌ Bad

// Group related constants in enums or objects
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DRAFT: 'draft'
} as const;
```

### **Classes & Interfaces**
```typescript
// Use PascalCase for classes
class UserService {}                   // ✅ Good
class userService {}                   // ❌ Bad
class user_service {}                  // ❌ Bad

// Use PascalCase for interfaces, prefix with 'I' for distinction
interface IUser {                      // ✅ Good
  id: string;
  name: string;
}

interface User {                       // ⚠️ Acceptable but less clear
  id: string;
  name: string;
}

// Use PascalCase for types
type ProjectStatus = 'active' | 'archived' | 'draft'; // ✅ Good
type projectStatus = 'active' | 'archived' | 'draft'; // ❌ Bad

// Use PascalCase for enums
enum UserRole {                        // ✅ Good
  SUPERADMIN = 'superadmin',
  TENANT_OWNER = 'tenant_owner',
  PROJECT_MEMBER = 'project_member'
}
```

## 🗄️ Database Naming Conventions

### **Collection Names**
```typescript
// Use singular, PascalCase for model names
export const User = mongoose.model('User', userSchema);     // ✅ Good
export const Project = mongoose.model('Project', projectSchema); // ✅ Good
export const users = mongoose.model('users', userSchema);   // ❌ Bad

// MongoDB collections will be pluralized automatically
// User model → users collection
// Project model → projects collection
// ProjectType model → projecttypes collection (use compound names carefully)
```

### **Field Names**
```typescript
// Use camelCase for field names
const userSchema = new Schema({
  firstName: String,                   // ✅ Good
  lastName: String,                    // ✅ Good
  emailAddress: String,                // ✅ Good
  first_name: String,                  // ❌ Bad
  FirstName: String,                   // ❌ Bad
});

// Use descriptive names for relationships
const projectSchema = new Schema({
  tenantId: {                          // ✅ Good - clear relationship
    type: Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  projectTypeId: {                     // ✅ Good - specific reference
    type: Schema.Types.ObjectId,
    ref: 'ProjectType'
  },
  createdBy: String,                   // ✅ Good - clear meaning
  ownerId: String,                     // ❌ Ambiguous - owner of what?
});

// Use consistent timestamp naming
const baseSchema = new Schema({
  createdAt: Date,                     // ✅ Good
  updatedAt: Date,                     // ✅ Good
  deletedAt: Date,                     // ✅ Good (for soft deletes)
  created_at: Date,                    // ❌ Bad
  date_created: Date,                  // ❌ Bad
});
```

### **Index Names**
```typescript
// MongoDB will auto-generate index names, but for custom names:
projectSchema.index(
  { tenantId: 1, status: 1 },
  { name: 'tenant_status_idx' }        // ✅ Good - descriptive
);

projectSchema.index(
  { name: 'text', description: 'text' },
  { name: 'project_search_idx' }       // ✅ Good - indicates purpose
);
```

## 🌐 API Naming Conventions

### **Endpoint Naming**
```typescript
// Use kebab-case for multi-word resources
GET /api/v1/project-types             // ✅ Good
GET /api/v1/projectTypes              // ❌ Bad
GET /api/v1/project_types             // ❌ Bad

// Use plural nouns for collections
GET /api/v1/users                     // ✅ Good
GET /api/v1/user                      // ❌ Bad

// Use singular for specific resources
GET /api/v1/users/:id                 // ✅ Good
GET /api/v1/users/:id/profile         // ✅ Good

// Use nested resources for relationships
GET /api/v1/projects/:id/members      // ✅ Good
POST /api/v1/projects/:id/members     // ✅ Good
DELETE /api/v1/projects/:id/members/:memberId // ✅ Good

// Use action verbs for non-CRUD operations
POST /api/v1/projects/:id/archive     // ✅ Good
POST /api/v1/users/:id/reset-password // ✅ Good
POST /api/v1/tenants/:id/invite-user  // ✅ Good
```

### **Query Parameters**
```typescript
// Use camelCase for query parameters
GET /api/v1/projects?includeArchived=true    // ✅ Good
GET /api/v1/projects?include_archived=true   // ❌ Bad

// Use descriptive parameter names
GET /api/v1/projects?sortBy=name&sortOrder=asc // ✅ Good
GET /api/v1/projects?sort=name&order=asc       // ⚠️ Acceptable
GET /api/v1/projects?s=name&o=asc             // ❌ Bad

// Common query parameter patterns
interface QueryParams {
  page?: number;                      // Pagination
  limit?: number;                     // Page size
  sortBy?: string;                    // Sort field
  sortOrder?: 'asc' | 'desc';        // Sort direction
  search?: string;                    // Search term
  filter?: string;                    // Filter criteria
  includeArchived?: boolean;          // Include soft-deleted
}
```

### **Response Field Names**
```typescript
// Use camelCase for JSON response fields
interface ApiResponse<T> {
  success: boolean;                   // ✅ Good
  data: T;                           // ✅ Good
  message?: string;                  // ✅ Good
  meta?: {
    pagination?: {
      currentPage: number;            // ✅ Good
      totalPages: number;             // ✅ Good
      totalItems: number;             // ✅ Good
      itemsPerPage: number;           // ✅ Good
    };
    timestamp: string;                // ✅ Good
    requestId: string;                // ✅ Good
  };
}

// Error response structure
interface ErrorResponse {
  success: false;
  error: {
    code: string;                     // ✅ Good - machine readable
    message: string;                  // ✅ Good - human readable
    details?: any;                    // ✅ Good - additional context
  };
}
```

## 🔧 Environment Variables

### **Environment Variable Naming**
```bash
# Use UPPER_SNAKE_CASE for environment variables
NODE_ENV=development                  # ✅ Good
PORT=3000                            # ✅ Good
MONGODB_URI=mongodb://localhost:27017 # ✅ Good

# Group related variables with prefixes
AUTH0_DOMAIN=tenant.auth0.com        # ✅ Good
AUTH0_CLIENT_ID=client123            # ✅ Good
AUTH0_CLIENT_SECRET=secret456        # ✅ Good
AUTH0_AUDIENCE=https://api.mwap.com  # ✅ Good

# Use descriptive names
DATABASE_CONNECTION_TIMEOUT=5000     # ✅ Good
DB_TIMEOUT=5000                     # ⚠️ Acceptable but less clear
TIMEOUT=5000                        # ❌ Bad - too generic

# Boolean environment variables
ENABLE_RATE_LIMITING=true           # ✅ Good
RATE_LIMITING_ENABLED=true          # ✅ Good
RATE_LIMITING=true                  # ❌ Ambiguous
```

### **Configuration Object Naming**
```typescript
// Use camelCase for configuration objects
export const config = {
  server: {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost'
  },
  database: {
    uri: process.env.MONGODB_URI!,
    connectionTimeout: Number(process.env.DATABASE_CONNECTION_TIMEOUT) || 5000
  },
  auth0: {
    domain: process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    audience: process.env.AUTH0_AUDIENCE!
  }
};
```

## 🧪 Test Naming Conventions

### **Test File Organization**
```typescript
// Test files mirror source structure
src/features/projects/project.service.ts
src/features/projects/__tests__/project.service.test.ts

// Test suite naming
describe('ProjectService', () => {           // ✅ Good - matches class name
  describe('createProject', () => {          // ✅ Good - matches method name
    it('should create project with valid data', () => {}); // ✅ Good - describes behavior
    it('should throw error for invalid data', () => {}); // ✅ Good - describes error case
  });
});

// Integration test naming
describe('Projects API', () => {             // ✅ Good - describes API area
  describe('POST /api/v1/projects', () => { // ✅ Good - matches endpoint
    it('should return 201 for valid request', () => {}); // ✅ Good - describes expected outcome
  });
});
```

### **Test Data Naming**
```typescript
// Use descriptive names for test data
const validProjectData = {               // ✅ Good
  name: 'Test Project',
  description: 'Test description'
};

const invalidProjectData = {             // ✅ Good
  name: '',  // Invalid empty name
  description: 'Test description'
};

const mockUser = {                       // ✅ Good
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com'
};

// Use factory functions for complex test data
const createTestProject = (overrides = {}) => ({
  name: 'Test Project',
  description: 'Test description',
  status: 'active',
  ...overrides
});
```

## 📋 Git Naming Conventions

### **Branch Naming**
```bash
# Use type/description format
feature/user-authentication             # ✅ Good
fix/project-creation-bug               # ✅ Good
docs/api-documentation-update          # ✅ Good
refactor/service-layer-cleanup         # ✅ Good

# Branch types
feature/    # New features
fix/        # Bug fixes
hotfix/     # Critical fixes
docs/       # Documentation updates
refactor/   # Code refactoring
test/       # Test improvements
chore/      # Maintenance tasks
```

### **Commit Message Naming**
```bash
# Use conventional commit format
feat(auth): add JWT token validation     # ✅ Good
fix(api): resolve project creation bug   # ✅ Good
docs(readme): update setup instructions  # ✅ Good
refactor(service): improve error handling # ✅ Good

# Commit types
feat:     # New features
fix:      # Bug fixes
docs:     # Documentation changes
style:    # Code formatting
refactor: # Code refactoring
test:     # Test changes
chore:    # Maintenance
```

## 🏷️ Error Code Naming

### **Error Code Conventions**
```typescript
// Use UPPER_SNAKE_CASE with descriptive prefixes
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Authentication errors
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',

  // Authorization errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  TENANT_ACCESS_DENIED: 'TENANT_ACCESS_DENIED',
  PROJECT_ACCESS_DENIED: 'PROJECT_ACCESS_DENIED',

  // Resource errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',

  // Business logic errors
  DUPLICATE_PROJECT_NAME: 'DUPLICATE_PROJECT_NAME',
  PROJECT_LIMIT_EXCEEDED: 'PROJECT_LIMIT_EXCEEDED',
  INVALID_PROJECT_STATUS: 'INVALID_PROJECT_STATUS'
} as const;

// Feature-specific error codes
export const ProjectErrorCodes = {
  NOT_FOUND: 'project/not-found',
  NAME_EXISTS: 'project/name-exists',
  INVALID_TYPE: 'project/invalid-type',
  MEMBER_NOT_FOUND: 'project/member-not-found'
} as const;
```

## 📊 Logging & Monitoring

### **Log Message Naming**
```typescript
// Use consistent log message formats
logger.info('User authentication successful', { 
  userId: 'user-123',
  method: 'jwt'
});

logger.error('Project creation failed', {
  error: error.message,
  tenantId: 'tenant-456',
  userId: 'user-123'
});

logger.warn('Rate limit approaching', {
  userId: 'user-123',
  currentRequests: 95,
  limit: 100
});

// Use structured logging with consistent field names
interface LogContext {
  userId?: string;
  tenantId?: string;
  projectId?: string;
  requestId?: string;
  duration?: number;
  statusCode?: number;
}
```

### **Metric Naming**
```typescript
// Use dot notation for metric names
const metrics = {
  'api.requests.total': counter,
  'api.requests.duration': histogram,
  'api.errors.total': counter,
  'database.queries.duration': histogram,
  'auth.tokens.validated': counter,
  'projects.created.total': counter
};
```

## 🔍 Search & Indexing

### **Search Field Naming**
```typescript
// Use consistent search field names
interface SearchableProject {
  searchText: string;        // Combined searchable text
  searchKeywords: string[];  // Individual keywords
  searchCategory: string;    // Category for filtering
}

// MongoDB text index fields
projectSchema.index({
  name: 'text',
  description: 'text',
  'tags.name': 'text'
}, {
  name: 'project_search_index',
  weights: {
    name: 10,           // Higher weight for name matches
    description: 5,     // Medium weight for description
    'tags.name': 3      // Lower weight for tag matches
  }
});
```

## 📚 Documentation Naming

### **Documentation File Naming**
```bash
# Use descriptive, hierarchical names
README.md                    # Project overview
CONTRIBUTING.md              # Contribution guidelines
CHANGELOG.md                 # Version history
API.md                      # API documentation
DEPLOYMENT.md               # Deployment guide

# Feature documentation
user-management.md          # User management features
project-types.md           # Project type system
cloud-integration.md       # Cloud provider integration
```

### **Section Naming in Documentation**
```markdown
# Use consistent heading structure
## 🎯 Overview              # Purpose and scope
## 🏗️ Architecture         # System design
## 🚀 Getting Started      # Quick start guide
## 📋 API Reference        # Detailed API docs
## 🧪 Testing             # Testing information
## 🔧 Configuration       # Setup and config
## 🚨 Troubleshooting     # Common issues
## 📚 Related Resources   # Links and references
```

## ✅ Naming Checklist

### **Before Naming Anything**
- [ ] Is the name descriptive and unambiguous?
- [ ] Does it follow the established convention for its type?
- [ ] Is it consistent with similar names in the codebase?
- [ ] Can a new developer understand its purpose?
- [ ] Does it avoid abbreviations and acronyms?
- [ ] Is it neither too short nor too verbose?

### **Code Review Checklist**
- [ ] All variables use camelCase
- [ ] All constants use UPPER_SNAKE_CASE
- [ ] All classes and interfaces use PascalCase
- [ ] All files use kebab-case
- [ ] All API endpoints follow REST conventions
- [ ] All database fields use camelCase
- [ ] All environment variables use UPPER_SNAKE_CASE

---

## 📚 Related Documentation

- [🛠️ Development Guide](./development-guide.md) - Complete development standards
- [🔒 Coding Standards](./coding-standards.md) - Code quality guidelines
- [🔧 Environment Format](./env-format.md) - Environment variable standards
- [📋 Commit Style](./commit-style.md) - Git commit conventions

---

*Consistent naming conventions make code more readable, maintainable, and professional. Follow these standards to ensure clarity and consistency across the MWAP platform.*