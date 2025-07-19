# MWAP Infrastructure Guide

This comprehensive guide covers the database design, cloud provider integrations, background job processing, and infrastructure patterns for the MWAP platform.

## 🎯 Infrastructure Overview

### Architecture Strategy
MWAP employs a modern, cloud-native infrastructure built on MongoDB Atlas for data persistence, OAuth-based cloud provider integrations for file access, and scalable patterns for background processing. The infrastructure emphasizes security, performance, and multi-tenant isolation.

### Core Infrastructure Components
- **Database**: MongoDB Atlas with flexible schema design
- **Cloud Integrations**: OAuth-based connections to Google Drive, Dropbox, OneDrive
- **Background Processing**: Asynchronous job handling for long-running operations
- **Security**: Encrypted credential storage and secure token management
- **Monitoring**: Comprehensive logging and performance tracking

### Technology Stack
```
┌─────────────────────────────────────────────────────┐
│                 Application Layer                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  Node.js    │ │  Express    │ │ TypeScript  │   │
│  │  Runtime    │ │ Framework   │ │   Types     │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                 Infrastructure Layer               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  MongoDB    │ │    OAuth    │ │   Queue     │   │
│  │   Atlas     │ │ Providers   │ │  System     │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                  External Services                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │    Auth0    │ │   Google    │ │   Dropbox   │   │
│  │   IdP       │ │   Drive     │ │   OneDrive  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 🗄️ Database Architecture

### Database Strategy
MWAP uses MongoDB Atlas as the primary database, leveraging its document-based structure for flexible data modeling while maintaining consistency through application-level validation using Zod schemas.

### Design Principles
- **Multi-tenancy**: All data is scoped by tenant for complete isolation
- **Schema Flexibility**: Document structure can evolve without migrations
- **Performance**: Strategic indexing for optimal query performance
- **Consistency**: Application-level validation ensures data integrity
- **Scalability**: Designed for horizontal scaling with proper sharding keys

### Database Collections Structure
```
mwap_database/
├── tenants                    # Tenant/organization data
├── projects                   # Project information
├── projectTypes               # Project type definitions (admin-managed)
├── cloudProviders            # Cloud provider configurations (admin-managed)
├── cloudIntegrations         # OAuth integrations per tenant
├── virtualFiles              # File metadata from cloud providers
├── superadmins               # Platform administrators
├── auditLogs                 # Security and activity audit trails
└── jobs                      # Background job processing (if using Agenda)
```

## 📊 Core Schema Definitions

### Tenants Collection
```typescript
interface Tenant {
  _id: ObjectId;
  name: string;                    // Unique per owner
  description?: string;
  ownerId: string;                 // Auth0 user ID (one-to-one relationship)
  settings: {
    allowPublicProjects: boolean;
    maxProjects: number;           // Default: 10, range: 1-100
    retentionDays: number;         // Data retention period
    features: {
      cloudIntegrations: boolean;
      advancedSecurity: boolean;
      customBranding: boolean;
    };
  };
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt: Date;
    features: string[];
  };
  metadata: {
    totalProjects: number;
    totalMembers: number;
    storageUsed: number;           // In bytes
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
}

// Indexes
db.tenants.createIndex({ "ownerId": 1 }, { unique: true });
db.tenants.createIndex({ "ownerId": 1, "name": 1 }, { unique: true });
db.tenants.createIndex({ "archived": 1 });
db.tenants.createIndex({ "subscription.expiresAt": 1 });
```

### Projects Collection
```typescript
interface Project {
  _id: ObjectId;
  name: string;                    // Unique per tenant
  description?: string;
  tenantId: ObjectId;              // Reference to tenant
  projectTypeId: ObjectId;         // Reference to project type
  config: Record<string, any>;     // Project-specific configuration
  members: Array<{
    userId: string;                // Auth0 user ID
    role: 'OWNER' | 'DEPUTY' | 'MEMBER';
    addedAt: Date;
    addedBy: string;               // User ID who added this member
  }>;
  folderPath?: string;             // Virtual folder path
  integrations: Array<{
    integrationId: ObjectId;       // Reference to cloud integration
    enabled: boolean;
    config?: Record<string, any>;
  }>;
  metadata: {
    fileCount: number;
    totalSize: number;
    lastSync: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
}

// Indexes
db.projects.createIndex({ "tenantId": 1 });
db.projects.createIndex({ "tenantId": 1, "name": 1 }, { unique: true });
db.projects.createIndex({ "members.userId": 1 });
db.projects.createIndex({ "projectTypeId": 1 });
db.projects.createIndex({ "archived": 1 });
```

### Cloud Providers Collection
```typescript
interface CloudProvider {
  _id: ObjectId;
  name: string;                    // Display name (e.g., "Google Drive")
  slug: string;                    // URL-safe identifier (e.g., "google-drive")
  scopes: string[];                // OAuth scopes required
  authUrl: string;                 // OAuth authorization URL
  tokenUrl: string;                // Token exchange URL
  clientId: string;                // OAuth client ID
  clientSecret: string;            // OAuth client secret (encrypted)
  grantType: string;               // OAuth grant type (default: "authorization_code")
  tokenMethod: string;             // HTTP method for token requests (default: "POST")
  metadata?: Record<string, any>;  // Provider-specific configuration
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;               // Auth0 user ID of admin
}

// Indexes
db.cloudProviders.createIndex({ "slug": 1 }, { unique: true });
db.cloudProviders.createIndex({ "name": 1 }, { unique: true });
```

### Cloud Integrations Collection
```typescript
interface CloudIntegration {
  _id: ObjectId;
  tenantId: ObjectId;              // Reference to tenant
  providerId: ObjectId;            // Reference to cloud provider
  status: 'active' | 'inactive' | 'error' | 'pending';
  authData: {
    accessToken: string;           // Encrypted OAuth access token
    refreshToken?: string;         // Encrypted OAuth refresh token
    expiresAt?: Date;             // Token expiration
    scope: string[];              // Granted scopes
  };
  userInfo?: {
    email: string;                // Provider account email
    name: string;                 // Provider account name
    providerId: string;           // Provider-specific user ID
  };
  health: {
    lastCheck: Date;
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorCount: number;
    lastError?: string;
  };
  usage: {
    totalRequests: number;
    lastRequest: Date;
    quotaUsed?: number;
    quotaLimit?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;               // Auth0 user ID
}

// Indexes
db.cloudIntegrations.createIndex({ "tenantId": 1 });
db.cloudIntegrations.createIndex({ "tenantId": 1, "providerId": 1 }, { unique: true });
db.cloudIntegrations.createIndex({ "status": 1 });
db.cloudIntegrations.createIndex({ "authData.expiresAt": 1 });
db.cloudIntegrations.createIndex({ "health.lastCheck": 1 });
```

### Virtual Files Collection
```typescript
interface VirtualFile {
  _id: ObjectId;
  projectId: ObjectId;             // Reference to project
  integrationId: ObjectId;         // Reference to cloud integration
  providerId: ObjectId;            // Reference to cloud provider
  providerFileId: string;          // Provider-specific file ID
  name: string;                    // File name
  path: string;                    // Virtual file path
  type: string;                    // MIME type
  size?: number;                   // File size in bytes
  modifiedTime?: Date;             // Last modified timestamp from provider
  metadata: {
    downloadUrl?: string;          // Temporary download URL
    thumbnailUrl?: string;         // Thumbnail URL
    permissions: string[];         // File permissions
    checksum?: string;             // File checksum for integrity
  };
  syncStatus: {
    lastSync: Date;
    status: 'synced' | 'pending' | 'error';
    error?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.virtualFiles.createIndex({ "projectId": 1 });
db.virtualFiles.createIndex({ "integrationId": 1 });
db.virtualFiles.createIndex({ "providerFileId": 1, "integrationId": 1 }, { unique: true });
db.virtualFiles.createIndex({ "syncStatus.lastSync": 1 });
db.virtualFiles.createIndex({ "path": 1 });
```

## ☁️ Cloud Provider Integration Architecture

### Integration Flow
```
User Request → Frontend → Backend → Cloud Provider OAuth → Token Storage → API Access
```

### Cloud Provider Service Pattern
```typescript
// services/CloudProviderService.ts
export class CloudProviderService {
  private collection = getDatabase().collection<CloudProvider>('cloudProviders');

  async create(data: CreateCloudProviderRequest, userId: string): Promise<CloudProvider> {
    // Encrypt sensitive data before storage
    const encryptedData = {
      ...data,
      clientSecret: encrypt(data.clientSecret),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(encryptedData);
    
    logAudit('cloud_provider_created', userId, result.insertedId.toString());
    
    return { ...encryptedData, _id: result.insertedId };
  }

  async findAll(includeSecrets = false): Promise<CloudProvider[]> {
    const providers = await this.collection.find({}).toArray();
    
    if (!includeSecrets) {
      // Redact sensitive information for client responses
      return providers.map(provider => ({
        ...provider,
        clientSecret: '[REDACTED]'
      }));
    }
    
    // Decrypt secrets for internal use
    return providers.map(provider => ({
      ...provider,
      clientSecret: decrypt(provider.clientSecret)
    }));
  }
}
```

### OAuth Integration Service
```typescript
// services/CloudIntegrationsService.ts
export class CloudIntegrationsService {
  private collection = getDatabase().collection<CloudIntegration>('cloudIntegrations');

  async createIntegration(
    tenantId: string,
    providerId: string,
    authData: OAuthTokens,
    userId: string
  ): Promise<CloudIntegration> {
    // Encrypt OAuth tokens before storage
    const encryptedAuthData = {
      accessToken: encrypt(authData.accessToken),
      refreshToken: authData.refreshToken ? encrypt(authData.refreshToken) : undefined,
      expiresAt: authData.expiresAt,
      scope: authData.scope
    };

    const integration: CloudIntegration = {
      _id: new ObjectId(),
      tenantId: new ObjectId(tenantId),
      providerId: new ObjectId(providerId),
      status: 'active',
      authData: encryptedAuthData,
      health: {
        lastCheck: new Date(),
        status: 'healthy',
        errorCount: 0
      },
      usage: {
        totalRequests: 0,
        lastRequest: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    await this.collection.insertOne(integration);
    
    // Schedule initial health check
    await this.scheduleHealthCheck(integration._id.toString());
    
    return integration;
  }

  async refreshTokens(integrationId: string): Promise<CloudIntegration> {
    const integration = await this.findById(integrationId);
    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    const provider = await cloudProviderService.findById(integration.providerId.toString());
    if (!provider) {
      throw new NotFoundError('Cloud provider not found');
    }

    try {
      // Decrypt current refresh token
      const refreshToken = decrypt(integration.authData.refreshToken!);
      
      // Request new tokens from provider
      const newTokens = await this.exchangeRefreshToken(refreshToken, provider);
      
      // Update integration with new encrypted tokens
      const updatedIntegration = await this.updateTokens(integrationId, newTokens);
      
      logInfo('OAuth tokens refreshed', { integrationId, providerId: provider._id });
      
      return updatedIntegration;
    } catch (error) {
      await this.markIntegrationError(integrationId, 'Token refresh failed');
      throw error;
    }
  }
}
```

### Provider-Specific Implementations
```typescript
// services/providers/GoogleDriveProvider.ts
export class GoogleDriveProvider implements CloudProviderInterface {
  async getFiles(accessToken: string, folderId?: string): Promise<VirtualFile[]> {
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: folderId ? `'${folderId}' in parents` : undefined,
        fields: 'files(id,name,mimeType,size,modifiedTime,parents)',
        pageSize: 100
      }
    });

    if (!response.ok) {
      throw new CloudProviderError('Failed to fetch files from Google Drive');
    }

    const data = await response.json();
    return data.files.map(this.mapToVirtualFile);
  }

  async refreshToken(refreshToken: string, clientId: string, clientSecret: string): Promise<OAuthTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!response.ok) {
      throw new CloudProviderError('Failed to refresh Google Drive token');
    }

    const tokens = await response.json();
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken, // Reuse if not provided
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope?.split(' ') || []
    };
  }
}
```

## 🔄 Background Job Processing

### Current State & Architecture
The MWAP backend currently operates without a dedicated background job processing system, handling most operations synchronously within HTTP request contexts. However, certain operations would benefit from asynchronous processing.

### Operations Suitable for Background Processing
```typescript
// Current synchronous operations that could be background jobs:
1. OAuth token refresh automation      // Currently manual/on-demand
2. Integration health monitoring       // Currently manual checks
3. File indexing and metadata sync    // Currently on-demand
4. Audit log cleanup and archiving    // Currently manual
5. Database optimization tasks         // Currently manual
6. Usage analytics aggregation        // Currently real-time
7. Email notifications and alerts     // Currently none
```

### Recommended Background Job Implementation

#### Option 1: Agenda (MongoDB-based)
```typescript
// services/jobs/AgendaService.ts
import Agenda from 'agenda';
import { getDatabase } from '../../config/db.js';

export const agenda = new Agenda({
  mongo: getDatabase(),
  db: { collection: 'jobs' },
  processEvery: '30 seconds',
  maxConcurrency: 10,
  defaultConcurrency: 2
});

// Define job processors
agenda.define('refresh-oauth-tokens', async (job) => {
  const { integrationId, tenantId } = job.attrs.data;
  
  try {
    await cloudIntegrationsService.refreshTokens(integrationId);
    logInfo('OAuth tokens refreshed via background job', { integrationId, tenantId });
  } catch (error) {
    logError('Failed to refresh OAuth tokens', { integrationId, tenantId, error });
    throw error;
  }
});

agenda.define('health-check-integrations', async (job) => {
  const { tenantId } = job.attrs.data;
  
  try {
    const integrations = await cloudIntegrationsService.findByTenant(tenantId);
    
    for (const integration of integrations) {
      await cloudIntegrationsService.checkHealth(integration._id.toString());
    }
    
    logInfo('Health checks completed', { tenantId, count: integrations.length });
  } catch (error) {
    logError('Health check failed', { tenantId, error });
    throw error;
  }
});

agenda.define('sync-virtual-files', async (job) => {
  const { projectId, integrationId } = job.attrs.data;
  
  try {
    await virtualFilesService.syncProject(projectId, integrationId);
    logInfo('Virtual files synced', { projectId, integrationId });
  } catch (error) {
    logError('Virtual file sync failed', { projectId, integrationId, error });
    throw error;
  }
});

// Start the agenda processing
export async function startJobProcessor() {
  await agenda.start();
  
  // Schedule recurring jobs
  await agenda.every('15 minutes', 'health-check-integrations');
  await agenda.every('1 hour', 'refresh-expiring-tokens');
  await agenda.every('24 hours', 'cleanup-audit-logs');
  
  logInfo('Background job processor started');
}
```

#### Job Scheduling Service
```typescript
// services/jobs/JobScheduler.ts
export class JobScheduler {
  static async scheduleTokenRefresh(integrationId: string, tenantId: string, delayMinutes = 60) {
    await agenda.schedule(`in ${delayMinutes} minutes`, 'refresh-oauth-tokens', {
      integrationId,
      tenantId
    });
  }

  static async scheduleFileSync(projectId: string, integrationId: string) {
    await agenda.now('sync-virtual-files', {
      projectId,
      integrationId
    });
  }

  static async scheduleHealthCheck(tenantId: string) {
    await agenda.schedule('in 5 minutes', 'health-check-integrations', {
      tenantId
    });
  }

  static async cancelJobsForIntegration(integrationId: string) {
    await agenda.cancel({
      'data.integrationId': integrationId
    });
  }
}
```

### Database Schema for Jobs (if using Agenda)
```typescript
interface Job {
  _id: ObjectId;
  name: string;                    // Job type name
  data: Record<string, any>;       // Job payload
  priority: number;                // Job priority
  repeatInterval?: string;         // Cron schedule for recurring jobs
  nextRunAt?: Date;               // Next execution time
  lastRunAt?: Date;               // Last execution time
  lastFinishedAt?: Date;          // Last completion time
  failCount: number;              // Number of failures
  failReason?: string;            // Last failure reason
  lockedAt?: Date;                // Lock timestamp for processing
  disabled: boolean;              // Whether job is disabled
}

// Indexes for jobs collection
db.jobs.createIndex({ "nextRunAt": 1, "disabled": 1 });
db.jobs.createIndex({ "name": 1 });
db.jobs.createIndex({ "lockedAt": 1 });
```

## 📈 Performance & Monitoring

### Database Performance Optimization
```typescript
// Database connection configuration
const mongoOptions = {
  maxPoolSize: 10,           // Maximum connections in pool
  minPoolSize: 2,            // Minimum connections in pool
  maxIdleTimeMS: 30000,      // Close connections after 30s idle
  serverSelectionTimeoutMS: 5000,  // Timeout for server selection
  socketTimeoutMS: 45000,    // Socket timeout
  bufferMaxEntries: 0,       // Disable mongoose buffering
  bufferCommands: false,     // Disable mongoose buffering
  readPreference: 'primary', // Read from primary
  writeConcern: {
    w: 'majority',           // Write concern
    wtimeout: 5000           // Write timeout
  }
};
```

### Monitoring and Observability
```typescript
// services/monitoring/DatabaseMonitor.ts
export class DatabaseMonitor {
  static async getConnectionStats() {
    const admin = getDatabase().admin();
    const stats = await admin.serverStatus();
    
    return {
      connections: {
        current: stats.connections.current,
        available: stats.connections.available,
        totalCreated: stats.connections.totalCreated
      },
      memory: {
        resident: stats.mem.resident,
        virtual: stats.mem.virtual,
        mapped: stats.mem.mapped
      },
      operations: {
        insert: stats.opcounters.insert,
        query: stats.opcounters.query,
        update: stats.opcounters.update,
        delete: stats.opcounters.delete
      }
    };
  }

  static async getCollectionStats(collectionName: string) {
    const stats = await getDatabase().collection(collectionName).stats();
    
    return {
      count: stats.count,
      size: stats.size,
      avgObjSize: stats.avgObjSize,
      storageSize: stats.storageSize,
      totalIndexSize: stats.totalIndexSize,
      indexSizes: stats.indexSizes
    };
  }
}
```

### Health Check Implementation
```typescript
// utils/healthCheck.ts
export async function checkDatabaseHealth(): Promise<HealthStatus> {
  try {
    // Test database connection
    await getDatabase().admin().ping();
    
    // Check critical collections
    const tenantCount = await getDatabase().collection('tenants').estimatedDocumentCount();
    const projectCount = await getDatabase().collection('projects').estimatedDocumentCount();
    
    return {
      status: 'healthy',
      details: {
        database: 'connected',
        tenants: tenantCount,
        projects: projectCount,
        timestamp: new Date()
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        database: 'disconnected',
        error: error.message,
        timestamp: new Date()
      }
    };
  }
}

export async function checkCloudIntegrationsHealth(): Promise<HealthStatus> {
  try {
    const integrations = await getDatabase()
      .collection('cloudIntegrations')
      .find({ status: 'active' })
      .toArray();
    
    const healthyCount = integrations.filter(i => i.health.status === 'healthy').length;
    const unhealthyCount = integrations.length - healthyCount;
    
    return {
      status: unhealthyCount === 0 ? 'healthy' : 'degraded',
      details: {
        total: integrations.length,
        healthy: healthyCount,
        unhealthy: unhealthyCount,
        timestamp: new Date()
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error.message,
        timestamp: new Date()
      }
    };
  }
}
```

## 🔒 Security & Encryption

### Credential Encryption Service
```typescript
// services/EncryptionService.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-character key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('MWAP-AUTH-DATA', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from('MWAP-AUTH-DATA', 'utf8'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

## 🚀 Scalability Considerations

### Horizontal Scaling Patterns
```typescript
// Database sharding key considerations
// Recommended sharding keys:
- tenantId: For tenant-based sharding
- projectId: For project-based sharding  
- userId: For user-based sharding

// Collection design for sharding
interface ShardedDocument {
  _id: ObjectId;
  shardKey: string;    // Consistent field for sharding
  tenantId: ObjectId;  // For tenant-based queries
  // ... other fields
}
```

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
export class CacheService {
  static async getCachedUserRoles(userId: string): Promise<UserRoles | null> {
    const cached = await redis.get(`user:roles:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  static async setCachedUserRoles(userId: string, roles: UserRoles, ttl = 300): Promise<void> {
    await redis.setex(`user:roles:${userId}`, ttl, JSON.stringify(roles));
  }

  static async invalidateUserCache(userId: string): Promise<void> {
    await redis.del(`user:roles:${userId}`);
  }
}
```

---
*This infrastructure guide provides comprehensive coverage of database design, cloud integrations, background processing, and scalability patterns for the MWAP platform.* 