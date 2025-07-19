# Background Job Processing

This document outlines the current state of background job processing in the MWAP backend and provides patterns for implementing robust asynchronous task handling.

## 🏗️ Current Architecture

### Current State
The MWAP backend currently operates **without a dedicated background job processing system**. Most operations are handled synchronously within HTTP request contexts:

```typescript
// Current: Synchronous OAuth token refresh
export async function refreshIntegrationTokens(req: Request, res: Response) {
  const tokenResponse = await oauthService.refreshTokens(refreshToken, provider);
  const updatedIntegration = await cloudIntegrationsService.updateTokens(...);
  return jsonResponse(res, 200, updatedIntegration);
}

// Current: On-demand health checks
export async function checkIntegrationHealth(req: Request, res: Response) {
  const healthStatus = await cloudIntegrationsService.checkIntegrationHealth(...);
  return jsonResponse(res, 200, healthStatus);
}
```

### Operations That Could Benefit from Background Processing
```typescript
// Potential background jobs identified:
1. OAuth token refresh automation
2. Integration health monitoring
3. File indexing and metadata extraction
4. Audit log cleanup and archiving
5. Database optimization tasks
6. Email notifications and alerts
7. Analytics data aggregation
```

## 🚀 Recommended Background Job Architecture

### Technology Stack Options

#### Option 1: Bull Queue (Redis-based)
```bash
# Install dependencies
npm install bull @types/bull redis @types/redis ioredis @types/ioredis
```

```typescript
// src/services/queue/QueueService.ts
import Queue from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const tokenRefreshQueue = new Queue('token refresh', {
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

export const healthCheckQueue = new Queue('health check', {
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    repeat: { cron: '*/15 * * * *' }, // Every 15 minutes
    removeOnComplete: 10,
    removeOnFail: 10
  }
});
```

#### Option 2: Agenda (MongoDB-based)
```bash
# Install dependencies
npm install agenda @types/agenda
```

```typescript
// src/services/queue/AgendaService.ts
import Agenda from 'agenda';
import { getDB } from '../../config/db.js';

export const agenda = new Agenda({
  mongo: getDB(),
  db: { collection: 'jobs' },
  processEvery: '30 seconds',
  maxConcurrency: 10
});

// Define job types
agenda.define('refresh oauth tokens', async (job) => {
  const { integrationId, tenantId } = job.attrs.data;
  await refreshIntegrationTokens(integrationId, tenantId);
});

agenda.define('check integration health', async (job) => {
  const { integrationId, tenantId } = job.attrs.data;
  await performHealthCheck(integrationId, tenantId);
});
```

## 🔄 Implementation Patterns

### 1. OAuth Token Refresh Automation

#### Current: Manual Refresh
```typescript
// Manual token refresh triggered by API call
POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh
```

#### Proposed: Automated Background Refresh
```typescript
// src/jobs/TokenRefreshJob.ts
import { tokenRefreshQueue } from '../services/queue/QueueService.js';
import { CloudIntegrationsService } from '../features/cloud-integrations/cloudIntegrations.service.js';
import { logInfo, logError } from '../utils/logger.js';

export class TokenRefreshJob {
  private cloudIntegrationsService = new CloudIntegrationsService();

  // Schedule token refresh before expiration
  async scheduleTokenRefresh(integrationId: string, tenantId: string, expiresAt: Date) {
    const refreshTime = new Date(expiresAt.getTime() - 5 * 60 * 1000); // 5 minutes before expiry
    
    await tokenRefreshQueue.add('refresh-tokens', {
      integrationId,
      tenantId
    }, {
      delay: refreshTime.getTime() - Date.now(),
      jobId: `refresh-${integrationId}` // Prevent duplicates
    });
    
    logInfo('Token refresh scheduled', {
      integrationId,
      tenantId,
      refreshTime: refreshTime.toISOString()
    });
  }

  // Process token refresh job
  async processTokenRefresh(job: any) {
    const { integrationId, tenantId } = job.data;
    
    try {
      logInfo('Processing background token refresh', { integrationId, tenantId });
      
      const integration = await this.cloudIntegrationsService.findById(integrationId, tenantId);
      
      if (!integration.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const provider = await this.getCloudProvider(integration.providerId);
      const tokenResponse = await this.refreshTokens(integration.refreshToken, provider);
      
      await this.cloudIntegrationsService.updateTokens(
        integrationId,
        tenantId,
        tokenResponse.accessToken,
        tokenResponse.refreshToken,
        tokenResponse.expiresIn,
        'system'
      );
      
      // Schedule next refresh
      const nextExpiry = new Date(Date.now() + tokenResponse.expiresIn * 1000);
      await this.scheduleTokenRefresh(integrationId, tenantId, nextExpiry);
      
      logInfo('Background token refresh completed', { integrationId, tenantId });
    } catch (error) {
      logError('Background token refresh failed', {
        integrationId,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Update integration status to indicate failure
      await this.cloudIntegrationsService.updateIntegrationStatus(
        integrationId,
        'expired',
        'Background token refresh failed'
      );
      
      throw error; // Re-throw for queue retry mechanism
    }
  }
}

// Job processor registration
tokenRefreshQueue.process('refresh-tokens', async (job) => {
  const tokenRefreshJob = new TokenRefreshJob();
  await tokenRefreshJob.processTokenRefresh(job);
});
```

### 2. Integration Health Monitoring

```typescript
// src/jobs/HealthCheckJob.ts
import { healthCheckQueue } from '../services/queue/QueueService.js';
import { CloudIntegrationsService } from '../features/cloud-integrations/cloudIntegrations.service.js';
import { logInfo, logError } from '../utils/logger.js';

export class HealthCheckJob {
  private cloudIntegrationsService = new CloudIntegrationsService();

  // Schedule periodic health checks for all active integrations
  async scheduleHealthChecks() {
    const activeIntegrations = await this.getActiveIntegrations();
    
    for (const integration of activeIntegrations) {
      await healthCheckQueue.add('health-check', {
        integrationId: integration._id,
        tenantId: integration.tenantId
      }, {
        repeat: { cron: '0 */4 * * *' }, // Every 4 hours
        jobId: `health-${integration._id}` // Prevent duplicates
      });
    }
    
    logInfo('Health checks scheduled', { count: activeIntegrations.length });
  }

  // Process health check job
  async processHealthCheck(job: any) {
    const { integrationId, tenantId } = job.data;
    
    try {
      logInfo('Processing background health check', { integrationId, tenantId });
      
      const healthResult = await this.cloudIntegrationsService.checkIntegrationHealth(
        integrationId,
        tenantId
      );
      
      // Handle different health statuses
      switch (healthResult.status) {
        case 'expired':
          // Trigger automatic token refresh
          await this.triggerTokenRefresh(integrationId, tenantId);
          break;
          
        case 'revoked':
          // Notify tenant owner about revoked access
          await this.notifyTenantOwner(tenantId, integrationId, 'access_revoked');
          break;
          
        case 'error':
          // Log for investigation but don't fail the job
          logError('Integration health check failed', {
            integrationId,
            tenantId,
            message: healthResult.message
          });
          break;
      }
      
      logInfo('Background health check completed', {
        integrationId,
        tenantId,
        status: healthResult.status
      });
    } catch (error) {
      logError('Background health check failed', {
        integrationId,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Don't throw - health checks should not retry indefinitely
    }
  }

  private async triggerTokenRefresh(integrationId: string, tenantId: string) {
    await tokenRefreshQueue.add('refresh-tokens', {
      integrationId,
      tenantId
    }, {
      priority: 10 // High priority for expired tokens
    });
  }

  private async notifyTenantOwner(tenantId: string, integrationId: string, event: string) {
    // Implement notification logic (email, in-app notification, etc.)
    logInfo('Tenant notification triggered', { tenantId, integrationId, event });
  }
}

// Job processor registration
healthCheckQueue.process('health-check', async (job) => {
  const healthCheckJob = new HealthCheckJob();
  await healthCheckJob.processHealthCheck(job);
});
```

### 3. Queue Management Service

```typescript
// src/services/queue/QueueManager.ts
import { tokenRefreshQueue, healthCheckQueue } from './QueueService.js';
import { logInfo, logError } from '../../utils/logger.js';

export class QueueManager {
  async startQueues() {
    try {
      // Start queue processing
      await Promise.all([
        tokenRefreshQueue.ready(),
        healthCheckQueue.ready()
      ]);
      
      logInfo('Background job queues started successfully');
      
      // Set up queue monitoring
      this.setupQueueMonitoring();
      
    } catch (error) {
      logError('Failed to start background job queues', error);
      throw error;
    }
  }

  async stopQueues() {
    try {
      await Promise.all([
        tokenRefreshQueue.close(),
        healthCheckQueue.close()
      ]);
      
      logInfo('Background job queues stopped successfully');
    } catch (error) {
      logError('Failed to stop background job queues', error);
      throw error;
    }
  }

  private setupQueueMonitoring() {
    // Monitor failed jobs
    tokenRefreshQueue.on('failed', (job, err) => {
      logError('Token refresh job failed', {
        jobId: job.id,
        data: job.data,
        error: err.message
      });
    });

    healthCheckQueue.on('failed', (job, err) => {
      logError('Health check job failed', {
        jobId: job.id,
        data: job.data,
        error: err.message
      });
    });

    // Monitor completed jobs
    tokenRefreshQueue.on('completed', (job) => {
      logInfo('Token refresh job completed', {
        jobId: job.id,
        data: job.data
      });
    });

    healthCheckQueue.on('completed', (job) => {
      logInfo('Health check job completed', {
        jobId: job.id,
        data: job.data
      });
    });
  }

  // Queue statistics and monitoring
  async getQueueStats() {
    const tokenRefreshStats = {
      waiting: await tokenRefreshQueue.getWaiting(),
      active: await tokenRefreshQueue.getActive(),
      completed: await tokenRefreshQueue.getCompleted(),
      failed: await tokenRefreshQueue.getFailed()
    };

    const healthCheckStats = {
      waiting: await healthCheckQueue.getWaiting(),
      active: await healthCheckQueue.getActive(),
      completed: await healthCheckQueue.getCompleted(),
      failed: await healthCheckQueue.getFailed()
    };

    return {
      tokenRefresh: {
        waiting: tokenRefreshStats.waiting.length,
        active: tokenRefreshStats.active.length,
        completed: tokenRefreshStats.completed.length,
        failed: tokenRefreshStats.failed.length
      },
      healthCheck: {
        waiting: healthCheckStats.waiting.length,
        active: healthCheckStats.active.length,
        completed: healthCheckStats.completed.length,
        failed: healthCheckStats.failed.length
      }
    };
  }
}
```

## 🔧 Integration with Express Server

### Server Startup Integration
```typescript
// src/server.ts
import { QueueManager } from './services/queue/QueueManager.js';
import { HealthCheckJob } from './jobs/HealthCheckJob.js';

const queueManager = new QueueManager();
const healthCheckJob = new HealthCheckJob();

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start background job queues
    await queueManager.startQueues();
    
    // Schedule initial health checks
    await healthCheckJob.scheduleHealthChecks();
    
    // Register API routes
    await registerRoutes();

    // Start Express server
    app.listen(env.PORT, () => {
      logInfo(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
    
    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      logInfo('SIGTERM received, shutting down gracefully');
      await queueManager.stopQueues();
      process.exit(0);
    });
    
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}
```

### Queue Monitoring API
```typescript
// src/features/queues/queues.routes.ts
import { Router } from 'express';
import { QueueManager } from '../../services/queue/QueueManager.js';
import { requireSuperAdminRole } from '../../middleware/authorization.js';
import { wrapAsyncHandler } from '../../utils/response.js';
import { jsonResponse } from '../../utils/response.js';

const queueManager = new QueueManager();

export function getQueuesRouter(): Router {
  const router = Router();
  
  // Require superadmin for all queue operations
  router.use(requireSuperAdminRole());
  
  // Get queue statistics
  router.get('/stats', wrapAsyncHandler(async (req, res) => {
    const stats = await queueManager.getQueueStats();
    return jsonResponse(res, 200, stats);
  }));
  
  return router;
}
```

## 📊 Monitoring and Observability

### Queue Dashboard Integration
```typescript
// Optional: Bull Board for queue monitoring
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue } = createBullBoard({
  queues: [
    new BullAdapter(tokenRefreshQueue),
    new BullAdapter(healthCheckQueue)
  ],
  serverAdapter: serverAdapter,
});

// Mount in app.ts (with proper authentication)
app.use('/admin/queues', requireSuperAdminRole(), serverAdapter.getRouter());
```

### Metrics and Alerting
```typescript
// src/monitoring/QueueMetrics.ts
export class QueueMetrics {
  async collectMetrics() {
    const stats = await queueManager.getQueueStats();
    
    // Example: Send metrics to monitoring service
    this.sendMetric('queue.token_refresh.waiting', stats.tokenRefresh.waiting);
    this.sendMetric('queue.token_refresh.failed', stats.tokenRefresh.failed);
    this.sendMetric('queue.health_check.active', stats.healthCheck.active);
    
    // Alert on high failure rates
    if (stats.tokenRefresh.failed > 10) {
      this.sendAlert('High token refresh failure rate', stats.tokenRefresh);
    }
  }

  private sendMetric(name: string, value: number) {
    // Implement metric sending to your monitoring service
    logInfo('Queue metric', { name, value });
  }

  private sendAlert(message: string, data: any) {
    // Implement alerting logic
    logError('Queue alert', { message, data });
  }
}
```

## 🚀 Migration Strategy

### Phase 1: Infrastructure Setup
1. Choose and install queue technology (Bull/Agenda)
2. Set up Redis/MongoDB for job storage
3. Create basic queue management service
4. Add queue monitoring endpoints

### Phase 2: Critical Jobs
1. Implement OAuth token refresh automation
2. Add integration health monitoring
3. Create proper error handling and retry logic
4. Set up basic monitoring and alerting

### Phase 3: Additional Jobs
1. Add file processing jobs
2. Implement cleanup and maintenance tasks
3. Add notification and email jobs
4. Create analytics aggregation jobs

### Phase 4: Optimization
1. Fine-tune job scheduling and priorities
2. Implement advanced monitoring and dashboards
3. Add queue scaling and performance optimization
4. Create comprehensive documentation and runbooks

## 📖 Related Documentation

- **[Cloud Provider Integration](cloud-providers.md)** - OAuth and integration patterns
- **[Performance Optimization](optimization-report.md)** - System performance guidelines
- **[Deployment Guide](../06-Guides/how-to-deploy.md)** - Production deployment with queues

---

*Background job processing enables reliable, scalable handling of asynchronous tasks while maintaining responsive API performance.* 