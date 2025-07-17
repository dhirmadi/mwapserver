# Database Documentation

This document describes the MongoDB database architecture and implementation used in MWAP, based on the actual implementation in `src/config/db.ts` and schema definitions.

## Overview

MWAP uses **MongoDB Atlas** as its primary database with the following characteristics:
- **Cloud-native**: Fully managed MongoDB Atlas cluster
- **Native MongoDB driver**: Direct MongoDB client (not Mongoose)
- **Schema validation**: Zod schemas for runtime validation
- **Connection management**: Singleton connection pattern

## Database Configuration

### Connection Setup

**File**: `src/config/db.ts`

```typescript
import { MongoClient, Db } from 'mongodb';
import { env } from './env.js';

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<void> {
  try {
    client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
```

### Connection Management

- **Singleton pattern**: Single database connection shared across the application
- **Graceful shutdown**: Connection closed on SIGINT signal
- **Error handling**: Application exits on connection failure
- **Environment-based**: Connection string from `MONGODB_URI` environment variable

## Schema Definitions

Schemas are defined using Zod for runtime validation in `src/schemas/`:

### Core Entities

1. **[Tenant Schema](../schemas/tenant.schema.ts)**
   - Organization-level entity
   - Contains tenant metadata and settings
   - One-to-many relationship with projects

2. **[User Schema](../schemas/user.schema.ts)**
   - User profile and role information
   - Links to Auth0 user ID
   - Role assignments per tenant/project

3. **[Project Schema](../schemas/project.schema.ts)**
   - Project metadata and configuration
   - Links to tenant and project type
   - Member management and permissions

4. **[Project Type Schema](../schemas/projectType.schema.ts)**
   - Template definitions for project types
   - Configuration and validation rules
   - Used for project creation

5. **[Cloud Provider Schema](../schemas/cloudProvider.schema.ts)**
   - External service provider definitions
   - OAuth configuration and endpoints
   - Integration capabilities

6. **[Cloud Integration Schema](../schemas/cloudProviderIntegration.schema.ts)**
   - Tenant-specific cloud connections
   - OAuth tokens and configuration
   - Integration status and metadata

7. **[File Schema](../schemas/file.schema.ts)**
   - Virtual file system entries
   - Cloud storage references
   - Access permissions and metadata

## Collections Structure

### Collection Naming Convention
- **Plural nouns**: `tenants`, `users`, `projects`
- **Lowercase**: All collection names in lowercase
- **Descriptive**: Clear indication of entity type

### Current Collections

```
mwap-database/
├── tenants                    # Tenant organizations
├── users                      # User profiles and roles
├── projects                   # Project instances
├── projectTypes              # Project type templates
├── cloudProviders            # External service providers
├── cloudIntegrations         # Tenant cloud connections
└── files                     # Virtual file system
```

## Data Relationships

### Entity Relationship Diagram

```
┌─────────────┐    1:1     ┌─────────────┐
│    User     │ ◄────────► │   Tenant    │
│ (Auth0 ID)  │            │             │
└─────────────┘            └─────────────┘
                                  │ 1:many
                                  ▼
                           ┌─────────────┐
                           │   Project   │
                           │             │
                           └─────────────┘
                                  │ many:1
                                  ▼
                           ┌─────────────┐
                           │ProjectType  │
                           │             │
                           └─────────────┘

┌─────────────┐    1:many  ┌─────────────┐
│   Tenant    │ ◄────────► │CloudIntegr. │
│             │            │             │
└─────────────┘            └─────────────┘
                                  │ many:1
                                  ▼
                           ┌─────────────┐
                           │CloudProvider│
                           │             │
                           └─────────────┘

┌─────────────┐    1:many  ┌─────────────┐
│   Project   │ ◄────────► │    File     │
│             │            │             │
└─────────────┘            └─────────────┘
```

### Relationship Details

1. **User ↔ Tenant (1:1)**
   - Each user can own one tenant
   - Each tenant has one owner
   - Linked via Auth0 user ID

2. **Tenant ↔ Project (1:many)**
   - Tenants can have multiple projects
   - Projects belong to one tenant
   - Tenant isolation enforced

3. **Project ↔ ProjectType (many:1)**
   - Projects are created from project types
   - Project types define templates
   - Multiple projects can use same type

4. **Tenant ↔ CloudIntegration (1:many)**
   - Tenants can have multiple cloud integrations
   - Integrations are tenant-specific
   - OAuth tokens stored per integration

5. **CloudIntegration ↔ CloudProvider (many:1)**
   - Integrations reference provider configurations
   - Providers define OAuth endpoints
   - Multiple integrations per provider

6. **Project ↔ File (1:many)**
   - Projects can contain multiple files
   - Files belong to one project
   - Virtual file system with cloud storage

## Database Operations

### Service Layer Pattern

Each feature implements a service layer for database operations:

```typescript
// Example: src/features/tenants/tenants.service.ts
export class TenantService {
  private collection = db.collection('tenants');

  async createTenant(data: CreateTenantData): Promise<Tenant> {
    const result = await this.collection.insertOne(data);
    return { ...data, _id: result.insertedId };
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result.value;
  }
}
```

### Query Patterns

1. **Tenant Isolation**
   ```typescript
   // Always filter by tenant for multi-tenant data
   const projects = await db.collection('projects').find({ tenantId }).toArray();
   ```

2. **Role-based Filtering**
   ```typescript
   // Filter based on user permissions
   const userProjects = await db.collection('projects').find({
     $or: [
       { ownerId: userId },
       { 'members.userId': userId }
     ]
   }).toArray();
   ```

3. **Aggregation Pipelines**
   ```typescript
   // Complex queries with joins
   const projectsWithTypes = await db.collection('projects').aggregate([
     { $match: { tenantId } },
     { $lookup: {
         from: 'projectTypes',
         localField: 'projectTypeId',
         foreignField: '_id',
         as: 'projectType'
       }
     }
   ]).toArray();
   ```

## Indexing Strategy

### Required Indexes

1. **Tenant Isolation**
   ```javascript
   db.projects.createIndex({ tenantId: 1 });
   db.files.createIndex({ tenantId: 1 });
   db.cloudIntegrations.createIndex({ tenantId: 1 });
   ```

2. **User Lookups**
   ```javascript
   db.users.createIndex({ auth0Id: 1 }, { unique: true });
   db.tenants.createIndex({ ownerId: 1 }, { unique: true });
   ```

3. **Project Operations**
   ```javascript
   db.projects.createIndex({ tenantId: 1, status: 1 });
   db.projects.createIndex({ 'members.userId': 1 });
   ```

4. **File System**
   ```javascript
   db.files.createIndex({ projectId: 1, path: 1 }, { unique: true });
   db.files.createIndex({ tenantId: 1, cloudIntegrationId: 1 });
   ```

## Data Validation

### Runtime Validation

Zod schemas provide runtime validation for all database operations:

```typescript
import { z } from 'zod';

export const TenantSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1).max(100),
  ownerId: z.string(),
  settings: z.object({
    allowPublicProjects: z.boolean().default(false),
    maxProjects: z.number().min(1).default(10)
  }).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type Tenant = z.infer<typeof TenantSchema>;
```

### Validation in Services

```typescript
export async function createTenant(data: unknown): Promise<Tenant> {
  // Validate input data
  const validatedData = TenantSchema.parse(data);
  
  // Database operation
  const result = await db.collection('tenants').insertOne(validatedData);
  
  return { ...validatedData, _id: result.insertedId.toString() };
}
```

## Error Handling

### Database Error Types

1. **Connection Errors**
   - Network connectivity issues
   - Authentication failures
   - Timeout errors

2. **Operation Errors**
   - Duplicate key violations
   - Validation failures
   - Document not found

3. **Schema Errors**
   - Invalid data types
   - Missing required fields
   - Constraint violations

### Error Handling Pattern

```typescript
import { AppError } from '../utils/errors.js';

export async function getTenantById(id: string): Promise<Tenant> {
  try {
    const tenant = await db.collection('tenants').findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!tenant) {
      throw new AppError('tenant/not-found', 'Tenant not found');
    }
    
    return TenantSchema.parse(tenant);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError('database/operation-failed', 'Database operation failed');
  }
}
```

## Performance Optimization

### Connection Pooling

MongoDB driver automatically manages connection pooling:
- **Default pool size**: 100 connections
- **Connection reuse**: Automatic connection recycling
- **Health monitoring**: Automatic connection health checks

### Query Optimization

1. **Use appropriate indexes** for query patterns
2. **Limit result sets** with pagination
3. **Project only needed fields** to reduce bandwidth
4. **Use aggregation pipelines** for complex queries

### Monitoring

1. **Connection metrics**: Pool utilization and health
2. **Query performance**: Slow query identification
3. **Index usage**: Index effectiveness analysis
4. **Error rates**: Database operation success rates

## Backup and Recovery

### MongoDB Atlas Features

1. **Automated backups**: Point-in-time recovery
2. **Cross-region replication**: High availability
3. **Backup retention**: Configurable retention periods
4. **Restore procedures**: Database and collection-level restore

### Best Practices

1. **Regular backup testing**: Verify backup integrity
2. **Disaster recovery planning**: Document recovery procedures
3. **Data retention policies**: Comply with data regulations
4. **Security measures**: Encrypt backups and access controls

---
*This documentation reflects the current database implementation and should be updated when database changes are made.*