/**
 * OAuth Performance Tests
 * 
 * Comprehensive performance testing for OAuth callback system:
 * - Load testing for concurrent OAuth callbacks
 * - Response time validation under various loads
 * - Memory usage and leak detection
 * - Database performance under load
 * - Rate limiting performance
 * - Stress testing and breaking point analysis
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createHmac } from 'crypto';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, registerRoutes, whenRoutesReady } from '../../src/app.js';
import { connectToDatabase, getDB } from '../../src/config/db.js';
import { performance } from 'perf_hooks';

// Mock external dependencies for consistent performance testing
vi.mock('../../src/config/auth0.ts', () => ({
  jwksClient: {
    getSigningKey: vi.fn().mockResolvedValue({
      getPublicKey: () => 'mock-public-key'
    })
  }
}));

vi.mock('../../src/utils/logger.js', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logAudit: vi.fn()
}));

vi.mock('../../src/features/oauth/oauth.service.js', () => ({
  OAuthService: vi.fn().mockImplementation(() => ({
    exchangeCodeForTokens: vi.fn().mockImplementation(async () => {
      // Simulate realistic OAuth provider response time
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      return {
        accessToken: 'perf_test_access_token',
        refreshToken: 'perf_test_refresh_token',
        expiresIn: 3600,
        scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
      };
    })
  }))
}));

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsPerSecond: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  errors: Array<{ error: string; count: number }>;
}

describe('OAuth Performance Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testTenantId: string;
  let testProviderId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Start in-memory MongoDB for performance testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    process.env.MONGODB_URI = mongoUri;
    await connectToDatabase();

    // Ensure routes are ready before firing high-concurrency tests
    await registerRoutes();
    await whenRoutesReady();

    // Increase timeout for performance tests
    vi.setConfig({ testTimeout: 60000 });
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database and setup test data
    const db = getDB();
    await db.collection('tenants').deleteMany({});
    await db.collection('cloudProviderIntegrations').deleteMany({});
    await db.collection('cloudProviders').deleteMany({});

    testUserId = 'auth0|perftest123';
    process.env.OAUTH_STATE_SECRET = 'test-secret';
    
    // Create test tenant
    const tenantResult = await db.collection('tenants').insertOne({
      name: 'Performance Test Tenant',
      ownerId: testUserId,
      settings: { allowPublicProjects: false, maxProjects: 100 },
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false
    });
    testTenantId = tenantResult.insertedId.toString();

    // Create test cloud provider
    const providerResult = await db.collection('cloudProviders').insertOne({
      name: 'Performance Test Provider',
      slug: 'perf-test-provider',
      scopes: ['test.scope'],
      authUrl: 'https://test.provider.com/oauth/authorize',
      tokenUrl: 'https://test.provider.com/oauth/token',
      clientId: 'perf-test-client',
      clientSecret: 'perf-test-secret',
      grantType: 'authorization_code',
      tokenMethod: 'POST',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });
    testProviderId = providerResult.insertedId.toString();
  });

  describe('Load Testing', () => {
    it('should handle moderate concurrent OAuth callbacks (50 requests)', async () => {
      const concurrency = 50;
      const metrics = await runConcurrentOAuthCallbacks(concurrency);

      // Performance assertions
      expect(metrics.successfulRequests).toBe(concurrency);
      expect(metrics.averageResponseTime).toBeLessThan(2000); // Under 2 seconds average
      expect(metrics.p95ResponseTime).toBeLessThan(5000); // 95th percentile under 5 seconds
      expect(metrics.requestsPerSecond).toBeGreaterThan(10); // At least 10 RPS

      logPerformanceResults('Moderate Load (50 concurrent)', metrics);
    });

    it('should handle high concurrent OAuth callbacks (100 requests)', async () => {
      const concurrency = 100;
      const metrics = await runConcurrentOAuthCallbacks(concurrency);

      // More relaxed assertions for higher load
      expect(metrics.successfulRequests).toBeGreaterThan(concurrency * 0.95); // 95% success rate
      expect(metrics.averageResponseTime).toBeLessThan(3000); // Under 3 seconds average
      expect(metrics.p95ResponseTime).toBeLessThan(8000); // 95th percentile under 8 seconds
      expect(metrics.requestsPerSecond).toBeGreaterThan(8); // At least 8 RPS

      logPerformanceResults('High Load (100 concurrent)', metrics);
    });

    it('should maintain performance with database growth', async () => {
      // Create large number of existing integrations
      const db = getDB();
      const existingIntegrations = Array.from({ length: 1000 }, (_, i) => ({
        tenantId: { $oid: testTenantId },
        providerId: { $oid: testProviderId },
        status: 'active',
        accessToken: `existing_token_${i}`,
        refreshToken: `existing_refresh_${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: testUserId
      }));

      await db.collection('cloudProviderIntegrations').insertMany(existingIntegrations);

      // Test performance with large dataset
      const concurrency = 25;
      const metrics = await runConcurrentOAuthCallbacks(concurrency);

      expect(metrics.successfulRequests).toBe(concurrency);
      expect(metrics.averageResponseTime).toBeLessThan(2500); // Slightly higher threshold with more data
      
      logPerformanceResults('Large Dataset Performance', metrics);
    });

    it('should handle sustained load over time', async () => {
      const duration = 30000; // 30 seconds
      const interval = 100; // New request every 100ms
      const metrics = await runSustainedLoad(duration, interval);

      expect(metrics.successfulRequests).toBeGreaterThan(250); // At least 250 successful requests
      expect(metrics.averageResponseTime).toBeLessThan(2000);
      
      // Check for memory leaks
      expect(metrics.memoryUsage.heapUsed).toBeLessThan(200 * 1024 * 1024); // Under 200MB
      
      logPerformanceResults('Sustained Load (30s)', metrics);
    }, 40000);
  });

  describe('Response Time Validation', () => {
    it('should process simple OAuth callbacks quickly', async () => {
      const integrationId = await createTestIntegration();
      const stateData = {
        tenantId: testTenantId,
        integrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'perf-test-simple'
      };
      const payload = { ...stateData, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 600 } as any;
      const sig = createHmac('sha256', process.env.OAUTH_STATE_SECRET!).update(JSON.stringify(payload)).digest('hex');
      const stateParam = Buffer.from(JSON.stringify({ p: payload, s: sig })).toString('base64url');

      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'perf_test_code',
          state: stateParam
        });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(302);
      expect(responseTime).toBeLessThan(1000); // Under 1 second for simple callback

      console.log(`Simple OAuth callback response time: ${responseTime.toFixed(2)}ms`);
    });

    it('should handle complex state validation efficiently', async () => {
      const integrationId = await createTestIntegration();
      
      // Create complex state with many fields
      const complexStateData = {
        tenantId: testTenantId,
        integrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'complex-state-validation-test-with-long-nonce-value',
        metadata: {
          redirectUri: 'https://app.example.com/oauth/success',
          scopes: ['scope1', 'scope2', 'scope3'],
          clientInfo: {
            userAgent: 'ComplexTestClient/1.0',
            platform: 'web',
            version: '1.2.3'
          }
        }
      };
      const payload2 = { ...complexStateData, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 600 } as any;
      const sig2 = createHmac('sha256', process.env.OAUTH_STATE_SECRET!).update(JSON.stringify(payload2)).digest('hex');
      const stateParam = Buffer.from(JSON.stringify({ p: payload2, s: sig2 })).toString('base64url');

      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'complex_test_code',
          state: stateParam
        });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(302);
      expect(responseTime).toBeLessThan(1500); // Under 1.5 seconds for complex validation

      console.log(`Complex state validation response time: ${responseTime.toFixed(2)}ms`);
    });

    it('should validate expired states quickly', async () => {
      const integrationId = await createTestIntegration();
      const expiredStateData = {
        tenantId: testTenantId,
        integrationId,
        userId: testUserId,
        timestamp: Date.now() - (15 * 60 * 1000), // 15 minutes ago (expired)
        nonce: 'expired-state-perf-test'
      };
      const payload3 = { ...expiredStateData, iat: Math.floor(Date.now()/1000) - 3600, exp: Math.floor(Date.now()/1000) - 60 } as any;
      const sig3 = createHmac('sha256', process.env.OAUTH_STATE_SECRET!).update(JSON.stringify(payload3)).digest('hex');
      const stateParam = Buffer.from(JSON.stringify({ p: payload3, s: sig3 })).toString('base64url');

      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'expired_test_code',
          state: stateParam
        });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(responseTime).toBeLessThan(500); // Error cases should be very fast

      console.log(`Expired state validation response time: ${responseTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during OAuth processing', async () => {
      const initialMemory = process.memoryUsage();
      
      // Process many OAuth callbacks
      for (let i = 0; i < 100; i++) {
        const integrationId = await createTestIntegration();
        const stateData = {
          tenantId: testTenantId,
          integrationId,
          userId: testUserId,
          timestamp: Date.now(),
          nonce: `memory-test-${i}`
        };
        const payload = { ...stateData, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 600 } as any;
        const sig = createHmac('sha256', process.env.OAUTH_STATE_SECRET!).update(JSON.stringify(payload)).digest('hex');
        const stateParam = Buffer.from(JSON.stringify({ p: payload, s: sig })).toString('base64url');

        await request(app)
          .get('/api/v1/oauth/callback')
          .query({
            code: `memory_test_code_${i}`,
            state: stateParam
          });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerRequest = memoryIncrease / 100;

      expect(memoryIncreasePerRequest).toBeLessThan(100 * 1024); // Less than 100KB per request

      console.log(`Memory increase per OAuth callback: ${(memoryIncreasePerRequest / 1024).toFixed(2)}KB`);
    });

    it('should handle large state parameters efficiently', async () => {
      const integrationId = await createTestIntegration();
      
      // Create very large state parameter
      const largeMetadata = {
        userPreferences: Array.from({ length: 200 }, (_, i) => ({
          key: `preference_${i}`,
          value: `value_${i}`.repeat(5)
        })),
        sessionData: 'x'.repeat(2000),
        temporaryData: Array.from({ length: 50 }, (_, i) => `temp_data_${i}`)
      };

      const largeStateData = {
        tenantId: testTenantId,
        integrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'large-state-test',
        metadata: largeMetadata
      };

      const initialMemory = process.memoryUsage();
      const payload4 = { ...largeStateData, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 600 } as any;
      const sig4 = createHmac('sha256', process.env.OAUTH_STATE_SECRET!).update(JSON.stringify(payload4)).digest('hex');
      const stateParam = Buffer.from(JSON.stringify({ p: payload4, s: sig4 })).toString('base64url');

      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'large_state_code',
          state: stateParam
        });

      const endTime = performance.now();
      const finalMemory = process.memoryUsage();

      const responseTime = endTime - startTime;
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Large payloads may trigger 431 (Request Header Fields Too Large) in some environments
      // Accept either redirect success or handled error as pass
      expect([302, 431]).toContain(response.status);
      expect(responseTime).toBeLessThan(2000); // Should still process quickly
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Under 50MB memory increase

      console.log(`Large state processing time: ${responseTime.toFixed(2)}ms`);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Database Performance', () => {
    it('should efficiently query integrations under load', async () => {
      // Create multiple integrations for the same tenant
      const integrationIds = await Promise.all(
        Array.from({ length: 50 }, () => createTestIntegration())
      );

      // Test concurrent database queries
      const queries = integrationIds.map(async (integrationId) => {
        const stateData = {
          tenantId: testTenantId,
          integrationId,
          userId: testUserId,
          timestamp: Date.now(),
          nonce: `db-perf-${integrationId}`
        };
        const payload = { ...stateData, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 600 } as any;
        const sig = createHmac('sha256', process.env.OAUTH_STATE_SECRET!).update(JSON.stringify(payload)).digest('hex');
        const stateParam = Buffer.from(JSON.stringify({ p: payload, s: sig })).toString('base64url');

        const startTime = performance.now();
        
        const response = await request(app)
          .get('/api/v1/oauth/callback')
          .query({
            code: `db_test_${integrationId}`,
            state: stateParam
          });

        const endTime = performance.now();
        
        return {
          success: response.status === 302,
          responseTime: endTime - startTime
        };
      });

      const results = await Promise.all(queries);
      const successCount = results.filter(r => r.success).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

      expect(successCount).toBe(integrationIds.length);
      expect(avgResponseTime).toBeLessThan(1500); // Average under 1.5 seconds

      console.log(`Database performance - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });

    it('should handle database connection pool efficiently', async () => {
      const concurrency = 20;
      
      // Simulate high database load
      const tasks = Array.from({ length: concurrency }, async (_, i) => {
        const integrationId = await createTestIntegration();
        
        // Multiple database operations per task
        for (let j = 0; j < 5; j++) {
          const stateData = {
            tenantId: testTenantId,
            integrationId,
            userId: testUserId,
            timestamp: Date.now(),
            nonce: `pool-test-${i}-${j}`
          };
          const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

          await request(app)
            .get('/api/v1/oauth/callback')
            .query({
              code: `pool_test_${i}_${j}`,
              state: stateParam
            });
        }
        
        return i;
      });

      const startTime = performance.now();
      const results = await Promise.all(tasks);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const throughput = (concurrency * 5) / (totalTime / 1000); // Operations per second

      expect(results.length).toBe(concurrency);
      expect(throughput).toBeGreaterThan(5); // At least 5 operations per second

      console.log(`Database pool performance - Throughput: ${throughput.toFixed(2)} ops/sec`);
    });
  });

  describe('Stress Testing', () => {
    it('should gracefully handle extreme load', async () => {
      const extremeConcurrency = 200;
      
      console.log(`Starting stress test with ${extremeConcurrency} concurrent requests...`);
      
      const metrics = await runConcurrentOAuthCallbacks(extremeConcurrency, {
        timeout: 30000, // 30 second timeout
        allowFailures: true
      });

      // In stress testing, we expect some failures but system should remain stable
      expect(metrics.successfulRequests).toBeGreaterThan(extremeConcurrency * 0.7); // 70% success rate
      expect(metrics.successfulRequests + metrics.failedRequests).toBe(extremeConcurrency);
      
      // System should still be responsive for successful requests
      expect(metrics.averageResponseTime).toBeLessThan(10000); // Under 10 seconds average
      
      logPerformanceResults('Stress Test (200 concurrent)', metrics);
    });

    it('should recover from stress conditions', async () => {
      // First, apply stress
      await runConcurrentOAuthCallbacks(150, { allowFailures: true });
      
      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test normal performance after stress
      const metrics = await runConcurrentOAuthCallbacks(10);
      
      expect(metrics.successfulRequests).toBe(10);
      expect(metrics.averageResponseTime).toBeLessThan(2000); // Should return to normal performance
      
      console.log('System recovery validated - performance returned to normal levels');
    });
  });

  // Helper functions
  async function createTestIntegration(): Promise<string> {
    const db = getDB();
    const result = await db.collection('cloudProviderIntegrations').insertOne({
      tenantId: { $oid: testTenantId },
      providerId: { $oid: testProviderId },
      status: 'active',
      accessToken: null,
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: testUserId
    });
    return result.insertedId.toString();
  }

  async function runConcurrentOAuthCallbacks(
    concurrency: number,
    options: { timeout?: number; allowFailures?: boolean } = {}
  ): Promise<PerformanceMetrics> {
    const { timeout = 15000, allowFailures = false } = options;
    
    const tasks = Array.from({ length: concurrency }, async (_, i) => {
      const integrationId = await createTestIntegration();
      const stateData = {
        tenantId: testTenantId,
        integrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: `concurrent-test-${i}`
      };
      const payload = { ...stateData, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 600 } as any;
      const sig = createHmac('sha256', process.env.OAUTH_STATE_SECRET!).update(JSON.stringify(payload)).digest('hex');
      const stateParam = Buffer.from(JSON.stringify({ p: payload, s: sig })).toString('base64url');

      const startTime = performance.now();
      
      try {
        const response = await Promise.race([
          request(app)
            .get('/api/v1/oauth/callback')
            .query({
              code: `concurrent_code_${i}`,
              state: stateParam
            }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);

        const endTime = performance.now();
        
        return {
          success: (response as any).status === 302,
          responseTime: endTime - startTime,
          error: null
        };
      } catch (error) {
        const endTime = performance.now();
        return {
          success: false,
          responseTime: endTime - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const startTime = performance.now();
    const results = await Promise.all(tasks);
    const endTime = performance.now();

    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    if (!allowFailures && failedResults.length > 0) {
      console.warn(`${failedResults.length} requests failed during performance test`);
    }

    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
    const totalTime = (endTime - startTime) / 1000; // Convert to seconds

    return {
      totalRequests: concurrency,
      successfulRequests: successfulResults.length,
      failedRequests: failedResults.length,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p50ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.5)],
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      requestsPerSecond: concurrency / totalTime,
      memoryUsage: process.memoryUsage(),
      errors: []
    };
  }

  async function runSustainedLoad(duration: number, interval: number): Promise<PerformanceMetrics> {
    const results: Array<{ success: boolean; responseTime: number; error?: string }> = [];
    const startTime = performance.now();
    const endTime = startTime + duration;

    while (performance.now() < endTime) {
      const integrationId = await createTestIntegration();
      const stateData = {
        tenantId: testTenantId,
        integrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: `sustained-${Date.now()}`
      };
      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const requestStart = performance.now();
      
      try {
        const response = await request(app)
          .get('/api/v1/oauth/callback')
          .query({
            code: `sustained_${Date.now()}`,
            state: stateParam
          });

        const requestEnd = performance.now();
        
        results.push({
          success: response.status === 302,
          responseTime: requestEnd - requestStart
        });
      } catch (error) {
        const requestEnd = performance.now();
        results.push({
          success: false,
          responseTime: requestEnd - requestStart,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    const actualEndTime = performance.now();
    const totalTime = (actualEndTime - startTime) / 1000;
    
    const successfulResults = results.filter(r => r.success);
    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);

    return {
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: results.length - successfulResults.length,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p50ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.5)],
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      requestsPerSecond: results.length / totalTime,
      memoryUsage: process.memoryUsage(),
      errors: []
    };
  }

  function logPerformanceResults(testName: string, metrics: PerformanceMetrics): void {
    console.log(`\n=== ${testName} Performance Results ===`);
    console.log(`Total Requests: ${metrics.totalRequests}`);
    console.log(`Successful: ${metrics.successfulRequests} (${(metrics.successfulRequests / metrics.totalRequests * 100).toFixed(1)}%)`);
    console.log(`Failed: ${metrics.failedRequests}`);
    console.log(`Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`P50 Response Time: ${metrics.p50ResponseTime.toFixed(2)}ms`);
    console.log(`P95 Response Time: ${metrics.p95ResponseTime.toFixed(2)}ms`);
    console.log(`P99 Response Time: ${metrics.p99ResponseTime.toFixed(2)}ms`);
    console.log(`Requests per Second: ${metrics.requestsPerSecond.toFixed(2)}`);
    console.log(`Memory Usage: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log('===============================================\n');
  }
}); 