# How to Deploy MWAP Backend

This guide covers production deployment of the MWAP backend to various platforms.

## 🚀 Heroku Deployment (Recommended)

### Prerequisites
- Heroku CLI installed
- Git repository
- MongoDB Atlas account (for production database)
- Auth0 production tenant configured

### Initial Setup
```bash
# 1. Login to Heroku
heroku login

# 2. Create Heroku app
heroku create your-app-name

# 3. Add MongoDB Atlas addon (or use external MongoDB)
heroku addons:create mongolab:sandbox
# OR set custom MongoDB URI
heroku config:set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mwap"

# 4. Configure environment variables
heroku config:set NODE_ENV=production
heroku config:set AUTH0_DOMAIN="your-prod-tenant.auth0.com"
heroku config:set AUTH0_AUDIENCE="https://api.yourapp.com"
```

### Deployment Process
```bash
# 1. Push to Heroku
git push heroku main

# 2. Verify deployment
heroku logs --tail

# 3. Test health endpoint
curl https://your-app-name.herokuapp.com/health
```

### Heroku Configuration

#### Procfile
```
web: npm start
```

#### Environment Variables
```bash
# Required production environment variables
NODE_ENV=production
PORT=3000                           # Set automatically by Heroku
MONGODB_URI=mongodb+srv://...       # MongoDB Atlas connection
AUTH0_DOMAIN=prod-tenant.auth0.com
AUTH0_AUDIENCE=https://api.yourapp.com
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  api:
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

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

### Build and Deploy
```bash
# 1. Build image
docker build -t mwap-backend .

# 2. Run with environment file
docker run --env-file .env.production -p 3000:3000 mwap-backend

# 3. Or use docker-compose
docker-compose up -d
```

## ☁️ Cloud Provider Deployment

### AWS ECS/Fargate
```yaml
# task-definition.json
{
  "family": "mwap-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "mwap-backend",
      "image": "your-registry/mwap-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:mongodb-uri"
        }
      ]
    }
  ]
}
```

### Google Cloud Run
```yaml
# service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: mwap-backend
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containers:
      - image: gcr.io/project-id/mwap-backend
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mongodb-uri
              key: uri
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
```bash
# 1. Create cluster at https://cloud.mongodb.com
# 2. Configure network access (whitelist deployment IPs)
# 3. Create database user
# 4. Get connection string
mongodb+srv://username:password@cluster.mongodb.net/mwap?retryWrites=true&w=majority
```

### Local MongoDB (Development/Testing)
```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community

# Start MongoDB
brew services start mongodb-community

# Connection string
mongodb://localhost:27017/mwap_prod
```

## 🔐 Auth0 Production Setup

### Auth0 Configuration
1. **Create Production Tenant**
   - Go to Auth0 Dashboard
   - Create new tenant for production
   - Configure domain: `prod-tenant.auth0.com`

2. **Create API**
   - Identifier: `https://api.yourapp.com`
   - Signing Algorithm: RS256
   - Enable RBAC

3. **Configure Application**
   - Type: Single Page Application
   - Allowed Callback URLs: `https://yourapp.com/callback`
   - Allowed Web Origins: `https://yourapp.com`
   - Allowed Logout URLs: `https://yourapp.com`

### Environment Variables
```bash
AUTH0_DOMAIN=prod-tenant.auth0.com
AUTH0_AUDIENCE=https://api.yourapp.com
```

## 🔍 Health Checks and Monitoring

### Health Endpoint
The application exposes a health check at `/health`:

```bash
# Test health endpoint
curl https://your-app.com/health

# Expected response
{
  "status": "ok"
}
```

### Application Monitoring
```typescript
// Built-in structured logging
import { logInfo, logError } from './utils/logger';

// Logs are automatically formatted for monitoring systems
logInfo('Server started', { 
  port: process.env.PORT,
  environment: process.env.NODE_ENV
});
```

### Performance Monitoring
- **Response Time**: Monitor API response times
- **Error Rate**: Track 4xx/5xx response codes
- **Database Connections**: Monitor MongoDB connection pool
- **Memory Usage**: Track Node.js memory consumption

## 🛡️ Security Checklist

### Production Security
- [ ] HTTPS enforced (SSL certificate)
- [ ] Environment variables secured (no hardcoded secrets)
- [ ] Database network access restricted
- [ ] Auth0 production tenant configured
- [ ] Rate limiting enabled
- [ ] Security headers configured (Helmet.js)
- [ ] Error messages sanitized (no internal details exposed)

### Network Security
```bash
# Restrict database access to application IPs only
# Configure firewall rules for API server
# Use VPC/private networks where possible
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### Application Won't Start
```bash
# Check logs
heroku logs --tail

# Common causes
Error: Missing required environment variable
→ Set missing environment variables

Error: Cannot connect to MongoDB
→ Verify MONGODB_URI and network access
```

#### Auth0 Token Validation Fails
```bash
Error: jwt audience invalid
→ Verify AUTH0_AUDIENCE matches API identifier

Error: Unable to verify signature
→ Check AUTH0_DOMAIN configuration
```

#### Database Connection Issues
```bash
Error: MongoNetworkError
→ Check MongoDB URI and network whitelist

Error: Authentication failed
→ Verify database credentials
```

### Performance Issues
```bash
# Check application metrics
heroku logs --ps web

# Common solutions
- Scale dynos: heroku ps:scale web=2
- Upgrade database tier
- Add connection pooling
- Implement caching
```

## 📊 Scaling Considerations

### Horizontal Scaling
```bash
# Heroku
heroku ps:scale web=3

# Docker
docker-compose up --scale api=3

# Kubernetes
kubectl scale deployment mwap-backend --replicas=3
```

### Database Scaling
- **Read Replicas**: For read-heavy workloads
- **Sharding**: For large datasets
- **Connection Pooling**: Optimize database connections
- **Indexing**: Ensure optimal query performance

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "your-app-name"
        heroku_email: "your-email@example.com"
```

## 📖 Related Documentation

- **[Environment Variables](../07-Standards/.env-format.md)** - Configuration setup
- **[Auth0 Implementation](../04-Backend/auth0.md)** - Authentication configuration
- **[Development Guide](../07-Standards/development-guide.md)** - Local development setup

---

*Follow this guide for reliable, secure production deployments of the MWAP backend.* 