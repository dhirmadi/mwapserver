# 🏢 Tenants Feature Documentation

## Overview
Tenants represent organizations or user workspaces in the MWAP platform. Each tenant has its own settings, projects, and cloud integrations. The system enforces a one-tenant-per-user rule for owners.

## API Endpoints

### POST /api/v1/tenants
Create a new tenant. Users can only own one tenant.

**Authorization**: Requires authenticated user
**Response**: Created tenant object

### GET /api/v1/tenants/me
Get the current user's tenant.

**Authorization**: Requires authenticated user
**Response**: User's tenant object

### PATCH /api/v1/tenants/:id
Update an existing tenant.

**Authorization**: Requires OWNER role or SUPERADMIN
**Request Body**: Partial tenant object

### DELETE /api/v1/tenants/:id
Delete a tenant.

**Authorization**: Requires SUPERADMIN role
**Constraints**: Deletes all associated data (projects, integrations)

## Tenant Settings

The tenant settings object controls tenant-wide configurations:

```json
{
  "allowPublicProjects": "boolean (default: false)",
  "maxProjects": "number (1-100, default: 10)"
}
```

## Request/Response Format

### Create Tenant Request
```json
{
  "name": "string (3-50 chars)",
  "settings": {
    "allowPublicProjects": "boolean (optional)",
    "maxProjects": "number (optional, 1-100)"
  }
}
```

### Tenant Response
```json
{
  "id": "string (ObjectId)",
  "name": "string",
  "ownerId": "string (Auth0 sub)",
  "settings": {
    "allowPublicProjects": "boolean",
    "maxProjects": "number"
  },
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string",
  "archived": "boolean"
}
```

### Update Tenant Request
```json
{
  "name": "string (optional)",
  "settings": {
    "allowPublicProjects": "boolean (optional)",
    "maxProjects": "number (optional)"
  },
  "archived": "boolean (optional)"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| tenant/not-found | Tenant with specified ID not found |
| tenant/name-exists | Tenant with this name already exists |
| tenant/owner-exists | User already owns another tenant |
| tenant/invalid-settings | Invalid tenant settings provided |

## Validation Rules

1. Name:
   - Required for creation
   - 3-50 characters
   - Must be unique across all tenants

2. Settings:
   - allowPublicProjects: boolean
   - maxProjects: number between 1 and 100
   - Defaults provided if not specified

3. Ownership:
   - One tenant per user as owner
   - Cannot change owner after creation
   - Only SUPERADMIN can delete tenants

4. Updates:
   - OWNER can update name and settings
   - SUPERADMIN can update any field
   - Cannot update ownerId

## Usage Examples

### Creating a Tenant
```json
POST /api/v1/tenants
{
  "name": "My Organization",
  "settings": {
    "allowPublicProjects": false,
    "maxProjects": 20
  }
}
```

### Updating Tenant Settings
```json
PATCH /api/v1/tenants/123
{
  "name": "Updated Org Name",
  "settings": {
    "maxProjects": 50
  }
}
```

## Implementation Notes

1. Role Authorization:
   - Create: Any authenticated user
   - Read: Tenant member
   - Update: OWNER or SUPERADMIN
   - Delete: SUPERADMIN only

2. Data Validation:
   - Name uniqueness checked on create/update
   - Settings validated against constraints
   - One owner per tenant enforced

3. Tenant Isolation:
   - Projects scoped to tenant
   - Integrations scoped to tenant
   - Settings enforced at tenant level

4. Audit Logging:
   - Creation logged with user ID
   - Settings changes logged
   - Deletion logged by SUPERADMIN

## Related Features

1. Projects:
   - Belong to a tenant
   - Count limited by tenant settings
   - Access controlled by tenant roles

2. Cloud Integrations:
   - Scoped to tenant
   - Managed by tenant owner
   - Used across tenant's projects

3. Members:
   - Associated with tenant
   - Have tenant-level roles
   - Access controlled by tenant settings