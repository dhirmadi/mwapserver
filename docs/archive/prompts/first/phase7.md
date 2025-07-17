🔧 Proceed to Phase 7: Virtual Files (Read-only)

- Implement `GET /api/v1/projects/:id/files`
- Return an array of virtual files derived from:
  - Project’s `folderpath`
  - Linked CloudProviderIntegration
- No DB persistence — files are computed at runtime via cloud API calls
- Role: Only `OWNER`, `DEPUTY`, or `MEMBER` of project may access
- Response must include `fileId`, `name`, `mimeType`, `path`, and optional metadata
- Enforce access via `assertProjectAccess()` and log all access events
