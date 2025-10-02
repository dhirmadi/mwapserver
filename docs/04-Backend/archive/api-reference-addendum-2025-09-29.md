---
title: API Reference Addendum (2025-09-29)
summary: Delta updates to the API reference covering tenants/me responses, my-project-membership endpoint, and OAuth refresh optional body
lastReviewed: 2025-09-29
---

This addendum documents recent API updates pending incorporation into the main `api-reference.md`.

## Tenants — Get Current User's Tenant

Endpoint: `GET /api/v1/tenants/me`

Responses:
- 200: Returns the tenant owned by the authenticated user
- 404: `{ success: false, error: { code: 'tenant/not-found', message: 'Tenant not found' } }`

## Projects — Get My Project Membership

Endpoint: `GET /api/v1/projects/:id/members/me`

Notes:
- Returns the authenticated user's membership for the given project
- If the user is not a member, returns 404: `{ success: false, error: { code: 'project/member-not-found', message: 'Member not found in project' } }`

Example Success Response:
```json
{
  "success": true,
  "data": {
    "projectId": "641f4411f24b4fcac1b1501c",
    "userId": "auth0|123",
    "role": "MEMBER"
  }
}
```

## OAuth — Refresh Integration Tokens

Endpoint: `POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh`

Request Body (optional):
```typescript
{
  force?: boolean; // If true, bypass cached validity and force refresh
}
```



