# API Configuration

## Overview

This document covers the configuration and setup of the MWAP platform API, including environment variables, middleware setup, routing configuration, and deployment settings.

## Environment Configuration

### Core Environment Variables

```bash
# Server Configuration
NODE_ENV=production                    # development, staging, production
PORT=3000                             # Server port
API_VERSION=v3                        # API version prefix

# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mwap_platform
DB_USER=mwap_user
DB_PASSWORD=secure_password
DB_SSL=true                           # Enable SSL for production
DB_POOL_MIN=2                         # Minimum connections
DB_POOL_MAX=10                        # Maximum connections

# Authentication (Auth0)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.mwap.platform
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
JWT_SECRET=your-256-bit-secret-key

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
CORS_ORIGIN=https://app.mwap.platform,http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000           # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100           # Max requests per window

# Redis (Caching & Sessions)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis_password
REDIS_DB=0
REDIS_TTL=3600                        # Default TTL in seconds

# Cloud Storage
AWS_REGION=us-west-2
AWS_S3_BUCKET=mwap-storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Monitoring & Logging
LOG_LEVEL=info                        # debug, info, warn, error
DATADOG_API_KEY=your_datadog_key
SENTRY_DSN=https://your-sentry-dsn

# Feature Flags
ENABLE_AI_AGENTS=true
ENABLE_FILE_PROCESSING=true
ENABLE_CLOUD_INTEGRATIONS=true
ENABLE_ANALYTICS=false
```

### Environment-Specific Configurations

#### Development Configuration
```typescript
// config/environments/development.ts
export const developmentConfig = {
  server: {
    port: process.env.PORT || 3000,
    host: 'localhost'
  },
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/mwap_dev',
    logging: true,
    synchronize: true // Auto-sync schema in development
  },
  
  auth: {
    skipAuth: false, // Set to true for local testing
    tokenExpiry: '24h'
  },
  
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  },
  
  logging: {
    level: 'debug',
    prettyPrint: true
  }
};
```

#### Production Configuration
```typescript
// config/environments/production.ts
export const productionConfig = {
  server: {
    port: process.env.PORT || 80,
    host: '0.0.0.0'
  },
  
  database: {
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    logging: false,
    synchronize: false // Never auto-sync in production
  },
  
  auth: {
    skipAuth: false,
    tokenExpiry: '1h',
    refreshTokenExpiry: '30d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [],
    credentials: true
  },
  
  logging: {
    level: 'warn',
    prettyPrint: false
  },
  
  security: {
    helmet: true,
    rateLimiting: true,
    requestSizeLimit: '10mb'
  }
};
```

## Server Configuration

### Express Application Setup

```typescript
// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { configureMiddleware } from './middleware';
import { configureRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): express.Application {
  const app = express();
  
  // Trust proxy for correct IP addresses
  app.set('trust proxy', 1);
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.AUTH0_DOMAIN!]
      }
    }
  }));
  
  // CORS configuration
  app.use(cors({
    origin: getConfig().cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
  }));
  
  // Compression
  app.use(compression());
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Configure middleware
  configureMiddleware(app);
  
  // Configure routes
  configureRoutes(app);
  
  // Error handling (must be last)
  app.use(errorHandler);
  
  return app;
}
```

### Middleware Configuration

```typescript
// src/middleware/index.ts
import { Application } from 'express';
import { authMiddleware } from './auth';
import { tenantMiddleware } from './tenant';
import { rateLimitMiddleware } from './rateLimit';
import { loggingMiddleware } from './logging';
import { metricsMiddleware } from './metrics';

export function configureMiddleware(app: Application): void {
  // Request logging
  app.use(loggingMiddleware);
  
  // Metrics collection
  app.use(metricsMiddleware);
  
  // Rate limiting
  app.use(rateLimitMiddleware);
  
  // Health check endpoint (no auth required)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // API routes with authentication
  app.use('/api', authMiddleware);
  app.use('/api', tenantMiddleware);
}
```

## Route Configuration

### API Versioning

```typescript
// src/routes/index.ts
import { Application, Router } from 'express';
import { v3Routes } from './v3';
import { v2Routes } from './v2'; // Legacy support

export function configureRoutes(app: Application): void {
  // API version 3 (current)
  app.use('/api/v3', v3Routes);
  
  // API version 2 (deprecated)
  app.use('/api/v2', v2Routes);
  
  // Default to latest version
  app.use('/api', v3Routes);
  
  // Catch-all for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.originalUrl
    });
  });
}
```

### V3 Routes Structure

```typescript
// src/routes/v3/index.ts
import { Router } from 'express';
import { authRoutes } from '../../features/auth/auth.routes';
import { userRoutes } from '../../features/users/user.routes';
import { tenantRoutes } from '../../features/tenants/tenants.routes';
import { projectRoutes } from '../../features/projects/projects.routes';
import { fileRoutes } from '../../features/files/files.routes';
import { agentRoutes } from '../../features/ai-agents/agents.routes';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// Core resource routes
router.use('/users', userRoutes);
router.use('/tenants', tenantRoutes);
router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);

// AI agent routes
router.use('/agents', agentRoutes);

export { router as v3Routes };
```

## Database Configuration

### TypeORM Configuration

```typescript
// src/config/database.ts
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // Entities
  entities: [
    'src/entities/**/*.ts'
  ],
  
  // Migrations
  migrations: [
    'src/migrations/**/*.ts'
  ],
  
  // Configuration
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development' ? 'all' : ['error'],
  
  // Connection pool
  extra: {
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 30000
  },
  
  // Naming strategy
  namingStrategy: new SnakeNamingStrategy(),
  
  // Subscribers
  subscribers: [
    'src/subscribers/**/*.ts'
  ]
});
```

### Database Initialization

```typescript
// src/config/database.init.ts
import { AppDataSource } from './database';
import { Logger } from '../utils/logger';

const logger = new Logger('Database');

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established');
    
    // Run pending migrations in production
    if (process.env.NODE_ENV === 'production') {
      await AppDataSource.runMigrations();
      logger.info('Database migrations completed');
    }
  } catch (error) {
    logger.error('Database initialization failed', error);
    throw error;
  }
}
```

## Authentication Configuration

### Auth0 Integration

```typescript
// src/config/auth0.ts
import jwt from 'express-jwt';
import jwks from 'jwks-rsa';

export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  audience: process.env.AUTH0_AUDIENCE!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!
};

export const jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`
  }),
  audience: auth0Config.audience,
  issuer: `https://${auth0Config.domain}/`,
  algorithms: ['RS256'],
  credentialsRequired: true
});
```

### Custom JWT Configuration

```typescript
// src/config/jwt.ts
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  issuer: 'mwap-platform',
  audience: 'mwap-api',
  expiresIn: '1h',
  refreshExpiresIn: '30d'
};

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, jwtConfig.secret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    expiresIn: jwtConfig.expiresIn
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, jwtConfig.secret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  }) as JWTPayload;
}
```

## Security Configuration

### Rate Limiting

```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args)
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message || 'Too many requests',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Default rate limiter
export const defaultRateLimit = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});

// Strict rate limiter for auth endpoints
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts'
});
```

### Input Validation

```typescript
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}
```

## Caching Configuration

### Redis Setup

```typescript
// src/config/redis.ts
import { createClient } from 'redis';
import { Logger } from '../utils/logger';

const logger = new Logger('Redis');

export const redisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis connection refused');
      return new Error('Redis connection refused');
    }
    
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Redis retry time exhausted');
    }
    
    if (options.attempt > 10) {
      logger.error('Redis max retry attempts reached');
      return undefined;
    }
    
    // Exponential backoff
    return Math.min(options.attempt * 100, 3000);
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

export async function initializeRedis(): Promise<void> {
  await redisClient.connect();
}
```

### Cache Service

```typescript
// src/services/cache.service.ts
import { redisClient } from '../config/redis';

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}
```

## Monitoring Configuration

### Health Checks

```typescript
// src/middleware/health.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { redisClient } from '../config/redis';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      redis: 'unknown',
      memory: 'unknown'
    }
  };
  
  // Database check
  try {
    await AppDataSource.query('SELECT 1');
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'error';
  }
  
  // Redis check
  try {
    await redisClient.ping();
    health.checks.redis = 'ok';
  } catch (error) {
    health.checks.redis = 'error';
    health.status = 'degraded';
  }
  
  // Memory check
  const memUsage = process.memoryUsage();
  const memUsageMB = memUsage.heapUsed / 1024 / 1024;
  health.checks.memory = memUsageMB > 512 ? 'warning' : 'ok';
  
  const statusCode = health.status === 'ok' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(health);
}
```

### Metrics Collection

```typescript
// src/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString()
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  
  next();
}

// Metrics endpoint
export function metricsEndpoint(req: Request, res: Response): void {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
}
```

## Deployment Configuration

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy application
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - AUTH0_DOMAIN=${AUTH0_DOMAIN}
      - AUTH0_AUDIENCE=${AUTH0_AUDIENCE}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=mwap_platform
      - POSTGRES_USER=mwap_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## Configuration Validation

### Environment Validation

```typescript
// src/config/validation.ts
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().min(1000).max(65535),
  DATABASE_URL: z.string().url(),
  AUTH0_DOMAIN: z.string().min(1),
  AUTH0_AUDIENCE: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url(),
  AWS_REGION: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

export function validateConfig(): void {
  try {
    configSchema.parse(process.env);
  } catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
  }
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Fails**
   - Check DATABASE_URL format
   - Verify network connectivity
   - Ensure SSL configuration matches environment

2. **Authentication Issues**
   - Verify Auth0 domain and audience
   - Check JWT secret configuration
   - Validate token expiry settings

3. **Rate Limiting Problems**
   - Check Redis connectivity
   - Verify rate limit configuration
   - Monitor request patterns

4. **Performance Issues**
   - Review database query performance
   - Check cache hit rates
   - Monitor memory usage

### Debugging Tools

```bash
# View logs
docker logs -f container_name

# Check health status
curl http://localhost:3000/health

# View metrics
curl http://localhost:3000/metrics

# Test database connection
npm run db:test

# Validate configuration
npm run config:validate
```

## Related Documents

- [Backend Architecture](./backend.md)
- [Authentication Guide](./auth0.md)
- [Database Documentation](./database.md)
- [Security Guide](../06-Guides/security-guide.md)
- [Deployment Guide](../06-Guides/how-to-deploy.md) 