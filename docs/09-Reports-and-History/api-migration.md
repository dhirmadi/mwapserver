# API Migration Guide

## Overview

This document outlines the migration strategy and timeline for evolving the MWAP platform API from version 2 to version 3, including breaking changes, migration paths, and deprecation schedules.

## Migration Timeline

### Phase 1: Preparation (Completed)
- **Duration**: 2 months
- **Status**: ✅ Complete
- **Deliverables**:
  - API v3 design and specification
  - Backward compatibility analysis
  - Migration tooling development
  - Documentation updates

### Phase 2: Parallel Deployment (Current)
- **Duration**: 3 months
- **Status**: 🔄 In Progress
- **Deliverables**:
  - Deploy API v3 alongside v2
  - Comprehensive testing
  - Client migration guides
  - Developer communication

### Phase 3: Migration Period
- **Duration**: 6 months
- **Status**: ⏳ Planned
- **Deliverables**:
  - Client application updates
  - Data migration scripts
  - Performance optimization
  - User training materials

### Phase 4: Deprecation
- **Duration**: 3 months
- **Status**: ⏳ Planned
- **Deliverables**:
  - API v2 deprecation notices
  - Final migration assistance
  - Monitoring and alerts
  - Legacy endpoint removal

## API Version Comparison

### Version 2 (Legacy)

#### Endpoint Structure
```
GET /api/v2/users
POST /api/v2/auth/login
GET /api/v2/projects/{id}
PUT /api/v2/files/{id}/upload
```

#### Response Format
```json
{
  "data": { ... },
  "message": "Success",
  "status": 200
}
```

#### Authentication
- Custom JWT implementation
- Token in `Authorization` header
- Basic role-based access

### Version 3 (Current)

#### Endpoint Structure
```
GET /api/v3/users
POST /api/v3/auth/login
GET /api/v3/projects/{projectId}
PUT /api/v3/projects/{projectId}/files/{fileId}
```

#### Response Format
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "3.0.0",
    "requestId": "req_123"
  }
}
```

#### Authentication
- Auth0 integration
- Enhanced RBAC system
- Tenant-based isolation
- Refresh token support

## Breaking Changes

### 1. Response Structure Changes

#### V2 Response
```json
{
  "data": {
    "id": "123",
    "name": "Project Name"
  },
  "message": "Success",
  "status": 200
}
```

#### V3 Response
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Project Name",
    "tenantId": "tenant_456"
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "3.0.0",
    "requestId": "req_789"
  }
}
```

**Migration**: Update client code to expect `success` instead of `status`, and handle `metadata` object.

### 2. Authentication Changes

#### V2 Authentication
```typescript
// Login request
POST /api/v2/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "data": {
    "token": "jwt_token_here",
    "user": { ... }
  }
}
```

#### V3 Authentication
```typescript
// Login request
POST /api/v3/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": { ... },
    "tenant": { ... }
  }
}
```

**Migration**: Update token storage to handle both access and refresh tokens, include tenant information.

### 3. Endpoint Path Changes

| V2 Endpoint | V3 Endpoint | Changes |
|-------------|-------------|---------|
| `/api/v2/projects/{id}` | `/api/v3/projects/{projectId}` | Parameter name change |
| `/api/v2/files/{id}` | `/api/v3/projects/{projectId}/files/{fileId}` | Nested resource structure |
| `/api/v2/users/profile` | `/api/v3/users/me` | Simplified path |
| `/api/v2/admin/users` | `/api/v3/tenants/{tenantId}/users` | Tenant-scoped resources |

### 4. Pagination Changes

#### V2 Pagination
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### V3 Pagination
```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

**Migration**: Update pagination parsing logic to use `metadata.pagination` with new field names.

## Migration Strategies

### 1. Client Library Updates

#### JavaScript/TypeScript SDK

**V2 SDK Usage**:
```typescript
import { MWAPClient } from '@mwap/sdk-v2';

const client = new MWAPClient({
  apiUrl: 'https://api.mwap.platform/v2',
  token: 'jwt_token'
});

const projects = await client.projects.list();
```

**V3 SDK Usage**:
```typescript
import { MWAPClient } from '@mwap/sdk';

const client = new MWAPClient({
  apiUrl: 'https://api.mwap.platform/v3',
  auth: {
    accessToken: 'access_token',
    refreshToken: 'refresh_token'
  },
  tenantId: 'tenant_123'
});

const projects = await client.projects.list();
```

#### Migration Script
```typescript
// migration/update-client.ts
import { MWAPClientV2 } from '@mwap/sdk-v2';
import { MWAPClient } from '@mwap/sdk';

export async function migrateClient(v2Config: V2Config): Promise<V3Config> {
  // 1. Authenticate with v3 endpoint
  const authResponse = await fetch('/api/v3/auth/migrate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${v2Config.token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const { accessToken, refreshToken, tenant } = await authResponse.json();
  
  // 2. Return v3 configuration
  return {
    apiUrl: 'https://api.mwap.platform/v3',
    auth: {
      accessToken,
      refreshToken
    },
    tenantId: tenant.id
  };
}
```

### 2. Database Migration

#### User Data Migration
```sql
-- Add tenant association to existing users
ALTER TABLE users ADD COLUMN tenant_id UUID;

-- Create default tenant for existing users
INSERT INTO tenants (id, name, created_at)
VALUES (gen_random_uuid(), 'Default Tenant', NOW());

-- Assign all existing users to default tenant
UPDATE users 
SET tenant_id = (SELECT id FROM tenants WHERE name = 'Default Tenant')
WHERE tenant_id IS NULL;

-- Make tenant_id required
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
```

#### Project Data Migration
```sql
-- Add tenant_id to projects table
ALTER TABLE projects ADD COLUMN tenant_id UUID;

-- Link projects to users' tenants
UPDATE projects 
SET tenant_id = u.tenant_id
FROM users u 
WHERE projects.owner_id = u.id;

-- Make tenant_id required
ALTER TABLE projects ALTER COLUMN tenant_id SET NOT NULL;

-- Add tenant-based indexes
CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_files_tenant_id ON files(tenant_id);
```

### 3. Gradual Migration Approach

#### Phase 1: Dual-Stack Deployment
```nginx
# nginx.conf
upstream api_v2 {
    server api-v2:3000;
}

upstream api_v3 {
    server api-v3:3000;
}

server {
    location /api/v2/ {
        proxy_pass http://api_v2;
        # Add deprecation warnings
        add_header X-API-Deprecated "true";
        add_header X-API-Sunset "2024-12-31";
    }
    
    location /api/v3/ {
        proxy_pass http://api_v3;
    }
    
    # Default to v3
    location /api/ {
        proxy_pass http://api_v3;
    }
}
```

#### Phase 2: Migration Middleware
```typescript
// middleware/migration.ts
export function migrationMiddleware(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.get('User-Agent') || '';
  const apiVersion = req.get('X-API-Version');
  
  // Track API usage
  metrics.increment('api.requests', {
    version: req.path.includes('/v2/') ? 'v2' : 'v3',
    userAgent: userAgent.split('/')[0] // Client name
  });
  
  // Add migration headers for v2 requests
  if (req.path.includes('/v2/')) {
    res.set({
      'X-API-Deprecated': 'true',
      'X-API-Sunset': '2024-12-31',
      'X-Migration-Guide': 'https://docs.mwap.platform/api-migration',
      'X-API-Current-Version': 'v3'
    });
  }
  
  next();
}
```

## Client Migration Guides

### Frontend Applications

#### React Application Migration

**Before (V2)**:
```typescript
// hooks/useProjects.ts
import { useEffect, useState } from 'react';
import { apiClient } from '../services/api';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    apiClient.get('/projects')
      .then(response => {
        setProjects(response.data.data);
        setLoading(false);
      });
  }, []);
  
  return { projects, loading };
}
```

**After (V3)**:
```typescript
// hooks/useProjects.ts
import { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { useTenant } from './useTenant';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentTenant } = useTenant();
  
  useEffect(() => {
    if (!currentTenant) return;
    
    apiClient.get(`/tenants/${currentTenant.id}/projects`)
      .then(response => {
        if (response.data.success) {
          setProjects(response.data.data);
        }
        setLoading(false);
      });
  }, [currentTenant]);
  
  return { projects, loading };
}
```

#### API Service Migration
```typescript
// services/api.ts - V3 Migration
class APIClient {
  private accessToken: string;
  private refreshToken: string;
  private tenantId: string;
  
  constructor(config: APIConfig) {
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.tenantId = config.tenantId;
  }
  
  async request(endpoint: string, options: RequestOptions = {}) {
    let response = await this.makeRequest(endpoint, options);
    
    // Handle token refresh
    if (response.status === 401) {
      await this.refreshAccessToken();
      response = await this.makeRequest(endpoint, options);
    }
    
    const data = await response.json();
    
    // Handle v3 response format
    if (!data.success) {
      throw new APIError(data.error, data.code);
    }
    
    return data;
  }
  
  private async refreshAccessToken() {
    const response = await fetch('/api/v3/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });
    
    const data = await response.json();
    this.accessToken = data.data.accessToken;
  }
}
```

### Mobile Applications

#### iOS Migration
```swift
// APIClient.swift - V3 Migration
class APIClient {
    private var accessToken: String
    private var refreshToken: String
    private let tenantId: String
    
    init(accessToken: String, refreshToken: String, tenantId: String) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        self.tenantId = tenantId
    }
    
    func request<T: Codable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: Data? = nil
    ) async throws -> APIResponse<T> {
        var request = URLRequest(url: URL(string: baseURL + endpoint)!)
        request.httpMethod = method.rawValue
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(tenantId, forHTTPHeaderField: "X-Tenant-ID")
        
        if let body = body {
            request.httpBody = body
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        // Handle token refresh
        if let httpResponse = response as? HTTPURLResponse,
           httpResponse.statusCode == 401 {
            try await refreshToken()
            return try await self.request(endpoint: endpoint, method: method, body: body)
        }
        
        let apiResponse = try JSONDecoder().decode(APIResponse<T>.self, from: data)
        
        guard apiResponse.success else {
            throw APIError.requestFailed(apiResponse.error ?? "Unknown error")
        }
        
        return apiResponse
    }
}

// Response models for V3
struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let error: String?
    let metadata: ResponseMetadata?
}

struct ResponseMetadata: Codable {
    let timestamp: String
    let version: String
    let requestId: String
    let pagination: PaginationMetadata?
}
```

## Automated Migration Tools

### Migration CLI Tool

```typescript
#!/usr/bin/env node
// bin/mwap-migrate.ts

import { Command } from 'commander';
import { migrateProject } from './commands/migrate-project';
import { validateProject } from './commands/validate-project';
import { generateClient } from './commands/generate-client';

const program = new Command();

program
  .name('mwap-migrate')
  .description('MWAP API migration tool')
  .version('1.0.0');

program
  .command('project')
  .description('Migrate project from API v2 to v3')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--dry-run', 'Show changes without applying them')
  .action(migrateProject);

program
  .command('validate')
  .description('Validate project for v3 compatibility')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(validateProject);

program
  .command('generate')
  .description('Generate v3 API client')
  .option('-l, --language <lang>', 'Client language', 'typescript')
  .option('-o, --output <path>', 'Output directory')
  .action(generateClient);

program.parse();
```

### Code Migration Script

```typescript
// commands/migrate-project.ts
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import * as ts from 'typescript';

export async function migrateProject(options: MigrationOptions) {
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: options.path,
    ignore: ['node_modules/**', 'dist/**']
  });
  
  for (const file of files) {
    const source = readFileSync(file, 'utf-8');
    const migrated = migrateSourceCode(source);
    
    if (migrated !== source) {
      if (options.dryRun) {
        console.log(`Would update: ${file}`);
      } else {
        writeFileSync(file, migrated);
        console.log(`Updated: ${file}`);
      }
    }
  }
}

function migrateSourceCode(source: string): string {
  let result = source;
  
  // Update API endpoints
  result = result.replace(/\/api\/v2\//g, '/api/v3/');
  
  // Update response handling
  result = result.replace(
    /response\.data\.data/g,
    'response.data.success ? response.data.data : null'
  );
  
  // Update pagination
  result = result.replace(
    /response\.data\.pagination/g,
    'response.data.metadata?.pagination'
  );
  
  // Add tenant context where needed
  result = result.replace(
    /apiClient\.get\('\/projects'/g,
    'apiClient.get(`/tenants/${tenantId}/projects`'
  );
  
  return result;
}
```

## Testing Migration

### Compatibility Testing

```typescript
// tests/migration.test.ts
describe('API Migration Compatibility', () => {
  test('v2 responses work with v3 client', async () => {
    const v2Response = {
      data: { id: '123', name: 'Test Project' },
      message: 'Success',
      status: 200
    };
    
    // Mock v2 endpoint
    nock('https://api.mwap.platform')
      .get('/v2/projects/123')
      .reply(200, v2Response);
    
    // Test with v3 client
    const client = new MWAPClientV3({
      apiUrl: 'https://api.mwap.platform/v2'
    });
    
    const project = await client.projects.get('123');
    expect(project.id).toBe('123');
    expect(project.name).toBe('Test Project');
  });
  
  test('v3 client handles new response format', async () => {
    const v3Response = {
      success: true,
      data: { id: '123', name: 'Test Project', tenantId: 'tenant_456' },
      metadata: {
        timestamp: '2024-01-01T00:00:00Z',
        version: '3.0.0',
        requestId: 'req_789'
      }
    };
    
    nock('https://api.mwap.platform')
      .get('/v3/projects/123')
      .reply(200, v3Response);
    
    const client = new MWAPClientV3({
      apiUrl: 'https://api.mwap.platform/v3'
    });
    
    const project = await client.projects.get('123');
    expect(project.id).toBe('123');
    expect(project.tenantId).toBe('tenant_456');
  });
});
```

### Performance Testing

```typescript
// tests/performance.test.ts
describe('Migration Performance Impact', () => {
  test('v3 API performance vs v2', async () => {
    const iterations = 100;
    
    // Test v2 performance
    const v2Times = [];
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await v2Client.projects.list();
      v2Times.push(Date.now() - start);
    }
    
    // Test v3 performance
    const v3Times = [];
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await v3Client.projects.list();
      v3Times.push(Date.now() - start);
    }
    
    const v2Avg = v2Times.reduce((a, b) => a + b) / v2Times.length;
    const v3Avg = v3Times.reduce((a, b) => a + b) / v3Times.length;
    
    // v3 should not be more than 20% slower
    expect(v3Avg).toBeLessThan(v2Avg * 1.2);
  });
});
```

## Monitoring and Rollback

### Migration Monitoring

```typescript
// monitoring/migration-metrics.ts
export class MigrationMonitor {
  private metrics: MetricsClient;
  
  trackAPIUsage(version: string, endpoint: string, success: boolean) {
    this.metrics.increment('api.requests', {
      version,
      endpoint,
      success: success.toString()
    });
  }
  
  trackMigrationEvent(event: string, clientId: string, metadata: any) {
    this.metrics.increment('migration.events', {
      event,
      clientId
    });
    
    console.log(`Migration event: ${event}`, {
      clientId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }
  
  generateMigrationReport(): MigrationReport {
    const v2Usage = this.getAPIUsage('v2');
    const v3Usage = this.getAPIUsage('v3');
    
    return {
      totalRequests: v2Usage.total + v3Usage.total,
      v2Percentage: (v2Usage.total / (v2Usage.total + v3Usage.total)) * 100,
      v3Percentage: (v3Usage.total / (v2Usage.total + v3Usage.total)) * 100,
      migrationProgress: this.calculateMigrationProgress(),
      issues: this.getKnownIssues()
    };
  }
}
```

### Rollback Strategy

```yaml
# rollback.yml - Emergency rollback procedure
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-rollback-config
data:
  rollback-steps: |
    1. Switch traffic back to v2 API
    2. Restore v2 database schema
    3. Notify clients of rollback
    4. Investigate migration issues
    
  nginx-rollback: |
    # Emergency nginx config
    upstream api_fallback {
        server api-v2:3000;
    }
    
    location /api/ {
        proxy_pass http://api_fallback;
    }
```

## Communication Plan

### Developer Notifications

```typescript
// notifications/migration-alerts.ts
export const migrationAlerts = {
  '6_months_before': {
    subject: 'MWAP API v3 Migration Starting Soon',
    message: 'API v3 will be released in 6 months. Start planning your migration.',
    channels: ['email', 'slack', 'blog']
  },
  
  '3_months_before': {
    subject: 'MWAP API v3 Available - Migration Required',
    message: 'API v3 is now available. Begin migrating your applications.',
    channels: ['email', 'slack', 'in-app']
  },
  
  '1_month_before_deprecation': {
    subject: 'URGENT: MWAP API v2 Deprecation in 1 Month',
    message: 'API v2 will be deprecated in 1 month. Complete your migration now.',
    channels: ['email', 'slack', 'in-app', 'dashboard']
  },
  
  'deprecation_day': {
    subject: 'MWAP API v2 Officially Deprecated',
    message: 'API v2 is now deprecated. Switch to v3 immediately.',
    channels: ['email', 'slack', 'in-app', 'dashboard', 'sms']
  }
};
```

## Support Resources

### Migration Support Team
- **Technical Lead**: API architecture and breaking changes
- **Developer Relations**: Client migration assistance
- **Documentation**: Migration guides and examples
- **Support Engineering**: Issue resolution and troubleshooting

### Resources Available
- Migration documentation: [docs.mwap.platform/migration](https://docs.mwap.platform/migration)
- Migration tools: [tools.mwap.platform](https://tools.mwap.platform)
- Support forum: [community.mwap.platform](https://community.mwap.platform)
- Direct support: migration-support@mwap.platform

### Office Hours
- **Weekly Migration Office Hours**: Tuesdays 2-4 PM PST
- **Emergency Support**: Available 24/7 for critical issues
- **One-on-One Sessions**: Schedule at [calendly.com/mwap-migration](https://calendly.com/mwap-migration)

## Success Metrics

### Migration KPIs
- **API v2 Usage Decline**: Target 10% decrease per month
- **API v3 Adoption**: Target 90% of active clients migrated within 6 months
- **Migration-Related Issues**: Target <5% of total support tickets
- **Client Satisfaction**: Target >90% satisfaction with migration process

### Completion Criteria
- ✅ All active clients migrated to v3
- ✅ API v2 traffic <1% of total requests
- ✅ No critical migration-blocking issues
- ✅ Documentation and tooling complete
- ✅ Support team trained on v3

## Related Documents

- [API v3 Documentation](../04-Backend/API-v3.md)
- [Breaking Changes Log](./breaking-changes.md)
- [Client SDK Documentation](../03-Frontend/api-integration.md)
- [Deployment Guide](../06-Guides/how-to-deploy.md) 