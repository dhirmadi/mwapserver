# 🟧 Phase 6: Integrations (Improved Prompt)

Support linking tenants to cloud providers using OAuth integrations.

## 📦 Endpoints

- GET `/api/v1/tenants/:id/integrations`
- POST `/api/v1/tenants/:id/integrations`
- DELETE `/api/v1/tenants/:id/integrations/:integrationId`

## 🛠 Files

```
src/features/integrations/
  - integrations.routes.ts
  - integrations.controller.ts
  - integrations.service.ts

src/schemas/
  - cloudIntegration.schema.ts
```

## 🔒 Constraints

- Only one integration per provider per tenant
- Sensitive fields (tokens) must be encrypted