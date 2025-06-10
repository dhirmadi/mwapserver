# 📘 Virtual Files Feature Documentation

## 🎯 Overview

The Virtual Files feature enables projects to access and manage files stored in cloud storage providers. Unlike other entities in the system, files are not persisted in the database but are fetched at runtime from the configured cloud provider for each project.

## 🔑 Key Concepts

- **Virtual Files**: Files that exist in cloud storage but are accessed through the MWAP API
- **Cloud Provider Integration**: Connection to a cloud storage service (Google Drive, Dropbox, OneDrive)
- **Project Context**: Files are always accessed within the context of a specific project
- **Role-Based Access**: File access is controlled by project member roles

## 📋 API Endpoints

| Endpoint                     | Method | Role                        | Description                       |
|------------------------------|--------|----------------------------|-----------------------------------|
| `/api/v1/projects/:id/files` | GET    | OWNER, DEPUTY, MEMBER      | List files for a project          |

## 📊 Data Model

```typescript
interface File {
  fileId: string;         // ID from the cloud provider
  name: string;           // File name
  mimeType: string;       // MIME type
  path: string;           // Path in the cloud storage
  status: 'pending' | 'processed' | 'error'; // Processing status
  size?: number;          // File size in bytes
  createdAt?: Date;       // Creation timestamp
  modifiedAt?: Date;      // Last modification timestamp
  metadata?: {            // Provider-specific metadata
    isFolder?: boolean;   // Whether the item is a folder
    webViewLink?: string; // Link to view in browser
    [key: string]: any;   // Other provider-specific fields
  };
}
```

## 🔒 Security Considerations

- All endpoints require authentication via Auth0 JWT
- File operations are restricted based on project member roles
- Files are only accessible within the context of a project
- Cloud provider access tokens are securely stored and managed
- No sensitive file data is persisted in the MWAP database

## 🧩 Implementation Details

### Cloud Provider Integration

The Virtual Files feature supports multiple cloud storage providers:

1. **Google Drive**
   - Uses the Google Drive API v3
   - Requires OAuth 2.0 authentication
   - Supports folder navigation and file listing

2. **Dropbox**
   - Uses the Dropbox API v2
   - Requires OAuth 2.0 authentication
   - Supports folder navigation and file listing

3. **OneDrive**
   - Uses the Microsoft Graph API
   - Requires OAuth 2.0 authentication
   - Supports folder navigation and file listing

### File Listing

The file listing endpoint supports:
- Filtering by folder path
- Recursive listing of subfolders
- Filtering by file types
- Pagination of results

### Error Handling

| Code                                   | Status | Description                                      |
|---------------------------------------|--------|--------------------------------------------------|
| `file/not-found`                      | 404    | The requested file does not exist                |
| `file/project-not-found`              | 404    | The referenced project does not exist            |
| `file/cloud-integration-not-found`    | 404    | The cloud integration does not exist             |
| `file/cloud-provider-error`           | 500    | Error communicating with the cloud provider      |
| `file/unauthorized`                   | 403    | The user is not authorized for this operation    |
| `file/invalid-path`                   | 400    | The specified path is invalid                    |
| `file/invalid-query`                  | 400    | The query parameters are invalid                 |
| `file/integration-error`              | 500    | Error with the cloud integration                 |
| `file/token-expired`                  | 401    | The cloud provider access token has expired      |

## 🔄 Integration Points

- **Projects**: Files are accessed within the context of a project
- **Cloud Integrations**: Files are fetched using the project's cloud integration
- **Cloud Providers**: The integration uses the configured cloud provider's API

## 📝 Usage Examples

### Listing Files in a Project

```
GET /api/v1/projects/60a1b2c3d4e5f6g7h8i9j0k4/files?folder=/documents&recursive=true
```

Response:
```json
[
  {
    "fileId": "1aBcDeFgHiJkLmNoPqRsTuVwXyZ",
    "name": "report.pdf",
    "mimeType": "application/pdf",
    "path": "/documents/report.pdf",
    "status": "pending",
    "size": 1048576,
    "createdAt": "2025-06-01T12:00:00Z",
    "modifiedAt": "2025-06-05T15:30:00Z",
    "metadata": {
      "webViewLink": "https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view",
      "isFolder": false
    }
  },
  {
    "fileId": "2aBcDeFgHiJkLmNoPqRsTuVwXyZ",
    "name": "images",
    "mimeType": "folder",
    "path": "/documents/images",
    "status": "pending",
    "metadata": {
      "isFolder": true
    }
  }
]
```

### Query Parameters

| Parameter   | Type      | Description                                      |
|-------------|-----------|--------------------------------------------------|
| `folder`    | string    | Path to the folder to list (default: root)       |
| `recursive` | boolean   | Whether to list files in subfolders (default: false) |
| `fileTypes` | string[]  | Filter by file types (e.g., "pdf,docx")          |
| `limit`     | number    | Maximum number of files to return (default: 100) |
| `page`      | number    | Page number for pagination (default: 1)          |

## 🔜 Future Enhancements

- File upload functionality
- File download functionality
- File metadata editing
- File search capabilities
- File content preview
- File sharing between projects
- File versioning support
- File tagging and categorization
- Integration with more cloud providers
- Support for file operations (copy, move, rename, delete)