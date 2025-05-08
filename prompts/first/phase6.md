🔧 Proceed to Phase 6: Cloud Provider Integrations

- Implement `/api/v1/tenants/:id/integrations` (GET, POST, DELETE)
- Use `OWNER`-only access at tenant level
- Each integration links a Tenant to a static CloudProvider
- Enforce constraint: One integration per CloudProvider per Tenant
- Fields: `clientId`, `clientSecret`, `accessToken`, `refreshToken`, `expiresAt`
- Credentials must be encrypted at rest (simulate encryption if needed)
- Reuse Zod schemas, audit logger, and `requireTenantRole('OWNER')`
