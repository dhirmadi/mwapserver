# 🟧 Phase 5: Cloud Integrations Domain

Implement the cloud provider integration system. Follow the architecture in `/docs/v3-architecture-reference.md`.

## ✅ Task

Create endpoints for managing tenant cloud provider integrations with OAuth2 and API key support.

## 🔍 Prerequisites

- Phases 1-4 complete and tested
- Cloud providers operational
- Tenant management operational
- Field-level encryption configured

## 📦 API Endpoints

### GET /api/v1/tenants/:id/integrations
```typescript
// Response
interface IntegrationsResponse {
  data: Array<{
    id: string;
    tenantId: string;
    providerId: string;
    name: string;
    status: 'active' | 'inactive';
    authType: 'oauth2' | 'apikey';
    createdAt: string;
    updatedAt: string;
  }>;
}
```

### POST /api/v1/tenants/:id/integrations
```typescript
// Request
interface CreateIntegrationRequest {
  providerId: string;
  name: string;
  // For OAuth2
  code?: string;
  redirectUri?: string;
  // For API Key
  credentials?: {
    apiKey: string;
    secretKey?: string;
  };
}

// Response: IntegrationResponse
```

### DELETE /api/v1/tenants/:id/integrations/:integrationId
```typescript
// Response
{
  "success": true
}
```

## 📝 Schema Definition

```typescript
// cloudIntegration.schema.ts
export const integrationSchema = z.object({
  providerId: z.string().uuid(),
  name: z.string().min(3).max(50),
  status: z.enum(['active', 'inactive']).default('active'),
  authType: z.enum(['oauth2', 'apikey']),
  // OAuth2 fields
  oauth2: z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresAt: z.string().datetime(),
    scope: z.string()
  }).optional(),
  // API Key fields
  apiKey: z.object({
    key: z.string(),
    secret: z.string().optional()
  }).optional()
});

// Validation ensures either oauth2 or apiKey is present based on authType
```

## ❌ Error Handling

```typescript
// Error codes
INTEGRATION_NOT_FOUND = 'integration/not-found'
INTEGRATION_EXISTS = 'integration/already-exists'
INVALID_CREDENTIALS = 'integration/invalid-credentials'
OAUTH_ERROR = 'integration/oauth-error'

// Example error
{
  "success": false,
  "error": {
    "code": "integration/already-exists",
    "message": "Integration already exists for this provider",
    "details": { 
      "tenantId": "123",
      "providerId": "456"
    }
  }
}
```

## 🧪 Testing Requirements

1. Unit Tests (90% coverage):
   - Schema validation
   - Credential encryption
   - OAuth2 flow
   - API key validation

2. Integration Tests:
   - Provider integration
   - OAuth2 workflow
   - API key workflow
   - Error handling

## 🛠 Implementation Files

```typescript
src/features/integrations/
  - integrations.routes.ts    # Route definitions
  - integrations.controller.ts# Request handling
  - integrations.service.ts   # Business logic
  - oauth2.service.ts        # OAuth2 specific logic
  - encryption.service.ts    # Credential encryption

src/schemas/
  - cloudIntegration.schema.ts# Type definitions
```

## 🔒 Business Rules

- One integration per provider per tenant
- Encrypt all sensitive credentials
- Validate provider exists and is active
- Handle OAuth2 token refresh
- Audit log all changes

## ✅ Definition of Done

- All endpoints implemented
- Encryption working
- OAuth2 flow tested
- API key validation complete
- Tests passing with coverage
- Documentation updated

## 🧠 Claude Constraints

- ❌ DO NOT store raw credentials
- ❌ DO NOT skip encryption
- ❌ DO NOT ignore token expiry
- ✅ Use Phase 1 utilities
- ✅ STOP after testing

## 📚 Documentation

- Update API docs in `/docs/api.md`
- Update progress in `/status.md`
- Document OAuth2 flow
- Add integration guide
- Document security measures