# Deployment Guide

This document provides comprehensive deployment instructions for the MWAP backend API, based on the actual build configuration and deployment setup.

## Overview

MWAP is designed for deployment on **Heroku** with the following characteristics:
- **Node.js 20.x runtime**: Specified in `package.json` engines
- **ESM modules**: Native ES module support
- **Build process**: TypeScript compilation with tsup
- **Environment-based configuration**: Production-ready settings

## Build Configuration

### Build Process

**File**: `package.json`

```json
{
  "scripts": {
    "build": "tsup src/server.ts --format esm --clean",
    "heroku-postbuild": "npm run build",
    "start": "node dist/server.js"
  },
  "engines": {
    "node": "20.x"
  }
}
```

### Build Tool: tsup

**Configuration**: Inline in package.json
- **Entry point**: `src/server.ts`
- **Output format**: ESM modules
- **Clean build**: Removes previous build artifacts
- **Output directory**: `dist/`

## Heroku Deployment

### Prerequisites

1. **Heroku CLI**: Install and authenticate
2. **Git repository**: Code in version control
3. **Environment variables**: Production configuration
4. **MongoDB Atlas**: Database cluster setup

### Deployment Steps

1. **Create Heroku Application**
   ```bash
   heroku create your-app-name
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mwap-prod"
   heroku config:set AUTH0_DOMAIN="your-tenant.auth0.com"
   heroku config:set AUTH0_AUDIENCE="https://api.mwap.dev"
   ```

3. **Deploy Application**
   ```bash
   git push heroku main
   ```

4. **Verify Deployment**
   ```bash
   heroku logs --tail
   heroku open
   ```

### Heroku Configuration

#### Buildpacks
Heroku automatically detects Node.js and uses the appropriate buildpack.

#### Process Types
**File**: `Procfile` (if needed)
```
web: node dist/server.js
```

#### Build Process
1. **Install dependencies**: `npm install`
2. **Run heroku-postbuild**: Executes `npm run build`
3. **Start application**: Runs `npm start`

## Environment Configuration

### Production Environment Variables

Required variables for production deployment:

```bash
# Application
NODE_ENV=production
PORT=3001  # Heroku sets this automatically

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap-prod

# Auth0
AUTH0_DOMAIN=your-production-tenant.auth0.com
AUTH0_AUDIENCE=https://api.mwap.dev
```

### Security Configuration

Production security settings in `src/app.ts`:

```typescript
// CORS - Production restricts to specific origin
app.use(cors({
  origin: env.NODE_ENV === 'production' ? 'https://app.mwap.dev' : true,
  credentials: true
}));

// Rate limiting - 100 requests per 15 minutes
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Security headers via Helmet
app.use(helmet());
```

## Database Setup

### MongoDB Atlas Configuration

1. **Create Production Cluster**
   - Choose appropriate tier for production workload
   - Configure network access for Heroku IPs
   - Set up database users with appropriate permissions

2. **Connection String**
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

3. **Security Settings**
   - Enable authentication
   - Configure IP whitelist (or allow all for Heroku)
   - Use strong passwords
   - Enable audit logging

### Database Indexes

Ensure production indexes are created:

```javascript
// Tenant isolation
db.projects.createIndex({ tenantId: 1 });
db.files.createIndex({ tenantId: 1 });
db.cloudIntegrations.createIndex({ tenantId: 1 });

// User lookups
db.users.createIndex({ auth0Id: 1 }, { unique: true });
db.tenants.createIndex({ ownerId: 1 }, { unique: true });

// Project operations
db.projects.createIndex({ tenantId: 1, status: 1 });
db.projects.createIndex({ 'members.userId': 1 });

// File system
db.files.createIndex({ projectId: 1, path: 1 }, { unique: true });
```

## Auth0 Configuration

### Production Auth0 Setup

1. **Create Production Tenant**
   - Separate tenant for production environment
   - Configure custom domain if needed
   - Set up appropriate branding

2. **Application Configuration**
   ```json
   {
     "name": "MWAP Production API",
     "type": "Regular Web Application",
     "callbacks": ["https://your-app.herokuapp.com/callback"],
     "allowed_origins": ["https://app.mwap.dev"],
     "jwt_configuration": {
       "alg": "RS256"
     }
   }
   ```

3. **API Configuration**
   ```json
   {
     "name": "MWAP Production API",
     "identifier": "https://api.mwap.dev",
     "signing_alg": "RS256",
     "scopes": []
   }
   ```

## Monitoring and Logging

### Heroku Logging

View application logs:
```bash
# Real-time logs
heroku logs --tail

# Historical logs
heroku logs --num 500

# Filter by source
heroku logs --source app
```

### Application Logging

MWAP uses structured logging:

```typescript
import { logInfo, logError } from './utils/logger.js';

// Info logging
logInfo('Server started', { port: env.PORT });

// Error logging
logError('Database connection failed', error);
```

### Health Monitoring

Health check endpoint:
```
GET /health
Response: { "status": "ok" }
```

Monitor this endpoint for application health.

## Performance Optimization

### Production Optimizations

1. **Connection Pooling**
   - MongoDB driver manages connection pool automatically
   - Default pool size: 100 connections

2. **Response Compression**
   - Consider adding compression middleware for large responses
   - Gzip compression for JSON responses

3. **Caching Strategy**
   - Implement Redis for session caching if needed
   - Cache frequently accessed data

### Scaling Considerations

1. **Horizontal Scaling**
   - Heroku dynos can be scaled horizontally
   - Stateless application design supports scaling

2. **Database Scaling**
   - MongoDB Atlas supports automatic scaling
   - Consider read replicas for read-heavy workloads

3. **CDN Integration**
   - Use CDN for static assets
   - Cache API responses where appropriate

## Security Best Practices

### Production Security

1. **Environment Variables**
   - Never commit secrets to version control
   - Use Heroku config vars for sensitive data
   - Rotate credentials regularly

2. **Network Security**
   - HTTPS only in production
   - Strict CORS configuration
   - Rate limiting enabled

3. **Database Security**
   - MongoDB Atlas encryption at rest
   - Network access restrictions
   - Strong authentication

4. **Application Security**
   - Helmet security headers
   - Input validation with Zod
   - JWT token validation

## Backup and Recovery

### Database Backups

MongoDB Atlas provides:
- **Automated backups**: Point-in-time recovery
- **Backup retention**: Configurable retention periods
- **Cross-region replication**: High availability

### Application Recovery

1. **Code Recovery**
   - Git version control
   - Tagged releases
   - Rollback procedures

2. **Configuration Recovery**
   - Document environment variables
   - Backup Heroku configuration
   - Infrastructure as code

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   ```bash
   # Check build logs
   heroku logs --source app --dyno build
   
   # Common issues:
   # - Missing dependencies
   # - TypeScript compilation errors
   # - Environment variable issues
   ```

2. **Runtime Errors**
   ```bash
   # Check application logs
   heroku logs --tail
   
   # Common issues:
   # - Database connection failures
   # - Auth0 configuration errors
   # - Missing environment variables
   ```

3. **Performance Issues**
   ```bash
   # Monitor dyno metrics
   heroku ps
   heroku logs --ps web
   
   # Common issues:
   # - Memory leaks
   # - Database connection pool exhaustion
   # - Slow queries
   ```

### Debugging Production Issues

1. **Enable Debug Logging**
   ```bash
   heroku config:set LOG_LEVEL=debug
   ```

2. **Database Monitoring**
   - Use MongoDB Atlas monitoring
   - Check slow query logs
   - Monitor connection metrics

3. **Application Metrics**
   - Monitor response times
   - Track error rates
   - Monitor memory usage

## Maintenance

### Regular Maintenance Tasks

1. **Security Updates**
   - Update dependencies regularly
   - Monitor security advisories
   - Apply security patches promptly

2. **Performance Monitoring**
   - Review application metrics
   - Optimize slow queries
   - Monitor resource usage

3. **Backup Verification**
   - Test backup restoration
   - Verify backup integrity
   - Update recovery procedures

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Auth0 configuration verified
- [ ] Security settings enabled
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Health checks passing
- [ ] Performance baseline established

---
*This deployment guide reflects the current application configuration and should be updated when deployment procedures change.*