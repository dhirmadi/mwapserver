# Quick Start Guide

Get up and running with MWAP development in under 15 minutes.

## 🚀 Prerequisites

Before you begin, ensure you have:
- **Node.js 20+** installed ([download here](https://nodejs.org/))
- **Git** installed and configured
- **MongoDB Atlas** account (free tier works)
- **Auth0** account (free tier works)
- **Code Editor** (VS Code recommended)

## ⚡ 5-Minute Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone <repo-url>
cd mwap-server

# Install dependencies
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

Required environment variables:
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=your-mongodb-atlas-connection-string
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.mwap.dev
JWT_SECRET=your-random-secret-for-development
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 3. Quick Start
```bash
# Start development server
npm run dev

# Server should start on http://localhost:3000
# Check health: curl http://localhost:3000/health
```

## 🔧 Detailed Setup

### MongoDB Atlas Setup (2 minutes)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account and cluster
3. **Database Access**: Add user with `Atlas Admin` role
4. **Network Access**: Add your IP (or `0.0.0.0/0` for development)
5. **Connect**: Copy connection string and update `.env`

### Auth0 Setup (3 minutes)
1. Go to [Auth0](https://auth0.com/) and create account
2. **Create Application**: 
   - Name: "MWAP Development"
   - Type: "Single Page Web Applications"
3. **Create API**:
   - Name: "MWAP Backend API"  
   - Identifier: `https://api.mwap.dev`
4. **Copy values** to `.env`:
   - Domain: `your-tenant.auth0.com`
   - Audience: `https://api.mwap.dev`

### Generate Security Keys
```bash
# JWT Secret (for development only)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 🧪 Verify Your Setup

### 1. Health Check
```bash
curl http://localhost:3000/health
# Expected: {"status":"healthy","database":"connected","auth":"configured"}
```

### 2. Database Connection
```bash
# Check server logs for:
# ✓ Connected to MongoDB Atlas
# ✓ Database indexes created successfully
```

### 3. Run Tests
```bash
npm test
# All tests should pass
```

## 📝 First API Request

### Without Authentication (Health Check)
```bash
curl http://localhost:3000/health
```

### With Authentication (Get Tenants)
1. **Get Auth0 Token** (for testing):
   ```bash
   # Use Auth0 Management API or frontend login
   # For development, you can create a test script
   ```

2. **Make Authenticated Request**:
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        http://localhost:3000/api/v1/tenants
   ```

## 🎯 Development Workflow

### Daily Development
```bash
# Start development server
npm run dev

# Run tests in watch mode (separate terminal)
npm run test:watch

# Check types
npm run type-check

# Lint code
npm run lint
```

### Making Changes
1. **Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Edit code following established patterns
3. **Test**: `npm test` and manual testing
4. **Commit**: `git commit -m "descriptive message"`
5. **Push**: `git push origin feature/your-feature`

## 📚 Next Steps

### Essential Reading
1. **[Architecture Overview](../02-Architecture/overview.md)** - Understand the system design
2. **[API Documentation](../04-Backend/API-v3.md)** - Learn the API endpoints
3. **[Testing Guide](./how-to-test.md)** - Testing strategies and patterns
4. **[Security Guide](./security-guide.md)** - Security best practices

### Common Tasks
- **Add New Feature**: Follow [Feature Pattern](../features/feature-pattern.md)
- **Add New Endpoint**: Check [Backend Guide](../04-Backend/backend.md)
- **Database Changes**: See [Database Guide](../04-Backend/database.md)
- **Authentication**: Review [Auth Guide](../04-Backend/authentication.md)

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check Node.js version
node --version  # Should be 20.x.x or later

# Check for port conflicts
lsof -ti:3000   # Kill if needed: kill -9 $(lsof -ti:3000)

# Check environment variables
echo $MONGODB_URI  # Should be set
```

### Database Connection Issues
```bash
# Test MongoDB connection
mongosh "your-connection-string"

# Check IP whitelist in MongoDB Atlas
# Verify username/password in connection string
```

### Authentication Issues
```bash
# Verify Auth0 configuration
curl https://your-tenant.auth0.com/.well-known/jwks.json

# Check environment variables
echo $AUTH0_DOMAIN
echo $AUTH0_AUDIENCE
```

### Common Error Messages

#### "Cannot find module" Errors
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### "Port already in use"
```bash
# Kill process using port 3000
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

#### "MongoDB connection failed"
```bash
# Check connection string format
# Should be: mongodb+srv://username:password@cluster.mongodb.net/database

# Verify IP whitelist in MongoDB Atlas
# Check username/password
```

## 💡 Development Tips

### VS Code Setup
Install recommended extensions:
- **TypeScript and JavaScript Language Features**
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **MongoDB for VS Code** - Database browsing
- **Thunder Client** - API testing

### Useful Commands
```bash
# Watch file changes and restart server
npm run dev

# Run specific test file
npm test -- tenant.test.ts

# Check TypeScript errors
npm run type-check

# Format all code
npm run format

# Build for production
npm run build
```

### Debugging
```bash
# Start with debugger
npm run dev:debug

# Or with VS Code debugger:
# F5 -> Node.js: Launch Program
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/add-project-templates

# Make commits with clear messages
git commit -m "feat: add project template creation endpoint"

# Keep branch updated
git pull origin main
git rebase main

# Push feature branch
git push origin feature/add-project-templates
```

## 🔄 Code Patterns

### Adding a New Feature
1. **Route**: `src/features/{feature}/{feature}.routes.ts`
2. **Controller**: `src/features/{feature}/{feature}.controller.ts`
3. **Service**: `src/features/{feature}/{feature}.service.ts`
4. **Schema**: `src/schemas/{feature}.schema.ts`
5. **Tests**: `tests/features/{feature}/`

### Example: Add New Endpoint
```typescript
// 1. Define schema
export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  projectId: z.string(),
});

// 2. Add route
router.post('/', validateRequest(CreateTaskSchema), controller.create);

// 3. Add controller method
create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await this.service.create(req.body);
    return successResponse(res, task, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// 4. Add service method
async create(data: CreateTaskRequest): Promise<Task> {
  const task = { ...data, createdAt: new Date() };
  const result = await this.collection.insertOne(task);
  return { ...task, _id: result.insertedId };
}
```

## 📖 Additional Resources

### Documentation
- **[Full Documentation](../README.md)** - Complete guide index
- **[API Reference](../04-Backend/API-v3.md)** - Detailed API documentation
- **[Frontend API Integration](../03-Frontend/README.md)** - Backend API integration for React

### External Resources
- **[Express.js Guide](https://expressjs.com/en/guide/)**
- **[MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/)**
- **[Auth0 Node.js SDK](https://auth0.com/docs/quickstart/backend/nodejs)**
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)**

## 🎉 You're Ready!

You now have a fully functional MWAP development environment. Start building amazing features!

### What's Next?
- Explore the codebase and understand the architecture
- Try creating a simple API endpoint
- Add tests for your new features
- Read the contributing guidelines
- Join the development discussions

**Happy coding! 🚀**

---

*This quick start guide gets you from zero to productive MWAP development in minutes.* 