# Development Guide

This document outlines general development practices, workflow, and standards for the MWAP project.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6.0+
- Git
- Auth0 account (development tenant)

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
```

## 🏗️ Project Structure

### Directory Organization
```
mwapserver/
├── src/
│   ├── features/          # Feature-based modules
│   ├── middleware/        # Express middleware
│   ├── config/           # Configuration files
│   ├── utils/            # Shared utilities
│   ├── schemas/          # Zod validation schemas
│   └── services/         # Business logic services
├── docs/                 # Documentation
├── tests/               # Test files
└── scripts/             # Build and utility scripts
```

### Feature Module Structure
```
src/features/example/
├── example.routes.ts     # Express routes
├── example.controller.ts # HTTP handlers
├── example.service.ts    # Business logic
└── example.types.ts      # TypeScript types
```

## 🔄 Development Workflow

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/add-user-management

# 2. Make changes with descriptive commits
git commit -m "feat: add user role validation middleware"

# 3. Push and create pull request
git push origin feature/add-user-management
```

### Commit Standards
```bash
# Format: type(scope): description
feat(auth): add JWT validation middleware
fix(api): resolve tenant creation bug
docs(readme): update installation instructions
test(users): add role validation tests
refactor(db): optimize query performance
```

### Branch Naming
```
feature/description       # New features
fix/description          # Bug fixes
docs/description         # Documentation updates
refactor/description     # Code refactoring
test/description         # Test additions
```

## 💻 Development Practices

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for consistent formatting
- **Prettier**: Automatic code formatting
- **File Naming**: kebab-case for files, PascalCase for classes

### API Development
```typescript
// ✅ Good API handler pattern
export async function getUsers(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const users = await userService.getAllUsers();
  return jsonResponse(res, 200, users);
}

// ❌ Avoid inline business logic
export async function getUsers(req: Request, res: Response) {
  const users = await db.collection('users').find().toArray();
  res.json(users);
}
```

### Error Handling
```typescript
// ✅ Use consistent error patterns
throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

// ✅ Wrap async route handlers
router.get('/', wrapAsyncHandler(getUsers));

// ❌ Don't let errors crash the app
// async function handler() { await riskyOperation(); } // Missing try/catch
```

### Database Interactions
```typescript
// ✅ Use service layer
const user = await userService.createUser(userData);

// ✅ Validate input with Zod
const validatedData = createUserSchema.parse(req.body);

// ❌ Direct database access in controllers
// const user = await db.collection('users').insertOne(userData);
```

## 🧪 Testing Strategy

### Testing Structure
```
tests/
├── integration/         # API endpoint tests
├── unit/               # Individual function tests
├── fixtures/           # Test data
└── utils/              # Test utilities
```

### Test Patterns
```typescript
// Unit test example
describe('UserService', () => {
  describe('createUser', () => {
    it('creates user with valid data', async () => {
      const userData = { name: 'John', email: 'john@example.com' };
      const result = await userService.createUser(userData);
      
      expect(result).toMatchObject(userData);
      expect(result._id).toBeDefined();
    });
  });
});

// Integration test example
describe('POST /api/v1/users', () => {
  it('creates user successfully', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201);
      
    expect(response.body.data.name).toBe('John');
  });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- users.test.ts

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## 🔐 Security Practices

### Authentication
- All API endpoints require JWT authentication
- Use `getUserFromToken(req)` to extract user information
- Apply role-based middleware for authorization

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

### Error Information
```typescript
// ✅ Safe error messages
throw new ApiError('Invalid credentials', 401, 'AUTH_INVALID');

// ❌ Don't expose internals
// throw new Error(`Database connection failed: ${dbError.message}`);
```

## 📝 Documentation Standards

### Code Documentation
```typescript
/**
 * Creates a new user with the specified data
 * @param userData - User creation data
 * @returns Created user object
 * @throws ApiError when validation fails
 */
export async function createUser(userData: CreateUserData): Promise<User> {
  // Implementation
}
```

### API Documentation
- Document all endpoints in OpenAPI format
- Include request/response examples
- Specify authentication requirements
- Document error responses

### README Updates
- Keep setup instructions current
- Document environment variables
- Include troubleshooting common issues

## 🚀 Deployment

### Environment Setup
```bash
# Development
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/mwap_dev

# Production
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://cluster/mwap
```

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] API documentation updated
- [ ] Security headers configured

## 🛠️ Tools and Scripts

### Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run test suite
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Database Scripts
```bash
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
npm run db:reset     # Reset development database
```

## 🐛 Debugging

### Development Debugging
```typescript
// Use structured logging
import { logInfo, logError } from '../utils/logger';

logInfo('Processing user request', { 
  userId: user.sub, 
  endpoint: req.path 
});
```

### Common Issues
```bash
# MongoDB connection issues
Error: MongoNetworkError
→ Check MONGODB_URI and server status

# Auth0 token validation
Error: jwt malformed
→ Verify AUTH0_DOMAIN and AUTH0_AUDIENCE

# Port already in use
Error: EADDRINUSE :::3001
→ Change PORT or kill existing process
```

## 🔍 Code Review Guidelines

### What to Review
- **Security**: Input validation, authentication, authorization
- **Performance**: Database queries, response times
- **Maintainability**: Code clarity, consistent patterns
- **Testing**: Adequate test coverage, edge cases

### Review Checklist
- [ ] Code follows project conventions
- [ ] All new endpoints are tested
- [ ] Documentation is updated
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

## 📊 Performance

### Best Practices
- Use database indexes for frequent queries
- Implement request validation to prevent malicious input
- Apply rate limiting to prevent abuse
- Use structured logging for monitoring

### Monitoring
```typescript
// Track request performance
const startTime = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - startTime;

logInfo('Operation completed', { 
  operation: 'expensiveOperation',
  duration,
  success: true 
});
```

## 📖 Related Documentation

- **[Coding Standards](coding-standards.md)** - Detailed code style rules
- **[Environment Variables](.env-format.md)** - Configuration management
- **[API Documentation](../04-Backend/API-v3.md)** - Complete API reference

---

*Following these practices ensures consistent, maintainable, and secure code across the team.* 