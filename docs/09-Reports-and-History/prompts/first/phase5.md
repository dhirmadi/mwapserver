🔧 Proceed to Phase 5: Cloud Providers

- Implement admin-only CRUD routes for `/api/v1/cloud-providers`
- Use Zod schema for fields like `slug`, `scopes[]`, `authUrl`, `tokenUrl`, `metadata`
- Only `SUPERADMIN` can create, edit, or delete providers
- Each provider is static, referenced by tenant integrations
- Validate uniqueness of provider slugs (e.g. `"gdrive"`, `"dropbox"`)
- Reuse shared middleware, response helpers, and audit logger
