# Naming Guidelines

This document defines naming conventions and standards used throughout the MWAP codebase to ensure consistency and maintainability.

## 🗂️ File and Directory Naming

### Source Files
```bash
# TypeScript files: kebab-case
src/features/project-types/projectTypes.routes.ts
src/middleware/error-handler.ts
src/config/auth0.ts

# Test files: match source + .test
src/utils/validate.test.ts
tests/integration/cloud-providers.test.ts

# Documentation: kebab-case
docs/04-Backend/express-structure.md
docs/06-Guides/how-to-deploy.md
```

### Directory Structure
```bash
# Feature modules: kebab-case
src/features/cloud-providers/
src/features/project-types/
src/features/cloud-integrations/

# Utility directories: camelCase or kebab-case
src/middleware/
src/schemas/
src/services/openapi/
```

### Configuration Files
```bash
# Environment files
.env.local
.env.production
.env.example

# Config files: kebab-case
tsconfig.json
vitest.config.ts
package.json
```

## 🔤 Variable and Function Naming

### Variables
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
```

### Functions
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
```

### Constants
```typescript
// SCREAMING_SNAKE_CASE for constants
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

## 🏗️ Class and Interface Naming

### Classes
```typescript
// PascalCase for classes
export class TenantService {}
export class RouteDiscoveryServiceImpl implements RouteDiscoveryService {}
export class OpenAPIDocumentBuilder {}

// Error classes: descriptive + Error suffix
export class ApiError extends Error {}
export class ValidationError extends Error {}
export class PermissionError extends Error {}
```

### Interfaces and Types
```typescript
// PascalCase for interfaces and types
interface RouteMetadata {
  path: string;
  method: string;
  feature: string;
}

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
}

// Type unions: descriptive names
type UserRole = 'OWNER' | 'DEPUTY' | 'MEMBER';
type ProjectStatus = 'active' | 'archived' | 'deleted';
```

### Generic Type Parameters
```typescript
// Single uppercase letters, starting with T
function validate<T>(schema: z.Schema<T>, data: unknown): T {}
interface Repository<T extends { _id: string }> {}
type ServiceResult<T, E = ApiError> = Promise<T | E>;
```

## 🌐 API Naming Conventions

### Endpoint Paths
```bash
# REST conventions with kebab-case
GET    /api/v1/tenants                    # List tenants
POST   /api/v1/tenants                    # Create tenant
GET    /api/v1/tenants/{id}              # Get tenant by ID
PATCH  /api/v1/tenants/{id}              # Update tenant
DELETE /api/v1/tenants/{id}              # Delete tenant

# Nested resources
GET    /api/v1/projects/{id}/members      # Project members
POST   /api/v1/projects/{id}/members      # Add project member
DELETE /api/v1/projects/{id}/members/{userId}  # Remove member

# Multi-word resources: kebab-case
GET    /api/v1/project-types              # Project types
GET    /api/v1/cloud-providers            # Cloud providers
POST   /api/v1/cloud-integrations         # Cloud integrations
```

### HTTP Methods and Actions
```bash
# Standard REST verbs
GET     # Retrieve/list resources
POST    # Create new resource
PATCH   # Partial update (preferred over PUT)
DELETE  # Remove resource

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

## 🗃️ Database Naming

### Collection Names
```bash
# Singular, lowercase with hyphens if needed
tenants
projects
users
superadmins
cloudProviders           # camelCase for compound names
projectTypes
cloudProviderIntegrations
```

### Field Names
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

### MongoDB Indexes
```javascript
// Descriptive index names
db.projects.createIndex({ tenantId: 1, name: 1 }, { name: "tenant_name_idx" });
db.projects.createIndex({ "members.userId": 1 }, { name: "project_members_idx" });
db.tenants.createIndex({ ownerId: 1 }, { name: "tenant_owner_idx" });
```

## 📋 Schema and Validation Naming

### Zod Schemas
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

### Error Codes
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
};
```

## 🎯 Environment Variables

### Naming Pattern
```bash
# SCREAMING_SNAKE_CASE with descriptive prefixes
NODE_ENV=development
PORT=3001

# Service prefixes
AUTH0_DOMAIN=tenant.auth0.com
AUTH0_AUDIENCE=https://api.yourapp.com

# Database
MONGODB_URI=mongodb://localhost:27017/mwap

# Feature flags
ENABLE_CLOUD_INTEGRATIONS=true
ENABLE_OPENAPI_DOCS=false
```

### Grouping
```bash
# Group related variables with prefixes
AUTH0_DOMAIN=...
AUTH0_AUDIENCE=...
AUTH0_CLIENT_ID=...

DATABASE_URI=...
DATABASE_POOL_SIZE=...
DATABASE_TIMEOUT=...

REDIS_URL=...
REDIS_PASSWORD=...
REDIS_DB=...
```

## 📝 Comments and Documentation

### Code Comments
```typescript
/**
 * Creates a new tenant with the specified data
 * @param userId - Auth0 user ID
 * @param data - Tenant creation data
 * @returns Created tenant object
 * @throws ApiError when validation fails
 */
export async function createTenant(userId: string, data: CreateTenantData) {}

// Single-line comments: sentence case with periods
// Check if user has permission to access this resource.
const hasAccess = await checkPermission(user.sub, resourceId);

// TODO comments: descriptive and actionable
// TODO: Implement caching for frequently accessed tenants
// FIXME: Handle edge case when user has no tenant assigned
```

### Git Commit Messages
```bash
# Format: type(scope): description
feat(auth): add JWT validation middleware
fix(api): resolve tenant creation bug
docs(readme): update installation instructions
test(users): add role validation tests
refactor(db): optimize query performance

# Breaking changes
feat(api)!: change response format for tenant endpoints
```

## 🔍 Testing Naming

### Test Files
```bash
# Match source file with .test suffix
src/utils/validate.ts → src/utils/validate.test.ts
src/features/tenants/tenants.service.ts → src/features/tenants/tenants.service.test.ts
```

### Test Cases
```typescript
// Descriptive test names: should + behavior
describe('TenantService', () => {
  describe('createTenant', () => {
    it('should create tenant with valid data', async () => {});
    it('should throw error when name already exists', async () => {});
    it('should validate required fields', async () => {});
  });

  describe('updateTenant', () => {
    it('should update only provided fields', async () => {});
    it('should not allow empty name', async () => {});
  });
});

// Integration test names
describe('POST /api/v1/tenants', () => {
  it('should create tenant successfully', async () => {});
  it('should return 400 for invalid input', async () => {});
  it('should require authentication', async () => {});
});
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

## ✅ Best Practices Summary

1. **Consistency**: Use the same naming pattern throughout the codebase
2. **Descriptive**: Names should clearly indicate purpose and content
3. **Conventional**: Follow established patterns in the ecosystem
4. **Searchable**: Avoid abbreviations that make code hard to search
5. **Pronunciation**: Choose names that are easy to say and discuss
6. **Context**: Consider the context where the name will be used

## 📖 Related Documentation

- **[Development Guide](development-guide.md)** - General development practices
- **[Coding Standards](coding-standards.md)** - Code formatting and style
- **[Git Workflow](branching.md)** - Branch and commit naming

---

*Consistent naming conventions improve code readability, maintainability, and team collaboration.* 