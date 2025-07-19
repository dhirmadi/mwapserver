# MWAP Performance Guide

This comprehensive guide covers API configuration, performance optimization strategies, monitoring, and best practices for achieving optimal performance in the MWAP platform.

## 🎯 Performance Overview

### Performance Philosophy
MWAP is designed for high performance with emphasis on:
- **Efficient Database Operations**: Optimized queries with proper indexing
- **Intelligent Caching**: Multi-layer caching strategies
- **Resource Optimization**: Memory and CPU efficient operations
- **Scalable Architecture**: Horizontal and vertical scaling patterns
- **Monitoring-Driven**: Continuous performance monitoring and optimization

### Current Performance Profile
```
MWAP API Performance Characteristics:
├── Response Time Goals: <200ms (95th percentile)
├── Database Queries: <50ms average
├── Authentication: <100ms (with caching)
├── File Operations: <500ms
└── Throughput: 1000+ concurrent requests
```

## 🏗️ API Architecture Configuration

### Core API Stack
```
MWAP API Infrastructure:
├── Express.js Router System
├── Dynamic Route Discovery
├── OpenAPI 3.1.0 Generation
├── Zod Schema Validation
├── Auth0 JWT Authentication
├── Role-Based Authorization
├── MongoDB Connection Pooling
└── Structured Error Handling
```

### Request Lifecycle Optimization
```
Request → [Cache Check] → JWT Auth → Role Check → Validation → Controller → Service → [Cache Update] → Database → Response
```

### OpenAPI Configuration

#### Dynamic Documentation Generation
```typescript
// src/services/openapi/OpenAPIService.ts
export class OpenAPIService {
  private cachedDocument: any = null;
  private cacheTimestamp: number = 0;
  private readonly cacheTTL = process.env.NODE_ENV === 'production' 
    ? 3600000   // 1 hour in production
    : 300000;   // 5 minutes in development

  async generateDocument(): Promise<any> {
    // Check cache validity for performance
    const now = Date.now();
    if (this.cachedDocument && (now - this.cacheTimestamp) < this.cacheTTL) {
      return this.cachedDocument;
    }

    const startTime = performance.now();

    try {
      // Generate fresh documentation
      const routes = await routeDiscoveryService.scanRoutes();
      const document = await openAPIDocumentBuilder.buildDocument(routes);
      
      // Cache result for performance
      this.cachedDocument = document;
      this.cacheTimestamp = now;
      
      const duration = performance.now() - startTime;
      logInfo('OpenAPI document generated', { 
        duration: Math.round(duration),
        routeCount: routes.length,
        cached: false
      });
      
      return document;
    } catch (error) {
      logError('OpenAPI generation failed', { error: error.message });
      throw error;
    }
  }

  // Invalidate cache when routes change
  invalidateCache(): void {
    this.cachedDocument = null;
    this.cacheTimestamp = 0;
  }
}
```

#### Optimized Route Discovery
```typescript
// src/services/openapi/RouteDiscoveryService.ts
export class RouteDiscoveryServiceImpl {
  private routeCache = new Map<string, RouteMetadata[]>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private readonly featureModules = [
    'tenants', 'projects', 'project-types',
    'cloud-providers', 'cloud-integrations',
    'users', 'oauth', 'files'
  ];

  async scanRoutes(): Promise<RouteMetadata[]> {
    // Use cache in production for performance
    if (process.env.NODE_ENV === 'production') {
      const cached = this.getFromCache();
      if (cached) return cached;
    }

    const startTime = performance.now();
    const allRoutes: RouteMetadata[] = [];

    // Scan routes in parallel for performance
    const routePromises = this.featureModules.map(feature => 
      this.scanFeatureRoutes(feature)
    );
    
    const routeResults = await Promise.all(routePromises);
    routeResults.forEach(routes => allRoutes.push(...routes));

    // Cache results
    this.setCache(allRoutes);

    const duration = performance.now() - startTime;
    logInfo('Route discovery completed', { 
      duration: Math.round(duration),
      moduleCount: this.featureModules.length,
      routeCount: allRoutes.length
    });

    return allRoutes;
  }

  private getFromCache(): RouteMetadata[] | null {
    const cached = this.routeCache.get('routes');
    if (cached && this.routeCache.has('timestamp')) {
      const timestamp = this.routeCache.get('timestamp') as any;
      if (Date.now() - timestamp < this.cacheTimeout) {
        return cached;
      }
    }
    return null;
  }

  private setCache(routes: RouteMetadata[]): void {
    this.routeCache.set('routes', routes);
    this.routeCache.set('timestamp', Date.now() as any);
  }
}
```

## ⚡ Database Performance Optimization

### Connection Pool Configuration
```typescript
// src/config/db.ts
import { MongoClient } from 'mongodb';

const mongoOptions = {
  // Connection pooling for performance
  maxPoolSize: 20,           // Maximum connections in pool
  minPoolSize: 5,            // Minimum connections in pool
  maxIdleTimeMS: 30000,      // Close connections after 30s idle
  serverSelectionTimeoutMS: 5000,  // Fast server selection
  socketTimeoutMS: 45000,    // Socket timeout
  
  // Performance optimizations
  maxConnecting: 2,          // Maximum connecting at once
  bufferMaxEntries: 0,       // Disable mongoose buffering
  bufferCommands: false,     // Disable mongoose buffering
  
  // Read/write configuration
  readPreference: 'primary', // Read from primary for consistency
  writeConcern: {
    w: 'majority',           // Write concern for durability
    wtimeout: 5000           // Write timeout
  },
  
  // Compression for network performance
  compressors: ['snappy', 'zlib']
};

export async function connectToDatabase(): Promise<MongoClient> {
  const client = new MongoClient(process.env.MONGODB_URI!, mongoOptions);
  
  await client.connect();
  
  // Test connection
  await client.db().admin().ping();
  
  logInfo('Database connected with optimized configuration', {
    maxPoolSize: mongoOptions.maxPoolSize,
    minPoolSize: mongoOptions.minPoolSize
  });
  
  return client;
}
```

### Strategic Indexing Plan
```typescript
// Database indexes for optimal query performance
const indexingPlan = {
  // Tenant collection indexes
  tenants: [
    { ownerId: 1 },                    // User tenant lookup
    { ownerId: 1, name: 1 },          // Unique constraint + fast lookup
    { archived: 1 },                  // Filter active tenants
    { 'subscription.expiresAt': 1 }   // Subscription management
  ],
  
  // Project collection indexes
  projects: [
    { tenantId: 1 },                  // Tenant project listing
    { tenantId: 1, name: 1 },         // Unique project names per tenant
    { tenantId: 1, archived: 1 },     // Active projects per tenant
    { 'members.userId': 1 },          // User project lookup
    { projectTypeId: 1 },             // Project type queries
    { createdAt: -1 },                // Recent projects
  ],
  
  // Cloud integrations indexes
  cloudIntegrations: [
    { tenantId: 1 },                  // Tenant integrations
    { tenantId: 1, providerId: 1 },   // Unique provider per tenant
    { status: 1 },                    // Filter by status
    { 'authData.expiresAt': 1 },      // Token expiration queries
    { 'health.lastCheck': 1 }         // Health monitoring
  ],
  
  // Virtual files indexes
  virtualFiles: [
    { projectId: 1 },                 // Project files
    { integrationId: 1 },             // Integration files
    { projectId: 1, path: 1 },        // File path lookups
    { 'syncStatus.lastSync': 1 }      // Sync monitoring
  ],
  
  // Audit logs indexes
  auditLogs: [
    { userId: 1, timestamp: -1 },     // User activity logs
    { tenantId: 1, timestamp: -1 },   // Tenant activity logs
    { action: 1, timestamp: -1 },     // Action-based queries
    { timestamp: -1 }                 // Time-based cleanup
  ]
};

// Automated index creation
export async function createOptimalIndexes(): Promise<void> {
  const db = getDatabase();
  
  for (const [collection, indexes] of Object.entries(indexingPlan)) {
    for (const index of indexes) {
      try {
        await db.collection(collection).createIndex(index, {
          background: true,  // Non-blocking index creation
          name: `${collection}_${Object.keys(index).join('_')}_idx`
        });
        
        logInfo(`Index created: ${collection}`, { index });
      } catch (error) {
        // Index might already exist
        if (!error.message.includes('already exists')) {
          logError(`Index creation failed: ${collection}`, { index, error });
        }
      }
    }
  }
}
```

### Optimized Query Patterns
```typescript
// src/services/OptimizedQueries.ts
export class OptimizedQueries {
  
  // ✅ Efficient tenant project lookup with pagination
  static async getProjectsByTenant(
    tenantId: string, 
    options: {
      includeArchived?: boolean;
      limit?: number;
      skip?: number;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortOrder?: 1 | -1;
    } = {}
  ): Promise<Project[]> {
    const {
      includeArchived = false,
      limit = 100,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = -1
    } = options;

    const filter: any = { tenantId: new ObjectId(tenantId) };
    if (!includeArchived) {
      filter.archived = { $ne: true };
    }
    
    return getDatabase().collection('projects')
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Math.min(limit, 100)) // Prevent unbounded queries
      .toArray();
  }
  
  // ✅ Efficient user role resolution with minimal queries
  static async getUserRoles(userId: string): Promise<UserRoles> {
    const startTime = performance.now();
    
    // Use Promise.all for parallel execution
    const [superadmin, tenant, projectRoles] = await Promise.all([
      // Use indexed field for fast lookup
      getDatabase().collection('superadmins').findOne(
        { userId },
        { projection: { _id: 1 } }
      ),
      
      // Use indexed field for fast lookup
      getDatabase().collection('tenants').findOne(
        { ownerId: userId },
        { projection: { _id: 1, name: 1 } }
      ),
      
      // Use compound index with projection for efficiency
      getDatabase().collection('projects')
        .find(
          { 'members.userId': userId },
          { projection: { _id: 1, 'members.$': 1 } }
        )
        .toArray()
    ]);
    
    const duration = performance.now() - startTime;
    logInfo('User roles resolved', { userId, duration: Math.round(duration) });
    
    return {
      userId,
      isSuperAdmin: !!superadmin,
      isTenantOwner: !!tenant,
      tenantId: tenant?._id?.toString() || null,
      projectRoles: projectRoles.map(p => ({
        projectId: p._id.toString(),
        role: p.members[0]?.role
      }))
    };
  }
  
  // ✅ Efficient integration health monitoring
  static async getExpiringTokens(hoursFromNow = 1): Promise<CloudIntegration[]> {
    const expiryThreshold = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    
    return getDatabase().collection('cloudIntegrations')
      .find({
        status: 'active',
        'authData.expiresAt': { $lte: expiryThreshold },
        'authData.refreshToken': { $exists: true }
      })
      .project({ 
        _id: 1, 
        tenantId: 1, 
        providerId: 1, 
        'authData.expiresAt': 1 
      })
      .toArray();
  }

  // ✅ Efficient file listing with smart pagination
  static async getProjectFiles(
    projectId: string,
    options: {
      path?: string;
      recursive?: boolean;
      limit?: number;
      offset?: number;
      fileTypes?: string[];
    } = {}
  ): Promise<VirtualFile[]> {
    const {
      path = '/',
      recursive = false,
      limit = 100,
      offset = 0,
      fileTypes = []
    } = options;

    const filter: any = { projectId: new ObjectId(projectId) };
    
    if (path && path !== '/') {
      if (recursive) {
        filter.path = { $regex: `^${escapeRegex(path)}` };
      } else {
        filter.path = { $regex: `^${escapeRegex(path)}[^/]*/?$` };
      }
    }
    
    if (fileTypes.length > 0) {
      filter.mimeType = { $in: fileTypes };
    }

    return getDatabase().collection('virtualFiles')
      .find(filter)
      .sort({ path: 1, name: 1 })
      .skip(offset)
      .limit(Math.min(limit, 1000))
      .toArray();
  }
}

// Utility function for regex escaping
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

## 🚀 Authentication Performance Optimization

### JWT Validation Caching
```typescript
// src/middleware/auth-optimized.ts
import { LRUCache } from 'lru-cache';
import { expressjwt as jwt } from 'express-jwt';
import { jwksClient } from '../config/auth0.js';

// Cache for JWKS keys (reduces Auth0 API calls)
const jwksCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 60 * 24 // 24 hours
});

// Cache for verified JWT payloads (reduces crypto operations)
const jwtPayloadCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 15 // 15 minutes (less than token expiry)
});

// Cache for user roles (reduces database queries)
const userRolesCache = new LRUCache<string, UserRoles>({
  max: 500,
  ttl: 1000 * 60 * 10 // 10 minutes
});

export const optimizedAuthenticateJWT = () => {
  return jwt({
    secret: async (req) => {
      const token = req.headers.authorization?.split(' ')[1] || '';
      
      // Check payload cache first (fastest path)
      if (jwtPayloadCache.has(token)) {
        const cachedPayload = jwtPayloadCache.get(token);
        req.auth = cachedPayload;
        return; // Skip verification for cached valid tokens
      }
      
      try {
        const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
        const kid = header.kid;
        
        // Check JWKS cache
        let signingKey = jwksCache.get(kid);
        
        if (!signingKey) {
          // Fetch from Auth0 and cache
          const key = await jwksClient.getSigningKey(kid);
          signingKey = key.getPublicKey();
          jwksCache.set(kid, signingKey);
        }
        
        return signingKey;
      } catch (error) {
        logError('JWT verification failed', { error: error.message });
        throw error;
      }
    },
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
    
    // Cache successful verifications
    onVerified: (req, payload) => {
      const token = req.headers.authorization?.split(' ')[1] || '';
      jwtPayloadCache.set(token, payload);
      req.auth = payload;
    }
  });
};

// Optimized user roles middleware with caching
export const attachUserRoles = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth?.sub) {
    return next();
  }

  const userId = req.auth.sub;
  
  // Check cache first
  if (userRolesCache.has(userId)) {
    req.userRoles = userRolesCache.get(userId);
    return next();
  }

  try {
    // Fetch from database
    const roles = await OptimizedQueries.getUserRoles(userId);
    
    // Cache for future requests
    userRolesCache.set(userId, roles);
    req.userRoles = roles;
    
    next();
  } catch (error) {
    logError('Failed to fetch user roles', { userId, error: error.message });
    next(error);
  }
};
```

### Connection Optimization
```typescript
// src/middleware/performance.ts
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';

// Response compression for bandwidth optimization
export const compressionMiddleware = compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Compress JSON and text responses
    return compression.filter(req, res);
  }
});

// Intelligent rate limiting
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Higher limits for authenticated users
    if (req.auth?.sub) {
      return 1000; // 1000 requests per window for auth users
    }
    return 100; // 100 requests per window for anonymous users
  },
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});

// Request performance monitoring
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    
    // Log slow requests for optimization
    if (duration > 1000) {
      logWarn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: Math.round(duration),
        statusCode: res.statusCode,
        userId: req.auth?.sub
      });
    }
    
    // Track performance metrics
    trackMetric('api.request.duration', duration, {
      method: req.method,
      route: req.route?.path || req.url,
      status: res.statusCode
    });
  });
  
  next();
};
```

## 📊 Performance Monitoring

### Real-time Performance Tracking
```typescript
// src/services/PerformanceMonitor.ts
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private readonly maxSamples = 1000;

  // Track performance metrics
  trackMetric(name: string, value: number, tags: Record<string, any> = {}): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const samples = this.metrics.get(name)!;
    samples.push(value);
    
    // Keep only recent samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
    
    // Log slow operations
    if (name.includes('duration') && value > 1000) {
      logWarn(`Slow operation: ${name}`, { value, tags });
    }
  }

  // Get performance statistics
  getStats(metricName: string): PerformanceStats | null {
    const samples = this.metrics.get(metricName);
    if (!samples || samples.length === 0) {
      return null;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const count = sorted.length;
    
    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sorted.reduce((sum, val) => sum + val, 0) / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)]
    };
  }

  // Performance health check
  async getPerformanceHealth(): Promise<PerformanceHealth> {
    const apiDuration = this.getStats('api.request.duration');
    const dbDuration = this.getStats('db.query.duration');
    const authDuration = this.getStats('auth.verification.duration');

    return {
      status: this.calculateOverallStatus(apiDuration, dbDuration, authDuration),
      api: {
        avgResponseTime: apiDuration?.avg || 0,
        p95ResponseTime: apiDuration?.p95 || 0
      },
      database: {
        avgQueryTime: dbDuration?.avg || 0,
        p95QueryTime: dbDuration?.p95 || 0
      },
      authentication: {
        avgVerificationTime: authDuration?.avg || 0,
        p95VerificationTime: authDuration?.p95 || 0
      },
      memory: this.getMemoryStats(),
      timestamp: new Date()
    };
  }

  private calculateOverallStatus(
    api?: PerformanceStats | null,
    db?: PerformanceStats | null,
    auth?: PerformanceStats | null
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Define performance thresholds
    const thresholds = {
      api: { warning: 500, critical: 2000 },
      db: { warning: 100, critical: 1000 },
      auth: { warning: 200, critical: 1000 }
    };

    let issues = 0;

    if (api?.p95 && api.p95 > thresholds.api.critical) issues += 2;
    else if (api?.p95 && api.p95 > thresholds.api.warning) issues += 1;

    if (db?.p95 && db.p95 > thresholds.db.critical) issues += 2;
    else if (db?.p95 && db.p95 > thresholds.db.warning) issues += 1;

    if (auth?.p95 && auth.p95 > thresholds.auth.critical) issues += 2;
    else if (auth?.p95 && auth.p95 > thresholds.auth.warning) issues += 1;

    if (issues >= 4) return 'unhealthy';
    if (issues >= 2) return 'degraded';
    return 'healthy';
  }

  private getMemoryStats(): MemoryStats {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024) // MB
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Helper function for tracking metrics
export function trackMetric(name: string, value: number, tags?: Record<string, any>): void {
  performanceMonitor.trackMetric(name, value, tags);
}
```

### Database Performance Monitoring
```typescript
// src/middleware/dbPerformance.ts
export function monitorDatabaseOperations() {
  // MongoDB operation monitoring
  const originalCollection = getDatabase().collection;
  
  getDatabase().collection = function<T = any>(name: string) {
    const collection = originalCollection.call(this, name);
    
    // Wrap common operations with performance tracking
    const operations = ['find', 'findOne', 'insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'];
    
    operations.forEach(op => {
      const originalOp = collection[op];
      if (typeof originalOp === 'function') {
        collection[op] = function(...args: any[]) {
          const startTime = performance.now();
          const result = originalOp.apply(this, args);
          
          // Handle both sync and async operations
          if (result && typeof result.then === 'function') {
            return result.then((res: any) => {
              const duration = performance.now() - startTime;
              trackMetric('db.query.duration', duration, {
                collection: name,
                operation: op
              });
              
              if (duration > 100) {
                logWarn('Slow database operation', {
                  collection: name,
                  operation: op,
                  duration: Math.round(duration)
                });
              }
              
              return res;
            });
          }
          
          return result;
        };
      }
    });
    
    return collection;
  };
}
```

## 🔧 Performance Best Practices

### Code Optimization Patterns
```typescript
// ✅ Efficient async operations
export class OptimizedService {
  
  // Use Promise.all for parallel operations
  async getProjectDetails(projectId: string): Promise<ProjectDetails> {
    const [project, members, files, integrations] = await Promise.all([
      this.getProject(projectId),
      this.getProjectMembers(projectId),
      this.getProjectFiles(projectId, { limit: 10 }),
      this.getProjectIntegrations(projectId)
    ]);
    
    return {
      project,
      members,
      recentFiles: files,
      integrations
    };
  }
  
  // Use streaming for large datasets
  async exportProjectData(projectId: string, res: Response): Promise<void> {
    const stream = this.createProjectDataStream(projectId);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="project-data.json"');
    
    stream.pipe(res);
  }
  
  // Implement efficient pagination
  async getPaginatedResults<T>(
    collection: string,
    filter: any,
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 50, sortBy = '_id', sortOrder = -1 } = options;
    const skip = (page - 1) * limit;
    
    // Run count and data queries in parallel
    const [data, total] = await Promise.all([
      getDatabase().collection<T>(collection)
        .find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray(),
      
      getDatabase().collection<T>(collection)
        .countDocuments(filter)
    ]);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
}
```

### Memory Management
```typescript
// Memory-efficient practices
export class MemoryOptimizedService {
  
  // Use streams for large file processing
  async processLargeFile(fileId: string): Promise<ProcessingResult> {
    const fileStream = await this.getFileStream(fileId);
    const processor = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        // Process chunk without loading entire file
        const processed = this.processChunk(chunk);
        callback(null, processed);
      }
    });
    
    return new Promise((resolve, reject) => {
      fileStream
        .pipe(processor)
        .on('finish', () => resolve({ success: true }))
        .on('error', reject);
    });
  }
  
  // Implement proper resource cleanup
  async cleanupResources(): Promise<void> {
    // Clear caches periodically
    jwtPayloadCache.clear();
    userRolesCache.purgeStale();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    logInfo('Resources cleaned up', {
      memoryUsage: process.memoryUsage()
    });
  }
}
```

### Error Handling Performance
```typescript
// Optimized error handling
export class PerformantErrorHandler {
  
  // Avoid throwing errors in hot paths
  static validateInput<T>(data: unknown, schema: z.ZodSchema<T>): { success: true; data: T } | { success: false; error: string } {
    try {
      const validated = schema.parse(data);
      return { success: true, data: validated };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof z.ZodError ? 'Validation failed' : 'Invalid input'
      };
    }
  }
  
  // Use early returns to avoid deep nesting
  static async processRequest(req: Request): Promise<ProcessingResult> {
    const validation = this.validateInput(req.body, RequestSchema);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }
    
    const user = this.getUser(req);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const hasPermission = await this.checkPermission(user, validation.data.action);
    if (!hasPermission) {
      return { success: false, error: 'Permission denied' };
    }
    
    // Process the request
    return await this.executeAction(validation.data);
  }
}
```

## 📋 Performance Checklist

### API Performance
- [ ] **Response Time**: <200ms for 95% of requests
- [ ] **Database Queries**: Properly indexed and optimized
- [ ] **Caching**: JWT validation and user roles cached
- [ ] **Compression**: Response compression enabled
- [ ] **Rate Limiting**: Intelligent rate limiting implemented

### Database Performance
- [ ] **Indexes**: All required indexes created
- [ ] **Connection Pooling**: Optimized connection pool configuration
- [ ] **Query Optimization**: No N+1 queries or unbounded results
- [ ] **Monitoring**: Database performance monitoring enabled

### Application Performance
- [ ] **Memory Management**: Efficient memory usage patterns
- [ ] **Async Operations**: Parallel execution where possible
- [ ] **Error Handling**: Optimized error handling paths
- [ ] **Resource Cleanup**: Proper cleanup of resources

### Monitoring
- [ ] **Performance Metrics**: Comprehensive metrics collection
- [ ] **Alerting**: Performance alerts configured
- [ ] **Logging**: Performance-related logging enabled
- [ ] **Health Checks**: Performance health checks implemented

---
*This performance guide provides comprehensive strategies for optimizing MWAP platform performance across all layers of the application stack.* 