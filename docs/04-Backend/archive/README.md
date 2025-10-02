# Backend Documentation Archive

This directory contains archived backend documentation files that have been superseded by newer implementations or consolidated into other documents.

## Archived Files

### api-reference-addendum-2025-09-29.md
**Archived:** 2024-10-01  
**Reason:** Temporary addendum document with delta updates that have been fully incorporated into the main `api-reference.md`.

**Content Summary:**
- Tenants `/me` endpoint response documentation
- Projects `/members/me` endpoint documentation
- OAuth refresh endpoint optional body parameter

**Replacement:** All content now in [api-reference.md](../api-reference.md)

---

### v3-openAPI.yaml
**Archived:** 2024-10-01  
**Reason:** Static OpenAPI specification file replaced by dynamic generation from actual implementation.

**Content Summary:**
- Complete OpenAPI 3.1 specification
- All endpoint definitions and schemas
- Authentication and security schemes

**Replacement:** 
- **Dynamic Endpoint:** `GET /api/v1/openapi?format=yaml` or `GET /api/v1/openapi?format=json`
- **Interactive UI:** Navigate to `/docs` (requires authentication)
- **Documentation:** See [api-reference.md](../api-reference.md) for OpenAPI management endpoints

**Benefits of Dynamic Generation:**
- Always synchronized with actual implementation
- Includes all newly added endpoints automatically
- No manual maintenance required
- Supports multiple output formats (JSON, YAML)
- Includes validation and security auditing

---

## Restoration

If you need to reference any archived content:

1. **For API documentation:** Use [api-reference.md](../api-reference.md) or [api-quickreference.md](../api-quickreference.md)
2. **For OpenAPI specification:** Access the live endpoint at `/api/v1/openapi`
3. **For historical context:** Review the archived files in this directory

---

*Last updated: 2024-10-01*


