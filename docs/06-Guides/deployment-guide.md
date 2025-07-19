# MWAP Deployment Guide

This comprehensive guide covers database migrations, deployment strategies, environment transitions, and production deployment for the MWAP platform.

## 🎯 Deployment Overview

### Deployment Philosophy
MWAP supports multiple deployment strategies with emphasis on:
- **Zero-downtime deployments** with health checks
- **Environment parity** across development, staging, and production
- **Security-first approach** with encrypted secrets and secure defaults
- **Scalable architecture** supporting horizontal scaling
- **Comprehensive monitoring** with health checks and logging

### Supported Platforms
- **Heroku** (Recommended for simplicity)
- **Docker** (Container deployment)
- **AWS** (ECS, Fargate, Elastic Beanstalk)
- **Google Cloud** (Cloud Run, GKE)
- **Azure** (Container Instances, App Service)

## 🗄️ Database Migration Strategy

### Migration Philosophy
MWAP uses a **schema-less** approach with MongoDB, maintaining data consistency through:
- **Application-level validation** using Zod schemas
- **Gradual migration** for data structure changes
- **Backward compatibility** during transitions
- **Versioned data models** for major changes

### Migration Types

#### 1. Schema Validation Updates
When updating Zod schemas for backward compatibility:
```typescript
// Before (v1)
const TenantSchema = z.object({
  name: z.string(),
  ownerId: z.string()
});

// After (v2) - Adding optional field
const TenantSchema = z.object({
  name: z.string(),
  ownerId: z.string(),
  settings: z.object({
    allowPublicProjects: z.boolean().default(false),
    maxProjects: z.number().min(1).max(100).default(10)
  }).optional() // Make optional for backward compatibility
});
```

#### 2. Data Structure Migrations
For significant data structure changes:
```typescript
// Migration script example
import { getDatabase } from '../src/config/db.js';
import { logInfo, logError } from '../src/utils/logger.js';

export async function migrateTenantSettings() {
  const db = getDatabase();
  const tenants = db.collection('tenants');
  
  try {
    // Find tenants without settings
    const tenantsWithoutSettings = await tenants.find({
      settings: { $exists: false }
    }).toArray();
    
    logInfo(`Migrating ${tenantsWithoutSettings.length} tenants`);
    
    // Add default settings
    for (const tenant of tenantsWithoutSettings) {
      await tenants.updateOne(
        { _id: tenant._id },
        {
          $set: {
            settings: {
              allowPublicProjects: false,
              maxProjects: 10
            },
            updatedAt: new Date()
          }
        }
      );
    }
    
    logInfo('Tenant settings migration completed successfully');
  } catch (error) {
    logError('Tenant settings migration failed', error);
    throw error;
  }
}
```

#### 3. Index Management
```typescript
// Create performance indexes
export async function createOptimalIndexes() {
  const db = getDatabase();
  
  try {
    // Tenant indexes
    await db.collection('tenants').createIndex({ ownerId: 1 }, { unique: true });
    await db.collection('tenants').createIndex({ archived: 1 });
    
    // Project indexes
    await db.collection('projects').createIndex({ tenantId: 1 });
    await db.collection('projects').createIndex({ tenantId: 1, name: 1 }, { unique: true });
    await db.collection('projects').createIndex({ 'members.userId': 1 });
    
    // Cloud integration indexes
    await db.collection('cloudIntegrations').createIndex({ tenantId: 1, providerId: 1 }, { unique: true });
    await db.collection('cloudIntegrations').createIndex({ 'authData.expiresAt': 1 });
    
    logInfo('Database indexes created successfully');
  } catch (error) {
    logError('Index creation failed', error);
    throw error;
  }
}
```

### Migration Execution

#### Development Environment
```bash
# Run migration scripts
npm run migrate:dev

# Specific migration
npm run migrate:dev -- --script=add-tenant-settings

# Rollback last migration
npm run migrate:rollback

# Verify migration
npm run migrate:verify
```

#### Production Environment
```bash
# Always backup before migration
npm run db:backup

# Run migration with dry-run first
npm run migrate:prod -- --dry-run

# Execute migration
npm run migrate:prod

# Verify migration success
npm run db:verify
```

## 🚀 Heroku Deployment (Recommended)

### Prerequisites
- Heroku CLI installed and configured
- Git repository with the MWAP codebase
- MongoDB Atlas account (for production database)
- Auth0 production tenant configured

### Initial Setup

#### 1. Create Heroku Application
```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create mwap-api-production

# Verify app creation
heroku apps:info mwap-api-production
```

#### 2. Configure Environment Variables
```bash
# Required production environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mwap?retryWrites=true&w=majority"
heroku config:set AUTH0_DOMAIN="prod-tenant.auth0.com"
heroku config:set AUTH0_AUDIENCE="https://api.yourapp.com"

# Security variables (use strong, unique values)
heroku config:set JWT_SECRET="$(openssl rand -base64 32)"
heroku config:set ENCRYPTION_KEY="$(openssl rand -base64 32)"

# Optional: Add monitoring
heroku config:set LOG_LEVEL=info
heroku config:set SENTRY_DSN="https://your-sentry-dsn"
```

#### 3. Configure Procfile
```
web: npm start
release: npm run migrate:prod
```

### Deployment Process
```bash
# 1. Ensure code is committed
git add .
git commit -m "Prepare for production deployment"

# 2. Deploy to Heroku
git push heroku main

# 3. Monitor deployment
heroku logs --tail

# 4. Verify health
curl https://mwap-api-production.herokuapp.com/health

# 5. Scale if needed
heroku ps:scale web=1
```

### Heroku Add-ons (Optional)
```bash
# Add logging
heroku addons:create papertrail:choklad

# Add monitoring
heroku addons:create newrelic:wayne

# Add backup
heroku addons:create heroku-postgresql:mini
```

## 🐳 Docker Deployment

### Production Dockerfile
```dockerfile
# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mwap -u 1001

# Change ownership
RUN chown -R mwap:nodejs /app
USER mwap

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Docker Compose for Production
```yaml
version: '3.8'

services:
  mwap-api:
    build: 
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGODB_URI=${MONGODB_URI}
      - AUTH0_DOMAIN=${AUTH0_DOMAIN}
      - AUTH0_AUDIENCE=${AUTH0_AUDIENCE}
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    restart: unless-stopped
    depends_on:
      - mongodb
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
      - MONGO_INITDB_DATABASE=mwap
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - mwap-api
    restart: unless-stopped

volumes:
  mongodb_data:
```

### Docker Deployment Commands
```bash
# Build optimized production image
docker build --target production -t mwap-api:latest .

# Run with environment file
docker run -d \
  --name mwap-api \
  --env-file .env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  mwap-api:latest

# Using Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Monitor logs
docker logs -f mwap-api

# Health check
docker exec mwap-api curl -f http://localhost:3000/health
```

## ☁️ Cloud Platform Deployment

### AWS ECS/Fargate

#### Task Definition
```json
{
  "family": "mwap-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "mwap-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/mwap-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mwap-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:mongodb-uri"
        },
        {
          "name": "AUTH0_DOMAIN",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:auth0-domain"
        },
        {
          "name": "AUTH0_AUDIENCE",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:auth0-audience"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### Deployment Commands
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t mwap-backend .
docker tag mwap-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/mwap-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/mwap-backend:latest

# Deploy to ECS
aws ecs update-service --cluster mwap-cluster --service mwap-backend-service --force-new-deployment

# Monitor deployment
aws ecs describe-services --cluster mwap-cluster --services mwap-backend-service
```

### Google Cloud Run

#### Cloud Run Service Configuration
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: mwap-backend
  labels:
    cloud.googleapis.com/location: us-central1
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/minScale: "1"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/execution-environment: gen2
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/project-id/mwap-backend:latest
        ports:
        - name: http1
          containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mongodb-uri
              key: uri
        - name: AUTH0_DOMAIN
          valueFrom:
            secretKeyRef:
              name: auth0-config
              key: domain
        - name: AUTH0_AUDIENCE
          valueFrom:
            secretKeyRef:
              name: auth0-config
              key: audience
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
          requests:
            cpu: "1"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Deployment Commands
```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/project-id/mwap-backend

# Deploy service
gcloud run deploy mwap-backend \
  --image gcr.io/project-id/mwap-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --cpu 1 \
  --memory 1Gi \
  --min-instances 1 \
  --max-instances 10

# Configure custom domain
gcloud run domain-mappings create --service mwap-backend --domain api.yourapp.com
```

## 🗄️ Database Setup

### MongoDB Atlas (Production Recommended)

#### Setup Steps
1. **Create MongoDB Atlas Account**
   - Visit [MongoDB Atlas](https://cloud.mongodb.com)
   - Create account and verify email
   - Create organization and project

2. **Create Cluster**
   - Choose cloud provider (AWS/GCP/Azure)
   - Select region closest to your app deployment
   - Choose cluster tier (M10+ for production)
   - Configure cluster name

3. **Configure Security**
   ```bash
   # Create database user
   Username: mwap-prod-user
   Password: <generate-strong-password>
   Roles: readWrite@mwap
   
   # Configure IP Whitelist
   # Add deployment server IPs
   # For cloud deployments, add service IP ranges
   ```

4. **Get Connection String**
   ```
   mongodb+srv://mwap-prod-user:<password>@cluster.mongodb.net/mwap?retryWrites=true&w=majority
   ```

#### Production Configuration
```bash
# Optimized connection string for production
mongodb+srv://username:password@cluster.mongodb.net/mwap?retryWrites=true&w=majority&maxPoolSize=10&minPoolSize=2&maxIdleTimeMS=30000&serverSelectionTimeoutMS=5000
```

### Self-Managed MongoDB

#### Docker MongoDB Setup
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: mwap-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: mwap
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    command: mongod --auth --bind_ip_all

volumes:
  mongodb_data:
  mongodb_config:
```

## 🔐 Auth0 Production Configuration

### Auth0 Setup

#### 1. Create Production Tenant
1. **Navigate to Auth0 Dashboard**
2. **Create New Tenant**
   - Tenant name: `mwap-production`
   - Region: Choose closest to your deployment
   - Environment: Production

#### 2. Configure API
```javascript
// API Configuration
{
  "name": "MWAP Production API",
  "identifier": "https://api.yourapp.com",
  "signing_alg": "RS256",
  "allow_offline_access": false,
  "skip_consent_for_verifiable_first_party_clients": true,
  "token_lifetime": 86400, // 24 hours
  "token_lifetime_for_web": 7200 // 2 hours for web
}
```

#### 3. Configure Application
```javascript
// Application Configuration
{
  "name": "MWAP Frontend Production",
  "app_type": "spa",
  "oidc_conformant": true,
  "callbacks": [
    "https://yourapp.com/callback",
    "https://yourapp.com/silent-callback"
  ],
  "allowed_logout_urls": [
    "https://yourapp.com"
  ],
  "allowed_origins": [
    "https://yourapp.com"
  ],
  "web_origins": [
    "https://yourapp.com"
  ],
  "grant_types": [
    "authorization_code",
    "refresh_token"
  ]
}
```

#### 4. Security Settings
```javascript
// Security Configuration
{
  "session_cookie": {
    "mode": "persistent"
  },
  "idle_session_lifetime": 72, // 72 hours
  "session_lifetime": 168, // 1 week
  "require_pushed_authorization_requests": false,
  "mfa": {
    "enabled": true,
    "policy": "opt-in"
  }
}
```

### Environment Variables
```bash
# Production Auth0 Configuration
AUTH0_DOMAIN=mwap-production.auth0.com
AUTH0_AUDIENCE=https://api.yourapp.com
AUTH0_CLIENT_ID=<production-client-id>
AUTH0_CLIENT_SECRET=<production-client-secret>
```

## 🔍 Health Checks & Monitoring

### Health Check Implementation

#### Enhanced Health Endpoint
```typescript
// src/routes/health.ts
import { Request, Response } from 'express';
import { getDatabase } from '../config/db.js';
import { logInfo, logError } from '../utils/logger.js';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  database: 'connected' | 'disconnected';
  auth: 'connected' | 'disconnected';
  memory: {
    used: number;
    free: number;
    total: number;
  };
}

export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  
  const healthData: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || 'unknown',
    database: 'disconnected',
    auth: 'disconnected',
    memory: {
      used: 0,
      free: 0,
      total: 0
    }
  };

  try {
    // Check database connection
    const db = getDatabase();
    await db.admin().ping();
    healthData.database = 'connected';
    logInfo('Health check: Database connection OK');
  } catch (error) {
    healthData.database = 'disconnected';
    overallStatus = 'unhealthy';
    logError('Health check: Database connection failed', error);
  }

  try {
    // Check Auth0 connectivity
    const authResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`, {
      timeout: 5000
    });
    healthData.auth = authResponse.ok ? 'connected' : 'disconnected';
    
    if (!authResponse.ok && overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
  } catch (error) {
    healthData.auth = 'disconnected';
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
    logError('Health check: Auth0 connection failed', error);
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  healthData.memory = {
    used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024), // MB
    total: Math.round(memUsage.heapTotal / 1024 / 1024) // MB
  };

  healthData.status = overallStatus;
  
  const responseTime = Date.now() - startTime;
  logInfo('Health check completed', { 
    status: overallStatus, 
    responseTime,
    database: healthData.database,
    auth: healthData.auth
  });

  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503;

  res.status(statusCode).json(healthData);
}
```

### Application Monitoring

#### Structured Logging
```typescript
// Enhanced logging configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'mwap-api',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file logging in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

export { logger };
```

#### Performance Metrics
```typescript
// src/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';
import { logInfo } from '../utils/logger.js';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logInfo('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.auth?.sub
    });
  });
  
  next();
}
```

### External Monitoring Setup

#### Sentry Error Tracking
```typescript
// src/config/sentry.ts
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.npm_package_version,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter sensitive data
      if (event.request?.headers) {
        delete event.request.headers.authorization;
      }
      return event;
    }
  });
}

export { Sentry };
```

## 🔄 CI/CD Pipeline

### GitHub Actions Production Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level=high

      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@v2

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test, security]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist/

  deploy-heroku:
    name: Deploy to Heroku
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.14
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: ${{ secrets.HEROKU_APP_NAME }}
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
          healthcheck: "https://${{ secrets.HEROKU_APP_NAME }}.herokuapp.com/health"
          rollbackonhealthcheckfailed: true

  deploy-docker:
    name: Deploy to Docker Registry
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to DockerHub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/mwap-backend:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/mwap-backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  post-deploy:
    name: Post-deployment Tests
    runs-on: ubuntu-latest
    needs: [deploy-heroku]
    steps:
      - name: Health Check
        run: |
          curl -f https://${{ secrets.HEROKU_APP_NAME }}.herokuapp.com/health
          
      - name: Smoke Tests
        run: |
          # Add smoke tests here
          echo "Running smoke tests..."
```

## 🛡️ Security Checklist

### Production Security Requirements
- [ ] **HTTPS enforced** with valid SSL certificate
- [ ] **Environment variables secured** (no hardcoded secrets)
- [ ] **Database access restricted** to application IPs only
- [ ] **Auth0 production tenant** properly configured
- [ ] **Rate limiting enabled** and configured
- [ ] **Security headers** configured (Helmet.js)
- [ ] **Error messages sanitized** (no internal details exposed)
- [ ] **CORS properly configured** for production domains
- [ ] **Secrets management** using secure key storage
- [ ] **Regular security updates** process established

### Security Configuration Example
```typescript
// src/config/security.ts
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

export const securityMiddleware = [
  // Security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.auth0.com"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // CORS configuration
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourapp.com', 'https://www.yourapp.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }),

  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  })
];
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### Application Won't Start
```bash
# Check logs
heroku logs --tail
# or
docker logs mwap-api

# Common causes and solutions:
Error: Missing required environment variable
→ Verify all required environment variables are set
→ Check variable names for typos

Error: Cannot connect to MongoDB
→ Verify MONGODB_URI format and credentials
→ Check network access and IP whitelist

Error: Port already in use
→ Check if PORT environment variable is set correctly
→ Ensure no other process is using the port
```

#### Database Connection Issues
```bash
# MongoDB connection troubleshooting
Error: MongoNetworkError
→ Check MongoDB URI format
→ Verify network connectivity
→ Check IP whitelist in MongoDB Atlas

Error: Authentication failed
→ Verify database username and password
→ Check database user permissions
→ Ensure database name is correct

Error: Connection timeout
→ Check firewall settings
→ Verify network latency
→ Increase connection timeout in connection string
```

#### Auth0 Authentication Issues
```bash
# Auth0 troubleshooting
Error: jwt audience invalid
→ Verify AUTH0_AUDIENCE matches API identifier in Auth0
→ Check for trailing slashes or typos

Error: Unable to verify signature
→ Verify AUTH0_DOMAIN is correct
→ Check JWKS endpoint accessibility
→ Ensure RS256 algorithm is used

Error: Token expired
→ Check token expiration settings in Auth0
→ Verify system clock synchronization
→ Implement token refresh logic
```

### Performance Issues
```bash
# Performance troubleshooting
High memory usage:
→ Check for memory leaks
→ Implement proper connection pooling
→ Optimize database queries

Slow response times:
→ Add database indexes
→ Implement caching
→ Optimize API endpoints
→ Use database query profiling

High CPU usage:
→ Profile application performance
→ Optimize heavy computations
→ Consider horizontal scaling
```

## 📊 Scaling and Performance

### Horizontal Scaling
```bash
# Heroku scaling
heroku ps:scale web=3

# Docker Compose scaling
docker-compose up --scale api=3

# Kubernetes scaling
kubectl scale deployment mwap-backend --replicas=3

# AWS ECS scaling
aws ecs update-service --cluster mwap-cluster --service mwap-backend --desired-count 3
```

### Database Optimization
```javascript
// Connection pooling configuration
const mongoOptions = {
  maxPoolSize: 10,           // Maximum connections
  minPoolSize: 2,            // Minimum connections
  maxIdleTimeMS: 30000,      // Close connections after 30s idle
  serverSelectionTimeoutMS: 5000,  // Server selection timeout
  socketTimeoutMS: 45000,    // Socket timeout
  bufferMaxEntries: 0,       // Disable mongoose buffering
  bufferCommands: false,     // Disable mongoose buffering
};
```

### Performance Monitoring
```typescript
// Performance metrics collection
import { performance } from 'perf_hooks';

export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    
    if (duration > 1000) { // Log slow requests
      logWarn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: Math.round(duration),
        userId: req.auth?.sub
      });
    }
  });
  
  next();
}
```

## 🔄 Rollback Procedures

### Application Rollback
```bash
# Heroku rollback
heroku rollback v123
heroku ps:restart

# Docker rollback
docker pull mwap-api:v1.2.3
docker stop mwap-api
docker rm mwap-api
docker run -d --name mwap-api --env-file .env.production mwap-api:v1.2.3

# Kubernetes rollback
kubectl rollout undo deployment/mwap-backend
kubectl rollout status deployment/mwap-backend

# AWS ECS rollback
aws ecs update-service --cluster mwap-cluster --service mwap-backend --task-definition mwap-backend:123
```

### Database Rollback
```bash
# MongoDB restore from backup
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/mwap" --archive=backup-2025-01-15.archive --gzip

# Verify restore
mongo --eval "db.tenants.countDocuments()"
```

---
*This comprehensive deployment guide ensures safe, secure, and scalable deployments of the MWAP platform across all environments and platforms.* 