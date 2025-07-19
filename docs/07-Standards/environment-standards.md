# MWAP Environment Configuration Standards

This comprehensive guide defines environment variable standards, configuration management, and deployment practices for the MWAP platform across all environments.

## 🎯 Overview

### Environment Management Philosophy
MWAP uses environment variables to configure the application across different deployment stages:

- **Separation of Concerns**: Configuration separate from code
- **Environment Parity**: Consistent configuration patterns across environments
- **Security First**: Sensitive data protected and never committed to version control
- **Type Safety**: Runtime validation ensures correct configuration
- **Documentation**: All variables clearly documented with examples

### Environment Types
- **Development**: Local development with debug features
- **Test**: Automated testing with isolated resources
- **Staging**: Production-like environment for final testing
- **Production**: Live environment with security and performance optimizations

## 📋 Environment Variable Reference

### Core Application Settings

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | enum | Yes | development | Application environment (`development` \| `test` \| `staging` \| `production`) |
| `PORT` | number | Yes | 3001 | Server port number (1-65535) |
| `API_BASE_URL` | string | No | - | Base URL for API documentation and callbacks |
| `CORS_ORIGIN` | string | Yes | - | Allowed origins for CORS requests (comma-separated) |

**Examples:**
```bash
# Development
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Production
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.yourapp.com
CORS_ORIGIN=https://yourapp.com,https://www.yourapp.com
```

### Database Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `MONGODB_URI` | string | Yes | - | MongoDB connection string |
| `MONGO_MAX_POOL_SIZE` | number | No | 10 | Maximum connections in pool |
| `MONGO_MIN_POOL_SIZE` | number | No | 2 | Minimum connections in pool |
| `MONGO_CONNECT_TIMEOUT_MS` | number | No | 10000 | Connection timeout (ms) |
| `MONGO_SOCKET_TIMEOUT_MS` | number | No | 45000 | Socket timeout (ms) |

**Examples:**
```bash
# Development
MONGODB_URI=mongodb://localhost:27017/mwap_dev
MONGO_MAX_POOL_SIZE=5
MONGO_MIN_POOL_SIZE=1

# Production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mwap?retryWrites=true&w=majority
MONGO_MAX_POOL_SIZE=20
MONGO_MIN_POOL_SIZE=5
MONGO_CONNECT_TIMEOUT_MS=5000
MONGO_SOCKET_TIMEOUT_MS=30000
```

### Authentication Configuration (Auth0)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `AUTH0_DOMAIN` | string | Yes | - | Auth0 tenant domain |
| `AUTH0_CLIENT_ID` | string | Yes | - | Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | string | Yes | - | Auth0 application client secret |
| `AUTH0_AUDIENCE` | string | Yes | - | Auth0 API identifier |
| `AUTH0_TOKEN_SIGNING_ALG` | string | No | RS256 | JWT signing algorithm |
| `AUTH0_CALLBACK_URL` | string | No | - | OAuth callback URL |

**Examples:**
```bash
# Development
AUTH0_DOMAIN=dev-tenant.auth0.com
AUTH0_CLIENT_ID=development_client_id
AUTH0_CLIENT_SECRET=development_client_secret
AUTH0_AUDIENCE=https://dev-api.yourapp.com
AUTH0_CALLBACK_URL=http://localhost:3001/api/v1/oauth/callback

# Production
AUTH0_DOMAIN=prod-tenant.auth0.com
AUTH0_CLIENT_ID=production_client_id
AUTH0_CLIENT_SECRET=production_client_secret
AUTH0_AUDIENCE=https://api.yourapp.com
AUTH0_CALLBACK_URL=https://api.yourapp.com/api/v1/oauth/callback
```

### Security Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `JWT_SECRET` | string | No | - | Additional JWT secret for local development |
| `ENCRYPTION_KEY` | string | Yes | - | 32-character encryption key for sensitive data |
| `HELMET_ENABLED` | boolean | No | true | Enable Helmet security headers |
| `CSP_DIRECTIVES` | string | No | - | Content Security Policy directives |

**Examples:**
```bash
# Development
JWT_SECRET=development_jwt_secret_key_for_local_testing_only
ENCRYPTION_KEY=12345678901234567890123456789012
HELMET_ENABLED=true

# Production
ENCRYPTION_KEY=randomly_generated_32_character_key
HELMET_ENABLED=true
CSP_DIRECTIVES="default-src 'self'; script-src 'self' 'unsafe-inline'"
```

### Rate Limiting Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `RATE_LIMITING_ENABLED` | boolean | No | true | Enable API rate limiting |
| `RATE_LIMIT_WINDOW_MS` | number | No | 900000 | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | number | No | 100 | Maximum requests per window |

**Examples:**
```bash
# Development (relaxed limits)
RATE_LIMITING_ENABLED=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Production (strict limits)
RATE_LIMITING_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Logging and Debugging

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `LOG_LEVEL` | enum | No | info | Logging level (`debug` \| `info` \| `warn` \| `error`) |
| `DEBUG` | string | No | - | Debug patterns for detailed logging |
| `ENABLE_REQUEST_LOGGING` | boolean | No | false | Enable detailed HTTP request logging |
| `ERROR_LOGGING_ENABLED` | boolean | No | true | Enable detailed error logging |
| `ERROR_NOTIFICATION_WEBHOOK` | string | No | - | Webhook URL for error notifications |

**Examples:**
```bash
# Development
LOG_LEVEL=debug
DEBUG=mwap:*
ENABLE_REQUEST_LOGGING=true
ERROR_LOGGING_ENABLED=true

# Production
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=false
ERROR_LOGGING_ENABLED=true
ERROR_NOTIFICATION_WEBHOOK=https://hooks.slack.com/services/xxx
```

### Monitoring and Performance

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `METRICS_ENABLED` | boolean | No | false | Enable metrics collection |
| `METRICS_INTERVAL` | number | No | 60000 | Metrics collection interval (ms) |
| `APM_ENABLED` | boolean | No | false | Enable Application Performance Monitoring |
| `TRACE_SAMPLING_RATE` | number | No | 0.1 | Trace sampling rate (0-1) |

**Examples:**
```bash
# Development
METRICS_ENABLED=true
METRICS_INTERVAL=30000
APM_ENABLED=false

# Production
METRICS_ENABLED=true
METRICS_INTERVAL=60000
APM_ENABLED=true
TRACE_SAMPLING_RATE=0.05
```

### Caching Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `CACHE_ENABLED` | boolean | No | true | Enable response caching |
| `CACHE_TTL` | number | No | 300 | Cache TTL in seconds |
| `CACHE_CHECK_PERIOD` | number | No | 600 | Cache cleanup interval in seconds |

**Examples:**
```bash
# Development
CACHE_ENABLED=false
CACHE_TTL=60

# Production
CACHE_ENABLED=true
CACHE_TTL=300
CACHE_CHECK_PERIOD=600
```

## 🔧 Environment File Organization

### File Naming Convention
```bash
.env                    # Default environment (development)
.env.local             # Local overrides (gitignored)
.env.development       # Development-specific settings
.env.test              # Testing environment
.env.staging           # Staging environment
.env.production        # Production environment (never committed)
.env.example           # Template file (committed to repo)
```

### File Priority Order
1. `.env.local` (highest priority, gitignored)
2. `.env.{NODE_ENV}` (environment-specific)
3. `.env` (default environment)
4. `process.env` (system environment variables)

### Development Environment (.env.local)
```bash
# Local development configuration
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/mwap_dev
AUTH0_DOMAIN=dev-12345.auth0.com
AUTH0_CLIENT_ID=your_dev_client_id
AUTH0_CLIENT_SECRET=your_dev_client_secret
AUTH0_AUDIENCE=https://localhost:3001
ENCRYPTION_KEY=12345678901234567890123456789012

# Development debugging
LOG_LEVEL=debug
DEBUG=mwap:*
ENABLE_REQUEST_LOGGING=true
RATE_LIMITING_ENABLED=false

# CORS for local frontend
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Testing Environment (.env.test)
```bash
# Testing configuration
NODE_ENV=test
PORT=3002
MONGODB_URI=mongodb://localhost:27017/mwap_test
AUTH0_DOMAIN=test-tenant.auth0.com
AUTH0_CLIENT_ID=test_client_id
AUTH0_CLIENT_SECRET=test_client_secret
AUTH0_AUDIENCE=https://test-api.yourapp.com
ENCRYPTION_KEY=test12345678901234567890123456789

# Test-specific settings
LOG_LEVEL=error
ENABLE_REQUEST_LOGGING=false
RATE_LIMITING_ENABLED=false
CACHE_ENABLED=false
METRICS_ENABLED=false
```

### Staging Environment (.env.staging)
```bash
# Staging configuration (production-like)
NODE_ENV=staging
PORT=3000
MONGODB_URI=mongodb+srv://staging-user:pass@staging-cluster.mongodb.net/mwap_staging
AUTH0_DOMAIN=staging-tenant.auth0.com
AUTH0_CLIENT_ID=staging_client_id
AUTH0_CLIENT_SECRET=staging_client_secret
AUTH0_AUDIENCE=https://staging-api.yourapp.com
ENCRYPTION_KEY=staging_32_character_encryption_key

# Staging-specific settings
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
RATE_LIMITING_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=500
CACHE_ENABLED=true
METRICS_ENABLED=true
CORS_ORIGIN=https://staging.yourapp.com
```

### Production Environment
```bash
# Production configuration (use secrets management)
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://prod-user:secure-pass@prod-cluster.mongodb.net/mwap
AUTH0_DOMAIN=prod-tenant.auth0.com
AUTH0_CLIENT_ID=production_client_id
AUTH0_CLIENT_SECRET=production_client_secret
AUTH0_AUDIENCE=https://api.yourapp.com
ENCRYPTION_KEY=production_32_char_encryption_key

# Production security
LOG_LEVEL=warn
ENABLE_REQUEST_LOGGING=false
RATE_LIMITING_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
HELMET_ENABLED=true
CACHE_ENABLED=true
METRICS_ENABLED=true
APM_ENABLED=true
ERROR_NOTIFICATION_WEBHOOK=https://hooks.slack.com/services/prod-alerts

# Production CORS
CORS_ORIGIN=https://yourapp.com,https://www.yourapp.com
```

## ✅ Environment Validation

### Validation Schema
```typescript
// src/config/env.ts
import { z } from 'zod';

export const envSchema = z.object({
  // Core settings
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  API_BASE_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string(),

  // Database
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  MONGO_MAX_POOL_SIZE: z.coerce.number().min(1).max(100).default(10),
  MONGO_MIN_POOL_SIZE: z.coerce.number().min(1).max(50).default(2),
  MONGO_CONNECT_TIMEOUT_MS: z.coerce.number().min(1000).default(10000),
  MONGO_SOCKET_TIMEOUT_MS: z.coerce.number().min(1000).default(45000),

  // Authentication
  AUTH0_DOMAIN: z.string().min(1, 'Auth0 domain is required'),
  AUTH0_CLIENT_ID: z.string().min(1, 'Auth0 client ID is required'),
  AUTH0_CLIENT_SECRET: z.string().min(1, 'Auth0 client secret is required'),
  AUTH0_AUDIENCE: z.string().url('Auth0 audience must be a valid URL'),
  AUTH0_TOKEN_SIGNING_ALG: z.string().default('RS256'),
  AUTH0_CALLBACK_URL: z.string().url().optional(),

  // Security
  ENCRYPTION_KEY: z.string().length(32, 'Encryption key must be exactly 32 characters'),
  JWT_SECRET: z.string().optional(),
  HELMET_ENABLED: z.coerce.boolean().default(true),
  CSP_DIRECTIVES: z.string().optional(),

  // Rate limiting
  RATE_LIMITING_ENABLED: z.coerce.boolean().default(true),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().min(1000).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().min(1).default(100),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DEBUG: z.string().optional(),
  ENABLE_REQUEST_LOGGING: z.coerce.boolean().default(false),
  ERROR_LOGGING_ENABLED: z.coerce.boolean().default(true),
  ERROR_NOTIFICATION_WEBHOOK: z.string().url().optional(),

  // Monitoring
  METRICS_ENABLED: z.coerce.boolean().default(false),
  METRICS_INTERVAL: z.coerce.number().min(1000).default(60000),
  APM_ENABLED: z.coerce.boolean().default(false),
  TRACE_SAMPLING_RATE: z.coerce.number().min(0).max(1).default(0.1),

  // Caching
  CACHE_ENABLED: z.coerce.boolean().default(true),
  CACHE_TTL: z.coerce.number().min(1).default(300),
  CACHE_CHECK_PERIOD: z.coerce.number().min(1).default(600),
});

export type Environment = z.infer<typeof envSchema>;

// Validate and export environment
export const env: Environment = envSchema.parse(process.env);
```

### Validation Implementation
```typescript
// src/config/validateEnv.ts
import { envSchema } from './env.js';
import { logError, logInfo } from '../utils/logger.js';

export function validateEnvironment(): void {
  try {
    const env = envSchema.parse(process.env);
    
    logInfo('Environment validation successful', {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      hasMongoUri: !!env.MONGODB_URI,
      hasAuth0Config: !!(env.AUTH0_DOMAIN && env.AUTH0_AUDIENCE)
    });
    
    return env;
  } catch (error) {
    logError('Environment validation failed', {
      error: error.message,
      issues: error.issues
    });
    
    console.error('❌ Environment configuration errors:');
    error.issues?.forEach((issue: any) => {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    
    console.error('\n📋 Required environment variables:');
    console.error('  • NODE_ENV (development|test|staging|production)');
    console.error('  • PORT (1-65535)');
    console.error('  • MONGODB_URI (MongoDB connection string)');
    console.error('  • AUTH0_DOMAIN (Auth0 tenant domain)');
    console.error('  • AUTH0_CLIENT_ID (Auth0 client ID)');
    console.error('  • AUTH0_CLIENT_SECRET (Auth0 client secret)');
    console.error('  • AUTH0_AUDIENCE (Auth0 API identifier)');
    console.error('  • ENCRYPTION_KEY (32 character string)');
    console.error('  • CORS_ORIGIN (allowed CORS origins)');
    
    process.exit(1);
  }
}
```

### Environment Validation Tests
```typescript
// tests/config/env.test.ts
import { envSchema } from '../../src/config/env.js';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('validates valid environment configuration', () => {
    process.env = {
      NODE_ENV: 'test',
      PORT: '3001',
      MONGODB_URI: 'mongodb://localhost:27017/test',
      AUTH0_DOMAIN: 'test.auth0.com',
      AUTH0_CLIENT_ID: 'test_client_id',
      AUTH0_CLIENT_SECRET: 'test_client_secret',
      AUTH0_AUDIENCE: 'https://test-api.example.com',
      ENCRYPTION_KEY: '12345678901234567890123456789012',
      CORS_ORIGIN: 'http://localhost:3000'
    };

    expect(() => envSchema.parse(process.env)).not.toThrow();
  });

  it('rejects invalid port numbers', () => {
    process.env.PORT = '99999';
    
    expect(() => envSchema.parse(process.env)).toThrow('too_big');
  });

  it('requires encryption key to be 32 characters', () => {
    process.env.ENCRYPTION_KEY = 'short_key';
    
    expect(() => envSchema.parse(process.env)).toThrow('exactly 32 characters');
  });

  it('validates Auth0 audience URL format', () => {
    process.env.AUTH0_AUDIENCE = 'invalid-url';
    
    expect(() => envSchema.parse(process.env)).toThrow('valid URL');
  });
});
```

## 🔒 Security Best Practices

### Sensitive Data Protection
```bash
# ❌ Never commit these to version control
AUTH0_CLIENT_SECRET=your-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db
JWT_SECRET=your-jwt-secret

# ✅ Use placeholder values in .env.example
AUTH0_CLIENT_SECRET=your_auth0_client_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key_here
MONGODB_URI=mongodb://localhost:27017/mwap_dev
JWT_SECRET=your_development_jwt_secret_here
```

### Environment Separation
```bash
# Different secrets per environment
ENCRYPTION_KEY_DEV=dev_32_character_encryption_key_123
ENCRYPTION_KEY_STAGING=staging_32_char_encryption_key_456
ENCRYPTION_KEY_PROD=prod_32_character_encryption_key_789

# Environment-specific endpoints
AUTH0_DOMAIN_DEV=dev-tenant.auth0.com
AUTH0_DOMAIN_STAGING=staging-tenant.auth0.com
AUTH0_DOMAIN_PROD=prod-tenant.auth0.com
```

### .gitignore Configuration
```bash
# Environment files
.env
.env.local
.env.*.local
.env.production
.env.staging

# Keep example files
!.env.example
```

### Secrets Management

#### Local Development
```bash
# Use .env.local for personal overrides
cp .env.example .env.local
# Edit .env.local with your personal values
```

#### Production Deployment
```bash
# Heroku
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set AUTH0_CLIENT_SECRET="prod_secret"

# Docker
docker run -e MONGODB_URI="mongodb+srv://..." app:latest

# Kubernetes
kubectl create secret generic app-secrets \
  --from-literal=mongodb-uri="mongodb+srv://..." \
  --from-literal=auth0-client-secret="prod_secret"
```

## 🚀 Deployment Configuration

### Initial Development Setup
```bash
# 1. Copy example file
cp .env.example .env.local

# 2. Generate encryption key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# 3. Edit configuration
vim .env.local

# 4. Validate configuration
npm run validate-env

# 5. Start development server
npm run dev
```

### Heroku Deployment
```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mwap"
heroku config:set AUTH0_DOMAIN="prod-tenant.auth0.com"
heroku config:set AUTH0_CLIENT_ID="prod_client_id"
heroku config:set AUTH0_CLIENT_SECRET="prod_client_secret"
heroku config:set AUTH0_AUDIENCE="https://api.yourapp.com"
heroku config:set ENCRYPTION_KEY="$(openssl rand -hex 16)"
heroku config:set CORS_ORIGIN="https://yourapp.com,https://www.yourapp.com"

# View current configuration
heroku config
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY dist/ ./dist/

# Set default environment
ENV NODE_ENV=production
ENV PORT=3000

# Run application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGODB_URI=${MONGODB_URI}
      - AUTH0_DOMAIN=${AUTH0_DOMAIN}
      - AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}
      - AUTH0_CLIENT_SECRET=${AUTH0_CLIENT_SECRET}
      - AUTH0_AUDIENCE=${AUTH0_AUDIENCE}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - CORS_ORIGIN=${CORS_ORIGIN}
    restart: unless-stopped
```

### Kubernetes Configuration
```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  mongodb-uri: "mongodb+srv://user:pass@cluster.mongodb.net/mwap"
  auth0-client-secret: "production_client_secret"
  encryption-key: "production_32_character_key_12345"

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  AUTH0_DOMAIN: "prod-tenant.auth0.com"
  AUTH0_CLIENT_ID: "production_client_id"
  AUTH0_AUDIENCE: "https://api.yourapp.com"
  CORS_ORIGIN: "https://yourapp.com,https://www.yourapp.com"
  LOG_LEVEL: "info"
  RATE_LIMITING_ENABLED: "true"
  METRICS_ENABLED: "true"

---
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mwap-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mwap-api
  template:
    metadata:
      labels:
        app: mwap-api
    spec:
      containers:
      - name: mwap-api
        image: mwap-api:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: app-config
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: mongodb-uri
        - name: AUTH0_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: auth0-client-secret
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: encryption-key
```

## 🧪 Testing Environment Configuration

### Test-Specific Variables
```bash
# .env.test
NODE_ENV=test
PORT=3002
MONGODB_URI=mongodb://localhost:27017/mwap_test
AUTH0_DOMAIN=test.auth0.com
AUTH0_CLIENT_ID=test_client_id
AUTH0_CLIENT_SECRET=test_client_secret
AUTH0_AUDIENCE=https://test-api.example.com
ENCRYPTION_KEY=test12345678901234567890123456789
CORS_ORIGIN=http://localhost:3000

# Test-specific optimizations
LOG_LEVEL=error
ENABLE_REQUEST_LOGGING=false
RATE_LIMITING_ENABLED=false
CACHE_ENABLED=false
METRICS_ENABLED=false
```

### Test Environment Isolation
```typescript
// tests/setup/environment.ts
export function setupTestEnvironment() {
  // Save original environment
  const originalEnv = { ...process.env };
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/mwap_test';
  process.env.AUTH0_DOMAIN = 'test.auth0.com';
  process.env.AUTH0_AUDIENCE = 'https://test-api.example.com';
  process.env.ENCRYPTION_KEY = 'test12345678901234567890123456789';
  
  return () => {
    // Restore original environment
    process.env = originalEnv;
  };
}
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Missing Required Variables
```bash
Error: Environment variable AUTH0_DOMAIN is required
```
**Solution**: Add the missing variable to your `.env` file or system environment.

#### Invalid Variable Format
```bash
Error: Port must be between 1 and 65535
```
**Solution**: Use a valid port number (e.g., `PORT=3001`).

#### MongoDB Connection Issues
```bash
Error: MongoNetworkError: failed to connect to server
```
**Solutions**:
- Verify `MONGODB_URI` format is correct
- Check if MongoDB server is running
- Verify network connectivity and firewall settings
- Check authentication credentials

#### Auth0 Configuration Problems
```bash
Error: jwt audience invalid
```
**Solutions**:
- Verify `AUTH0_AUDIENCE` matches the API identifier in Auth0
- Check for typos in the audience URL
- Ensure the audience doesn't have trailing slashes

#### Environment File Not Loaded
```bash
Error: Cannot load environment variables
```
**Solutions**:
- Verify `.env` file exists in the project root
- Check file permissions are readable
- Ensure dotenv is properly configured in the application

### Debugging Environment Issues
```typescript
// Debug environment loading
console.log('Environment Debug Info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('Has MONGODB_URI:', !!process.env.MONGODB_URI);
console.log('Has AUTH0_DOMAIN:', !!process.env.AUTH0_DOMAIN);
console.log('ENV file exists:', require('fs').existsSync('.env'));
```

## 📋 Environment Checklist

### Development Setup
- [ ] `.env.local` created from `.env.example`
- [ ] All required variables filled with valid values
- [ ] MongoDB connection string points to development database
- [ ] Auth0 development tenant configured
- [ ] Encryption key generated (32 characters)
- [ ] CORS origins include local development URLs
- [ ] Environment validation passes

### Staging Deployment
- [ ] Staging environment variables configured
- [ ] Separate staging database and Auth0 tenant
- [ ] Security settings enabled
- [ ] Monitoring and logging configured
- [ ] Rate limiting enabled with appropriate limits
- [ ] SSL/TLS certificates configured

### Production Deployment
- [ ] All secrets stored securely (never in code)
- [ ] Production database with appropriate access controls
- [ ] Production Auth0 tenant with security features
- [ ] Strong encryption key generated and stored securely
- [ ] Security headers and rate limiting enabled
- [ ] Monitoring, metrics, and error notification configured
- [ ] CORS origins limited to production domains only
- [ ] Environment validation passes in production

---
*Proper environment configuration is critical for secure, reliable, and maintainable application deployment across all environments.* 