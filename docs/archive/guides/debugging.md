# Debugging Guide

This guide covers debugging techniques, troubleshooting common issues, and investigation workflows for the MWAP backend.

## 🔍 Debugging Tools

### Application Logging
```typescript
// Structured logging throughout the application
import { logInfo, logError, logWarning } from '../utils/logger';

// Log with context
logInfo('User action completed', {
  userId: user.sub,
  action: 'createProject',
  projectId: result._id,
  duration: Date.now() - startTime
});

// Error logging with full context
logError('Database operation failed', {
  operation: 'insertProject',
  userId: user.sub,
  error: error.message,
  stack: error.stack
});
```

### Development Environment
```bash
# Start with detailed logging
npm run dev

# Enable Node.js debugging
NODE_OPTIONS="--inspect" npm run dev

# Connect Chrome DevTools
# Navigate to chrome://inspect
```

### Production Logging
```bash
# Heroku logs
heroku logs --tail
heroku logs --source app --dyno web

# Filter by level
heroku logs --tail | grep ERROR
heroku logs --tail | grep "JWT authentication"
```

## 🚨 Common Issues

### Authentication Problems

#### JWT Token Issues
```bash
# Error: jwt malformed
→ Check Authorization header format: "Bearer <token>"
→ Verify token is properly encoded
→ Check for extra whitespace or newlines

# Error: jwt audience invalid
→ Verify AUTH0_AUDIENCE matches API identifier
→ Check Auth0 API configuration

# Error: Unable to verify signature
→ Verify AUTH0_DOMAIN is correct
→ Check Auth0 tenant configuration
→ Ensure JWKS endpoint is accessible
```

**Debug Steps:**
```typescript
// Add debug logging to auth middleware
export const authenticateJWT = () => {
  const middleware = jwt({
    secret: async (req) => {
      const token = req.headers.authorization?.split(' ')[1];
      
      logInfo('JWT Debug', {
        hasAuthHeader: !!req.headers.authorization,
        headerFormat: req.headers.authorization?.substring(0, 20),
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20)
      });
      
      // ... rest of implementation
    }
  });
};
```

#### Permission Denied
```bash
# Error: Insufficient permissions
→ Check user roles with GET /api/v1/users/me/roles
→ Verify middleware order in routes
→ Check tenant/project ownership

# Error: User not found in superadmins
→ Add user to superadmins collection manually
→ Verify user ID matches Auth0 subject
```

### Database Issues

#### Connection Problems
```bash
# Error: MongoNetworkError
→ Check MONGODB_URI format
→ Verify MongoDB server is running
→ Check network connectivity
→ Verify credentials and permissions

# Error: Authentication failed
→ Check MongoDB username/password
→ Verify database exists
→ Check user permissions on database
```

**Debug Steps:**
```typescript
// Add connection monitoring
import { getDB } from '../config/db';

// Test connection
export async function testConnection() {
  try {
    const db = getDB();
    const result = await db.admin().ping();
    logInfo('Database connection test', { status: 'success', result });
  } catch (error) {
    logError('Database connection failed', { 
      error: error.message,
      connectionString: process.env.MONGODB_URI?.replace(/\/\/[^@]+@/, '//***:***@')
    });
  }
}
```

#### Query Issues
```bash
# Error: BSONError: invalid ObjectId
→ Validate ObjectId format before queries
→ Check parameter extraction from request

# Slow queries
→ Add database indexes
→ Use query profiling
→ Check query structure
```

### Server Startup Issues

#### Port Already in Use
```bash
# Error: EADDRINUSE :::3001
→ Kill existing process: lsof -ti:3001 | xargs kill
→ Change PORT environment variable
→ Check for duplicate server instances
```

#### Environment Variables
```bash
# Error: Environment variable required
→ Check .env file exists and is loaded
→ Verify variable names and values
→ Check for typos in variable names

# Error: Invalid environment configuration
→ Run environment validation
→ Check Zod schema requirements
```

### API Response Issues

#### 404 Not Found
```bash
# API endpoints returning 404
→ Verify route registration order
→ Check dynamic import paths
→ Ensure middleware doesn't interfere
→ Verify route patterns match requests
```

**Debug Route Registration:**
```typescript
// Add route debugging
export async function registerRoutes(): Promise<void> {
  logInfo('🔁 Registering routes...');
  
  // Log each route registration
  const routes = [
    { path: '/api/v1/tenants', module: 'tenants' },
    { path: '/api/v1/projects', module: 'projects' }
  ];
  
  for (const route of routes) {
    try {
      // Dynamic import and registration
      logInfo(`✅ Route registered: ${route.path}`);
    } catch (error) {
      logError(`❌ Route registration failed: ${route.path}`, error);
    }
  }
}
```

#### Unexpected Response Format
```bash
# Missing success/error wrapper
→ Check controller uses jsonResponse/errorResponse
→ Verify error handler middleware is applied
→ Check for direct res.json() usage
```

## 🛠️ Debugging Workflows

### API Request Debugging

#### Step 1: Request Validation
```bash
# Check request format
curl -X POST https://api.domain.com/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Test Tenant"}' \
  -v
```

#### Step 2: Server Logs
```typescript
// Add request debugging middleware
app.use((req, res, next) => {
  logInfo('Incoming request', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});
```

#### Step 3: Response Analysis
```typescript
// Add response debugging
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    logInfo('Outgoing response', {
      statusCode: res.statusCode,
      path: req.path,
      responseSize: data?.length || 0,
      responsePreview: typeof data === 'string' ? data.substring(0, 200) : data
    });
    return originalSend.call(this, data);
  };
  next();
});
```

### Database Query Debugging

#### Step 1: Query Logging
```typescript
// Add query debugging
export async function findTenantById(id: string) {
  const startTime = Date.now();
  
  logInfo('Database query start', {
    operation: 'findTenantById',
    collection: 'tenants',
    query: { _id: id }
  });
  
  try {
    const result = await db.collection('tenants').findOne({ 
      _id: new ObjectId(id) 
    });
    
    logInfo('Database query success', {
      operation: 'findTenantById',
      duration: Date.now() - startTime,
      found: !!result
    });
    
    return result;
  } catch (error) {
    logError('Database query failed', {
      operation: 'findTenantById',
      duration: Date.now() - startTime,
      error: error.message
    });
    throw error;
  }
}
```

#### Step 2: Query Performance
```typescript
// MongoDB profiler
db.setProfilingLevel(2); // Profile all operations
db.system.profile.find().limit(5).sort({ ts: -1 });
```

### Authentication Flow Debugging

#### Step 1: Token Inspection
```bash
# Decode JWT token (header and payload only)
echo "<token>" | cut -d. -f1 | base64 -d
echo "<token>" | cut -d. -f2 | base64 -d
```

#### Step 2: Auth0 Configuration
```bash
# Test JWKS endpoint
curl https://your-tenant.auth0.com/.well-known/jwks.json

# Verify token with Auth0
curl -X POST https://your-tenant.auth0.com/userinfo \
  -H "Authorization: Bearer <token>"
```

#### Step 3: Backend Validation
```typescript
// Test JWT validation manually
import { jwksClient } from '../config/auth0';

async function debugTokenValidation(token: string) {
  try {
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
    logInfo('Token header', header);
    
    const key = await jwksClient.getSigningKey(header.kid);
    logInfo('Signing key retrieved', { kid: header.kid });
    
    // Continue with verification...
  } catch (error) {
    logError('Token validation debug failed', error);
  }
}
```

## 🔧 Development Tools

### Postman/Insomnia Setup
```json
{
  "name": "MWAP API",
  "variables": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    },
    {
      "key": "token",
      "value": "{{auth0_token}}"
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}"
      }
    ]
  }
}
```

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.ts",
      "runtimeArgs": ["-r", "tsx/cjs"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "node"
    }
  ]
}
```

### Database Debugging
```bash
# MongoDB Compass connection
mongodb://localhost:27017/mwap_dev

# CLI debugging
mongo mwap_dev
> db.tenants.find().pretty()
> db.users.find({userId: "auth0|123"})
> db.projects.find({"members.userId": "auth0|123"})
```

## 🧪 Testing & Validation

### API Testing
```bash
# Health check
curl http://localhost:3001/health

# Auth test
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/v1/users/me/roles

# Database test
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Debug Tenant"}'
```

### Environment Validation
```typescript
// Create debug endpoint
router.get('/debug/env', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not available in production' });
  }
  
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    MONGODB_URI: process.env.MONGODB_URI?.replace(/\/\/[^@]+@/, '//***:***@'),
    hasAllRequired: !!(process.env.AUTH0_DOMAIN && process.env.AUTH0_AUDIENCE && process.env.MONGODB_URI)
  });
});
```

## 📊 Performance Debugging

### Response Time Analysis
```typescript
// Performance monitoring middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (duration > 1000) { // Log slow requests
      logWarning('Slow request detected', {
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
});
```

### Memory Usage
```typescript
// Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  
  logInfo('Memory usage', {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
    external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
  });
}, 60000); // Every minute
```

## 📖 Related Documentation

- **[Development Guide](../07-Standards/development-guide.md)** - Development workflow
- **[Auth0 Implementation](../04-Backend/auth0.md)** - Authentication details
- **[Express Structure](../04-Backend/express-structure.md)** - Server architecture

---

*Effective debugging requires systematic investigation and thorough logging throughout the application.* 