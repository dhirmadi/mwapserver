# ⚙️ MWAP Environment Setup

## 🎯 Overview

This guide provides step-by-step instructions for setting up your MWAP development environment. Follow these instructions after completing the [Prerequisites](./prerequisites.md).

## 📥 Repository Setup

### **1. Clone Repository**
```bash
# Clone the repository
git clone https://github.com/dhirmadi/mwapserver.git
cd mwapserver

# Verify repository structure
ls -la
# Should show: src/, docs/, scripts/, package.json, etc.
```

### **2. Install Dependencies**
```bash
# Install all project dependencies
npm install

# Verify installation
npm list --depth=0
# Should show all dependencies without errors
```

### **3. Verify Project Structure**
```bash
# Check project structure
tree -I 'node_modules|.git' -L 2
```

Expected structure:
```
mwapserver/
├── src/
│   ├── features/
│   ├── middleware/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── docs/
├── scripts/
├── tests/
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 🔧 Environment Configuration

### **1. Create Environment File**
```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env  # or use your preferred editor
```

### **2. Configure Environment Variables**

#### **Database Configuration**
```bash
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap-dev?retryWrites=true&w=majority

# Database name for development
DB_NAME=mwap-development

# Test database (separate from development)
TEST_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap-test?retryWrites=true&w=majority
```

**MongoDB Atlas Setup:**
1. Log into [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your cluster
3. Click "Connect" → "Connect your application"
4. Copy connection string and replace `<username>`, `<password>`, and `<database>`

#### **Auth0 Configuration**
```bash
# Auth0 domain (from Auth0 dashboard)
AUTH0_DOMAIN=your-tenant.auth0.com

# Auth0 application credentials
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Auth0 API identifier
AUTH0_AUDIENCE=https://api.mwap.local

# JWKS endpoint (automatically constructed)
AUTH0_JWKS_URI=https://your-tenant.auth0.com/.well-known/jwks.json
```

**Auth0 Setup:**
1. Log into [Auth0 Dashboard](https://manage.auth0.com/)
2. Go to Applications → Your Application
3. Copy Domain, Client ID, and Client Secret
4. Go to APIs → Your API
5. Copy API Identifier for AUTH0_AUDIENCE

#### **Application Configuration**
```bash
# Node.js environment
NODE_ENV=development

# Server port
PORT=3000

# API version
API_VERSION=v1

# Base URL for API
API_BASE_URL=http://localhost:3000/api/v1
```

#### **Security Configuration**
```bash
# JWT secret for additional security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# CORS configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window

# Session configuration
SESSION_SECRET=your-session-secret-key
```

#### **Development Configuration**
```bash
# Logging level
LOG_LEVEL=debug

# Enable development features
ENABLE_SWAGGER=true
ENABLE_DEBUG_ROUTES=true

# File upload configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_PATH=./uploads
```

### **3. Validate Environment Configuration**
```bash
# Check environment variables
npm run env:check

# Or manually verify
node -e "
require('dotenv').config();
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');
console.log('Auth0 Domain:', process.env.AUTH0_DOMAIN ? '✓ Set' : '✗ Missing');
console.log('Auth0 Client ID:', process.env.AUTH0_CLIENT_ID ? '✓ Set' : '✗ Missing');
"
```

## 🗄️ Database Setup

### **1. Test Database Connection**
```bash
# Test MongoDB connection
npm run db:test

# Or use MongoDB Compass
# Connection string: mongodb+srv://username:password@cluster.mongodb.net/
```

### **2. Initialize Database Schema**
```bash
# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Verify database setup
npm run db:status
```

### **3. Create Database Indexes**
```bash
# Create required indexes for performance
npm run db:index

# Verify indexes
npm run db:index:list
```

## 🔐 Auth0 Configuration

### **1. Application Configuration**
In Auth0 Dashboard → Applications → Your Application:

```javascript
// Application Settings
Name: MWAP Development
Application Type: Single Page Application
Token Endpoint Authentication Method: None

// Application URIs
Allowed Callback URLs: http://localhost:3000/callback
Allowed Logout URLs: http://localhost:3000
Allowed Web Origins: http://localhost:3000
Allowed Origins (CORS): http://localhost:3000
```

### **2. API Configuration**
In Auth0 Dashboard → APIs → Your API:

```javascript
// API Settings
Name: MWAP API
Identifier: https://api.mwap.local
Signing Algorithm: RS256

// Scopes
read:profile - Read user profile
write:profile - Update user profile
read:projects - Read projects
write:projects - Create/update projects
admin:tenant - Tenant administration
```

### **3. Test Auth0 Configuration**
```bash
# Test Auth0 connection
npm run auth:test

# Get Auth0 management token
npm run auth:token

# Verify JWKS endpoint
curl https://your-tenant.auth0.com/.well-known/jwks.json
```

## 🧪 Development Server Setup

### **1. Start Development Server**
```bash
# Start in development mode
npm run dev

# Server should start on http://localhost:3000
# API available at http://localhost:3000/api/v1
```

### **2. Verify Server Status**
```bash
# Check server health
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-07-17T...","version":"3.0.0"}

# Check API documentation
open http://localhost:3000/api/docs
```

### **3. Test API Endpoints**
```bash
# Test public endpoint
curl http://localhost:3000/api/v1/status

# Test protected endpoint (requires JWT)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/v1/users/profile
```

## 🔍 Development Tools Setup

### **1. VS Code Configuration**
Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.env": true
  }
}
```

### **2. Git Configuration**
```bash
# Configure Git hooks
npm run prepare

# Set up pre-commit hooks
npx husky add .husky/pre-commit "npm run lint && npm run test"
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

### **3. Debugging Setup**
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug MWAP Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## ✅ Verification Checklist

### **Environment Verification**
```bash
# Run comprehensive verification
npm run verify:setup

# Individual checks
npm run verify:env      # Environment variables
npm run verify:db       # Database connection
npm run verify:auth     # Auth0 configuration
npm run verify:deps     # Dependencies
```

### **Manual Verification**
- [ ] Repository cloned successfully
- [ ] Dependencies installed without errors
- [ ] Environment variables configured
- [ ] MongoDB Atlas connection working
- [ ] Auth0 application and API configured
- [ ] Development server starts successfully
- [ ] API endpoints respond correctly
- [ ] Tests pass successfully

### **Test Suite Execution**
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:api         # API tests

# Run tests with coverage
npm run test:coverage
```

## 🚨 Troubleshooting

### **Common Issues**

#### **MongoDB Connection Errors**
```bash
# Error: MongoNetworkError
# Solution: Check network access in MongoDB Atlas
# 1. Go to Network Access in Atlas dashboard
# 2. Add your IP address or use 0.0.0.0/0 for development
# 3. Ensure database user has correct permissions
```

#### **Auth0 Configuration Errors**
```bash
# Error: Invalid audience
# Solution: Verify AUTH0_AUDIENCE matches API identifier
# 1. Check Auth0 API settings
# 2. Ensure identifier matches .env file
# 3. Verify JWKS endpoint is accessible
```

#### **Port Already in Use**
```bash
# Error: EADDRINUSE :::3000
# Solution: Change port or kill existing process
export PORT=3001
# or
lsof -ti:3000 | xargs kill -9
```

#### **TypeScript Compilation Errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix common issues
npm run lint:fix
npm run format
```

### **Environment Debugging**
```bash
# Debug environment variables
npm run debug:env

# Check all configurations
npm run debug:config

# Validate all services
npm run debug:services
```

## 📊 Performance Optimization

### **Development Performance**
```bash
# Enable development optimizations
export NODE_ENV=development
export DEBUG=mwap:*

# Use nodemon for auto-restart
npm install -g nodemon
nodemon src/server.ts
```

### **Database Performance**
```bash
# Monitor database performance
npm run db:stats

# Optimize queries
npm run db:explain

# Check index usage
npm run db:index:stats
```

## 🔄 Next Steps

After successful environment setup:

1. **Explore API**: Use Postman collection or Swagger UI
2. **Run Tests**: Execute test suite to verify functionality
3. **Read Documentation**: Review [API Documentation](../04-Backend/API-v3.md)
4. **Start Development**: Begin with [Feature Development Guide](../06-Guides/feature-development.md)

## 📚 Related Documentation

- [Prerequisites](./prerequisites.md) - System requirements
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [FAQ](./faq.md) - Frequently asked questions
- [API Documentation](../04-Backend/API-v3.md) - Complete API reference

---

*Your MWAP development environment is now ready! Start building secure, scalable applications with confidence.*