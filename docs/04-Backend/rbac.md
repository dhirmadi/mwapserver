# Role-Based Access Control (RBAC)

This document outlines the RBAC implementation in the MWAP backend, covering roles, permissions, and authorization middleware.

## 🎭 Role System

### User Roles
```typescript
SuperAdmin      // Platform-wide access (system management)
Tenant Owner    // Tenant-specific access (tenant management)
Project Member  // Project-specific access (OWNER | DEPUTY | MEMBER)
```

### Permission Hierarchy
```
SuperAdmin
├── All tenant operations
├── All project operations  
├── System configuration
└── User management

Tenant Owner
├── Own tenant management
├── Tenant project creation/management
├── Cloud integrations
└── Project member management

Project Member
├── OWNER: Full project control
├── DEPUTY: Project editing + member management
└── MEMBER: Read-only project access
```

## 🛡️ Authorization Middleware

### SuperAdmin Check
```typescript
// src/middleware/authorization.ts
export function requireSuperAdminRole() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = getUserFromToken(req);
    
    const superadmin = await getDB()
      .collection('superadmins')
      .findOne({ userId: user.sub });
    
    if (!superadmin) {
      throw new PermissionError('Requires superadmin role');
    }
    
    next();
  };
}
```

### Tenant Owner Check
```typescript
export function requireTenantOwner(tenantIdParam = 'tenantId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = getUserFromToken(req);
    const tenantId = req.params[tenantIdParam];
    
    const tenant = await getDB()
      .collection('tenants')
      .findOne({
        _id: new ObjectId(tenantId),
        ownerId: user.sub
      });
    
    if (!tenant) {
      throw new PermissionError('Only tenant owners can access this resource');
    }
    
    req.tenant = tenant;
    next();
  };
}
```

### Flexible Owner/Admin Check
```typescript
export function requireTenantOwnerOrSuperAdmin(tenantIdParam = 'tenantId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = getUserFromToken(req);
    const tenantId = req.params[tenantIdParam];
    
    // Check superadmin first
    const superadmin = await getDB()
      .collection('superadmins')
      .findOne({ userId: user.sub });
      
    if (superadmin) return next();
    
    // Check tenant ownership
    const tenant = await getDB()
      .collection('tenants')
      .findOne({
        _id: new ObjectId(tenantId),
        ownerId: user.sub
      });
    
    if (!tenant) {
      throw new PermissionError('Only tenant owners or superadmins can access this resource');
    }
    
    req.tenant = tenant;
    next();
  };
}
```

### Project Role Check
```typescript
// src/middleware/roles.ts
export function requireProjectRole(requiredRole: 'OWNER' | 'DEPUTY' | 'MEMBER') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = getUserFromToken(req);
    const projectId = req.params.id;
    
    const project = await getDB()
      .collection('projects')
      .findOne({ _id: new ObjectId(projectId) });
    
    const member = project?.members?.find(m => m.userId === user.sub);
    
    if (!member || !hasRolePermission(member.role, requiredRole)) {
      throw new PermissionError('Insufficient project permissions');
    }
    
    next();
  };
}

function hasRolePermission(userRole: string, requiredRole: string): boolean {
  const hierarchy = { OWNER: 3, DEPUTY: 2, MEMBER: 1 };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}
```

## 🔐 Route Protection Examples

### SuperAdmin Routes
```typescript
// Only superadmins can manage project types
router.use(requireSuperAdminRole());
router.get('/', wrapAsyncHandler(getAllProjectTypes));
router.post('/', wrapAsyncHandler(createProjectType));
```

### Tenant Owner Routes
```typescript
// Tenant-specific cloud integrations
router.use('/:tenantId/integrations', requireTenantOwner('tenantId'));
router.get('/', wrapAsyncHandler(getIntegrations));
router.post('/', wrapAsyncHandler(createIntegration));
```

### Project Role Routes
```typescript
// Project operations by role
router.get('/:id', wrapAsyncHandler(getProject));                    // Public (authenticated)
router.patch('/:id', requireProjectRole('DEPUTY'), updateProject);   // Deputy+
router.delete('/:id', requireProjectRole('OWNER'), deleteProject);   // Owner only
```

### Mixed Permission Routes
```typescript
// Flexible access patterns
router.get('/:id', requireTenantOwnerOrSuperAdmin('id'), getTenantById);
```

## 📊 Database Schema

### SuperAdmins Collection
```typescript
{
  _id: ObjectId,
  userId: string,        // Auth0 user ID
  createdAt: Date,
  permissions?: string[] // Future: granular permissions
}
```

### Tenants Collection
```typescript
{
  _id: ObjectId,
  name: string,
  ownerId: string,       // Auth0 user ID
  // ... other fields
}
```

### Projects Collection
```typescript
{
  _id: ObjectId,
  name: string,
  tenantId: ObjectId,
  members: [
    {
      userId: string,    // Auth0 user ID
      role: 'OWNER' | 'DEPUTY' | 'MEMBER',
      addedAt: Date
    }
  ]
  // ... other fields
}
```

## 🔍 Permission Resolution

### User Roles API Endpoint
```typescript
// GET /api/v1/users/me/roles
{
  "success": true,
  "data": {
    "isSuperAdmin": boolean,
    "isTenantOwner": boolean,
    "tenantId": string | null,
    "projectRoles": [
      {
        "projectId": string,
        "role": "OWNER" | "DEPUTY" | "MEMBER"
      }
    ]
  }
}
```

### Role Resolution Logic
```typescript
// src/features/users/user.service.ts
export async function getUserRoles(userId: string) {
  const [superadmin, tenant, projectRoles] = await Promise.all([
    db.collection('superadmins').findOne({ userId }),
    db.collection('tenants').findOne({ ownerId: userId }),
    db.collection('projects').find({ 'members.userId': userId }).toArray()
  ]);
  
  return {
    isSuperAdmin: !!superadmin,
    isTenantOwner: !!tenant,
    tenantId: tenant?._id || null,
    projectRoles: projectRoles.map(project => ({
      projectId: project._id,
      role: project.members.find(m => m.userId === userId)?.role
    }))
  };
}
```

## 🚨 Error Handling

### Permission Errors
```typescript
// Custom error for authorization failures
export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

// Global error handler converts to HTTP response
if (error instanceof PermissionError) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: error.message
    }
  });
}
```

### Common Error Responses
```json
// SuperAdmin required
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS", 
    "message": "Requires superadmin role"
  }
}

// Tenant owner required
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only tenant owners can access this resource"
  }
}

// Project role required
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS", 
    "message": "Insufficient project permissions"
  }
}
```

## 🧪 Testing RBAC

### Unit Tests
```typescript
describe('requireSuperAdminRole', () => {
  it('allows superadmin users', async () => {
    mockDB.collection('superadmins').findOne.mockResolvedValue({ userId: 'user123' });
    
    await requireSuperAdminRole()(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
  
  it('rejects non-superadmin users', async () => {
    mockDB.collection('superadmins').findOne.mockResolvedValue(null);
    
    await requireSuperAdminRole()(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(PermissionError));
  });
});
```

## 🔗 Related Documentation

- **[Auth0 Implementation](auth0.md)** - Authentication setup
- **[Frontend RBAC](../03-Frontend/rbac.md)** - Client-side role handling
- **[API Documentation](API-v3.md)** - Endpoint-specific permissions

---

*RBAC ensures secure, scalable access control across the multi-tenant platform.* 