# Database Design & Schema

This document describes the MongoDB database design, schema structure, and data management patterns for the MWAP platform.

## 🗄️ Database Overview

### Database Strategy
MWAP uses MongoDB Atlas as the primary database, leveraging its document-based structure for flexible data modeling while maintaining consistency through application-level validation using Zod schemas.

### Key Design Principles
- **Multi-tenancy**: All data is scoped by tenant for complete isolation
- **Schema Flexibility**: Document structure can evolve without migrations
- **Performance**: Strategic indexing for optimal query performance
- **Consistency**: Application-level validation ensures data integrity
- **Scalability**: Designed for horizontal scaling with proper sharding keys

## 📊 Database Collections

### Core Collections Structure
```
mwap_database/
├── tenants                    # Tenant/organization data
├── users                      # User profiles and metadata
├── projects                   # Project information
├── projectMembers             # Project-user relationships
├── projectTypes               # Project type definitions
├── cloudProviders            # Cloud provider configurations
├── cloudIntegrations         # OAuth integrations per tenant
├── virtualFiles              # File metadata from cloud providers
├── auditLogs                 # Security and activity audit trails
└── systemConfig              # System-wide configuration
```

## 🏢 Tenant Collection

### Schema Definition
```typescript
interface Tenant {
  _id: ObjectId;
  name: string;                    // Unique per owner
  description?: string;
  ownerId: string;                 // Auth0 user ID
  settings: {
    allowPublicProjects: boolean;
    maxProjects: number;
    retentionDays: number;
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
  billing?: {
    customerId: string;            // Stripe customer ID
    subscriptionId: string;        // Stripe subscription ID
    currentPeriodEnd: Date;
  };
  metadata: {
    totalProjects: number;
    totalMembers: number;
    storageUsed: number;           // In bytes
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;               // Soft delete
}
```

### Indexes
```javascript
// Unique tenant name per owner
db.tenants.createIndex({ "ownerId": 1, "name": 1 }, { unique: true });

// Owner lookup
db.tenants.createIndex({ "ownerId": 1 });

// Active tenants (for queries excluding deleted)
db.tenants.createIndex({ "deletedAt": 1 });

// Subscription management
db.tenants.createIndex({ "subscription.expiresAt": 1 });
db.tenants.createIndex({ "subscription.status": 1 });
```

### Sample Document
```json
{
  "_id": ObjectId("65a1b2c3d4e5f6789012345"),
  "name": "Acme Corporation",
  "description": "Main company tenant for Acme Corp",
  "ownerId": "auth0|65a1b2c3d4e5f67890123456",
  "settings": {
    "allowPublicProjects": false,
    "maxProjects": 50,
    "retentionDays": 365,
    "features": {
      "cloudIntegrations": true,
      "advancedSecurity": true,
      "customBranding": false
    }
  },
  "subscription": {
    "plan": "pro",
    "status": "active",
    "expiresAt": ISODate("2024-12-31T23:59:59Z"),
    "features": ["unlimited_projects", "priority_support"]
  },
  "metadata": {
    "totalProjects": 12,
    "totalMembers": 25,
    "storageUsed": 1073741824,
    "lastActivity": ISODate("2024-01-15T10:30:00Z")
  },
  "createdAt": ISODate("2024-01-01T00:00:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

## 📁 Projects Collection

### Schema Definition
```typescript
interface Project {
  _id: ObjectId;
  name: string;                    // Unique per tenant
  description?: string;
  tenantId: ObjectId;              // Reference to tenant
  projectTypeId: ObjectId;         // Reference to project type
  settings: {
    visibility: 'private' | 'public' | 'internal';
    features: {
      cloudIntegrations: boolean;
      fileVersioning: boolean;
      collaborativeEditing: boolean;
    };
    integrations: {
      allowedProviders: string[];   // Cloud provider IDs
      syncFrequency: number;        // In minutes
    };
  };
  status: 'active' | 'archived' | 'suspended';
  metadata: {
    memberCount: number;
    fileCount: number;
    totalSize: number;            // In bytes
    lastActivity: Date;
  };
  createdBy: string;              // Auth0 user ID
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}
```

### Indexes
```javascript
// Unique project name per tenant
db.projects.createIndex({ "tenantId": 1, "name": 1 }, { unique: true });

// Tenant projects lookup
db.projects.createIndex({ "tenantId": 1, "status": 1 });

// User projects (via project members)
db.projects.createIndex({ "createdBy": 1 });

// Project type lookup
db.projects.createIndex({ "projectTypeId": 1 });

// Activity tracking
db.projects.createIndex({ "metadata.lastActivity": -1 });
```

## 👥 Project Members Collection

### Schema Definition
```typescript
interface ProjectMember {
  _id: ObjectId;
  projectId: ObjectId;             // Reference to project
  userId: string;                  // Auth0 user ID
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canManageMembers: boolean;
    canManageSettings: boolean;
  };
  invitedBy: string;              // Auth0 user ID
  invitedAt: Date;
  joinedAt?: Date;
  status: 'pending' | 'active' | 'suspended';
  metadata: {
    lastAccess: Date;
    actionsCount: number;
  };
}
```

### Indexes
```javascript
// Unique user per project
db.projectMembers.createIndex({ "projectId": 1, "userId": 1 }, { unique: true });

// User projects lookup
db.projectMembers.createIndex({ "userId": 1, "status": 1 });

// Project members lookup
db.projectMembers.createIndex({ "projectId": 1, "status": 1 });

// Role-based queries
db.projectMembers.createIndex({ "projectId": 1, "role": 1 });
```

## ☁️ Cloud Integrations Collection

### Schema Definition
```typescript
interface CloudIntegration {
  _id: ObjectId;
  tenantId: ObjectId;              // Reference to tenant
  providerId: ObjectId;            // Reference to cloud provider
  name: string;                    // User-friendly name
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  oauth: {
    accessToken: string;           // Encrypted
    refreshToken?: string;         // Encrypted
    expiresAt: Date;
    scope: string[];
    tokenType: string;
  };
  metadata: {
    userEmail: string;             // Connected account email
    accountName: string;           // Provider account name
    quotaUsed?: number;            // Provider quota usage
    quotaTotal?: number;           // Provider quota total
    lastSync: Date;
    errorCount: number;
  };
  settings: {
    autoSync: boolean;
    syncFrequency: number;         // In minutes
    syncPath?: string;             // Root folder to sync
    excludePatterns: string[];     // File patterns to exclude
  };
  connectedBy: string;             // Auth0 user ID
  connectedAt: Date;
  lastVerified: Date;
  updatedAt: Date;
}
```

### Indexes
```javascript
// Unique provider per tenant
db.cloudIntegrations.createIndex({ "tenantId": 1, "providerId": 1 }, { unique: true });

// Tenant integrations lookup
db.cloudIntegrations.createIndex({ "tenantId": 1, "status": 1 });

// Token expiry monitoring
db.cloudIntegrations.createIndex({ "oauth.expiresAt": 1 });

// Sync scheduling
db.cloudIntegrations.createIndex({ "settings.autoSync": 1, "lastSync": 1 });
```

## 📄 Virtual Files Collection

### Schema Definition
```typescript
interface VirtualFile {
  _id: ObjectId;
  projectId: ObjectId;             // Reference to project
  integrationId: ObjectId;         // Reference to cloud integration
  cloudFileId: string;             // Provider's file ID
  path: string;                    // Virtual path in project
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size: number;                    // In bytes
  checksum?: string;               // For change detection
  metadata: {
    parentId?: ObjectId;           // Parent folder (if any)
    isRoot: boolean;
    depth: number;                 // Folder depth
    childCount?: number;           // For folders
    tags: string[];
    description?: string;
  };
  cloudMetadata: {
    createdAt: Date;               // Provider creation date
    modifiedAt: Date;              // Provider modification date
    version?: string;              // Provider version
    permissions: {
      canDownload: boolean;
      canEdit: boolean;
      canShare: boolean;
    };
  };
  syncMetadata: {
    lastSyncAt: Date;
    syncStatus: 'synced' | 'pending' | 'error';
    errorMessage?: string;
    changeDetected: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes
```javascript
// Project files lookup
db.virtualFiles.createIndex({ "projectId": 1, "type": 1 });

// Path-based queries
db.virtualFiles.createIndex({ "projectId": 1, "path": 1 });

// Parent-child relationships
db.virtualFiles.createIndex({ "metadata.parentId": 1 });

// Integration files
db.virtualFiles.createIndex({ "integrationId": 1 });

// Sync status monitoring
db.virtualFiles.createIndex({ "syncMetadata.syncStatus": 1 });

// Change detection
db.virtualFiles.createIndex({ "syncMetadata.changeDetected": 1 });

// Performance: compound index for common queries
db.virtualFiles.createIndex({ 
  "projectId": 1, 
  "metadata.parentId": 1, 
  "syncMetadata.syncStatus": 1 
});
```

## 🔐 Audit Logs Collection

### Schema Definition
```typescript
interface AuditLog {
  _id: ObjectId;
  tenantId: ObjectId;              // Reference to tenant
  userId: string;                  // Auth0 user ID
  action: string;                  // Action performed
  resource: {
    type: 'tenant' | 'project' | 'file' | 'integration' | 'user';
    id: string;                    // Resource ID
    name?: string;                 // Resource name for context
  };
  details: {
    method: string;                // HTTP method
    endpoint: string;              // API endpoint
    userAgent?: string;
    ipAddress: string;
    changes?: {                    // For update operations
      before: Record<string, any>;
      after: Record<string, any>;
    };
    metadata?: Record<string, any>;
  };
  result: 'success' | 'failure';
  errorMessage?: string;
  timestamp: Date;
  expiresAt: Date;                 // TTL index for automatic cleanup
}
```

### Indexes
```javascript
// Tenant audit logs
db.auditLogs.createIndex({ "tenantId": 1, "timestamp": -1 });

// User activity tracking
db.auditLogs.createIndex({ "userId": 1, "timestamp": -1 });

// Resource audit trail
db.auditLogs.createIndex({ "resource.type": 1, "resource.id": 1, "timestamp": -1 });

// Action-based queries
db.auditLogs.createIndex({ "action": 1, "timestamp": -1 });

// Security monitoring
db.auditLogs.createIndex({ "result": 1, "timestamp": -1 });

// TTL index for automatic cleanup (90 days)
db.auditLogs.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
```

## 🎯 Project Types Collection

### Schema Definition
```typescript
interface ProjectType {
  _id: ObjectId;
  name: string;
  description: string;
  category: 'development' | 'design' | 'marketing' | 'data' | 'general';
  template: {
    defaultSettings: {
      visibility: 'private' | 'public' | 'internal';
      features: Record<string, boolean>;
    };
    defaultStructure: {
      folders: string[];
      files: Array<{
        name: string;
        content?: string;
        template?: string;
      }>;
    };
    integrationRecommendations: ObjectId[]; // Recommended cloud providers
  };
  metadata: {
    usageCount: number;
    tags: string[];
    isSystem: boolean;              // System vs custom types
    iconUrl?: string;
  };
  createdBy?: string;              // Auth0 user ID (null for system types)
  tenantId?: ObjectId;             // Null for system types
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes
```javascript
// System project types
db.projectTypes.createIndex({ "metadata.isSystem": 1 });

// Category-based lookup
db.projectTypes.createIndex({ "category": 1, "metadata.isSystem": 1 });

// Tenant custom types
db.projectTypes.createIndex({ "tenantId": 1 });

// Usage statistics
db.projectTypes.createIndex({ "metadata.usageCount": -1 });
```

## 🔌 Cloud Providers Collection

### Schema Definition
```typescript
interface CloudProvider {
  _id: ObjectId;
  name: string;                    // e.g., "Google Drive", "Dropbox"
  identifier: string;              // e.g., "google_drive", "dropbox"
  status: 'active' | 'deprecated' | 'maintenance';
  oauth: {
    authUrl: string;
    tokenUrl: string;
    scope: string[];
    clientId: string;              // Environment-specific
    redirectUri: string;
  };
  api: {
    baseUrl: string;
    version: string;
    rateLimit: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    features: {
      fileDownload: boolean;
      fileUpload: boolean;
      folderCreate: boolean;
      fileShare: boolean;
      fileVersion: boolean;
    };
  };
  metadata: {
    description: string;
    iconUrl: string;
    websiteUrl: string;
    documentationUrl: string;
    supportedFormats: string[];
    maxFileSize: number;           // In bytes
  };
  configuration: {
    webhookSupport: boolean;
    deltaSync: boolean;
    batchOperations: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes
```javascript
// Provider lookup by identifier
db.cloudProviders.createIndex({ "identifier": 1 }, { unique: true });

// Active providers
db.cloudProviders.createIndex({ "status": 1 });
```

## 📈 Data Management Patterns

### Multi-tenancy Implementation
```typescript
// Tenant isolation in queries
const getUserTenants = async (userId: string): Promise<Tenant[]> => {
  return await db.collection('tenants').find({ 
    ownerId: userId,
    deletedAt: { $exists: false }  // Exclude soft-deleted
  }).toArray();
};

// Tenant-scoped project queries
const getTenantProjects = async (tenantId: string): Promise<Project[]> => {
  return await db.collection('projects').find({
    tenantId: new ObjectId(tenantId),
    status: 'active'
  }).sort({ 'metadata.lastActivity': -1 }).toArray();
};
```

### Data Consistency Patterns
```typescript
// Transaction for multi-collection operations
const createProjectWithMember = async (projectData: any, ownerId: string) => {
  const session = client.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Create project
      const projectResult = await db.collection('projects').insertOne(
        projectData, 
        { session }
      );
      
      // Add owner as project member
      await db.collection('projectMembers').insertOne({
        projectId: projectResult.insertedId,
        userId: ownerId,
        role: 'owner',
        status: 'active',
        invitedBy: ownerId,
        invitedAt: new Date(),
        joinedAt: new Date()
      }, { session });
    });
  } finally {
    await session.endSession();
  }
};
```

### Soft Delete Pattern
```typescript
// Soft delete implementation
const softDeleteTenant = async (tenantId: string, userId: string) => {
  const result = await db.collection('tenants').updateOne(
    { 
      _id: new ObjectId(tenantId),
      ownerId: userId,
      deletedAt: { $exists: false }
    },
    { 
      $set: { 
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );
  
  if (result.matchedCount === 0) {
    throw new NotFoundError('Tenant not found or already deleted');
  }
};

// Query excluding soft-deleted documents
const getActiveTenants = async (userId: string) => {
  return await db.collection('tenants').find({
    ownerId: userId,
    deletedAt: { $exists: false }
  }).toArray();
};
```

## 🚀 Performance Optimization

### Query Optimization
```typescript
// Use projection to limit returned fields
const getTenantSummary = async (userId: string) => {
  return await db.collection('tenants').find(
    { ownerId: userId, deletedAt: { $exists: false } },
    { 
      projection: { 
        name: 1, 
        description: 1, 
        'metadata.totalProjects': 1,
        'metadata.totalMembers': 1,
        createdAt: 1 
      }
    }
  ).toArray();
};

// Use aggregation for complex queries
const getProjectStats = async (tenantId: string) => {
  return await db.collection('projects').aggregate([
    { $match: { tenantId: new ObjectId(tenantId), status: 'active' } },
    {
      $group: {
        _id: '$projectTypeId',
        count: { $sum: 1 },
        totalSize: { $sum: '$metadata.totalSize' },
        avgMemberCount: { $avg: '$metadata.memberCount' }
      }
    },
    {
      $lookup: {
        from: 'projectTypes',
        localField: '_id',
        foreignField: '_id',
        as: 'projectType'
      }
    }
  ]).toArray();
};
```

### Index Usage Monitoring
```typescript
// Monitor slow queries
const enableProfiling = async () => {
  await db.runCommand({ profile: 2, slowms: 100 });
};

// Get query performance stats
const getQueryStats = async () => {
  const stats = await db.collection('system.profile').find({
    ts: { $gte: new Date(Date.now() - 3600000) } // Last hour
  }).sort({ ts: -1 }).limit(100).toArray();
  
  return stats;
};
```

## 🔄 Data Migration Strategies

### Schema Evolution
```typescript
// Gradual schema migration
const migrateTenantSettings = async () => {
  const tenants = db.collection('tenants');
  
  // Find tenants without new settings structure
  const cursor = tenants.find({
    'settings.features': { $exists: false }
  });
  
  for await (const tenant of cursor) {
    await tenants.updateOne(
      { _id: tenant._id },
      {
        $set: {
          'settings.features': {
            cloudIntegrations: true,
            advancedSecurity: false,
            customBranding: false
          },
          updatedAt: new Date()
        }
      }
    );
  }
};
```

### Data Validation
```typescript
// Validate data integrity
const validateProjectMembers = async () => {
  const pipeline = [
    {
      $lookup: {
        from: 'projects',
        localField: 'projectId',
        foreignField: '_id',
        as: 'project'
      }
    },
    {
      $match: {
        'project': { $size: 0 } // Orphaned project members
      }
    }
  ];
  
  const orphanedMembers = await db.collection('projectMembers')
    .aggregate(pipeline)
    .toArray();
    
  console.log(`Found ${orphanedMembers.length} orphaned project members`);
};
```

## 🔧 Database Maintenance

### Automated Cleanup
```typescript
// Clean up expired sessions and temporary data
const cleanupExpiredData = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Remove old audit logs (handled by TTL index)
  // Remove expired OAuth tokens
  await db.collection('cloudIntegrations').updateMany(
    { 'oauth.expiresAt': { $lt: new Date() } },
    { $set: { status: 'expired', updatedAt: new Date() } }
  );
  
  // Remove soft-deleted tenants after 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await db.collection('tenants').deleteMany({
    deletedAt: { $exists: true, $lt: ninetyDaysAgo }
  });
};
```

### Backup Strategy
```bash
# Daily backup script
mongodump --uri="mongodb+srv://cluster.mongodb.net/mwap" \
  --archive=backup-$(date +%Y%m%d).gz \
  --gzip

# Restore from backup
mongorestore --uri="mongodb+srv://cluster.mongodb.net/mwap" \
  --archive=backup-20240115.gz \
  --gzip
```

---

*This database design ensures scalable, performant, and maintainable data management for the multi-tenant MWAP platform.* 