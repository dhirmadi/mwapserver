# 🚀 MWAP Deployment Guide

## 🎯 Overview

This comprehensive deployment guide covers all aspects of deploying the MWAP platform to production environments, including infrastructure setup, configuration management, security hardening, monitoring, and maintenance procedures.

## 🏗️ Deployment Architecture

### **Production Architecture**
```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX Load Balancer]
    end
    
    subgraph "Application Tier"
        APP1[MWAP Server Instance 1]
        APP2[MWAP Server Instance 2]
        APP3[MWAP Server Instance 3]
    end
    
    subgraph "Database Tier"
        MONGO[MongoDB Atlas Cluster]
        REDIS[Redis Cache]
    end
    
    subgraph "External Services"
        AUTH0[Auth0]
        CDN[CloudFront CDN]
        S3[AWS S3]
    end
    
    subgraph "Monitoring"
        LOGS[Centralized Logging]
        METRICS[Metrics Collection]
        ALERTS[Alert Manager]
    end
    
    LB --> APP1
    LB --> APP2
    LB --> APP3
    
    APP1 --> MONGO
    APP2 --> MONGO
    APP3 --> MONGO
    
    APP1 --> REDIS
    APP2 --> REDIS
    APP3 --> REDIS
    
    APP1 --> AUTH0
    APP2 --> AUTH0
    APP3 --> AUTH0
    
    CDN --> S3
    
    APP1 --> LOGS
    APP2 --> LOGS
    APP3 --> LOGS
    
    APP1 --> METRICS
    APP2 --> METRICS
    APP3 --> METRICS
```

## 🐳 Docker Deployment

### **Dockerfile**
```dockerfile
# Multi-stage build for production
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mwap -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=mwap:nodejs /app/dist ./dist
COPY --from=builder --chown=mwap:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mwap:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown mwap:nodejs /app/logs

# Switch to non-root user
USER mwap

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/server.js"]
```

### **Docker Compose for Production**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mwap-app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    image: mwap-server:latest
    container_name: mwap-app
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    env_file:
      - .env.production
    volumes:
      - ./logs:/app/logs
      - /etc/ssl/certs:/etc/ssl/certs:ro
    networks:
      - mwap-network
    depends_on:
      - redis
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

  redis:
    image: redis:7-alpine
    container_name: mwap-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - mwap-network
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'

  nginx:
    image: nginx:alpine
    container_name: mwap-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    networks:
      - mwap-network
    depends_on:
      - mwap-app

volumes:
  redis-data:

networks:
  mwap-network:
    driver: bridge
```

### **NGINX Configuration**
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream mwap_backend {
        server mwap-app:3001;
        # Add more servers for load balancing
        # server mwap-app-2:3001;
        # server mwap-app-3:3001;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen 80;
        server_name api.mwap.dev;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.mwap.dev;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security
        client_max_body_size 10M;
        
        # Health check endpoint (no rate limiting)
        location /health {
            proxy_pass http://mwap_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API endpoints with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://mwap_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Authentication endpoints with stricter rate limiting
        location /api/v1/auth/ {
            limit_req zone=auth burst=10 nodelay;
            
            proxy_pass http://mwap_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Documentation
        location /docs/ {
            proxy_pass http://mwap_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## ☁️ Cloud Platform Deployment

### **AWS Deployment with ECS**
```yaml
# aws-ecs-task-definition.json
{
  "family": "mwap-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "mwap-server",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/mwap-server:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:mwap/mongodb-uri"
        },
        {
          "name": "AUTH0_CLIENT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:mwap/auth0-client-secret"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:mwap/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mwap-server",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3001/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### **Terraform Infrastructure**
```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC and Networking
resource "aws_vpc" "mwap_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "mwap-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_subnets" {
  count             = 2
  vpc_id            = aws_vpc.mwap_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "mwap-private-subnet-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_subnets" {
  count                   = 2
  vpc_id                  = aws_vpc.mwap_vpc.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "mwap-public-subnet-${count.index + 1}"
    Environment = var.environment
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "mwap_cluster" {
  name = "mwap-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "mwap_alb" {
  name               = "mwap-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public_subnets[*].id

  enable_deletion_protection = var.environment == "production"

  tags = {
    Environment = var.environment
  }
}

# ECS Service
resource "aws_ecs_service" "mwap_service" {
  name            = "mwap-service"
  cluster         = aws_ecs_cluster.mwap_cluster.id
  task_definition = aws_ecs_task_definition.mwap_task.arn
  desired_count   = var.desired_count

  launch_type = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_sg.id]
    subnets          = aws_subnet.private_subnets[*].id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.mwap_tg.arn
    container_name   = "mwap-server"
    container_port   = 3001
  }

  depends_on = [aws_lb_listener.mwap_listener]

  tags = {
    Environment = var.environment
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "mwap_target" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.mwap_cluster.name}/${aws_ecs_service.mwap_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "mwap_up" {
  name               = "mwap-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.mwap_target.resource_id
  scalable_dimension = aws_appautoscaling_target.mwap_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.mwap_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

### **Kubernetes Deployment**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mwap
  labels:
    name: mwap

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mwap-config
  namespace: mwap
data:
  NODE_ENV: "production"
  PORT: "3001"
  AUTH0_DOMAIN: "your-tenant.auth0.com"
  AUTH0_AUDIENCE: "https://api.mwap.local"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: mwap-secrets
  namespace: mwap
type: Opaque
data:
  MONGODB_URI: <base64-encoded-mongodb-uri>
  AUTH0_CLIENT_SECRET: <base64-encoded-client-secret>
  JWT_SECRET: <base64-encoded-jwt-secret>

---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mwap-server
  namespace: mwap
  labels:
    app: mwap-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mwap-server
  template:
    metadata:
      labels:
        app: mwap-server
    spec:
      containers:
      - name: mwap-server
        image: mwap-server:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: mwap-config
        - secretRef:
            name: mwap-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mwap-service
  namespace: mwap
spec:
  selector:
    app: mwap-server
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mwap-ingress
  namespace: mwap
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.mwap.dev
    secretName: mwap-tls
  rules:
  - host: api.mwap.dev
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mwap-service
            port:
              number: 80

---
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mwap-hpa
  namespace: mwap
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mwap-server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 🔧 Environment Configuration

### **Production Environment Variables**
```env
# .env.production
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap_prod?retryWrites=true&w=majority
REDIS_URL=redis://redis:6379

# Authentication
AUTH0_DOMAIN=prod-tenant.auth0.com
AUTH0_CLIENT_ID=prod_client_id
AUTH0_CLIENT_SECRET=prod_client_secret
AUTH0_AUDIENCE=https://api.mwap.dev
JWT_SECRET=your-production-jwt-secret-256-bits

# Security
ENCRYPTION_KEY=your-production-encryption-key-256-bits
SESSION_SECRET=your-production-session-secret

# API Configuration
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
API_CORS_ORIGIN=https://app.mwap.dev

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# External Services
AWS_REGION=us-east-1
AWS_S3_BUCKET=mwap-prod-files
```

### **Configuration Validation**
```typescript
// src/config/production.ts
import { z } from 'zod';

const productionConfigSchema = z.object({
  NODE_ENV: z.literal('production'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  
  // Database
  MONGODB_URI: z.string().startsWith('mongodb'),
  REDIS_URL: z.string().startsWith('redis'),
  
  // Authentication
  AUTH0_DOMAIN: z.string().min(1),
  AUTH0_CLIENT_ID: z.string().min(1),
  AUTH0_CLIENT_SECRET: z.string().min(32),
  AUTH0_AUDIENCE: z.string().url(),
  JWT_SECRET: z.string().min(32),
  
  // Security
  ENCRYPTION_KEY: z.string().length(64),
  SESSION_SECRET: z.string().min(32),
  
  // API
  API_RATE_LIMIT_WINDOW_MS: z.string().transform(Number),
  API_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number),
  API_CORS_ORIGIN: z.string().url(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']),
  AUDIT_LOG_ENABLED: z.enum(['true', 'false']),
  
  // Monitoring
  METRICS_ENABLED: z.enum(['true', 'false']),
  HEALTH_CHECK_ENABLED: z.enum(['true', 'false'])
});

export const validateProductionConfig = () => {
  try {
    const config = productionConfigSchema.parse(process.env);
    console.log('✅ Production configuration validation passed');
    return config;
  } catch (error) {
    console.error('❌ Production configuration validation failed:', error);
    process.exit(1);
  }
};
```

## 🔒 Security Hardening

### **Security Checklist**
```bash
#!/bin/bash
# scripts/security-check.sh

echo "🔒 Running security hardening checks..."

# Check for secrets in environment
echo "Checking for exposed secrets..."
if grep -r "password\|secret\|key" .env* 2>/dev/null | grep -v ".example"; then
    echo "❌ Potential secrets found in environment files"
    exit 1
fi

# Check SSL/TLS configuration
echo "Checking SSL/TLS configuration..."
if [ ! -f "/etc/nginx/ssl/cert.pem" ] || [ ! -f "/etc/nginx/ssl/key.pem" ]; then
    echo "❌ SSL certificates not found"
    exit 1
fi

# Check file permissions
echo "Checking file permissions..."
find . -name "*.key" -o -name "*.pem" | while read file; do
    if [ "$(stat -c %a "$file")" != "600" ]; then
        echo "❌ Incorrect permissions on $file"
        exit 1
    fi
done

# Check for security headers
echo "Checking security headers..."
curl -s -I https://api.mwap.dev/health | grep -q "Strict-Transport-Security" || {
    echo "❌ HSTS header missing"
    exit 1
}

# Check rate limiting
echo "Checking rate limiting..."
for i in {1..10}; do
    curl -s -o /dev/null -w "%{http_code}" https://api.mwap.dev/api/v1/health
done | grep -q "429" || {
    echo "⚠️  Rate limiting may not be working properly"
}

echo "✅ Security checks completed"
```

### **Security Monitoring**
```typescript
// src/middleware/securityMonitoring.ts
import { Request, Response, NextFunction } from 'express';
import { logError, logWarn } from '../utils/logger';

interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  endpoint: string;
  timestamp: Date;
  details?: any;
}

class SecurityMonitor {
  private suspiciousIPs = new Set<string>();
  private failedAttempts = new Map<string, number>();

  logSecurityEvent(event: SecurityEvent): void {
    const logData = {
      securityEvent: event.type,
      severity: event.severity,
      ip: event.ip,
      userAgent: event.userAgent,
      endpoint: event.endpoint,
      timestamp: event.timestamp,
      details: event.details
    };

    if (event.severity === 'critical' || event.severity === 'high') {
      logError('Security event detected', logData);
      this.handleHighSeverityEvent(event);
    } else {
      logWarn('Security event detected', logData);
    }
  }

  private handleHighSeverityEvent(event: SecurityEvent): void {
    // Add IP to suspicious list
    this.suspiciousIPs.add(event.ip);
    
    // Send alert to security team
    this.sendSecurityAlert(event);
    
    // Consider blocking IP temporarily
    if (event.severity === 'critical') {
      this.blockIP(event.ip);
    }
  }

  private sendSecurityAlert(event: SecurityEvent): void {
    // Implementation would send alerts via email, Slack, etc.
    console.log(`🚨 SECURITY ALERT: ${event.type} from ${event.ip}`);
  }

  private blockIP(ip: string): void {
    // Implementation would add IP to firewall block list
    console.log(`🚫 Blocking IP: ${ip}`);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check for suspicious patterns
      this.checkSuspiciousPatterns(req);
      
      // Monitor failed authentication attempts
      res.on('finish', () => {
        if (res.statusCode === 401) {
          this.trackFailedAttempt(req);
        }
      });

      next();
    };
  }

  private checkSuspiciousPatterns(req: Request): void {
    const suspiciousPatterns = [
      /\.\.\//,  // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /exec\(/i, // Code injection
    ];

    const testString = `${req.url} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(testString)) {
        this.logSecurityEvent({
          type: 'suspicious_pattern_detected',
          severity: 'high',
          ip: req.ip,
          userAgent: req.get('User-Agent') || '',
          endpoint: req.originalUrl,
          timestamp: new Date(),
          details: { pattern: pattern.source }
        });
        break;
      }
    }
  }

  private trackFailedAttempt(req: Request): void {
    const ip = req.ip;
    const attempts = this.failedAttempts.get(ip) || 0;
    this.failedAttempts.set(ip, attempts + 1);

    if (attempts >= 5) {
      this.logSecurityEvent({
        type: 'multiple_failed_attempts',
        severity: 'high',
        ip,
        userAgent: req.get('User-Agent') || '',
        endpoint: req.originalUrl,
        timestamp: new Date(),
        details: { attemptCount: attempts + 1 }
      });
    }

    // Reset counter after 1 hour
    setTimeout(() => {
      this.failedAttempts.delete(ip);
    }, 60 * 60 * 1000);
  }
}

export const securityMonitor = new SecurityMonitor();
```

## 📊 Monitoring and Observability

### **Health Checks**
```typescript
// src/routes/health.ts
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { redis } from '../config/redis';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail';
  responseTime?: number;
  details?: any;
}

router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    memory: checkMemory(),
    disk: checkDisk()
  };

  const allHealthy = Object.values(checks).every(check => check.status === 'pass');
  const status: HealthStatus = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    checks
  };

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(status);
});

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
    return {
      status: 'pass',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      details: error.message
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    await redis.ping();
    return {
      status: 'pass',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      details: error.message
    };
  }
}

function checkMemory(): HealthCheck {
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const memoryUsagePercent = (usedMem / totalMem) * 100;

  return {
    status: memoryUsagePercent < 90 ? 'pass' : 'fail',
    details: {
      heapUsed: Math.round(usedMem / 1024 / 1024),
      heapTotal: Math.round(totalMem / 1024 / 1024),
      usagePercent: Math.round(memoryUsagePercent)
    }
  };
}

function checkDisk(): HealthCheck {
  // Simplified disk check - in production, use proper disk space monitoring
  return {
    status: 'pass',
    details: {
      available: '80%'
    }
  };
}

export { router as healthRouter };
```

### **Metrics Collection**
```typescript
// src/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseConnections = new Gauge({
  name: 'database_connections',
  help: 'Number of database connections'
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode
      },
      duration
    );
    
    activeConnections.dec();
  });
  
  next();
};

// Metrics endpoint
export const metricsHandler = (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
};
```

## 🚀 Deployment Scripts

### **Deployment Automation**
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Load environment-specific configuration
source "scripts/config/$ENVIRONMENT.env"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run test
npm run lint
npm run type-check
npm run security-check

# Build and tag Docker image
echo "🏗️ Building Docker image..."
docker build -t mwap-server:$VERSION .
docker tag mwap-server:$VERSION $DOCKER_REGISTRY/mwap-server:$VERSION

# Push to registry
echo "📤 Pushing to registry..."
docker push $DOCKER_REGISTRY/mwap-server:$VERSION

# Deploy based on platform
case $DEPLOYMENT_PLATFORM in
    "docker-compose")
        echo "🐳 Deploying with Docker Compose..."
        docker-compose -f docker-compose.$ENVIRONMENT.yml pull
        docker-compose -f docker-compose.$ENVIRONMENT.yml up -d
        ;;
    "kubernetes")
        echo "☸️ Deploying to Kubernetes..."
        kubectl set image deployment/mwap-server mwap-server=$DOCKER_REGISTRY/mwap-server:$VERSION -n mwap
        kubectl rollout status deployment/mwap-server -n mwap
        ;;
    "ecs")
        echo "☁️ Deploying to AWS ECS..."
        aws ecs update-service --cluster mwap-cluster --service mwap-service --force-new-deployment
        ;;
esac

# Post-deployment verification
echo "✅ Running post-deployment verification..."
sleep 30
curl -f $HEALTH_CHECK_URL/health || {
    echo "❌ Health check failed"
    exit 1
}

# Run smoke tests
npm run test:smoke

echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
```

### **Rollback Script**
```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ENVIRONMENT=${1:-staging}
PREVIOUS_VERSION=${2}

echo "🔄 Starting rollback for $ENVIRONMENT..."

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "❌ Previous version not specified"
    exit 1
fi

# Load environment configuration
source "scripts/config/$ENVIRONMENT.env"

# Rollback based on platform
case $DEPLOYMENT_PLATFORM in
    "kubernetes")
        echo "☸️ Rolling back Kubernetes deployment..."
        kubectl set image deployment/mwap-server mwap-server=$DOCKER_REGISTRY/mwap-server:$PREVIOUS_VERSION -n mwap
        kubectl rollout status deployment/mwap-server -n mwap
        ;;
    "ecs")
        echo "☁️ Rolling back ECS service..."
        # Implementation for ECS rollback
        ;;
esac

# Verify rollback
echo "✅ Verifying rollback..."
sleep 30
curl -f $HEALTH_CHECK_URL/health || {
    echo "❌ Rollback verification failed"
    exit 1
}

echo "🎉 Rollback completed successfully!"
```

## 🔗 Related Documentation

- **[⚙️ Environment Configuration](../07-Standards/.env-format.md)** - Environment variable standards
- **[🛡️ Security Configuration](../04-Backend/security-configuration.md)** - Security setup
- **[📊 Performance Monitoring](./performance-monitoring.md)** - Monitoring and alerting
- **[🔍 Debugging Guide](./debugging.md)** - Troubleshooting deployment issues
- **[🧪 Testing Strategy](./testing-strategy.md)** - Testing before deployment

---

*This comprehensive deployment guide provides everything needed to deploy the MWAP platform securely and reliably to production environments with proper monitoring, security, and maintenance procedures.*