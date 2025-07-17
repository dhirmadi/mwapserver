# ⚡ MWAP Quick Reference Guide

## 🚀 Getting Started (5 Minutes)

### **Prerequisites Check**
```bash
node --version    # ≥18.0.0
npm --version     # ≥9.0.0
git --version     # ≥2.30.0
```

### **Quick Setup**
```bash
# 1. Clone and setup
git clone https://github.com/dhirmadi/mwapserver.git
cd mwapserver
npm install

# 2. Environment configuration
cp .env.example .env
# Edit .env with your settings

# 3. Start development
npm run dev
```

### **Verify Installation**
```bash
curl http://localhost:3000/health
# Expected: {"status":"healthy"}
```

## 🏗️ Architecture Overview

### **System Components**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Database      │
│   (Future)      │◄──►│   Express.js    │◄──►│   MongoDB       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   Auth0         │
                       │   Authentication│
                       └─────────────────┘
```

### **Feature Modules**
- **Tenants**: Multi-tenant management and isolation
- **Users**: User management and authentication
- **Projects**: Project management and collaboration
- **Files**: File management and cloud storage
- **Auth**: Authentication and authorization

## 🔧 Development Commands

### **Core Commands**
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # TypeScript validation
npm run format          # Format code with Prettier

# Testing
npm run test            # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests
npm run test:coverage   # Generate coverage report
npm run test:watch      # Run tests in watch mode

# Database
npm run db:seed         # Seed development database
npm run db:migrate      # Run database migrations
npm run db:reset        # Reset database

# Deployment
npm run deploy:staging     # Deploy to staging
npm run deploy:production  # Deploy to production
```

### **Git Workflow**
```bash
# Feature development
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name

# Commit with conventional format
git add .
git commit -m "feat: add user authentication"

# Push and create PR
git push -u origin feature/your-feature-name
# Create PR on GitHub
```

## 🔐 Authentication & Security

### **Auth0 Configuration**
```env
# Required environment variables
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://api.mwap.local
```

### **JWT Token Structure**
```typescript
interface JWTPayload {
  sub: string;           // Auth0 user ID
  email: string;         // User email
  name: string;          // User name
  tenantId: string;      // Tenant ID
  role: UserRole;        // User role
  permissions: string[]; // User permissions
}
```

### **Role Hierarchy**
```
SUPERADMIN (Level 3)
    ↓
TENANT_OWNER (Level 2)
    ↓
PROJECT_MEMBER (Level 1)
```

### **Common Permissions**
- `tenant:read`, `tenant:write`, `tenant:admin`
- `project:read`, `project:write`, `project:admin`
- `file:read`, `file:write`, `file:delete`
- `user:read`, `user:write`, `user:admin`

## 📊 Database Quick Reference

### **Core Collections**
```typescript
// Tenants
{
  _id: ObjectId,
  name: string,
  domain: string,
  status: 'active' | 'suspended' | 'archived',
  ownerId: string,
  settings: { maxUsers, maxProjects, maxStorage }
}

// Users
{
  auth0Id: string,        // Primary key
  email: string,
  tenantId: ObjectId,
  role: 'superadmin' | 'tenant_owner' | 'project_member',
  isActive: boolean
}

// Projects
{
  _id: ObjectId,
  name: string,
  tenantId: ObjectId,     // Tenant isolation
  projectTypeId: ObjectId,
  status: 'active' | 'archived' | 'draft',
  createdBy: string
}
```

### **Query Patterns**
```typescript
// Tenant-aware queries (ALWAYS include tenantId)
const projects = await Project.find({
  tenantId: new ObjectId(userTenantId),
  status: 'active'
});

// User access check
const hasAccess = await ProjectMember.findOne({
  projectId,
  userId: userAuth0Id,
  status: 'active'
});
```

## 🌐 API Quick Reference

### **Authentication Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Common Endpoints**
```http
# Health Check
GET /health

# Authentication
POST /api/v1/auth/login
GET  /api/v1/auth/profile
POST /api/v1/auth/logout

# Tenants
GET    /api/v1/tenants
POST   /api/v1/tenants
GET    /api/v1/tenants/:id
PUT    /api/v1/tenants/:id
DELETE /api/v1/tenants/:id

# Projects
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PUT    /api/v1/projects/:id
DELETE /api/v1/projects/:id

# Project Members
GET    /api/v1/projects/:id/members
POST   /api/v1/projects/:id/members
DELETE /api/v1/projects/:id/members/:userId

# Files
GET    /api/v1/files
POST   /api/v1/files/upload
GET    /api/v1/files/:id
DELETE /api/v1/files/:id
GET    /api/v1/files/:id/download
```

### **Response Format**
```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string,
  meta?: {
    page: number,
    limit: number,
    total: number
  }
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

## 🧪 Testing Quick Reference

### **Test Structure**
```
src/features/{feature}/__tests__/
├── {feature}.service.test.ts      # Unit tests
├── {feature}.controller.test.ts   # Controller tests
├── {feature}.integration.test.ts  # Integration tests
└── {feature}.fixtures.ts          # Test data
```

### **Test Patterns**
```typescript
// Unit test example
describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create project with valid data', async () => {
      // Arrange
      const projectData = { name: 'Test Project' };
      vi.mocked(projectRepository.create).mockResolvedValue(mockProject);
      
      // Act
      const result = await projectService.createProject(tenantId, userId, projectData);
      
      // Assert
      expect(result.name).toBe(projectData.name);
    });
  });
});

// Integration test example
describe('Projects API', () => {
  it('should create project via API', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Project' })
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
```

### **Test Utilities**
```typescript
// Generate test JWT
const testToken = generateTestJWT({
  sub: 'auth0|test-user',
  tenantId: 'test-tenant-id',
  role: 'project_member'
});

// Setup test database
beforeEach(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  await cleanupTestDatabase();
});
```

## 🚀 Deployment Quick Reference

### **Environment Variables**
```env
# Core
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://...

# Authentication
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
CORS_ORIGIN=https://your-domain.com

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

### **Deployment Commands**
```bash
# Build for production
npm run build

# Start production server
npm start

# Health check
curl https://your-api.com/health

# Deploy to Heroku
git push heroku main
```

### **Health Checks**
```http
GET /health
# Response: {"status":"healthy","timestamp":"..."}

GET /health/database
# Response: {"status":"connected","latency":"5ms"}

GET /health/auth0
# Response: {"status":"connected","domain":"..."}
```

## 🔍 Troubleshooting Quick Fixes

### **Common Issues**
```bash
# Port already in use
lsof -ti:3000 | xargs kill -9

# Node modules corruption
rm -rf node_modules package-lock.json
npm install

# TypeScript errors
npm run type-check
# Fix reported errors

# Database connection issues
# Check MONGODB_URI in .env
# Verify network access in MongoDB Atlas

# Auth0 authentication issues
# Verify AUTH0_DOMAIN, CLIENT_ID, CLIENT_SECRET
# Check callback URLs in Auth0 dashboard
```

### **Debug Commands**
```bash
# Enable debug logging
DEBUG=mwap:* npm run dev

# Check environment variables
node -e "console.log(process.env)"

# Test database connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('DB Connected'))
  .catch(err => console.error('DB Error:', err));
"
```

## 📝 Code Patterns

### **Feature Module Structure**
```typescript
// feature.routes.ts
router.post('/', 
  authMiddleware,
  validateRequest(createSchema),
  featureController.create
);

// feature.controller.ts
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, userId } = req.user!;
    const data = req.validatedBody as CreateRequest;
    
    const result = await featureService.create(tenantId, userId, data);
    
    res.status(201).json(new SuccessResponse(result, 'Created successfully'));
  } catch (error) {
    next(error);
  }
};

// feature.service.ts
export class FeatureService {
  async create(tenantId: string, userId: string, data: CreateRequest) {
    // Validate tenant access
    await this.validateTenantAccess(tenantId, userId);
    
    // Business logic
    const result = await this.repository.create({
      ...data,
      tenantId: new ObjectId(tenantId),
      createdBy: userId
    });
    
    return result;
  }
}
```

### **Error Handling**
```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
  }
}

// Usage
throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

// Error middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }
  
  // Handle other errors...
};
```

### **Validation Patterns**
```typescript
// Zod schema
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  projectTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  visibility: z.enum(['private', 'team', 'public']).default('team')
});

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        });
      }
      next(error);
    }
  };
};
```

## 📚 Documentation Links

### **Essential Reading**
- **[Navigation Guide](./NAVIGATION.md)** - Complete documentation navigation
- **[Developer Onboarding](./02-Architecture/developer-onboarding.md)** - Step-by-step setup
- **[API Documentation](./04-Backend/API-v3.md)** - Complete API reference
- **[Contributing Guide](./08-Contribution/contributing.md)** - Contribution workflow

### **Architecture & Design**
- **[System Architecture](./02-Architecture/diagrams/system-architecture.md)** - Visual system overview
- **[Component Structure](./02-Architecture/component-structure.md)** - Component relationships
- **[Database Schema](./02-Architecture/database-schema.md)** - Data architecture

### **Development Standards**
- **[Development Guide](./07-Standards/development-guide.md)** - Complete standards
- **[Naming Conventions](./07-Standards/naming.md)** - Naming standards
- **[Commit Style](./07-Standards/commit-style.md)** - Git conventions

---

## 🆘 Need Help?

1. **Check Documentation**: Use the [Navigation Guide](./NAVIGATION.md) to find relevant docs
2. **Search Issues**: Look for similar issues in the GitHub repository
3. **Ask Questions**: Create an issue with the `question` label
4. **Join Discussions**: Participate in team communication channels
5. **Request Help**: Tag team members for assistance

---

*This quick reference provides essential information for daily MWAP development. Bookmark this page for quick access to commands, patterns, and troubleshooting solutions.*