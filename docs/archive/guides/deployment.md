# Migration & Deployment Guide

This guide covers database migrations, deployment strategies, and environment transitions for the MWAP platform.

## 🗄️ Database Migrations

### Migration Strategy

MWAP uses a **schema-less** approach with MongoDB, but we maintain data consistency through:
- **Application-level validation** using Zod schemas
- **Gradual migration** for data structure changes
- **Backward compatibility** during transitions
- **Versioned data models** for major changes

### Migration Types

#### 1. Schema Validation Updates
When updating Zod schemas:
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
    allowPublicProjects: z.boolean().default(false)
  }).optional() // Make optional for backward compatibility
});
```

#### 2. Data Structure Changes
For significant data structure changes:
```typescript
// Migration function example
async function migrateTenantSettings() {
  const db = await connectToDatabase();
  const tenants = db.collection('tenants');
  
  // Find tenants without settings
  const tenantsWithoutSettings = await tenants.find({
    settings: { $exists: false }
  }).toArray();
  
  // Add default settings
  for (const tenant of tenantsWithoutSettings) {
    await tenants.updateOne(
      { _id: tenant._id },
      {
        $set: {
          settings: {
            allowPublicProjects: false,
            maxProjects: 10
          }
        }
      }
    );
  }
}
```

#### 3. Index Management
```typescript
// Add indexes for performance
async function createIndexes() {
  const db = await connectToDatabase();
  
  // Tenant indexes
  await db.collection('tenants').createIndex({ ownerId: 1 });
  await db.collection('tenants').createIndex({ name: 1 });
  
  // Project indexes
  await db.collection('projects').createIndex({ tenantId: 1 });
  await db.collection('projects').createIndex({ tenantId: 1, name: 1 });
  
  // Member indexes
  await db.collection('projectMembers').createIndex({ projectId: 1 });
  await db.collection('projectMembers').createIndex({ userId: 1 });
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

## 🚀 Deployment Strategies

### 1. Local Development
```bash
# Start development server
npm run dev

# Run with specific environment
NODE_ENV=development npm run dev

# Debug mode
DEBUG=* npm run dev
```

### 2. Staging Deployment

#### Environment Setup
```bash
# Staging environment variables
NODE_ENV=staging
PORT=3000
MONGODB_URI=<staging-mongodb-uri>
AUTH0_DOMAIN=<staging-auth0-domain>
AUTH0_AUDIENCE=<staging-auth0-audience>
```

#### Deploy to Staging
```bash
# Build application
npm run build

# Run staging server
npm run start:staging

# Health check
curl https://staging-api.mwap.com/health
```

### 3. Production Deployment

#### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Load testing completed

#### Production Environment
```bash
# Production environment variables (use secret management)
NODE_ENV=production
PORT=3000
MONGODB_URI=<production-mongodb-uri>
AUTH0_DOMAIN=<production-auth0-domain>
AUTH0_AUDIENCE=<production-auth0-audience>

# Security
JWT_SECRET=<secure-production-secret>
ENCRYPTION_KEY=<secure-production-key>

# Monitoring
LOG_LEVEL=info
AUDIT_ENABLED=true
```

#### Deploy to Production
```bash
# Build optimized application
npm run build:production

# Start production server
npm run start

# Verify deployment
npm run verify:production
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY dist/ ./dist/
COPY public/ ./public/

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  mwap-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - AUTH0_DOMAIN=${AUTH0_DOMAIN}
      - AUTH0_AUDIENCE=${AUTH0_AUDIENCE}
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

### Docker Deployment Commands
```bash
# Build image
docker build -t mwap-api:latest .

# Run container
docker run -d \
  --name mwap-api \
  -p 3000:3000 \
  --env-file .env.production \
  mwap-api:latest

# Docker Compose
docker-compose up -d

# Check logs
docker logs mwap-api

# Health check
docker exec mwap-api curl http://localhost:3000/health
```

## ☁️ Cloud Deployment

### Heroku Deployment

#### Setup
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create mwap-api-production

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=<production-uri>
heroku config:set AUTH0_DOMAIN=<production-domain>
heroku config:set AUTH0_AUDIENCE=<production-audience>
```

#### Deploy
```bash
# Deploy to Heroku
git push heroku main

# Check logs
heroku logs --tail

# Scale dynos
heroku ps:scale web=1
```

### AWS Deployment

#### Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init mwap-api

# Create environment
eb create production

# Deploy
eb deploy

# Check status
eb status
```

#### ECS/Fargate
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-uri>
docker tag mwap-api:latest <ecr-uri>/mwap-api:latest
docker push <ecr-uri>/mwap-api:latest

# Deploy to ECS
aws ecs update-service --cluster mwap-cluster --service mwap-api-service --force-new-deployment
```

### Google Cloud Platform

#### Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/<project-id>/mwap-api
gcloud run deploy mwap-api --image gcr.io/<project-id>/mwap-api --platform managed

# Set environment variables
gcloud run services update mwap-api \
  --set-env-vars NODE_ENV=production,MONGODB_URI=<uri>
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy MWAP API

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Your deployment script here
          npm run deploy:production
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```typescript
// Health check implementation
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    
    // Check Auth0 connectivity
    const authCheck = await fetch(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      auth: authCheck.ok ? 'connected' : 'disconnected',
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Monitoring Setup
```bash
# Application monitoring
npm install --save @sentry/node

# Performance monitoring
npm install --save newrelic

# Health monitoring
npm install --save express-health-check
```

## 🔧 Rollback Procedures

### Application Rollback
```bash
# Heroku rollback
heroku rollback v123

# Docker rollback
docker pull mwap-api:v1.2.3
docker stop mwap-api
docker run -d --name mwap-api mwap-api:v1.2.3

# Kubernetes rollback
kubectl rollout undo deployment/mwap-api
```

### Database Rollback
```bash
# Restore from backup
mongorestore --uri="<connection-string>" --archive=backup-2025-01-15.archive

# Application-level rollback
npm run migrate:rollback -- --to=v1.2.3
```

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Code review completed
- [ ] All tests passing
- [ ] Security scan passed
- [ ] Performance testing completed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Backup created

### Deployment
- [ ] Application deployed successfully
- [ ] Health checks passing
- [ ] Database migrations executed
- [ ] SSL certificates valid
- [ ] DNS configured correctly
- [ ] Monitoring enabled

### Post-deployment
- [ ] Smoke tests passed
- [ ] Performance metrics normal
- [ ] Error rates within acceptable limits
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Team notified

---

*This guide ensures safe and reliable deployments of the MWAP platform across all environments.* 