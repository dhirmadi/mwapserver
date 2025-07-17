# 🧩 Project Types Feature Documentation

## Overview
Project Types define the structure and configuration requirements for different kinds of projects in the MWAP platform. Each project type has a configSchema that validates project configurations at runtime.

## API Endpoints

### GET /api/v1/project-types
Lists all project types.

**Authorization**: Requires SUPERADMIN role
**Response**: Array of project types

### GET /api/v1/project-types/:id
Get a specific project type by ID.

**Authorization**: Requires SUPERADMIN role
**Response**: Single project type object

### POST /api/v1/project-types
Create a new project type.

**Authorization**: Requires SUPERADMIN role
**Request Body**:
```json
{
  "name": "string (3-50 chars)",
  "description": "string (max 500 chars)",
  "configSchema": "object (Zod-compatible schema)",
  "isActive": "boolean (optional)"
}
```

### PATCH /api/v1/project-types/:id
Update an existing project type.

**Authorization**: Requires SUPERADMIN role
**Request Body**: Partial project type object (configSchema cannot be updated)

### DELETE /api/v1/project-types/:id
Delete a project type if it's not in use.

**Authorization**: Requires SUPERADMIN role
**Constraints**: Cannot delete if any projects are using this type

## ConfigSchema Format

The configSchema must be a valid Zod schema object that defines the configuration structure for projects of this type.

Example:
```json
{
  "name": "WebApp",
  "description": "Configuration for web applications",
  "configSchema": {
    "hosting": {
      "type": "object",
      "properties": {
        "domain": {
          "type": "string",
          "format": "hostname"
        },
        "ssl": {
          "type": "boolean",
          "default": true
        }
      },
      "required": ["domain"]
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| project-type/not-found | Project type with specified ID not found |
| project-type/name-exists | Project type with this name already exists |
| project-type/in-use | Project type is in use by existing projects |
| project-type/invalid-schema | Invalid Zod schema configuration |

## Validation Rules

1. Name:
   - Required
   - 3-50 characters
   - Must be unique

2. Description:
   - Required
   - Max 500 characters

3. ConfigSchema:
   - Must be a valid JSON object
   - Must be convertible to a Zod schema
   - Cannot be updated after creation

4. Deletion:
   - Cannot delete if any projects reference this type
   - Requires SUPERADMIN role

## Usage Examples

### Creating a Project Type
```json
POST /api/v1/project-types
{
  "name": "StaticWebsite",
  "description": "Configuration for static websites",
  "configSchema": {
    "hosting": {
      "type": "object",
      "properties": {
        "domain": { "type": "string" },
        "cdn": { "type": "boolean" }
      },
      "required": ["domain"]
    }
  }
}
```

### Updating a Project Type
```json
PATCH /api/v1/project-types/123
{
  "name": "UpdatedName",
  "description": "Updated description",
  "isActive": false
}
```

## Implementation Notes

1. Role Authorization:
   - All endpoints require SUPERADMIN role
   - Role check is applied at router level

2. Schema Validation:
   - ConfigSchema is validated during creation
   - Basic structure validation
   - Zod compatibility check

3. Deletion Protection:
   - Checks for existing projects using the type
   - Prevents accidental deletion of in-use types

4. Audit Logging:
   - All write operations are logged
   - Includes user ID and affected entity ID