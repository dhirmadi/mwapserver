# 📘 MWAP API – OpenAPI Specification (v1)

This is the complete and canonical OpenAPI 3.1 definition for the MWAP backend API, aligned with the domain model, coding standards, and Claude/OpenHands usage.

---

## 📄 Metadata

- **OpenAPI Version**: 3.1.0  
- **Title**: MWAP API  
- **Version**: 1.0.0  
- **Base URL**: `https://api.mwap.dev/api/v1`  
- **Auth**: `Bearer` token via Auth0 (RS256)

---

## 🔐 Security Schemes

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## 🧱 Core Resources

This spec includes full coverage for:

- `/tenants` → create, update, delete (admin), me
- `/projects` → full CRUD + `members` subresource
- `/cloud-providers` → static provider registry (admin only)
- `/integrations` → per-tenant cloud auth tokens
- `/project-types` → admin-defined UI/agent schemas
- `/files` → virtual read-only folder listing
- `/agents` → microagent triggers (sort, tag, mail)

---

## 📁 API Paths

### Tenant Endpoints

```yaml
/api/v1/tenants:
  post:
    summary: Create new tenant
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
                example: "Test Tenant"
              settings:
                type: object
                properties:
                  allowPublicProjects:
                    type: boolean
                    default: false
                  maxProjects:
                    type: integer
                    minimum: 1
                    default: 10
    responses:
      201:
        description: Tenant created successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TenantResponse'
      409:
        description: User already has a tenant
      422:
        description: Invalid input data

/api/v1/tenants/me:
  get:
    summary: Get current user's tenant
    security:
      - bearerAuth: []
    responses:
      200:
        description: OK
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TenantResponse'
      404:
        description: Tenant not found

/api/v1/tenants/{id}:
  parameters:
    - name: id
      in: path
      required: true
      schema:
        type: string
  patch:
    summary: Update tenant
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
              settings:
                type: object
                properties:
                  allowPublicProjects:
                    type: boolean
                  maxProjects:
                    type: integer
                    minimum: 1
              archived:
                type: boolean
    responses:
      200:
        description: Tenant updated successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TenantResponse'
      403:
        description: Not authorized to update tenant
      404:
        description: Tenant not found
  delete:
    summary: Delete tenant (superadmin only)
    security:
      - bearerAuth: []
    responses:
      204:
        description: Tenant deleted successfully
      403:
        description: Not authorized to delete tenant
      404:
        description: Tenant not found

### Project Member Example
/api/v1/projects/{id}/members:
  get:
    summary: List project members
    security:
      - bearerAuth: []
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: OK
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/ProjectMember'
  post:
    summary: Add project member
    ...
```

---

## 📦 Schemas

```yaml
TenantResponse:
  type: object
  properties:
    success:
      type: boolean
      example: true
    data:
      type: object
      properties:
        _id:
          type: string
          example: "681f4411f24b4fcac1b1501b"
        name:
          type: string
          example: "Acme Corporation"
        ownerId:
          type: string
          example: "user123@clients"
        settings:
          type: object
          properties:
            allowPublicProjects:
              type: boolean
              default: false
            maxProjects:
              type: integer
              minimum: 1
              default: 10
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        archived:
          type: boolean
          default: false
      required:
        - _id
        - name
        - ownerId
        - settings
        - createdAt
        - updatedAt
        - archived

ProjectMember:
  type: object
  properties:
    userId:
      type: string
    role:
      type: string
      enum: [OWNER, DEPUTY, MEMBER]
  required: [userId, role]

Project:
  type: object
  properties:
    _id: { type: string }
    name: { type: string }
    folderpath: { type: string }
    ...
    members:
      type: array
      items:
        $ref: '#/components/schemas/ProjectMember'
```

---