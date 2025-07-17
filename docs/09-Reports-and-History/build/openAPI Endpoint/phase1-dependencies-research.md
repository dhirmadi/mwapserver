# Phase 1 Task 3: Dependencies and Tools Research

## OpenAPI Generation Libraries

### ✅ Already Available
- **swagger-ui-express** (v5.0.1) - Currently used for `/docs` endpoint
- **@asteasolutions/zod-to-openapi** (v7.3.3) - Perfect for our Zod schema conversion needs

### 📦 Recommended Additional Dependencies

#### Core OpenAPI Tools
```json
{
  "@apidevtools/swagger-parser": "^10.1.0",
  "swagger-jsdoc": "^6.2.8"
}
```

#### Optional Performance/Validation Tools
```json
{
  "express-openapi-validator": "^5.1.6",
  "node-cache": "^5.1.2"
}
```

## Zod-to-OpenAPI Conversion Analysis

### ✅ @asteasolutions/zod-to-openapi (Already Installed)
- **Pros**: 
  - Comprehensive Zod schema support
  - OpenAPI 3.1.0 compatible
  - Active maintenance
  - TypeScript first
- **Cons**: 
  - Requires manual registration of schemas
  - Learning curve for advanced features

### Example Usage Pattern
```typescript
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { tenantSchema, createTenantSchema } from '../schemas/tenant.schema.js';

const registry = new OpenAPIRegistry();

// Register schemas
registry.register('Tenant', tenantSchema);
registry.register('CreateTenant', createTenantSchema);

// Generate OpenAPI document
const generator = new OpenApiGeneratorV31(registry.definitions);
const document = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'MWAP API',
    version: '1.0.0'
  }
});
```

## Caching Strategy Design

### Implementation Options

#### 1. In-Memory Caching (Recommended for MVP)
```typescript
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class OpenAPICache {
  private cache = new Map<string, CacheEntry>();
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
  
  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
}
```

#### 2. Node-Cache Library (Enhanced)
```typescript
import NodeCache from 'node-cache';

const openApiCache = new NodeCache({
  stdTTL: process.env.NODE_ENV === 'production' ? 3600 : 300, // 1 hour prod, 5 min dev
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Better performance for read-only data
});
```

#### 3. Redis (Future Enhancement)
- For multi-instance deployments
- Shared cache across server instances
- Persistence across restarts

### Cache Configuration
```typescript
export const cacheConfig = {
  development: {
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: true,
    maxSize: 100
  },
  production: {
    ttl: 60 * 60 * 1000, // 1 hour
    enabled: true,
    maxSize: 1000
  },
  test: {
    ttl: 0, // No caching in tests
    enabled: false,
    maxSize: 0
  }
};
```

## Error Handling Approach

### Integration with Existing AppError Pattern

```typescript
import { AppError } from '../utils/errors.js';
import { logError } from '../utils/logger.js';

export class OpenAPIGenerationError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 500, 'OPENAPI_GENERATION_ERROR');
    this.cause = cause;
  }
}

export class SchemaConversionError extends AppError {
  constructor(schemaName: string, cause?: Error) {
    super(`Failed to convert schema: ${schemaName}`, 500, 'SCHEMA_CONVERSION_ERROR');
    this.cause = cause;
  }
}

// Usage in services
try {
  const openApiDoc = await generateOpenAPIDocument();
  return openApiDoc;
} catch (error) {
  logError('OpenAPI generation failed', {
    error: error.message,
    stack: error.stack
  });
  
  throw new OpenAPIGenerationError(
    'Failed to generate OpenAPI documentation',
    error
  );
}
```

### Graceful Degradation Strategy
```typescript
export async function getOpenAPIDocumentWithFallback(): Promise<any> {
  try {
    // Try to generate fresh documentation
    return await generateOpenAPIDocument();
  } catch (error) {
    logError('OpenAPI generation failed, falling back to static docs', { error });
    
    // Fallback to existing static documentation
    return await import('../docs/api-docs.js').then(m => m.openApiDocument);
  }
}
```

## Performance Optimization Strategy

### 1. Lazy Loading
- Generate documentation only on first request
- Cache results for subsequent requests
- Background regeneration on schema changes

### 2. Incremental Generation
- Generate documentation per feature module
- Combine modules into complete document
- Update only changed modules

### 3. Async Processing
```typescript
export class OpenAPIService {
  private generationPromise: Promise<any> | null = null;
  
  async getDocument(): Promise<any> {
    if (!this.generationPromise) {
      this.generationPromise = this.generateDocument();
    }
    return this.generationPromise;
  }
  
  invalidateCache(): void {
    this.generationPromise = null;
  }
}
```

## Security Considerations

### 1. Authentication Requirements
- All OpenAPI endpoints require JWT authentication
- No public access to API documentation
- Rate limiting on documentation endpoints

### 2. Sensitive Data Protection
```typescript
const sanitizeSchema = (schema: any): any => {
  // Remove sensitive fields from documentation
  const sensitiveFields = ['password', 'secret', 'token', 'key'];
  
  if (schema.properties) {
    for (const field of sensitiveFields) {
      if (schema.properties[field]) {
        schema.properties[field] = {
          type: 'string',
          description: '[REDACTED]'
        };
      }
    }
  }
  
  return schema;
};
```

### 3. Audit Logging
```typescript
export const auditOpenAPIAccess = (req: Request): void => {
  logInfo('OpenAPI documentation accessed', {
    userId: req.auth?.sub,
    endpoint: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
};
```

## Recommended Implementation Order

### Phase 2 Priority
1. **RouteDiscoveryService** - Foundation for all other services
2. **Basic Zod-to-OpenAPI conversion** - Leverage existing schemas
3. **Simple in-memory caching** - Performance optimization
4. **Error handling integration** - Follow existing patterns

### Phase 3 Enhancements
1. **Advanced schema generation** - Complex types and relationships
2. **Swagger JSDoc integration** - Extract existing documentation
3. **Validation and testing** - Ensure generated docs are correct
4. **Performance monitoring** - Track generation times and cache hits

### Future Considerations
1. **Redis caching** - For production scalability
2. **Real-time updates** - WebSocket notifications for doc changes
3. **API versioning support** - Multiple OpenAPI versions
4. **Custom documentation themes** - Enhanced UI/UX