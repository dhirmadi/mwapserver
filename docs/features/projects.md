# 📘 Projects Feature Documentation

## 🎯 Overview

The Projects feature enables tenants to create and manage application instances with specific configurations. Each project is associated with a project type and a cloud integration, and has its own set of members with different roles.

## 🔑 Key Concepts

- **Project**: An application instance inside a tenant with fixed configuration
- **Project Type**: Defines the application behavior (e.g., Sorter, Tagger, Mailer)
- **Cloud Integration**: Provides access to cloud storage for the project
- **Project Members**: Users with specific roles within a project
- **Role-Based Access Control**: Different permissions based on member roles

## 📋 API Endpoints

### Projects

| Endpoint               | Method | Role                 | Description                       |
|------------------------|--------|----------------------|-----------------------------------|
| `/api/v1/projects`     | GET    | Authenticated        | List user's projects              |
| `/api/v1/projects/:id` | GET    | Authenticated        | Get a specific project            |
| `/api/v1/projects`     | POST   | Tenant OWNER         | Create a new project              |
| `/api/v1/projects/:id` | PATCH  | OWNER, DEPUTY        | Update an existing project        |
| `/api/v1/projects/:id` | DELETE | OWNER, SUPERADMIN    | Delete a project                  |

### Project Members

| Endpoint                               | Method | Role              | Description                       |
|----------------------------------------|--------|-------------------|-----------------------------------|
| `/api/v1/projects/:id/members`         | GET    | Project Member    | List project members              |
| `/api/v1/projects/:id/members`         | POST   | OWNER, DEPUTY     | Add a new member to the project   |
| `/api/v1/projects/:id/members/:userId` | PATCH  | OWNER             | Update a member's role            |
| `/api/v1/projects/:id/members/:userId` | DELETE | OWNER             | Remove a member from the project  |

## 📊 Data Model

```typescript
interface Project {
  _id: ObjectId;
  tenantId: ObjectId;           // References the tenant
  projectTypeId: ObjectId;      // References the project type
  cloudIntegrationId: ObjectId; // References the cloud integration
  folderpath: string;           // Path in the cloud storage
  name: string;                 // Project name
  description?: string;         // Optional description
  archived: boolean;            // Soft-delete flag
  members: ProjectMember[];     // List of project members (max 10)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;            // Auth0 sub of the user who created it
}

interface ProjectMember {
  userId: string;               // Auth0 sub of the user
  role: 'OWNER' | 'DEPUTY' | 'MEMBER'; // Member role
}
```

## 🔒 Security Considerations

- All endpoints require authentication via Auth0 JWT
- Project operations are restricted based on member roles:
  - **OWNER**: Full control over the project and members
  - **DEPUTY**: Can update project details and manage members
  - **MEMBER**: Read-only access to project and members
- Projects can only be created by tenant owners
- Projects can be deleted by project owners or superadmins
- Each project must have at least one OWNER at all times

## 🧩 Implementation Details

### Schema Validation

The Project schema enforces:
- Valid tenant, project type, and cloud integration references
- Required name and folder path
- Maximum of 10 members per project
- At least one OWNER member

### Business Rules

1. **Tenant Scoping**: Each project belongs to a specific tenant
2. **Immutable Fields**: `tenantId`, `projectTypeId`, `cloudIntegrationId`, and `folderpath` are immutable after creation
3. **Member Roles**: Members can have OWNER, DEPUTY, or MEMBER roles
4. **Owner Requirement**: Each project must have at least one OWNER
5. **Member Limit**: Maximum of 10 members per project
6. **Audit Logging**: All write operations are logged with the acting user's ID

### Role-Based Access Control

The `requireProjectRole` middleware enforces role-based access control:
- Checks if the user is a member of the project
- Verifies the user has the required role or higher
- Superadmins bypass role checks

### Error Codes

| Code                                    | Status | Description                                      |
|----------------------------------------|--------|--------------------------------------------------|
| `project/not-found`                    | 404    | The requested project does not exist             |
| `project/tenant-not-found`             | 404    | The referenced tenant does not exist             |
| `project/project-type-not-found`       | 404    | The referenced project type does not exist       |
| `project/cloud-integration-not-found`  | 404    | The referenced cloud integration does not exist  |
| `project/invalid-input`                | 400    | The request contains invalid data                |
| `project/unauthorized`                 | 403    | The user is not authorized for this operation    |
| `project/member-not-found`             | 404    | The specified member does not exist              |
| `project/member-already-exists`        | 409    | The member already exists in the project         |
| `project/owner-required`               | 400    | Cannot remove the last owner from the project    |
| `project/max-members-reached`          | 400    | Maximum number of members reached (10)           |
| `project/immutable-field`              | 400    | Attempted to modify an immutable field           |

## 🔄 Integration Points

- **Tenants**: Projects are scoped to tenants
- **Project Types**: Projects reference project types
- **Cloud Integrations**: Projects use cloud integrations for storage access
- **Virtual Files**: (Future) Projects will access files through cloud integrations

## 📝 Usage Examples

### Creating a Project

```json
POST /api/v1/projects
{
  "tenantId": "60a1b2c3d4e5f6g7h8i9j0k1",
  "projectTypeId": "60a1b2c3d4e5f6g7h8i9j0k2",
  "cloudIntegrationId": "60a1b2c3d4e5f6g7h8i9j0k3",
  "folderpath": "/projects/my-project",
  "name": "My Project",
  "description": "A sample project for demonstration",
  "members": [
    {
      "userId": "auth0|123456789",
      "role": "DEPUTY"
    }
  ]
}
```

Note: The tenant owner is automatically added as a project OWNER.

### Updating a Project

```json
PATCH /api/v1/projects/60a1b2c3d4e5f6g7h8i9j0k4
{
  "name": "Updated Project Name",
  "description": "Updated project description",
  "archived": true
}
```

### Adding a Project Member

```json
POST /api/v1/projects/60a1b2c3d4e5f6g7h8i9j0k4/members
{
  "userId": "auth0|987654321",
  "role": "MEMBER"
}
```

### Updating a Member's Role

```json
PATCH /api/v1/projects/60a1b2c3d4e5f6g7h8i9j0k4/members/auth0|987654321
{
  "role": "DEPUTY"
}
```

## 🔜 Future Enhancements

- Project templates for quick creation
- Project cloning functionality
- Enhanced member invitation flow
- Project activity logging
- Project-specific settings and configurations
- Integration with Virtual Files feature