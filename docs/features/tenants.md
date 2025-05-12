# Tenant Feature Documentation

## Overview
The Tenant feature provides multi-tenancy support in the MWAP platform, allowing users to create and manage isolated workspaces (tenants) with their own settings and resources. Each user can own one tenant, and each tenant can have multiple projects and settings.

## Core Concepts

### Tenant
A tenant represents an isolated workspace with:
- **Name**: Unique identifier for the tenant (3-50 characters)
- **Owner**: Single user who owns and manages the tenant
- **Settings**: Configurable options for tenant behavior
- **Projects**: Collection of projects belonging to the tenant

### Tenant Settings
Each tenant has configurable settings:
- **Allow Public Projects**: Toggle for enabling public project visibility
- **Max Projects**: Limit on number of projects (1-100)

## Data Model

```typescript
interface TenantSettings {
  allowPublicProjects: boolean;  // default: false
  maxProjects: number;           // range: 1-100, default: 10
}

interface Tenant {
  _id: ObjectId;
  name: string;         // 3-50 chars, unique
  ownerId: string;      // Auth0 sub
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;    // default: false
}
```

## API Endpoints

### Get Current User's Tenant
```
GET /api/v1/tenants/me
```
Returns the tenant owned by the authenticated user.

### Get Tenant by ID
```
GET /api/v1/tenants/:id
```
Returns a specific tenant by ID. Requires appropriate permissions.

### Create Tenant
```
POST /api/v1/tenants
```
Creates a new tenant. Each user can only own one tenant. Requires:
- `name`: string (3-50 chars)
- `settings`: object (optional)
  - `allowPublicProjects`: boolean (optional)
  - `maxProjects`: number (optional, 1-100)

### Update Tenant
```
PATCH /api/v1/tenants/:id
```
Updates an existing tenant. Only owner or superadmin can update. Supports:
- `name`: string (3-50 chars)
- `settings`: object
  - `allowPublicProjects`: boolean
  - `maxProjects`: number (1-100)
- `archived`: boolean

### Delete Tenant
```
DELETE /api/v1/tenants/:id
```
Deletes a tenant. Only superadmin can perform this operation.

## Error Handling

The feature defines specific error codes:
- `tenant/not-found`: Tenant doesn't exist
- `tenant/not-authorized`: User not authorized for operation
- `tenant/name-exists`: Duplicate tenant name
- `tenant/already-exists`: User already owns a tenant
- `tenant/update-failed`: Failed to update tenant

## Security

- All endpoints require authentication via JWT
- Each user can own only one tenant
- Only tenant owner can update tenant settings
- Only superadmin can delete tenants
- Audit logging tracks all create/update/delete operations

## Best Practices

1. **Tenant Creation**
   - Use descriptive, organization-related names
   - Configure settings based on expected usage
   - Consider future scaling when setting maxProjects

2. **Tenant Management**
   - Archive tenants instead of deleting when possible
   - Regularly review and update settings
   - Monitor project count against maxProjects limit

3. **Error Handling**
   - Handle all error codes appropriately in clients
   - Validate inputs before sending requests
   - Check for name uniqueness before creation/updates

## Implementation Example

```typescript
// Creating a new tenant
const newTenant = {
  name: "Acme Corporation",
  settings: {
    allowPublicProjects: true,
    maxProjects: 50
  }
};

// API call
const response = await fetch('/api/v1/tenants', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(newTenant)
});

// Updating tenant settings
const updateSettings = {
  settings: {
    maxProjects: 75
  }
};

await fetch(`/api/v1/tenants/${tenantId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(updateSettings)
});
```

## Limitations and Constraints

1. **One Tenant Per User**
   - Each user can own only one tenant
   - Cannot create additional tenants
   - Must delete existing tenant to create new one

2. **Project Limits**
   - Maximum 100 projects per tenant
   - Configurable via maxProjects setting
   - Cannot exceed platform limit

3. **Access Control**
   - Only owner can modify tenant settings
   - Only superadmin can delete tenants
   - Cannot transfer tenant ownership

## Related Documentation
- [Architecture Reference](../v3-architecture-reference.md)
- [API Contract](../v3-api.md)
- [Domain Map](../v3-domainmap.md)