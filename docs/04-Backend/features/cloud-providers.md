# 📘 Cloud Providers Feature Documentation

## 🎯 Overview

The Cloud Providers feature enables platform administrators to manage supported cloud storage providers (like Google Drive, Dropbox, etc.) that can be integrated with tenant workspaces. This feature is a prerequisite for the Cloud Integrations feature, which will allow tenants to connect their workspaces to these providers.

## 🔑 Key Concepts

- **Cloud Provider**: A supported external storage service (e.g., Google Drive, Dropbox)
- **OAuth Configuration**: Authentication details required to connect to the provider
- **Admin-Only Management**: Only superadmins can create, update, or delete providers
- **Provider Metadata**: Additional configuration specific to each provider

## 📋 API Endpoints

| Endpoint                      | Method | Role       | Description                       |
|-------------------------------|--------|------------|-----------------------------------|
| `/api/v1/cloud-providers`     | GET    | SUPERADMIN | List all cloud providers          |
| `/api/v1/cloud-providers/:id` | GET    | SUPERADMIN | Get a specific cloud provider     |
| `/api/v1/cloud-providers`     | POST   | SUPERADMIN | Create a new cloud provider       |
| `/api/v1/cloud-providers/:id` | PATCH  | SUPERADMIN | Update an existing cloud provider |
| `/api/v1/cloud-providers/:id` | DELETE | SUPERADMIN | Delete a cloud provider           |

## 📊 Data Model

```typescript
interface CloudProvider {
  _id: ObjectId;
  name: string;           // Display name (e.g., "Google Drive")
  slug: string;           // Unique identifier (e.g., "gdrive")
  scopes: string[];       // OAuth scopes required for access
  authUrl: string;        // OAuth 2.0 authorization endpoint
  tokenUrl: string;       // OAuth 2.0 token exchange endpoint
  metadata?: object;      // Provider-specific configuration
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;      // Auth0 sub of the admin who created it
}
```

## 🔒 Security Considerations

- All endpoints require authentication via Auth0 JWT
- All operations require SUPERADMIN role
- Provider credentials (client IDs, secrets) are managed separately in tenant integrations
- Providers cannot be deleted if they are in use by any tenant integrations

## 🧩 Implementation Details

### Schema Validation

The Cloud Provider schema enforces:
- Unique name and slug values
- Valid URL format for OAuth endpoints
- Array of required OAuth scopes
- Optional metadata object for provider-specific configuration

### Business Rules

1. **Uniqueness**: Each provider must have a unique name and slug
2. **Deletion Protection**: Providers in use by tenant integrations cannot be deleted
3. **Admin-Only**: All operations require SUPERADMIN role
4. **Audit Logging**: All write operations are logged with the acting user's ID

### Error Codes

| Code                         | Status | Description                                      |
|------------------------------|--------|--------------------------------------------------|
| `cloud-provider/not-found`   | 404    | The requested cloud provider does not exist      |
| `cloud-provider/name-exists` | 409    | A provider with the given name already exists    |
| `cloud-provider/slug-exists` | 409    | A provider with the given slug already exists    |
| `cloud-provider/in-use`      | 409    | The provider is in use by tenant integrations    |
| `cloud-provider/invalid-input`| 400   | The request contains invalid data                |

## 🔄 Integration Points

- **Tenant Integrations**: Cloud providers are referenced by tenant integrations
- **Projects**: Projects may use cloud providers via tenant integrations
- **Virtual Files**: Files are accessed through cloud provider APIs

## 📝 Usage Examples

### Creating a Cloud Provider (Google Drive)

```json
POST /api/v1/cloud-providers
{
  "name": "Google Drive",
  "slug": "gdrive",
  "scopes": ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.metadata.readonly"],
  "authUrl": "https://accounts.google.com/o/oauth2/auth",
  "tokenUrl": "https://oauth2.googleapis.com/token",
  "metadata": {
    "apiVersion": "v3",
    "rootFolderType": "drive"
  }
}
```

### Updating a Cloud Provider

```json
PATCH /api/v1/cloud-providers/60a1b2c3d4e5f6g7h8i9j0k1
{
  "scopes": ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.metadata.readonly", "https://www.googleapis.com/auth/drive.file"],
  "metadata": {
    "apiVersion": "v3",
    "rootFolderType": "drive",
    "allowSharedDrives": true
  }
}
```

## 🔜 Future Enhancements

- Provider-specific validation rules
- Support for non-OAuth authentication methods
- Automatic discovery of provider capabilities
- Provider status monitoring
- Rate limit configuration per provider