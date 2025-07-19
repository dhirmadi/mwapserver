# Best Practices

## Overview

This guide outlines comprehensive best practices for developing, deploying, and maintaining AI agents within the MWAP platform. Following these practices ensures reliable, secure, and maintainable agent systems.

## Development Best Practices

### 1. Code Quality Standards

#### TypeScript Excellence
```typescript
// ✅ Good: Proper typing and error handling
interface AgentConfig {
  readonly name: string;
  readonly version: string;
  readonly capabilities: readonly string[];
  readonly timeout?: number;
}

class BaseAgent {
  private readonly config: AgentConfig;
  private readonly logger: Logger;
  
  constructor(config: AgentConfig, logger: Logger) {
    this.config = Object.freeze(config);
    this.logger = logger;
  }
  
  async execute<T>(input: unknown): Promise<Result<T, AgentError>> {
    try {
      this.logger.debug('Agent execution started', { 
        agent: this.config.name,
        input: this.sanitizeInput(input)
      });
      
      const validated = await this.validateInput(input);
      const result = await this.processInput(validated);
      
      return Result.ok(result);
    } catch (error) {
      this.logger.error('Agent execution failed', { 
        agent: this.config.name,
        error: error.message 
      });
      
      return Result.err(new AgentError(error.message, error.code));
    }
  }
  
  protected abstract validateInput(input: unknown): Promise<ValidatedInput>;
  protected abstract processInput(input: ValidatedInput): Promise<T>;
}
```

#### Error Handling Patterns
```typescript
// Custom error hierarchy
abstract class AgentError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'validation' | 'processing' | 'external' | 'system';
  readonly timestamp = new Date();
  
  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends AgentError {
  readonly code = 'VALIDATION_FAILED';
  readonly category = 'validation';
}

class ProcessingError extends AgentError {
  readonly code = 'PROCESSING_FAILED';
  readonly category = 'processing';
}

class ExternalServiceError extends AgentError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly category = 'external';
}

// Result type for better error handling
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

class Result {
  static ok<T>(data: T): Result<T, never> {
    return { success: true, data };
  }
  
  static err<E>(error: E): Result<never, E> {
    return { success: false, error };
  }
}
```

### 2. Security Best Practices

#### Input Validation and Sanitization
```typescript
import { z } from 'zod';

// Strong input validation schemas
const CodeGenerationRequestSchema = z.object({
  tenantId: z.string().uuid(),
  projectId: z.string().uuid(),
  specification: z.string()
    .min(10)
    .max(10000)
    .refine(spec => !this.containsMaliciousPatterns(spec), {
      message: 'Specification contains potentially malicious content'
    }),
  framework: z.enum(['react', 'express', 'vue', 'angular']),
  constraints: z.array(z.string()).max(20).optional()
});

class SecureCodeGenerationAgent extends BaseAgent {
  protected async validateInput(input: unknown): Promise<CodeGenerationRequest> {
    const parseResult = CodeGenerationRequestSchema.safeParse(input);
    
    if (!parseResult.success) {
      throw new ValidationError(
        'Invalid input parameters',
        { zodErrors: parseResult.error.errors }
      );
    }
    
    // Additional security checks
    await this.validateTenantAccess(parseResult.data.tenantId);
    await this.validateProjectAccess(parseResult.data.projectId, parseResult.data.tenantId);
    
    return parseResult.data;
  }
  
  private containsMaliciousPatterns(text: string): boolean {
    const maliciousPatterns = [
      /eval\s*\(/,
      /function\s*\(\s*\)\s*\{.*\}/,
      /require\s*\(/,
      /import\s*\(/,
      /<script/i,
      /javascript:/i
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(text));
  }
}
```

#### Authentication and Authorization
```typescript
class AgentAuthManager {
  async validateAgentAccess(
    agentId: string,
    userId: string,
    tenantId: string,
    operation: string
  ): Promise<AuthorizationResult> {
    // Validate user authentication
    const user = await this.userService.validateToken(userId);
    if (!user) {
      return { authorized: false, reason: 'Invalid user token' };
    }
    
    // Check tenant membership
    const tenantMember = await this.tenantService.isMember(user.id, tenantId);
    if (!tenantMember) {
      return { authorized: false, reason: 'User not member of tenant' };
    }
    
    // Verify agent permissions
    const hasPermission = await this.permissionService.checkAgentPermission(
      user.id,
      tenantId,
      agentId,
      operation
    );
    
    if (!hasPermission) {
      return { authorized: false, reason: 'Insufficient agent permissions' };
    }
    
    return { authorized: true };
  }
}

// Middleware for agent authentication
const agentAuthMiddleware = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agentId } = req.params;
      const { userId, tenantId } = req.user;
      
      const authResult = await agentAuthManager.validateAgentAccess(
        agentId,
        userId,
        tenantId,
        requiredPermission
      );
      
      if (!authResult.authorized) {
        return res.status(403).json({
          success: false,
          error: authResult.reason
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  };
};
```

#### Data Protection
```typescript
class DataProtectionService {
  private readonly encryptionKey: string;
  
  constructor() {
    this.encryptionKey = process.env.AGENT_ENCRYPTION_KEY!;
  }
  
  // Encrypt sensitive data before storage
  async encryptSensitiveData(data: SensitiveData): Promise<EncryptedData> {
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      authTag: authTag.toString('hex'),
      algorithm: 'aes-256-gcm'
    };
  }
  
  // Sanitize data for logging
  sanitizeForLogging(data: any): any {
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth'];
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeForLogging(sanitized[key]);
      }
    }
    
    return sanitized;
  }
}
```

### 3. Performance Optimization

#### Caching Strategies
```typescript
interface CacheStrategy {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}

class LayeredCacheStrategy implements CacheStrategy {
  constructor(
    private memoryCache: MemoryCache,
    private redisCache: RedisCache,
    private dbCache: DatabaseCache
  ) {}
  
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (fastest)
    let value = await this.memoryCache.get<T>(key);
    if (value) return value;
    
    // Try Redis cache (medium speed)
    value = await this.redisCache.get<T>(key);
    if (value) {
      // Populate memory cache
      await this.memoryCache.set(key, value, 300); // 5 minutes
      return value;
    }
    
    // Try database cache (slowest)
    value = await this.dbCache.get<T>(key);
    if (value) {
      // Populate both caches
      await this.redisCache.set(key, value, 3600); // 1 hour
      await this.memoryCache.set(key, value, 300); // 5 minutes
      return value;
    }
    
    return null;
  }
}

class SmartCodeGenerationAgent extends BaseAgent {
  constructor(
    private cache: CacheStrategy,
    private promptHasher: PromptHasher
  ) {
    super();
  }
  
  async generateCode(request: CodeGenerationRequest): Promise<GeneratedCode> {
    // Create cache key based on request
    const cacheKey = this.createCacheKey(request);
    
    // Check cache first
    const cached = await this.cache.get<GeneratedCode>(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for code generation', { cacheKey });
      return cached;
    }
    
    // Generate new code
    const generated = await this.performCodeGeneration(request);
    
    // Cache the result
    await this.cache.set(cacheKey, generated, 3600); // Cache for 1 hour
    
    return generated;
  }
  
  private createCacheKey(request: CodeGenerationRequest): string {
    const keyData = {
      specification: request.specification,
      framework: request.framework,
      constraints: request.constraints?.sort() // Normalize order
    };
    
    return `code-gen:${this.promptHasher.hash(JSON.stringify(keyData))}`;
  }
}
```

#### Resource Management
```typescript
class ResourceManager {
  private activeConnections = new Map<string, Connection>();
  private resourcePools = new Map<string, ResourcePool>();
  
  async getConnection(type: ConnectionType): Promise<Connection> {
    const poolKey = `${type.provider}-${type.region}`;
    
    let pool = this.resourcePools.get(poolKey);
    if (!pool) {
      pool = new ConnectionPool({
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100
      });
      
      this.resourcePools.set(poolKey, pool);
    }
    
    return await pool.acquire();
  }
  
  async releaseConnection(connection: Connection): Promise<void> {
    const pool = this.findPoolForConnection(connection);
    if (pool) {
      await pool.release(connection);
    }
  }
  
  async cleanup(): Promise<void> {
    // Close all active connections
    for (const connection of this.activeConnections.values()) {
      await connection.close();
    }
    
    // Destroy all pools
    for (const pool of this.resourcePools.values()) {
      await pool.drain();
      await pool.clear();
    }
  }
}

// Usage in agent
class ResourceAwareAgent extends BaseAgent {
  constructor(private resourceManager: ResourceManager) {
    super();
  }
  
  async processWithExternalService(data: ProcessingData): Promise<ProcessingResult> {
    const connection = await this.resourceManager.getConnection({
      provider: 'openai',
      region: 'us-west-2'
    });
    
    try {
      return await this.performProcessing(connection, data);
    } finally {
      await this.resourceManager.releaseConnection(connection);
    }
  }
}
```

### 4. Testing Best Practices

#### Unit Testing
```typescript
describe('CodeGenerationAgent', () => {
  let agent: CodeGenerationAgent;
  let mockAIService: jest.Mocked<AIService>;
  let mockCache: jest.Mocked<CacheStrategy>;
  let mockLogger: jest.Mocked<Logger>;
  
  beforeEach(() => {
    mockAIService = createMockAIService();
    mockCache = createMockCache();
    mockLogger = createMockLogger();
    
    agent = new CodeGenerationAgent(mockAIService, mockCache, mockLogger);
  });
  
  describe('generateCode', () => {
    it('should generate code for valid React component request', async () => {
      // Arrange
      const request: CodeGenerationRequest = {
        tenantId: 'tenant-123',
        projectId: 'project-456',
        specification: 'Create a user profile component',
        framework: 'react'
      };
      
      const expectedCode: GeneratedCode = {
        files: [
          {
            path: 'UserProfile.tsx',
            content: 'export const UserProfile = () => { return <div>Profile</div>; }'
          }
        ],
        metadata: {
          framework: 'react',
          generatedAt: expect.any(Date)
        }
      };
      
      mockCache.get.mockResolvedValue(null);
      mockAIService.generateCode.mockResolvedValue(expectedCode);
      
      // Act
      const result = await agent.generateCode(request);
      
      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(expectedCode);
      }
      
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^code-gen:/),
        expectedCode,
        3600
      );
    });
    
    it('should return cached result when available', async () => {
      // Arrange
      const request: CodeGenerationRequest = {
        tenantId: 'tenant-123',
        projectId: 'project-456',
        specification: 'Create a button component',
        framework: 'react'
      };
      
      const cachedCode: GeneratedCode = {
        files: [{ path: 'Button.tsx', content: 'cached content' }],
        metadata: { framework: 'react', generatedAt: new Date() }
      };
      
      mockCache.get.mockResolvedValue(cachedCode);
      
      // Act
      const result = await agent.generateCode(request);
      
      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(cachedCode);
      }
      
      expect(mockAIService.generateCode).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Cache hit for code generation',
        expect.objectContaining({ cacheKey: expect.any(String) })
      );
    });
    
    it('should handle validation errors gracefully', async () => {
      // Arrange
      const invalidRequest = {
        tenantId: 'invalid-tenant',
        specification: '', // Empty specification
        framework: 'react'
      };
      
      // Act
      const result = await agent.generateCode(invalidRequest as any);
      
      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.code).toBe('VALIDATION_FAILED');
      }
    });
  });
});
```

#### Integration Testing
```typescript
describe('Agent Integration Tests', () => {
  let testContainer: TestContainer;
  
  beforeAll(async () => {
    testContainer = await createTestContainer();
    await testContainer.start();
  });
  
  afterAll(async () => {
    await testContainer.stop();
  });
  
  describe('End-to-end code generation workflow', () => {
    it('should complete full workflow from request to deployment', async () => {
      // Arrange
      const tenant = await testContainer.createTestTenant();
      const project = await testContainer.createTestProject(tenant.id);
      const user = await testContainer.createTestUser(tenant.id);
      
      const codeGenRequest = {
        tenantId: tenant.id,
        projectId: project.id,
        specification: 'Create a user authentication API endpoint',
        framework: 'express'
      };
      
      // Act
      const generationResult = await testContainer.agentOrchestrator.execute({
        type: 'code-generation',
        request: codeGenRequest,
        userId: user.id
      });
      
      // Assert
      expect(generationResult.success).toBe(true);
      expect(generationResult.data.files).toHaveLength(3); // Controller, service, test
      
      // Verify files were saved
      const savedFiles = await testContainer.fileService.getProjectFiles(project.id);
      expect(savedFiles).toHaveLength(3);
      
      // Verify code quality
      const qualityReport = await testContainer.qualityAnalyzer.analyze(
        generationResult.data.files
      );
      expect(qualityReport.score).toBeGreaterThan(0.8);
      
      // Verify security
      const securityReport = await testContainer.securityScanner.scan(
        generationResult.data.files
      );
      expect(securityReport.vulnerabilities).toHaveLength(0);
    });
  });
  
  describe('Error handling and recovery', () => {
    it('should handle external service failures gracefully', async () => {
      // Simulate external service failure
      await testContainer.simulateServiceFailure('openai-api');
      
      const request = {
        tenantId: 'test-tenant',
        projectId: 'test-project',
        specification: 'Create a component',
        framework: 'react'
      };
      
      const result = await testContainer.agentOrchestrator.execute({
        type: 'code-generation',
        request,
        userId: 'test-user'
      });
      
      // Should fallback to local generation
      expect(result.success).toBe(true);
      expect(result.data.metadata.generationMethod).toBe('local-fallback');
    });
  });
});
```

#### Load Testing
```typescript
describe('Agent Performance Tests', () => {
  it('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = 50;
    const requests = Array.from({ length: concurrentRequests }, (_, i) => ({
      tenantId: `tenant-${i % 5}`, // 5 different tenants
      projectId: `project-${i}`,
      specification: `Create component ${i}`,
      framework: 'react' as const
    }));
    
    const startTime = Date.now();
    
    const results = await Promise.all(
      requests.map(req => agent.generateCode(req))
    );
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // All requests should succeed
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
    
    // Performance expectations
    expect(totalTime).toBeLessThan(30000); // Under 30 seconds
    expect(totalTime / concurrentRequests).toBeLessThan(1000); // Under 1 second per request average
  });
});
```

## Deployment Best Practices

### 1. Environment Configuration

#### Configuration Management
```typescript
// config/agent.config.ts
import { z } from 'zod';

const AgentConfigSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  
  // AI Services
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4'),
  OPENAI_TIMEOUT: z.coerce.number().default(30000),
  
  // Caching
  REDIS_URL: z.string().url(),
  CACHE_TTL: z.coerce.number().default(3600),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Security
  AGENT_ENCRYPTION_KEY: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  
  // Monitoring
  DATADOG_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

export const agentConfig = AgentConfigSchema.parse(process.env);
```

#### Environment-Specific Settings
```typescript
// config/environments/production.ts
export const productionConfig = {
  ai: {
    timeout: 60000,
    retries: 3,
    fallbackEnabled: true,
    models: {
      primary: 'gpt-4',
      fallback: 'gpt-3.5-turbo'
    }
  },
  
  cache: {
    ttl: 7200, // 2 hours
    maxMemoryUsage: '512MB',
    redis: {
      cluster: true,
      nodes: process.env.REDIS_CLUSTER_NODES?.split(',') || []
    }
  },
  
  monitoring: {
    enabled: true,
    metrics: {
      interval: 30000,
      retention: '30d'
    },
    alerts: {
      errorRate: 0.05,
      responseTime: 5000,
      queueDepth: 1000
    }
  },
  
  security: {
    rateLimit: {
      windowMs: 60000,
      max: 60 // Stricter in production
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotation: true
    }
  }
};
```

### 2. Monitoring and Observability

#### Metrics Collection
```typescript
class AgentMetricsCollector {
  private readonly metrics: Metrics;
  
  constructor() {
    this.metrics = new Metrics({
      prefix: 'mwap_agent_',
      tags: {
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION
      }
    });
  }
  
  // Business metrics
  recordCodeGeneration(duration: number, framework: string, success: boolean): void {
    this.metrics.increment('code_generation_total', {
      framework,
      success: success.toString()
    });
    
    this.metrics.histogram('code_generation_duration', duration, {
      framework
    });
  }
  
  recordCacheHit(type: string): void {
    this.metrics.increment('cache_hits_total', { type });
  }
  
  recordCacheMiss(type: string): void {
    this.metrics.increment('cache_misses_total', { type });
  }
  
  // System metrics
  recordMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    this.metrics.gauge('memory_usage_bytes', memUsage.heapUsed, { type: 'heap' });
    this.metrics.gauge('memory_usage_bytes', memUsage.external, { type: 'external' });
  }
  
  recordActiveConnections(count: number, provider: string): void {
    this.metrics.gauge('active_connections', count, { provider });
  }
  
  // Error tracking
  recordError(error: AgentError, context: string): void {
    this.metrics.increment('errors_total', {
      code: error.code,
      category: error.category,
      context
    });
  }
}

// Middleware for automatic metrics collection
export const metricsMiddleware = (collector: AgentMetricsCollector) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      collector.recordRequest(duration, req.method, res.statusCode, req.path);
    });
    
    next();
  };
};
```

#### Health Checks
```typescript
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, ComponentHealth>;
  timestamp: Date;
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

class AgentHealthChecker {
  private readonly checks: Map<string, HealthCheck> = new Map();
  
  addCheck(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
  }
  
  async performHealthCheck(): Promise<HealthCheckResult> {
    const results: Record<string, ComponentHealth> = {};
    
    await Promise.all(
      Array.from(this.checks.entries()).map(async ([name, check]) => {
        try {
          const startTime = Date.now();
          await check.check();
          const responseTime = Date.now() - startTime;
          
          results[name] = {
            status: 'healthy',
            responseTime
          };
        } catch (error) {
          results[name] = {
            status: 'unhealthy',
            error: error.message
          };
        }
      })
    );
    
    const overallStatus = this.determineOverallStatus(results);
    
    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date()
    };
  }
  
  private determineOverallStatus(
    checks: Record<string, ComponentHealth>
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.every(status => status === 'healthy')) {
      return 'healthy';
    }
    
    if (statuses.some(status => status === 'unhealthy')) {
      return 'unhealthy';
    }
    
    return 'degraded';
  }
}

// Built-in health checks
class DatabaseHealthCheck implements HealthCheck {
  constructor(private db: Database) {}
  
  async check(): Promise<void> {
    await this.db.query('SELECT 1');
  }
}

class CacheHealthCheck implements HealthCheck {
  constructor(private cache: CacheStrategy) {}
  
  async check(): Promise<void> {
    const testKey = `health-check-${Date.now()}`;
    await this.cache.set(testKey, 'test', 10);
    const value = await this.cache.get(testKey);
    
    if (value !== 'test') {
      throw new Error('Cache read/write failed');
    }
  }
}

class ExternalServiceHealthCheck implements HealthCheck {
  constructor(
    private serviceName: string,
    private client: ServiceClient
  ) {}
  
  async check(): Promise<void> {
    const response = await this.client.ping();
    
    if (!response.ok) {
      throw new Error(`${this.serviceName} health check failed`);
    }
  }
}
```

### 3. Scaling Strategies

#### Horizontal Scaling
```typescript
// Load balancer configuration
class AgentLoadBalancer {
  private instances: AgentInstance[] = [];
  private currentIndex = 0;
  
  addInstance(instance: AgentInstance): void {
    this.instances.push(instance);
  }
  
  removeInstance(instanceId: string): void {
    this.instances = this.instances.filter(inst => inst.id !== instanceId);
  }
  
  async getAvailableInstance(): Promise<AgentInstance> {
    if (this.instances.length === 0) {
      throw new Error('No available agent instances');
    }
    
    // Round-robin with health checks
    for (let i = 0; i < this.instances.length; i++) {
      const instance = this.instances[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.instances.length;
      
      if (await this.isInstanceHealthy(instance)) {
        return instance;
      }
    }
    
    throw new Error('No healthy agent instances available');
  }
  
  private async isInstanceHealthy(instance: AgentInstance): Promise<boolean> {
    try {
      const health = await instance.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }
}

// Auto-scaling based on queue depth
class AgentAutoScaler {
  constructor(
    private loadBalancer: AgentLoadBalancer,
    private instanceManager: InstanceManager
  ) {}
  
  async checkScaling(): Promise<void> {
    const metrics = await this.getMetrics();
    
    if (this.shouldScaleUp(metrics)) {
      await this.scaleUp();
    } else if (this.shouldScaleDown(metrics)) {
      await this.scaleDown();
    }
  }
  
  private shouldScaleUp(metrics: SystemMetrics): boolean {
    return (
      metrics.queueDepth > 100 ||
      metrics.averageResponseTime > 5000 ||
      metrics.cpuUsage > 0.8
    );
  }
  
  private shouldScaleDown(metrics: SystemMetrics): boolean {
    return (
      metrics.queueDepth < 10 &&
      metrics.averageResponseTime < 1000 &&
      metrics.cpuUsage < 0.3 &&
      this.loadBalancer.instanceCount > 2
    );
  }
  
  private async scaleUp(): Promise<void> {
    const newInstance = await this.instanceManager.createInstance({
      type: 'agent-worker',
      config: this.getScalingConfig()
    });
    
    this.loadBalancer.addInstance(newInstance);
  }
  
  private async scaleDown(): Promise<void> {
    const instanceToRemove = await this.selectInstanceForRemoval();
    
    await this.instanceManager.drainInstance(instanceToRemove.id);
    await this.instanceManager.terminateInstance(instanceToRemove.id);
    
    this.loadBalancer.removeInstance(instanceToRemove.id);
  }
}
```

#### Queue Management
```typescript
interface QueueConfig {
  maxSize: number;
  processingTimeout: number;
  retryAttempts: number;
  dlqEnabled: boolean;
}

class AgentTaskQueue {
  private queue: AgentTask[] = [];
  private processing: Map<string, AgentTask> = new Map();
  private dlq: AgentTask[] = [];
  
  constructor(private config: QueueConfig) {}
  
  async enqueue(task: AgentTask): Promise<void> {
    if (this.queue.length >= this.config.maxSize) {
      throw new Error('Queue is full');
    }
    
    task.enqueuedAt = new Date();
    task.attempts = 0;
    
    this.queue.push(task);
    
    // Emit queue size metric
    this.emitMetric('queue_size', this.queue.length);
  }
  
  async dequeue(): Promise<AgentTask | null> {
    const task = this.queue.shift();
    
    if (task) {
      task.dequeuedAt = new Date();
      task.attempts++;
      
      this.processing.set(task.id, task);
      
      // Set processing timeout
      setTimeout(() => {
        this.handleTimeout(task.id);
      }, this.config.processingTimeout);
    }
    
    return task || null;
  }
  
  async complete(taskId: string): Promise<void> {
    const task = this.processing.get(taskId);
    
    if (task) {
      task.completedAt = new Date();
      this.processing.delete(taskId);
      
      // Emit processing time metric
      const processingTime = task.completedAt.getTime() - task.dequeuedAt!.getTime();
      this.emitMetric('processing_time', processingTime);
    }
  }
  
  async fail(taskId: string, error: Error): Promise<void> {
    const task = this.processing.get(taskId);
    
    if (!task) return;
    
    this.processing.delete(taskId);
    
    if (task.attempts < this.config.retryAttempts) {
      // Retry with exponential backoff
      const delay = Math.pow(2, task.attempts) * 1000;
      
      setTimeout(() => {
        this.queue.push(task);
      }, delay);
    } else if (this.config.dlqEnabled) {
      // Move to dead letter queue
      task.failedAt = new Date();
      task.error = error.message;
      this.dlq.push(task);
    }
  }
  
  private handleTimeout(taskId: string): void {
    const task = this.processing.get(taskId);
    
    if (task) {
      this.fail(taskId, new Error('Processing timeout'));
    }
  }
  
  getMetrics(): QueueMetrics {
    return {
      queueSize: this.queue.length,
      processingCount: this.processing.size,
      dlqSize: this.dlq.length,
      totalEnqueued: this.totalEnqueued,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed
    };
  }
}
```

## Security Best Practices

### 1. Input Validation and Sanitization

#### Comprehensive Validation Framework
```typescript
class AgentInputValidator {
  private readonly schemas: Map<string, z.ZodSchema> = new Map();
  private readonly sanitizers: Map<string, Sanitizer> = new Map();
  
  registerSchema(operation: string, schema: z.ZodSchema): void {
    this.schemas.set(operation, schema);
  }
  
  registerSanitizer(type: string, sanitizer: Sanitizer): void {
    this.sanitizers.set(type, sanitizer);
  }
  
  async validate(operation: string, input: unknown): Promise<ValidationResult> {
    const schema = this.schemas.get(operation);
    
    if (!schema) {
      throw new Error(`No validation schema found for operation: ${operation}`);
    }
    
    // Schema validation
    const parseResult = schema.safeParse(input);
    
    if (!parseResult.success) {
      return {
        valid: false,
        errors: parseResult.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      };
    }
    
    // Security validation
    const securityCheck = await this.performSecurityValidation(parseResult.data);
    
    if (!securityCheck.passed) {
      return {
        valid: false,
        errors: securityCheck.violations.map(violation => ({
          path: violation.field,
          message: violation.message,
          code: 'SECURITY_VIOLATION'
        }))
      };
    }
    
    return {
      valid: true,
      data: parseResult.data
    };
  }
  
  private async performSecurityValidation(data: any): Promise<SecurityCheckResult> {
    const violations: SecurityViolation[] = [];
    
    // Check for injection patterns
    const injectionCheck = this.checkForInjectionPatterns(data);
    violations.push(...injectionCheck);
    
    // Check for malicious content
    const maliciousContentCheck = await this.checkForMaliciousContent(data);
    violations.push(...maliciousContentCheck);
    
    // Check rate limits
    const rateLimitCheck = await this.checkRateLimits(data);
    violations.push(...rateLimitCheck);
    
    return {
      passed: violations.length === 0,
      violations
    };
  }
}
```

### 2. Secure Communication

#### Encryption and Transport Security
```typescript
class SecureCommunicationManager {
  private readonly certificates: Map<string, Certificate> = new Map();
  
  async setupTLS(config: TLSConfig): Promise<TLSContext> {
    const cert = await this.loadCertificate(config.certPath);
    const key = await this.loadPrivateKey(config.keyPath);
    
    return {
      cert,
      key,
      ca: config.caPath ? await this.loadCA(config.caPath) : undefined,
      ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384',
      honorCipherOrder: true,
      secureProtocol: 'TLSv1_2_method'
    };
  }
  
  async encryptMessage(message: any, recipientKey: string): Promise<EncryptedMessage> {
    const serialized = JSON.stringify(message);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher('aes-256-gcm', recipientKey);
    cipher.setAAD(Buffer.from('agent-communication'));
    
    let encrypted = cipher.update(serialized, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: 'aes-256-gcm'
    };
  }
  
  async decryptMessage(encryptedMessage: EncryptedMessage, key: string): Promise<any> {
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(Buffer.from('agent-communication'));
    decipher.setAuthTag(Buffer.from(encryptedMessage.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedMessage.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}
```

## Performance Best Practices

### 1. Optimization Strategies

#### Memory Management
```typescript
class MemoryOptimizedAgent extends BaseAgent {
  private readonly maxMemoryUsage = 512 * 1024 * 1024; // 512MB
  private readonly memoryCheckInterval = 30000; // 30 seconds
  
  constructor() {
    super();
    this.startMemoryMonitoring();
  }
  
  private startMemoryMonitoring(): void {
    setInterval(() => {
      this.checkMemoryUsage();
    }, this.memoryCheckInterval);
  }
  
  private checkMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    
    if (memUsage.heapUsed > this.maxMemoryUsage) {
      this.triggerGarbageCollection();
      this.clearCaches();
    }
  }
  
  private triggerGarbageCollection(): void {
    if (global.gc) {
      global.gc();
    }
  }
  
  private clearCaches(): void {
    // Clear internal caches
    this.internalCache.clear();
    
    // Emit memory pressure event
    this.eventEmitter.emit('memory-pressure', {
      heapUsed: process.memoryUsage().heapUsed,
      threshold: this.maxMemoryUsage
    });
  }
  
  // Implement streaming for large data processing
  async processLargeDataset(dataStream: ReadableStream): Promise<ProcessingResult> {
    const processor = new StreamProcessor();
    
    return new Promise((resolve, reject) => {
      const resultChunks: any[] = [];
      
      dataStream
        .pipe(processor)
        .on('data', (chunk) => {
          resultChunks.push(chunk);
          
          // Process in batches to avoid memory buildup
          if (resultChunks.length >= 100) {
            this.processBatch(resultChunks.splice(0, 100));
          }
        })
        .on('end', () => {
          // Process remaining chunks
          if (resultChunks.length > 0) {
            this.processBatch(resultChunks);
          }
          
          resolve(this.aggregateResults());
        })
        .on('error', reject);
    });
  }
}
```

#### Concurrency Control
```typescript
class ConcurrencyController {
  private readonly semaphores: Map<string, Semaphore> = new Map();
  
  async withConcurrencyLimit<T>(
    key: string,
    limit: number,
    operation: () => Promise<T>
  ): Promise<T> {
    let semaphore = this.semaphores.get(key);
    
    if (!semaphore) {
      semaphore = new Semaphore(limit);
      this.semaphores.set(key, semaphore);
    }
    
    await semaphore.acquire();
    
    try {
      return await operation();
    } finally {
      semaphore.release();
    }
  }
}

class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }
  
  release(): void {
    this.permits++;
    
    const next = this.waitQueue.shift();
    if (next) {
      this.permits--;
      next();
    }
  }
}

// Usage in agent
class ConcurrencyAwareAgent extends BaseAgent {
  constructor(private concurrencyController: ConcurrencyController) {
    super();
  }
  
  async processFiles(files: FileData[]): Promise<ProcessingResult[]> {
    return await Promise.all(
      files.map(file => 
        this.concurrencyController.withConcurrencyLimit(
          'file-processing',
          5, // Max 5 concurrent file processing operations
          () => this.processFile(file)
        )
      )
    );
  }
  
  async callExternalAPI(request: APIRequest): Promise<APIResponse> {
    return await this.concurrencyController.withConcurrencyLimit(
      `external-api-${request.provider}`,
      3, // Max 3 concurrent calls per provider
      () => this.makeAPICall(request)
    );
  }
}
```

## Maintenance Best Practices

### 1. Logging and Debugging

#### Structured Logging
```typescript
interface LogContext {
  agentId: string;
  tenantId?: string;
  userId?: string;
  correlationId?: string;
  operation?: string;
  [key: string]: any;
}

class StructuredLogger {
  constructor(
    private baseContext: LogContext,
    private logLevel: LogLevel = LogLevel.INFO
  ) {}
  
  debug(message: string, context?: Partial<LogContext>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  info(message: string, context?: Partial<LogContext>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  warn(message: string, context?: Partial<LogContext>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    const errorContext = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    } : {};
    
    this.log(LogLevel.ERROR, message, { ...context, ...errorContext });
  }
  
  private log(level: LogLevel, message: string, context?: Partial<LogContext>): void {
    if (level < this.logLevel) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context: {
        ...this.baseContext,
        ...context
      }
    };
    
    console.log(JSON.stringify(logEntry));
  }
}

// Request correlation
class CorrelationService {
  private static correlationStore = new AsyncLocalStorage<string>();
  
  static run<T>(correlationId: string, fn: () => T): T {
    return this.correlationStore.run(correlationId, fn);
  }
  
  static getId(): string | undefined {
    return this.correlationStore.getStore();
  }
  
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage in agent
class LoggingAgent extends BaseAgent {
  private logger: StructuredLogger;
  
  constructor(agentId: string) {
    super();
    this.logger = new StructuredLogger({ agentId });
  }
  
  async execute(request: AgentRequest): Promise<AgentResult> {
    const correlationId = CorrelationService.generateId();
    
    return CorrelationService.run(correlationId, async () => {
      this.logger.info('Agent execution started', {
        correlationId,
        operation: request.operation,
        tenantId: request.tenantId
      });
      
      try {
        const result = await this.processRequest(request);
        
        this.logger.info('Agent execution completed', {
          correlationId,
          duration: result.processingTime
        });
        
        return result;
      } catch (error) {
        this.logger.error('Agent execution failed', error, {
          correlationId,
          operation: request.operation
        });
        
        throw error;
      }
    });
  }
}
```

### 2. Alerting and Notifications

#### Alert Management
```typescript
interface AlertRule {
  name: string;
  condition: AlertCondition;
  threshold: number;
  window: number; // Time window in milliseconds
  severity: AlertSeverity;
  channels: NotificationChannel[];
}

enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

class AlertManager {
  private rules: AlertRule[] = [];
  private activeAlerts: Map<string, ActiveAlert> = new Map();
  
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }
  
  async checkAlerts(metrics: SystemMetrics): Promise<void> {
    for (const rule of this.rules) {
      const shouldAlert = await this.evaluateCondition(rule, metrics);
      
      if (shouldAlert && !this.activeAlerts.has(rule.name)) {
        await this.triggerAlert(rule, metrics);
      } else if (!shouldAlert && this.activeAlerts.has(rule.name)) {
        await this.resolveAlert(rule.name);
      }
    }
  }
  
  private async evaluateCondition(
    rule: AlertRule,
    metrics: SystemMetrics
  ): Promise<boolean> {
    switch (rule.condition) {
      case AlertCondition.ERROR_RATE_HIGH:
        return metrics.errorRate > rule.threshold;
      
      case AlertCondition.RESPONSE_TIME_HIGH:
        return metrics.averageResponseTime > rule.threshold;
      
      case AlertCondition.QUEUE_DEPTH_HIGH:
        return metrics.queueDepth > rule.threshold;
      
      case AlertCondition.MEMORY_USAGE_HIGH:
        return metrics.memoryUsage > rule.threshold;
      
      default:
        return false;
    }
  }
  
  private async triggerAlert(rule: AlertRule, metrics: SystemMetrics): Promise<void> {
    const alert: ActiveAlert = {
      ruleId: rule.name,
      severity: rule.severity,
      triggeredAt: new Date(),
      message: this.buildAlertMessage(rule, metrics),
      metrics
    };
    
    this.activeAlerts.set(rule.name, alert);
    
    // Send notifications
    await Promise.all(
      rule.channels.map(channel => this.sendNotification(channel, alert))
    );
  }
  
  private async resolveAlert(ruleName: string): Promise<void> {
    const alert = this.activeAlerts.get(ruleName);
    
    if (alert) {
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(ruleName);
      
      // Send resolution notification
      await this.sendResolutionNotification(alert);
    }
  }
}

// Built-in notification channels
class SlackNotificationChannel implements NotificationChannel {
  constructor(private webhookUrl: string) {}
  
  async send(alert: ActiveAlert): Promise<void> {
    const payload = {
      text: `🚨 Alert: ${alert.message}`,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Triggered', value: alert.triggeredAt.toISOString(), short: true }
          ]
        }
      ]
    };
    
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
}

class EmailNotificationChannel implements NotificationChannel {
  constructor(private emailService: EmailService) {}
  
  async send(alert: ActiveAlert): Promise<void> {
    await this.emailService.send({
      to: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
      subject: `MWAP Agent Alert: ${alert.severity.toUpperCase()}`,
      html: this.buildEmailTemplate(alert)
    });
  }
}
```

This comprehensive best practices guide covers all essential aspects of AI agent development, deployment, and maintenance within the MWAP platform. Following these practices ensures reliable, secure, and maintainable agent systems that can scale effectively and provide consistent value to users. 