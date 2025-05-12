# Project Type Feature Documentation

## Overview
The Project Type feature provides a flexible way to define and manage different types of projects within the MWAP platform. Each project type has its own configuration schema that defines the structure and validation rules for projects of that type.

## Core Concepts

### Project Type
A project type represents a template or blueprint for creating projects. It consists of:
- **Name**: Unique identifier for the project type (3-50 characters)
- **Description**: Detailed explanation of the project type (up to 500 characters)
- **Configuration Schema**: JSON schema defining the structure and validation rules for projects
- **Active Status**: Boolean flag indicating if the type is available for use

## Data Model

```typescript
interface ProjectType {
  _id: ObjectId;
  name: string;         // 3-50 chars, unique
  description: string;  // max 500 chars
  configSchema: Record<string, unknown>; // JSON schema
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;    // Auth0 sub
}
```

## API Endpoints

### List Project Types
```
GET /api/v1/project-types
```
Returns all available project types.

### Get Project Type
```
GET /api/v1/project-types/:id
```
Returns a specific project type by ID.

### Create Project Type
```
POST /api/v1/project-types
```
Creates a new project type. Requires:
- `name`: string (3-50 chars)
- `description`: string (max 500 chars)
- `configSchema`: object (valid JSON schema)
- `isActive`: boolean (optional, defaults to true)

### Update Project Type
```
PATCH /api/v1/project-types/:id
```
Updates an existing project type. Supports:
- `name`: string (3-50 chars)
- `description`: string (max 500 chars)
- `isActive`: boolean

Note: `configSchema` cannot be modified after creation to maintain data integrity.

### Delete Project Type
```
DELETE /api/v1/project-types/:id
```
Deletes a project type if it's not in use by any projects.

## Error Handling

The feature defines specific error codes:
- `project-type/not-found`: Project type doesn't exist
- `project-type/name-exists`: Duplicate project type name
- `project-type/in-use`: Project type is being used by projects
- `project-type/invalid-schema`: Invalid configuration schema format

## Security

- All endpoints require authentication via JWT
- Project type management is restricted to admin users
- Audit logging tracks all create/update/delete operations

## Best Practices

1. **Configuration Schema Design**
   - Keep schemas simple and focused
   - Use clear field names and descriptions
   - Include validation rules where needed

2. **Project Type Management**
   - Use descriptive names and detailed descriptions
   - Test configuration schemas before creating types
   - Deactivate unused types instead of deleting them

3. **Error Handling**
   - Handle all error codes appropriately in clients
   - Validate inputs before sending requests
   - Check for name uniqueness before creation/updates

## Implementation Example

```typescript
// Creating a new project type
const newProjectType = {
  name: "Web Application",
  description: "Template for standard web applications",
  configSchema: {
    type: "object",
    properties: {
      framework: {
        type: "string",
        enum: ["react", "vue", "angular"]
      },
      database: {
        type: "string",
        enum: ["mongodb", "postgresql"]
      }
    },
    required: ["framework", "database"]
  },
  isActive: true
};

// API call
const response = await fetch('/api/v1/project-types', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(newProjectType)
});
```

## Related Documentation
- [Architecture Reference](../v3-architecture-reference.md)
- [API Contract](../v3-api.md)
- [Domain Map](../v3-domainmap.md)