# 🔧 MWAP Troubleshooting Guide

## 🎯 Overview

This comprehensive troubleshooting guide helps resolve common issues encountered during MWAP development and deployment. Issues are organized by category with step-by-step solutions.

## 🚀 Installation & Setup Issues

### **Node.js Version Problems**

#### **Issue**: Wrong Node.js version installed
```bash
Error: This project requires Node.js 18.x or later
Current version: v16.14.0
```

**Solution:**
```bash
# Using Node Version Manager (recommended)
nvm install 18
nvm use 18
nvm alias default 18

# Verify version
node --version  # Should show v18.x.x

# If nvm not installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
```

#### **Issue**: npm permission errors
```bash
Error: EACCES: permission denied, access '/usr/local/lib/node_modules'
```

**Solution:**
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Alternative: Use nvm (recommended)
# This avoids permission issues entirely
```

### **Dependency Installation Issues**

#### **Issue**: Package installation failures
```bash
npm ERR! peer dep missing: typescript@>=4.5.0
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If peer dependency issues persist
npm install --legacy-peer-deps
```

#### **Issue**: TypeScript compilation errors
```bash
Error: Cannot find module '@types/node'
```

**Solution:**
```bash
# Install missing TypeScript types
npm install --save-dev @types/node @types/express

# Verify TypeScript configuration
npx tsc --noEmit

# Check tsconfig.json
cat tsconfig.json | grep -A 5 -B 5 "compilerOptions"
```

## 🗄️ Database Connection Issues

### **MongoDB Atlas Connection Problems**

#### **Issue**: Network timeout errors
```bash
MongoNetworkError: connection timed out
```

**Solution:**
```bash
# 1. Check MongoDB Atlas Network Access
# - Go to MongoDB Atlas Dashboard
# - Navigate to Network Access
# - Add your current IP address or use 0.0.0.0/0 for development

# 2. Verify connection string format
# Correct format:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# 3. Test connection
node -e "
const { MongoClient } = require('mongodb');
MongoClient.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Connected'))
  .catch(err => console.error('✗ Failed:', err.message));
"
```

#### **Issue**: Authentication failures
```bash
MongoServerError: Authentication failed
```

**Solution:**
```bash
# 1. Verify database user credentials
# - Check username and password in connection string
# - Ensure no special characters need URL encoding

# 2. URL encode special characters in password
# Example: password with @ becomes %40
# password: p@ssw0rd → p%40ssw0rd

# 3. Verify user permissions
# - User must have readWrite permissions on database
# - Check Database Access in MongoDB Atlas

# 4. Test with MongoDB Compass
# Use same connection string to verify credentials
```

#### **Issue**: Database not found
```bash
MongoServerError: Database 'mwap-dev' not found
```

**Solution:**
```bash
# MongoDB creates databases automatically on first write
# This error usually indicates connection issues

# 1. Verify database name in connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mwap-dev

# 2. Initialize database with seed data
npm run db:seed

# 3. Check if database exists
npm run db:status
```

### **Local MongoDB Issues**

#### **Issue**: MongoDB service not running
```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Start MongoDB service (if using local MongoDB)
# macOS with Homebrew
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB

# Verify service status
mongosh --eval "db.runCommand('ping')"
```

## 🔐 Authentication & Auth0 Issues

### **Auth0 Configuration Problems**

#### **Issue**: Invalid audience error
```bash
UnauthorizedError: jwt audience invalid. expected: https://api.mwap.local
```

**Solution:**
```bash
# 1. Verify AUTH0_AUDIENCE in .env matches API identifier
AUTH0_AUDIENCE=https://api.mwap.local

# 2. Check Auth0 API configuration
# - Go to Auth0 Dashboard → APIs
# - Verify identifier matches .env file exactly
# - Ensure no trailing slashes

# 3. Test JWKS endpoint
curl https://your-tenant.auth0.com/.well-known/jwks.json
```

#### **Issue**: JWKS endpoint unreachable
```bash
Error: Unable to verify signature, no matching key found in JWKS
```

**Solution:**
```bash
# 1. Verify Auth0 domain format
AUTH0_DOMAIN=your-tenant.auth0.com  # No https://

# 2. Test JWKS endpoint accessibility
curl https://${AUTH0_DOMAIN}/.well-known/jwks.json

# 3. Check firewall/proxy settings
# Ensure outbound HTTPS connections allowed

# 4. Verify JWT token format
# Use jwt.io to decode and inspect token
```

#### **Issue**: Token validation failures
```bash
JsonWebTokenError: invalid signature
```

**Solution:**
```bash
# 1. Verify signing algorithm
# Auth0 API must use RS256 (not HS256)

# 2. Check token expiration
# Tokens expire after set time (default 24 hours)

# 3. Verify token audience and issuer
# Token must match API configuration

# 4. Debug token validation
npm run auth:debug
```

### **JWT Token Issues**

#### **Issue**: Missing Authorization header
```bash
UnauthorizedError: No authorization token was found
```

**Solution:**
```bash
# 1. Verify header format
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/v1/protected-endpoint

# 3. Check middleware configuration
# Ensure authenticateJWT middleware is applied
```

## 🌐 API & Server Issues

### **Server Startup Problems**

#### **Issue**: Port already in use
```bash
Error: listen EADDRINUSE :::3000
```

**Solution:**
```bash
# 1. Find process using port
lsof -ti:3000

# 2. Kill process
lsof -ti:3000 | xargs kill -9

# 3. Use different port
export PORT=3001
npm run dev

# 4. Check for other MWAP instances
ps aux | grep node | grep mwap
```

#### **Issue**: Environment variables not loaded
```bash
Error: MONGODB_URI is not defined
```

**Solution:**
```bash
# 1. Verify .env file exists
ls -la .env

# 2. Check .env file format (no spaces around =)
# Correct: MONGODB_URI=mongodb+srv://...
# Incorrect: MONGODB_URI = mongodb+srv://...

# 3. Verify dotenv is loaded
# Add to top of server.ts:
import 'dotenv/config';

# 4. Debug environment loading
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI);"
```

### **API Response Issues**

#### **Issue**: CORS errors in browser
```bash
Access to fetch at 'http://localhost:3000/api/v1/users' from origin 'http://localhost:3001' has been blocked by CORS policy
```

**Solution:**
```bash
# 1. Configure CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:3001

# 2. For multiple origins, use comma-separated values
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# 3. For development, allow all origins (not for production)
CORS_ORIGIN=*

# 4. Verify CORS middleware configuration
# Check src/middleware/cors.ts
```

#### **Issue**: Rate limiting blocking requests
```bash
TooManyRequestsError: Too many requests, please try again later
```

**Solution:**
```bash
# 1. Adjust rate limiting for development
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000

# 2. Disable rate limiting for development
ENABLE_RATE_LIMITING=false

# 3. Clear rate limit cache
# Restart server to reset counters

# 4. Check IP address
# Rate limiting is per IP address
```

## 🧪 Testing Issues

### **Test Execution Problems**

#### **Issue**: Tests failing due to database connection
```bash
MongoMemoryServerError: Failed to start MongoDB instance
```

**Solution:**
```bash
# 1. Install MongoDB Memory Server
npm install --save-dev mongodb-memory-server

# 2. Clear test database
npm run test:db:reset

# 3. Run tests with proper timeout
npm test -- --timeout=30000

# 4. Check available memory
# MongoDB Memory Server requires sufficient RAM
```

#### **Issue**: Auth0 token issues in tests
```bash
Error: Unable to get Auth0 management token for testing
```

**Solution:**
```bash
# 1. Create test Auth0 application
# Separate from development application

# 2. Configure test environment variables
TEST_AUTH0_DOMAIN=test-tenant.auth0.com
TEST_AUTH0_CLIENT_ID=test-client-id
TEST_AUTH0_CLIENT_SECRET=test-client-secret

# 3. Use mock tokens for unit tests
# See tests/utils/auth-helpers.ts

# 4. Skip integration tests if Auth0 unavailable
npm run test:unit  # Run only unit tests
```

### **Test Data Issues**

#### **Issue**: Test data conflicts
```bash
Error: Duplicate key error in test database
```

**Solution:**
```bash
# 1. Use unique test data for each test
# Generate random data or use test factories

# 2. Clean database between tests
beforeEach(async () => {
  await TestDatabase.clear();
});

# 3. Use separate test database
TEST_MONGODB_URI=mongodb://localhost:27017/mwap-test

# 4. Run tests in isolation
npm test -- --run-in-band
```

## 🔧 Development Tools Issues

### **VS Code Configuration**

#### **Issue**: TypeScript errors not showing
```bash
TypeScript errors not displayed in VS Code
```

**Solution:**
```bash
# 1. Install TypeScript extension
code --install-extension ms-vscode.vscode-typescript-next

# 2. Reload VS Code window
Cmd/Ctrl + Shift + P → "Developer: Reload Window"

# 3. Check TypeScript version
# VS Code → Command Palette → "TypeScript: Select TypeScript Version"
# Choose "Use Workspace Version"

# 4. Verify tsconfig.json
npx tsc --showConfig
```

#### **Issue**: ESLint not working
```bash
ESLint not showing errors or warnings
```

**Solution:**
```bash
# 1. Install ESLint extension
code --install-extension dbaeumer.vscode-eslint

# 2. Check ESLint configuration
npx eslint --print-config src/server.ts

# 3. Verify .eslintrc.js exists and is valid
node -e "console.log(require('./.eslintrc.js'))"

# 4. Restart ESLint server
Cmd/Ctrl + Shift + P → "ESLint: Restart ESLint Server"
```

### **Git and Version Control**

#### **Issue**: Husky hooks not running
```bash
Git hooks not executing on commit
```

**Solution:**
```bash
# 1. Reinstall Husky
npm run prepare

# 2. Check hook permissions
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# 3. Verify hook files exist
ls -la .husky/

# 4. Test hook manually
.husky/pre-commit
```

## 🚨 Production Issues

### **Deployment Problems**

#### **Issue**: Build failures
```bash
Error: Build failed with TypeScript errors
```

**Solution:**
```bash
# 1. Fix TypeScript errors
npm run type-check

# 2. Update dependencies
npm update

# 3. Clear build cache
rm -rf dist/
npm run build

# 4. Check build configuration
cat tsconfig.json | grep -A 10 "compilerOptions"
```

#### **Issue**: Environment variables in production
```bash
Error: Production environment variables not set
```

**Solution:**
```bash
# 1. Set production environment variables
# Use platform-specific method (Heroku, AWS, etc.)

# 2. Verify required variables
npm run verify:env:production

# 3. Use different .env file for production
NODE_ENV=production node -r dotenv/config src/server.js

# 4. Check environment variable loading
console.log('Environment:', process.env.NODE_ENV);
```

## 📊 Performance Issues

### **Slow Database Queries**

#### **Issue**: API responses are slow
```bash
API endpoints taking > 5 seconds to respond
```

**Solution:**
```bash
# 1. Check database indexes
npm run db:index:list

# 2. Analyze slow queries
npm run db:profiler:enable

# 3. Add missing indexes
# See src/models/ for index definitions

# 4. Monitor query performance
npm run db:stats
```

### **Memory Issues**

#### **Issue**: High memory usage
```bash
Process killed due to memory limit exceeded
```

**Solution:**
```bash
# 1. Monitor memory usage
node --inspect src/server.ts
# Open chrome://inspect in Chrome

# 2. Check for memory leaks
npm run test:memory

# 3. Optimize database connections
# Use connection pooling

# 4. Increase memory limit (temporary)
node --max-old-space-size=4096 src/server.ts
```

## 🔍 Debugging Tools

### **Debug Commands**
```bash
# Environment debugging
npm run debug:env

# Database debugging
npm run debug:db

# Auth0 debugging
npm run debug:auth

# API debugging
npm run debug:api

# Full system check
npm run debug:all
```

### **Logging Configuration**
```bash
# Enable debug logging
export DEBUG=mwap:*
export LOG_LEVEL=debug

# Specific module debugging
export DEBUG=mwap:auth,mwap:db

# Disable logging
export LOG_LEVEL=error
```

## 📞 Getting Additional Help

### **Documentation Resources**
- [Prerequisites](./prerequisites.md) - System requirements
- [Environment Setup](./env-setup.md) - Configuration guide
- [FAQ](./faq.md) - Frequently asked questions
- [API Documentation](../04-Backend/API-v3.md) - Complete API reference

### **Community Support**
- **GitHub Issues**: Report bugs and technical issues
- **GitHub Discussions**: Ask questions and get community help
- **Stack Overflow**: Tag questions with `mwap` and `nodejs`

### **Professional Support**
- **Consulting**: Available for complex implementation issues
- **Training**: Team training and onboarding sessions
- **Custom Development**: Feature development and customization

---

## ✅ Prevention Tips

### **Best Practices**
1. **Regular Updates**: Keep dependencies updated
2. **Environment Consistency**: Use same Node.js version across team
3. **Error Monitoring**: Implement comprehensive error tracking
4. **Testing**: Maintain high test coverage
5. **Documentation**: Keep documentation current

### **Monitoring Setup**
```bash
# Set up error monitoring
npm install --save @sentry/node

# Add health checks
npm run health:check

# Monitor performance
npm run perf:monitor
```

---

*This troubleshooting guide is regularly updated with new issues and solutions. If you encounter an issue not covered here, please report it via GitHub Issues.*