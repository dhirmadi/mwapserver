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

## 📁 Example Paths

```yaml
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

## 📦 Example Schemas

```yaml
ProjectMember:
  type: object
  properties:
    userId:
      type: string
    role:
      type: string
      enum: [OWNER, DEPUTY, MEMBER]
  required: [userId, role]
```

```yaml
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