# 🔧 MWAP Environment Configuration Guide

## 🎯 Overview

This guide establishes secure and consistent environment variable management for MWAP applications. Proper environment configuration is critical for security, deployment flexibility, and maintainability.

## 🔒 Security Principles

### **Environment Variable Security**
1. **🚫 Never Commit Secrets**: Environment files with real values must never be committed to version control
2. **🔐 Use Strong Secrets**: All secrets must be cryptographically secure and unique per environment
3. **🎯 Principle of Least Privilege**: Only provide the minimum required permissions and access
4. **🔄 Regular Rotation**: Rotate secrets regularly, especially for production environments
5. **📊 Audit Trail**: Log access to sensitive configuration without exposing values

### **Secret Management Hierarchy**
```typescript
// Security levels (highest to lowest)
1. Production Secrets    // Vault/AWS Secrets Manager
2. Staging Secrets      // Secure environment variables
3. Development Secrets  // Local .env files (never committed)
4. Test Secrets        // Mock values for testing
5. Default Values      // Non-sensitive fallbacks
```

## 📋 Environment File Structure

### **Base Environment Template (.env.example)**
```bash
# =============================================================================
# MWAP Environment Configuration Template
# =============================================================================
# Copy this file to .env and fill in the actual values
# NEVER commit .env files with real secrets to version control

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=development
PORT=3000
HOST=localhost
API_VERSION=v1

# Application URLs
CLIENT_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api/v1

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap?retryWrites=true&w=majority

# Database connection settings
DATABASE_CONNECTION_TIMEOUT=10000
DATABASE_MAX_POOL_SIZE=10
DATABASE_MIN_POOL_SIZE=2

# =============================================================================
# AUTH0 CONFIGURATION
# =============================================================================
# Auth0 tenant configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_AUDIENCE=https://api.mwap.local

# Auth0 management API (for user management)
AUTH0_MANAGEMENT_CLIENT_ID=management_client_id
AUTH0_MANAGEMENT_CLIENT_SECRET=management_client_secret

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
# JWT configuration
JWT_SECRET=your_jwt_secret_here_minimum_32_characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Session configuration
SESSION_SECRET=your_session_secret_here_minimum_32_characters
SESSION_MAX_AGE=86400000

# CORS configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# =============================================================================
# RATE LIMITING
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=./logs/app.log
LOG_MAX_FILE_SIZE=10m
LOG_MAX_FILES=5

# =============================================================================
# REDIS CONFIGURATION (Optional - for caching)
# =============================================================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_KEY_PREFIX=mwap:

# =============================================================================
# EMAIL CONFIGURATION (Optional - for notifications)
# =============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# =============================================================================
# CLOUD PROVIDER CONFIGURATION (Optional)
# =============================================================================
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=mwap-files

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json

# =============================================================================
# MONITORING & ANALYTICS (Optional)
# =============================================================================
# Application monitoring
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# =============================================================================
# DEVELOPMENT TOOLS
# =============================================================================
# Development mode settings
ENABLE_SWAGGER_UI=true
ENABLE_DEBUG_LOGGING=true
ENABLE_HOT_RELOAD=true

# Testing configuration
TEST_DATABASE_URI=mongodb://localhost:27017/mwap_test
TEST_AUTH0_DOMAIN=test-tenant.auth0.com
TEST_JWT_SECRET=test_jwt_secret_for_testing_only
```

### **Environment-Specific Configurations**

#### **Development Environment (.env.development)**
```bash
# Development-specific overrides
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER_UI=true
ENABLE_DEBUG_LOGGING=true

# Local development URLs
CLIENT_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api/v1

# Development database
MONGODB_URI=mongodb://localhost:27017/mwap_dev

# Relaxed CORS for development
CORS_ORIGIN=*

# Development Auth0 tenant
AUTH0_DOMAIN=dev-tenant.auth0.com
```

#### **Staging Environment (.env.staging)**
```bash
# Staging-specific configuration
NODE_ENV=staging
LOG_LEVEL=info

# Staging URLs
CLIENT_URL=https://staging.mwap.com
API_BASE_URL=https://api-staging.mwap.com/api/v1

# Staging database
MONGODB_URI=mongodb+srv://staging_user:password@staging-cluster.mongodb.net/mwap_staging

# Staging Auth0 tenant
AUTH0_DOMAIN=staging-tenant.auth0.com

# Enhanced security for staging
RATE_LIMIT_MAX_REQUESTS=50
SESSION_MAX_AGE=3600000
```

#### **Production Environment (.env.production)**
```bash
# Production configuration
NODE_ENV=production
LOG_LEVEL=warn

# Production URLs
CLIENT_URL=https://app.mwap.com
API_BASE_URL=https://api.mwap.com/api/v1

# Production database with replica set
MONGODB_URI=mongodb+srv://prod_user:secure_password@prod-cluster.mongodb.net/mwap_prod?retryWrites=true&w=majority

# Production Auth0 tenant
AUTH0_DOMAIN=mwap.auth0.com

# Strict security for production
CORS_ORIGIN=https://app.mwap.com
RATE_LIMIT_MAX_REQUESTS=30
SESSION_MAX_AGE=1800000

# Disable development features
ENABLE_SWAGGER_UI=false
ENABLE_DEBUG_LOGGING=false
```

## 🔐 Secret Management

### **Secret Generation Guidelines**
```typescript
// Generate secure secrets using Node.js crypto
import crypto from 'crypto';

// Generate JWT secret (minimum 32 characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Generate session secret (minimum 32 characters)
const sessionSecret = crypto.randomBytes(32).toString('hex');

// Generate API key (URL-safe base64)
const apiKey = crypto.randomBytes(32).toString('base64url');

// Example secure secrets
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
SESSION_SECRET=9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba
API_KEY=Zm9vYmFyYmF6cXV4Zm9vYmFyYmF6cXV4Zm9vYmFyYmF6cXV4Zm9vYmFyYmF6cXV4
```

### **Secret Rotation Strategy**
```typescript
// Secret rotation schedule
interface SecretRotationSchedule {
  jwtSecret: '90 days';           // Rotate JWT secrets quarterly
  sessionSecret: '30 days';       // Rotate session secrets monthly
  databasePassword: '60 days';    // Rotate DB passwords bi-monthly
  apiKeys: '180 days';           // Rotate API keys semi-annually
  auth0ClientSecret: '365 days'; // Rotate Auth0 secrets annually
}

// Rotation implementation
export class SecretRotationService {
  async rotateJWTSecret(): Promise<void> {
    const newSecret = crypto.randomBytes(32).toString('hex');
    
    // Update environment variable
    await this.updateEnvironmentVariable('JWT_SECRET', newSecret);
    
    // Graceful transition: accept both old and new secrets for 24 hours
    await this.scheduleSecretTransition('JWT_SECRET', newSecret, '24h');
    
    // Log rotation (without exposing secret values)
    logger.info('JWT secret rotated successfully', {
      rotationId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    });
  }
}
```

### **Environment Variable Validation**
```typescript
// Runtime environment validation
import { z } from 'zod';

const environmentSchema = z.object({
  // Application configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().min(1000).max(65535),
  HOST: z.string().min(1),

  // Database configuration
  MONGODB_URI: z.string().url().startsWith('mongodb'),
  DATABASE_CONNECTION_TIMEOUT: z.coerce.number().min(1000),

  // Auth0 configuration
  AUTH0_DOMAIN: z.string().min(1),
  AUTH0_CLIENT_ID: z.string().min(1),
  AUTH0_CLIENT_SECRET: z.string().min(32), // Minimum length for security
  AUTH0_AUDIENCE: z.string().url(),

  // Security configuration
  JWT_SECRET: z.string().min(32), // Minimum 32 characters
  SESSION_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().min(1),

  // Optional configurations
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
});

// Validate environment on startup
export function validateEnvironment(): z.infer<typeof environmentSchema> {
  try {
    return environmentSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment validation failed', {
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          received: err.code === 'invalid_type' ? typeof err.received : err.received
        }))
      });
    }
    
    process.exit(1);
  }
}

// Usage in application startup
const config = validateEnvironment();
```

## 🏗️ Configuration Management

### **Configuration Service Pattern**
```typescript
// Centralized configuration service
export class ConfigService {
  private static instance: ConfigService;
  private config: z.infer<typeof environmentSchema>;

  private constructor() {
    this.config = validateEnvironment();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // Application configuration
  get app() {
    return {
      env: this.config.NODE_ENV,
      port: this.config.PORT,
      host: this.config.HOST,
      apiVersion: this.config.API_VERSION || 'v1'
    };
  }

  // Database configuration
  get database() {
    return {
      uri: this.config.MONGODB_URI,
      connectionTimeout: this.config.DATABASE_CONNECTION_TIMEOUT,
      maxPoolSize: this.config.DATABASE_MAX_POOL_SIZE || 10,
      minPoolSize: this.config.DATABASE_MIN_POOL_SIZE || 2
    };
  }

  // Auth0 configuration
  get auth0() {
    return {
      domain: this.config.AUTH0_DOMAIN,
      clientId: this.config.AUTH0_CLIENT_ID,
      clientSecret: this.config.AUTH0_CLIENT_SECRET,
      audience: this.config.AUTH0_AUDIENCE,
      managementClientId: this.config.AUTH0_MANAGEMENT_CLIENT_ID,
      managementClientSecret: this.config.AUTH0_MANAGEMENT_CLIENT_SECRET
    };
  }

  // Security configuration
  get security() {
    return {
      jwtSecret: this.config.JWT_SECRET,
      jwtExpiresIn: this.config.JWT_EXPIRES_IN || '24h',
      sessionSecret: this.config.SESSION_SECRET,
      sessionMaxAge: this.config.SESSION_MAX_AGE || 86400000,
      corsOrigin: this.config.CORS_ORIGIN,
      corsCredentials: this.config.CORS_CREDENTIALS === 'true'
    };
  }

  // Rate limiting configuration
  get rateLimit() {
    return {
      windowMs: this.config.RATE_LIMIT_WINDOW_MS || 900000,
      maxRequests: this.config.RATE_LIMIT_MAX_REQUESTS || 100,
      skipSuccessfulRequests: this.config.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true'
    };
  }

  // Logging configuration
  get logging() {
    return {
      level: this.config.LOG_LEVEL || 'info',
      format: this.config.LOG_FORMAT || 'json',
      filePath: this.config.LOG_FILE_PATH || './logs/app.log',
      maxFileSize: this.config.LOG_MAX_FILE_SIZE || '10m',
      maxFiles: this.config.LOG_MAX_FILES || 5
    };
  }

  // Feature flags
  get features() {
    return {
      swaggerUI: this.config.ENABLE_SWAGGER_UI === 'true',
      debugLogging: this.config.ENABLE_DEBUG_LOGGING === 'true',
      hotReload: this.config.ENABLE_HOT_RELOAD === 'true'
    };
  }

  // Check if running in production
  get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  // Check if running in development
  get isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  // Check if running in staging
  get isStaging(): boolean {
    return this.config.NODE_ENV === 'staging';
  }
}

// Usage throughout the application
const config = ConfigService.getInstance();
```

### **Environment-Specific Overrides**
```typescript
// Environment-specific configuration overrides
export class EnvironmentConfig {
  static getConfig() {
    const baseConfig = ConfigService.getInstance();
    
    switch (baseConfig.app.env) {
      case 'development':
        return {
          ...baseConfig,
          logging: {
            ...baseConfig.logging,
            level: 'debug'
          },
          features: {
            ...baseConfig.features,
            swaggerUI: true,
            debugLogging: true
          }
        };
        
      case 'staging':
        return {
          ...baseConfig,
          rateLimit: {
            ...baseConfig.rateLimit,
            maxRequests: 50 // More restrictive for staging
          }
        };
        
      case 'production':
        return {
          ...baseConfig,
          logging: {
            ...baseConfig.logging,
            level: 'warn' // Less verbose logging in production
          },
          features: {
            swaggerUI: false,
            debugLogging: false,
            hotReload: false
          }
        };
        
      default:
        return baseConfig;
    }
  }
}
```

## 🔍 Environment Debugging

### **Configuration Debugging Tools**
```typescript
// Configuration debugging utility
export class ConfigDebugger {
  static logConfiguration(): void {
    const config = ConfigService.getInstance();
    
    // Log non-sensitive configuration
    logger.info('Application configuration loaded', {
      environment: config.app.env,
      port: config.app.port,
      host: config.app.host,
      databaseConnected: !!config.database.uri,
      auth0Domain: config.auth0.domain,
      corsOrigin: config.security.corsOrigin,
      logLevel: config.logging.level,
      features: config.features
    });
    
    // Validate critical configuration
    this.validateCriticalConfig(config);
  }

  private static validateCriticalConfig(config: ConfigService): void {
    const issues: string[] = [];

    // Check for development secrets in production
    if (config.isProduction) {
      if (config.security.jwtSecret.includes('development') || 
          config.security.jwtSecret.includes('test')) {
        issues.push('Production environment using development JWT secret');
      }
      
      if (config.security.corsOrigin === '*') {
        issues.push('Production environment using wildcard CORS origin');
      }
    }

    // Check for missing required configuration
    if (!config.auth0.domain || !config.auth0.clientId) {
      issues.push('Auth0 configuration incomplete');
    }

    if (!config.database.uri) {
      issues.push('Database URI not configured');
    }

    // Log issues
    if (issues.length > 0) {
      logger.error('Configuration validation issues detected', { issues });
      
      if (config.isProduction) {
        process.exit(1); // Fail fast in production
      }
    }
  }

  // Mask sensitive values for logging
  static maskSensitiveValue(value: string): string {
    if (!value || value.length < 8) {
      return '***';
    }
    
    return value.substring(0, 4) + '***' + value.substring(value.length - 4);
  }
}

// Usage in application startup
ConfigDebugger.logConfiguration();
```

### **Environment Health Check**
```typescript
// Environment health check endpoint
export class HealthCheckService {
  static async checkEnvironment(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
  }> {
    const config = ConfigService.getInstance();
    const checks: Record<string, boolean> = {};

    // Check database connectivity
    try {
      await mongoose.connection.db.admin().ping();
      checks.database = true;
    } catch {
      checks.database = false;
    }

    // Check Auth0 connectivity
    try {
      const response = await fetch(`https://${config.auth0.domain}/.well-known/jwks.json`);
      checks.auth0 = response.ok;
    } catch {
      checks.auth0 = false;
    }

    // Check Redis connectivity (if configured)
    if (process.env.REDIS_URL) {
      try {
        // Redis ping check
        checks.redis = true; // Implement actual Redis ping
      } catch {
        checks.redis = false;
      }
    }

    const allHealthy = Object.values(checks).every(check => check);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    };
  }
}
```

## 🚀 Deployment Configuration

### **Docker Environment Configuration**
```dockerfile
# Dockerfile environment handling
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /usr/src/app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### **Docker Compose Environment**
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
    env_file:
      - .env.production
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped
    
  mongodb:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

### **Kubernetes Configuration**
```yaml
# k8s-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mwap-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  API_VERSION: "v1"

---
# k8s-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: mwap-secrets
type: Opaque
data:
  MONGODB_URI: <base64-encoded-uri>
  JWT_SECRET: <base64-encoded-secret>
  AUTH0_CLIENT_SECRET: <base64-encoded-secret>
```

## 📋 Environment Checklist

### **Development Setup Checklist**
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in all required environment variables
- [ ] Generate secure secrets for JWT and session
- [ ] Configure Auth0 development tenant
- [ ] Set up local MongoDB instance or Atlas connection
- [ ] Verify environment validation passes
- [ ] Test application startup with configuration
- [ ] Confirm all features work with current environment

### **Production Deployment Checklist**
- [ ] Generate production-grade secrets
- [ ] Configure production Auth0 tenant
- [ ] Set up production database with proper security
- [ ] Configure CORS for production domain
- [ ] Enable appropriate logging level
- [ ] Disable development features
- [ ] Set up monitoring and alerting
- [ ] Configure backup and disaster recovery
- [ ] Test environment health checks
- [ ] Verify secret rotation procedures

### **Security Audit Checklist**
- [ ] No secrets committed to version control
- [ ] All secrets meet minimum length requirements
- [ ] Production uses different secrets than development
- [ ] CORS configured appropriately for environment
- [ ] Rate limiting configured for environment
- [ ] Logging doesn't expose sensitive information
- [ ] Environment validation catches configuration errors
- [ ] Secret rotation procedures documented and tested

## 📚 Related Documentation

- [🛠️ Development Guide](./development-guide.md) - Complete development standards
- [🔒 Coding Standards](./coding-standards.md) - Code quality guidelines
- [📝 Naming Conventions](./naming.md) - Naming standards and examples
- [📋 Commit Style](./commit-style.md) - Git commit conventions

---

*Proper environment configuration is essential for security, reliability, and maintainability. Follow these guidelines to ensure your MWAP deployment is secure and well-configured.*