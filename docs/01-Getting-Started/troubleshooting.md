# Troubleshooting Guide

This guide helps resolve common issues encountered during MWAP development, testing, and deployment.

## 🚨 Common Development Issues

### Node.js and npm Issues

#### Problem: Node.js Version Conflicts
```bash
# Error message
Error: The engine "node" is incompatible with this module

# Solution: Check Node.js version
node --version
# Should be v20.x.x or later

# Fix: Update Node.js
# Download from nodejs.org or use version manager
nvm install 20
nvm use 20
```

#### Problem: npm Permission Errors
```bash
# Error message
EACCES: permission denied

# Solution: Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Alternative: Use npx for one-time commands
npx create-app my-app
```

#### Problem: Package Installation Failures
```bash
# Error message
npm ERR! network timeout

# Solution: Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Alternative: Use different registry
npm install --registry https://registry.npmjs.org/
```

### TypeScript Issues

#### Problem: TypeScript Compilation Errors
```bash
# Error message
TS2307: Cannot find module 'xyz'

# Solution: Check imports and dependencies
# 1. Verify module is installed
npm list xyz

# 2. Check import path
import { something } from './correct/path';

# 3. Restart TypeScript service in editor
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

#### Problem: Type Definition Issues
```bash
# Error message
TS7016: Could not find a declaration file for module 'xyz'

# Solution: Install type definitions
npm install --save-dev @types/xyz

# Or add to tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

### Environment and Configuration Issues

#### Problem: Environment Variables Not Loading
```bash
# Error message
Missing required environment variable: MONGODB_URI

# Solution: Check .env file
# 1. Verify .env file exists in project root
ls -la .env

# 2. Check .env format (no spaces around =)
NODE_ENV=development
MONGODB_URI=mongodb+srv://...

# 3. Restart development server
npm run dev

# 4. Debug environment loading
console.log('NODE_ENV:', process.env.NODE_ENV);
```

#### Problem: Port Already in Use
```bash
# Error message
EADDRINUSE: address already in use :::3000

# Solution: Find and kill process
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Alternative: Use different port
PORT=3001 npm run dev
```

## 🗄️ Database Issues

### MongoDB Connection Problems

#### Problem: Authentication Failed
```bash
# Error message
MongoServerError: bad auth: authentication failed

# Solution: Check credentials
# 1. Verify username/password in MONGODB_URI
mongodb+srv://correct-username:correct-password@cluster.mongodb.net/

# 2. Check database user permissions in Atlas
# - Go to Database Access
# - Verify user has atlasAdmin role (or appropriate permissions)

# 3. URL encode special characters in password
# Replace @ with %40, + with %2B, etc.
```

#### Problem: Network Access Denied
```bash
# Error message
MongoNetworkError: connection timed out

# Solution: Configure IP whitelist
# 1. Go to MongoDB Atlas → Network Access
# 2. Add current IP address
# 3. For development, can use 0.0.0.0/0 (not for production!)

# Get current IP
curl ifconfig.me

# Test connection
ping cluster0.abc123.mongodb.net
```

#### Problem: SSL/TLS Connection Issues
```bash
# Error message
MongoServerError: SSL handshake failed

# Solution: Update connection string
# Add SSL parameters
mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority&ssl=true

# Or disable SSL for local development (not recommended)
mongodb://localhost:27017/mwap-dev
```

### Database Operation Issues

#### Problem: Duplicate Key Errors
```bash
# Error message
E11000 duplicate key error collection

# Solution: Handle unique constraints
try {
  await collection.insertOne(document);
} catch (error) {
  if (error.code === 11000) {
    throw new Error('Resource already exists');
  }
  throw error;
}
```

#### Problem: Query Performance Issues
```bash
# Symptom: Slow database queries

# Solution: Add indexes
await db.collection('tenants').createIndex({ ownerId: 1 });
await db.collection('projects').createIndex({ tenantId: 1, name: 1 });

# Check query performance
db.collection.find({}).explain('executionStats');
```

## 🔐 Authentication Issues

### Auth0 Configuration Problems

#### Problem: JWT Token Validation Failed
```bash
# Error message
UnauthorizedError: jwt malformed

# Solution: Check Auth0 configuration
# 1. Verify AUTH0_DOMAIN (without https://)
AUTH0_DOMAIN=your-tenant.auth0.com

# 2. Verify AUTH0_AUDIENCE matches API identifier
AUTH0_AUDIENCE=https://api.mwap.dev

# 3. Check token format in request
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

# 4. Test JWT at jwt.io
```

#### Problem: CORS Errors with Auth0
```bash
# Error message
Access to fetch at 'auth0.com' from origin 'localhost:5173' has been blocked by CORS

# Solution: Configure Auth0 application settings
# 1. Allowed Web Origins: http://localhost:5173
# 2. Allowed Callback URLs: http://localhost:5173/callback
# 3. Allowed Logout URLs: http://localhost:5173
```

#### Problem: Token Refresh Issues
```bash
# Error message
invalid_grant: Invalid refresh token

# Solution: Check refresh token configuration
# 1. Enable refresh tokens in Auth0 application
# 2. Set rotation settings appropriately
# 3. Handle token expiration in frontend

// Frontend token refresh logic
if (error.status === 401) {
  try {
    await auth0.getTokenSilently();
    // Retry original request
  } catch (refreshError) {
    // Redirect to login
  }
}
```

## 🧪 Testing Issues

### Test Environment Problems

#### Problem: Tests Failing Due to Environment
```bash
# Error message
TypeError: Cannot read properties of undefined (reading 'MONGODB_URI')

# Solution: Set up test environment
# 1. Create .env.test file
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/mwap-test

# 2. Load test environment in setupTests.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

# 3. Use different database for tests
const testDb = process.env.NODE_ENV === 'test' ? 'mwap-test' : 'mwap';
```

#### Problem: Test Database Cleanup Issues
```bash
# Symptom: Tests interfering with each other

# Solution: Proper test cleanup
beforeEach(async () => {
  // Clear test collections
  await db.collection('tenants').deleteMany({});
  await db.collection('projects').deleteMany({});
});

afterAll(async () => {
  // Close database connection
  await mongoose.connection.close();
});
```

#### Problem: Mock Issues
```bash
# Error message
Module not found: Can't resolve 'fs'

# Solution: Configure mocks properly
// In vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setupTests.ts']
  }
});

// Mock external modules
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn()
}));
```

## 🚀 Deployment Issues

### Build and Compilation Problems

#### Problem: TypeScript Build Errors
```bash
# Error message
TS2322: Type 'string | undefined' is not assignable to type 'string'

# Solution: Handle undefined environment variables
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI is required');
}

// Or use type assertion with validation
const mongoUri = process.env.MONGODB_URI as string;
if (!mongoUri) {
  process.exit(1);
}
```

#### Problem: Module Resolution in Production
```bash
# Error message
Cannot find module './src/app.js'

# Solution: Check build output and paths
# 1. Verify dist/ folder is created
npm run build
ls -la dist/

# 2. Check package.json scripts
{
  "start": "node dist/app.js",
  "build": "tsc"
}

# 3. Verify tsconfig.json outDir
{
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### Docker Issues

#### Problem: Docker Build Failures
```bash
# Error message
npm ERR! network timeout

# Solution: Optimize Dockerfile
# Use npm ci instead of npm install
RUN npm ci --only=production

# Add .dockerignore
node_modules
npm-debug.log
.env
.git
```

#### Problem: Container Health Check Failures
```bash
# Error message
Health check failed

# Solution: Verify health check endpoint
# 1. Test health endpoint locally
curl http://localhost:3000/health

# 2. Update Dockerfile health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 3. Check container logs
docker logs container-name
```

### Cloud Deployment Issues

#### Problem: Heroku Deployment Failures
```bash
# Error message
Build failed

# Solution: Check Heroku requirements
# 1. Verify package.json engines
{
  "engines": {
    "node": "20.x",
    "npm": "10.x"
  }
}

# 2. Check Procfile
web: npm start

# 3. Set required environment variables
heroku config:set NODE_ENV=production
```

#### Problem: SSL Certificate Issues
```bash
# Error message
SSL_ERROR_BAD_CERT_DOMAIN

# Solution: Configure SSL properly
# 1. Verify domain configuration
# 2. Check certificate validity
# 3. Update DNS records if needed

# Test SSL
curl -I https://your-domain.com
```

## 🔧 Performance Issues

### Slow API Response Times

#### Problem: Database Query Performance
```bash
# Symptom: API responses > 1000ms

# Solution: Optimize queries
# 1. Add appropriate indexes
await db.collection('projects').createIndex({ tenantId: 1, archived: 1 });

# 2. Use aggregation pipelines for complex queries
const pipeline = [
  { $match: { tenantId: new ObjectId(tenantId) } },
  { $lookup: { from: 'projectMembers', localField: '_id', foreignField: 'projectId', as: 'members' } },
  { $limit: 20 }
];

# 3. Implement pagination
const projects = await db.collection('projects')
  .find({ tenantId })
  .limit(20)
  .skip(page * 20)
  .toArray();
```

#### Problem: Memory Leaks
```bash
# Symptom: Increasing memory usage over time

# Solution: Identify and fix leaks
# 1. Use Node.js built-in profiler
node --inspect app.js

# 2. Monitor memory usage
process.memoryUsage();

# 3. Common causes and fixes
// Fix: Properly close database connections
await client.close();

// Fix: Clear timers and intervals
clearInterval(intervalId);

// Fix: Remove event listeners
emitter.removeAllListeners();
```

## 📊 Monitoring and Debugging

### Application Logging

#### Problem: Missing Log Information
```bash
# Solution: Improve logging
import { logger } from '../utils/logger';

// Add structured logging
logger.info('User action', {
  userId: user.id,
  action: 'project_created',
  projectId: project.id,
  timestamp: new Date().toISOString()
});

// Log errors with context
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  connectionString: 'mongodb://...' // Without credentials
});
```

#### Problem: Performance Debugging
```bash
# Solution: Add performance monitoring
const startTime = process.hrtime.bigint();

// ... operation ...

const endTime = process.hrtime.bigint();
const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

logger.info('Operation completed', {
  operation: 'createProject',
  duration: `${duration}ms`,
  success: true
});
```

## 🆘 Emergency Procedures

### Application Down

#### Immediate Response
1. **Check health endpoint**: `curl https://api.mwap.com/health`
2. **Check server logs**: `heroku logs --tail` or `docker logs container-name`
3. **Verify external services**: MongoDB Atlas, Auth0 status pages
4. **Check recent deployments**: Review last changes

#### Recovery Steps
```bash
# 1. Rollback to last known good version
heroku rollback v123

# 2. Scale up if resource issue
heroku ps:scale web=2

# 3. Restart application
heroku restart

# 4. Monitor recovery
watch curl -s -o /dev/null -w "%{http_code}" https://api.mwap.com/health
```

### Database Issues

#### Emergency Database Access
```bash
# Connect to production database (careful!)
mongosh "mongodb+srv://cluster.mongodb.net/" --username admin

# Check database status
db.runCommand("serverStatus")

# Check slow operations
db.currentOp()

# Emergency: Kill slow operation
db.killOp(opId)
```

## 📞 Getting Help

### Internal Resources
1. **Documentation**: Check relevant guides in `/docs`
2. **Team Chat**: Reach out to team members
3. **Git History**: Review recent changes and commits
4. **Issue Tracker**: Search for similar issues

### External Resources
1. **Stack Overflow**: Search for specific error messages
2. **GitHub Issues**: Check repositories for known issues
3. **Official Documentation**: Node.js, MongoDB, Auth0, Express
4. **Community Forums**: MongoDB Community, Auth0 Community

### Creating Bug Reports
```markdown
## Bug Report Template

### Environment
- Node.js version: 20.x.x
- npm version: 10.x.x
- OS: macOS/Windows/Linux
- Browser (if applicable): Chrome 120.x

### Expected Behavior
Describe what should happen

### Actual Behavior
Describe what actually happens

### Steps to Reproduce
1. Step one
2. Step two
3. Step three

### Error Messages
```
Paste error messages here
```

### Additional Context
Any other relevant information
```

---

*This troubleshooting guide is continuously updated based on common issues encountered by the MWAP development team.* 