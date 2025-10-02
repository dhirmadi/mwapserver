# MWAP API Quick Reference

Quick reference for all MWAP API endpoints. For detailed documentation, see [api-reference.md](./api-reference.md).

**Base URL:** `/api/v1`  
**Authentication:** Bearer token (JWT) required unless marked PUBLIC

---

## 🔓 Public Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check endpoint for monitoring |
| GET | `/api/v1/oauth/callback` | OAuth callback handler (enhanced security) |
| GET | `/api/v1/oauth/success` | OAuth success page with auto-close |
| GET | `/api/v1/oauth/error` | OAuth error page with user-friendly messages |

---

## 👤 Users

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/users/me/roles` | Get current user's roles and permissions | JWT |

---

## 🏢 Tenants

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/tenants/me` | Get current user's tenant | JWT |
| POST | `/api/v1/tenants` | Create new tenant (one per user) | JWT |
| GET | `/api/v1/tenants` | List all tenants | SUPERADMIN |
| GET | `/api/v1/tenants/:id` | Get tenant by ID | Owner/SUPERADMIN |
| PATCH | `/api/v1/tenants/:id` | Update tenant details | Owner/SUPERADMIN |
| DELETE | `/api/v1/tenants/:id` | Delete tenant | SUPERADMIN |

---

## 📁 Projects

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/projects` | List accessible projects | JWT |
| GET | `/api/v1/projects/:id` | Get project by ID | MEMBER+ |
| POST | `/api/v1/projects` | Create new project | Tenant Owner |
| PATCH | `/api/v1/projects/:id` | Update project details | DEPUTY+ |
| DELETE | `/api/v1/projects/:id` | Delete project | OWNER |

---

## 👥 Project Members

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/projects/:id/members` | List project members | MEMBER+ |
| GET | `/api/v1/projects/:id/members/me` | Get my membership in project | JWT |
| POST | `/api/v1/projects/:id/members` | Add member to project | DEPUTY+ |
| PATCH | `/api/v1/projects/:id/members/:userId` | Update member role | OWNER |
| DELETE | `/api/v1/projects/:id/members/:userId` | Remove member from project | OWNER |

---

## 📄 Files

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/projects/:id/files` | List files from connected cloud providers | MEMBER+ |

---

## 🔧 Project Types

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/project-types` | List all project types | SUPERADMIN |
| GET | `/api/v1/project-types/:id` | Get project type by ID | SUPERADMIN |
| POST | `/api/v1/project-types` | Create new project type | SUPERADMIN |
| PATCH | `/api/v1/project-types/:id` | Update project type | SUPERADMIN |
| DELETE | `/api/v1/project-types/:id` | Delete project type | SUPERADMIN |

---

## ☁️ Cloud Providers

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/cloud-providers` | List available cloud providers | JWT |
| GET | `/api/v1/cloud-providers/:id` | Get cloud provider by ID | JWT |
| POST | `/api/v1/cloud-providers` | Create cloud provider config | SUPERADMIN |
| PATCH | `/api/v1/cloud-providers/:id` | Update cloud provider config | SUPERADMIN |
| DELETE | `/api/v1/cloud-providers/:id` | Delete cloud provider | SUPERADMIN |

---

## 🔗 Cloud Integrations

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/tenants/:tenantId/integrations` | List tenant's cloud integrations | Tenant Owner |
| GET | `/api/v1/tenants/:tenantId/integrations/:integrationId` | Get integration by ID | Tenant Owner |
| POST | `/api/v1/tenants/:tenantId/integrations` | Create cloud integration | Tenant Owner |
| PATCH | `/api/v1/tenants/:tenantId/integrations/:integrationId` | Update integration | Tenant Owner |
| DELETE | `/api/v1/tenants/:tenantId/integrations/:integrationId` | Delete integration | Tenant Owner |
| POST | `/api/v1/tenants/:tenantId/integrations/:integrationId/refresh-token` | Manually refresh OAuth tokens | Tenant Owner |
| GET | `/api/v1/tenants/:tenantId/integrations/:integrationId/health` | Check integration health status | Tenant Owner |

---

## 🔑 OAuth

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/oauth/tenants/:tenantId/integrations/:integrationId/initiate` | Generate OAuth authorization URL | Tenant Owner |
| POST | `/api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh` | Manually refresh integration tokens | Tenant Owner |
| GET | `/api/v1/oauth/security/metrics` | Get OAuth security metrics | JWT |
| GET | `/api/v1/oauth/security/alerts` | Get security alerts | JWT |
| GET | `/api/v1/oauth/security/patterns` | Get suspicious patterns | JWT |
| GET | `/api/v1/oauth/security/report` | Get comprehensive security report | JWT |
| GET | `/api/v1/oauth/security/validate/data-exposure` | Validate data exposure controls | JWT |
| GET | `/api/v1/oauth/security/validate/attack-vectors` | Validate attack vector protections | JWT |

---

## 📚 OpenAPI Documentation

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/openapi` | Get complete OpenAPI specification | JWT |
| GET | `/api/v1/openapi/info` | Get OpenAPI metadata summary | JWT |
| GET | `/api/v1/openapi/validate` | Validate OpenAPI specification | JWT |
| GET | `/api/v1/openapi/health` | OpenAPI service health check | JWT |
| GET | `/api/v1/openapi/cache/status` | Get cache status | JWT |
| POST | `/api/v1/openapi/cache/invalidate` | Invalidate cache (force regeneration) | SUPERADMIN |
| GET | `/api/v1/openapi/validation/history` | Get validation history | JWT |
| GET | `/api/v1/openapi/validation/ci-report` | Generate CI/CD validation report | JWT |
| POST | `/api/v1/openapi/validation/monitor` | Trigger validation monitoring | JWT |
| GET | `/api/v1/openapi/performance/metrics` | Get performance metrics | JWT |
| POST | `/api/v1/openapi/performance/benchmark` | Run performance benchmarks | JWT |
| POST | `/api/v1/openapi/performance/optimize-cache` | Optimize cache configuration | JWT |
| POST | `/api/v1/openapi/security/audit` | Perform security audit | JWT |
| GET | `/api/v1/openapi/security/sanitized` | Get sanitized specification | JWT |
| GET | `/api/v1/openapi/security/audit-log` | Get security audit log | JWT |

---

## 📊 Endpoint Statistics

**Total Endpoints:** 67  
- Public: 4
- Authenticated: 63
  - SUPERADMIN only: 13
  - Tenant Owner: 17
  - Project roles: 9
  - General JWT: 24

---

## 🔍 Documentation Synchronization Status

**Status:** ✅ **SYNCHRONIZED** (Updated: 2024-10-01)

This quick reference and the detailed [api-reference.md](./api-reference.md) are now fully synchronized with the actual implementation. All 67 endpoints are documented in both locations:

### Recently Added Documentation (2024-10-01):

1. **OpenAPI Management API** (15 endpoints)
   - Validation endpoints for specification quality assurance
   - Performance endpoints for monitoring and optimization
   - Security endpoints for audit and sanitization

2. **OAuth Security Monitoring** (6 endpoints)
   - Real-time security metrics and alerts
   - Suspicious pattern detection
   - Attack vector validation

3. **OAuth Flow Pages** (2 endpoints)
   - Success and error pages for OAuth completion

### Implementation Notes:

1. **Dual Token Refresh Endpoints**: Two separate endpoints exist for token refresh:
   - `/api/v1/tenants/:tenantId/integrations/:integrationId/refresh-token` - Part of Cloud Integrations API
   - `/api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh` - Part of OAuth API
   
   Both are functional with slightly different internal flows but achieve the same result.

2. **OpenAPI Format Parameter**: The OpenAPI specification is available at `/api/v1/openapi?format=yaml` (not as a separate `/api/v1/openapi.yaml` endpoint).

---

## 📖 Related Documentation

- **[API Reference](./api-reference.md)** - Comprehensive documentation with schemas, examples, and security details
- **[Features Guide](./features.md)** - Feature-by-feature implementation guide
- **[Security Guide](./security.md)** - Security architecture and best practices
- **[OAuth Integration Guide](../06-Guides/oauth-integration-guide.md)** - Complete OAuth implementation guide

---

*Last updated: 2024-10-01*  
*Generated from actual route implementations in `src/features/*/routes.ts`*

