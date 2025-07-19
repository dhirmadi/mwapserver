# 🏗️ MWAP Backend API Reference

This document serves as the canonical reference for developers and scaffolding tools during backend generation. It defines the backend API server architecture, domain model, and coding principles for the MWAP platform.

## 🎯 Purpose & Scope

### Purpose
- **Canonical Reference**: Source of truth for developers and scaffolding tools
- **Backend Generation**: Guide for all scaffolding tasks (routes, services, schemas)
- **Architecture Consistency**: Ensure consistent folder structures and role logic

### Scope
- **Focus**: Backend API only
- **Out of Scope**: Frontend UI, deployments, and CI/CD (covered in supporting docs)

## 🧱 Architectural Overview

### 1. Domain-Driven Design
- All modules map 1:1 to core domain entities: `Tenant`, `Project`, `ProjectType`, `CloudProvider`, etc.
- Each domain has a folder under `src/features/{domain}`

### 2. Technology Stack
- **Runtime**: Node.js (v18+)
- **Web Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: Auth0 JWT (RS256, JWKS)
- **Schema Validation**: Zod

## 📁 Folder Structure

```
/src
  /features
    /tenants              → tenant logic, routes, services
    /projects             → project logic and member APIs
    /project-types        → admin CRUD + runtime config
    /cloud-providers      → cloud provider configuration
    /cloud-integrations   → tenant-specific cloud integrations
    /oauth                → OAuth 2.0 callback and token management
    /files                → file listing, metadata, and sorting
    /users                → user-related endpoints
  /middleware             → auth, role, request validation
  /schemas                → Zod schema definitions for all types
  /utils                  → helper methods (e.g. token tools)
  /config                 → env loading, Auth0, Mongo connection
  /docs                   → API documentation
```

## 📜 Coding Guidelines

### Language & Style
- TypeScript for type safety (migrating from JS where needed)
- ES modules (no `require`, use `import`)
- Functional-first service layer (no `this`, no mutation)

### Patterns
- **Thin Controllers**, **Fat Services**
- **Zod for all external inputs** (request body, query, Claude input)
- All Express routes must attach role middleware where applicable

### Security
- All routes require `Bearer` token (Auth0)
- Route permissions enforced via `requireProjectRole` or `requireTenantOwner`

### Testing
- Use `vitest` for unit tests
- All routes must have input validation tests + role enforcement tests

## 🗺️ Domain Model

### 1. User
Represents an authenticated person via Auth0 (*Scope: platform*)

- **Source of Truth**: Auth0 `sub` (external ID)
- **Fields**:
  - `id`: string (Auth0 `sub`)
  - `email`: string (from Auth0 claims)
  - `name`: string (from Auth0 claims)
- **Constraints**:
  - Cannot exist without Auth0 registration
  - Can own only **one** tenant

### 2. Tenant
Represents a user-owned workspace and logical isolation unit (*Scope: tenant*)

- **Fields**:
  - `_id`: ObjectId (Mongo-generated, do not set manually)
  - `ownerId`: string (Auth0 `sub`)
  - `name`: string
  - `createdAt`: Date
  - `archived`: boolean (soft delete)
  - `integrations`: CloudProviderIntegration[]
- **Constraints**:
  - One tenant per user (enforced in DB + app layer)
  - Deletable only by superadmin (hard delete, removes all associated projects and integrations)
- **Relations**:
  - One-to-one with User
  - One-to-many with Project
  - One-to-many with CloudProviderIntegration

### 3. Project
Application instance inside a tenant with fixed config (*Scope: tenant*)

- **Fields**:
  - `_id`: ObjectId (Mongo-generated, do not set manually)
  - `tenantId`: ObjectId (references a tenant)
  - `projectTypeId`: ObjectId (references a ProjectType)
  - `cloudIntegrationId`: ObjectId (references a CloudProviderIntegration)
  - `folderpath`: string
  - `name`: string
  - `description?`: string (optional)
  - `archived`: boolean (optional soft-archive, but hard delete supported via API)
  - `members[]`: [{ User.id: string (Auth0 `sub`), role: 'OWNER' | 'DEPUTY' | 'MEMBER' }]
- **Constraints**:
  - `cloudProvider`, `folderpath`, `projectTypeId` are immutable after creation
  - `members` must include the tenant `ownerId` as `OWNER`
- **Relations**:
  - Belongs to Tenant
  - References one ProjectType
  - Has many Members (Users) max. 10

### 4. ProjectType
Defines application behavior (Sorter, Tagger, Mailer, etc) (*Scope: platform*)

- **Fields**:
  - `_id`: ObjectId (Mongo-generated, do not set manually)
  - `slug`: string (slug or shortname)
  - `name`: string
  - `description`: string
  - `entryComponent`: string
  - `configSchema?`: Zod-compatible JSON schema
  - `createdAt`: Date
  - `updatedAt`: Date
  - `createdBy`: string (Auth0 sub)
- **Constraints**:
  - Cannot be deleted once used by a project
- **Relations**:
  - Referenced by multiple Projects

### 5. CloudProvider
Represents a supported, static cloud provider (*Scope: platform*)

- **Fields**:
  - `_id`: ObjectId (Mongo-generated, do not set manually)
  - `name`: string (e.g. "Google Drive")
  - `slug`: string (e.g. "gdrive")
  - `scopes`: string[]
  - `authUrl`: string (OAuth 2.0 authorization endpoint)
  - `tokenUrl`: string (OAuth 2.0 token exchange endpoint)
  - `metadata?`: object (optional provider-specific metadata)
  - `createdAt`: Date
  - `updatedAt`: Date
  - `createdBy`: string (Auth0 sub)
- **Constraints**:
  - One document per supported provider (e.g., one for GDrive, one for Dropbox)
  - Admin-managed only (not tenant editable)
- **Usage**:
  - Referenced by integrations for configuration purposes

### 6. CloudProviderIntegration
Represents a tenant's authenticated connection to a specific `CloudProvider` (*Scope: tenant*)

- **Fields**:
  - `_id`: ObjectId (Mongo-generated, do not set manually)
  - `tenantId`: ObjectId (references Tenant)
  - `providerId`: ObjectId (references CloudProvider)
  - `clientId`: string (from the tenant's app registration)
  - `clientSecret`: string (encrypted)
  - `redirectUri`: string
  - `accessToken`: string (encrypted)
  - `refreshToken`: string (encrypted)
  - `expiresAt`: Date
  - `metadata?`: object (optional cloud-specific claims)
- **Constraints**:
  - A tenant may have at most one integration per `CloudProvider`
  - Required for any project that uses cloud access
- **Relations**:
  - Belongs to one Tenant
  - References one CloudProvider

### 7. File (Virtual)
Represents a file that exists in the cloud provider folder (*Scope: tenant*)

- **Not stored in MongoDB** – fetched at runtime via cloud APIs
- **Fields**:
  - `fileId`: string (from the cloud provider)
  - `name`: string
  - `mimeType`: string
  - `path`: string (virtualized or absolute path)
  - `status`: 'pending' | 'processed' | 'error'
  - `metadata?`: object (depends on projectType, e.g. tags, annotations)
- **Contextual Info** (retrieved from project):
  - Cloud provider is derived via the project's `cloudIntegrationId`
  - Folder path is derived via the project's `folderpath`
- **Constraints**:
  - Only visible within scope of a project + integration
  - Not persisted in local database
- **Relations**:
  - Used only in runtime workflows for sorting, tagging, mailing, etc.

### 8. SuperAdmin
Represents a platform-level administrator (*Scope: platform*)

- **Fields**:
  - `_id`: ObjectId (Mongo-generated, do not set manually)
  - `userId`: string (**Auth0 `sub`** – serves as primary identity key)
  - `createdAt`: Date
  - `createdBy`: string (Auth0 sub of the admin who created this entry)
  - `name?`: string (optional for traceability)
  - `email?`: string (optional for traceability)
- **Constraints**:
  - Must reference a valid Auth0 user
- **Relations**:
  - Platform-scoped access to all `Tenants`, `Projects`, `ProjectTypes`, `CloudProviders`
- **Permissions**:
  - Can create, update, delete `ProjectType` and `CloudProvider`
  - Can archive/unarchive any `Tenant` or `Project`

### Entity Relationship Diagram

```
User (1) ←→ (0..1) Tenant
Tenant (1) ←→ (*) Project
Project (*) ←→ (1) ProjectType
Tenant (1) ←→ (*) CloudIntegration
CloudIntegration (*) ←→ (1) CloudProvider
Project (1) ←→ (*) File
User (*) ←→ (*) Project (through ProjectMember)
SuperAdmin ||--o{ Tenant : administers
SuperAdmin ||--o{ Project : administers
SuperAdmin ||--o{ ProjectType : manages
SuperAdmin ||--o{ CloudProvider : manages
```

## 🔧 Shared Utilities

The shared utility modules in `src/utils/` provide common functionality needed across multiple features. These services must be used consistently by all controllers, services, and generated code.

### Authentication Utils (`auth.ts`)
```typescript
export function getUserFromToken(req: Request): { sub: string; email: string; name: string }
export function requireTenantRole(role: 'OWNER' | 'MEMBER'): MiddlewareFn
export function requireProjectRole(role: 'OWNER' | 'DEPUTY' | 'MEMBER'): MiddlewareFn
```

### Error Utils (`errors.ts`)
```typescript
export class ApiError extends Error {
  status: number;
  constructor(message: string, status?: number)
}
export class NotFoundError extends ApiError {}
export class PermissionError extends ApiError {}
export function wrapHandler(fn: Fn): Fn  // wraps async controller
```

### Logging Utils (`logger.ts`)
```typescript
export function logInfo(message: string, meta?: any): void
export function logError(message: string, error?: any): void
export function logAudit(action: string, actor: string, target: string, meta?: any): void
```

### Response Utils (`response.ts`)
```typescript
export function jsonResponse(res: Response, data: any, status = 200): void
export function errorResponse(res: Response, err: Error): void
export function wrapAsyncHandler(fn: Fn): Fn
```

### Validation Utils (`validate.ts`)
```typescript
export function validateWithSchema<T>(schema: ZodSchema<T>, input: unknown): T
```

## 🔐 Middleware Design

All middleware functions live under `src/middleware/` and are categorized by their security, role-checking, and request pre-processing responsibilities.

### Authentication (`auth.js`)
```typescript
export function authenticateJWT(): RequestHandler // Sets req.user
```
- Validates JWT from `Authorization` header
- Verifies via Auth0 JWKS endpoint (RS256)
- Populates `req.user = { sub, email, name }`

### Authorization (`authorization.js`)
```typescript
export function requireSuperAdminRole(): RequestHandler
export function requireTenantOwner(tenantIdParam: string): RequestHandler
export function requireTenantOwnerOrSuperAdmin(tenantIdParam: string): RequestHandler
```
- Middleware to guard routes based on user's role in current scope
- Checks for superadmin role or tenant ownership
- Relies on `req.user` populated by `auth.js`

### Project Roles (`roles.js`)
```typescript
export function requireProjectRole(role: 'OWNER' | 'DEPUTY' | 'MEMBER'): RequestHandler
```
- Middleware to guard routes based on user's role in a project
- Roles: `OWNER`, `DEPUTY`, `MEMBER`
- Relies on `req.user` populated by `auth.js`

## 🧠 Services Structure

The `src/services/` folder contains reusable, pure business logic that is shared across multiple features.

### Audit Logger (`auditLogger.ts`)
```typescript
export function logAudit(action: string, userId: string, target: string, meta?: any): void
```
- Captures who did what to which entity
- May write to a database, file log, or monitoring service

### Project Access (`projectAccess.ts`)
```typescript
export async function assertProjectAccess(projectId: string, userId: string, allowedRoles: Role[]): Promise<Project>
```
- Fetches project from DB
- Validates user is a member with a permitted role
- Throws `PermissionError` if check fails

### Tenant Context (`tenantContext.ts`)
```typescript
export async function resolveTenantContext(userSub: string): Promise<Tenant>
```
- Maps Auth0 `sub` → internal user and tenant
- Returns full `Tenant` object with relevant metadata

## ⚙️ Configuration Management

All runtime configuration (environment, database, Auth0 keys) is loaded via:

```
/src/config/
├── env.ts          # dotenv-based environment variable loader
├── db.ts           # Mongoose connection
├── auth0.ts        # JWKS client setup
```

## 🧠 Usage Guidelines

### For Developers
- Always reuse these services for access checks and tenant resolution
- Never duplicate project role validation inside controllers
- Do not access Express `req/res` inside any service file
- Services may throw `ApiError` subclasses (see `utils/errors.ts`)

### For OpenHands/Claude
- **Reuse these utilities** when generating any controller or middleware
- No direct calls to `res.json()` or `console.error()` should occur in feature modules
- They must go through `response.ts` or `logger.ts`
- Error classes help with consistent error formatting, logging, and status codes
- Middleware must be reused, not redefined inline in controllers
- Use `authenticateJWT()` and `requireProjectRole()` rather than parsing tokens manually
- All exposed routes must apply at least one middleware from this set

### Security Requirements
- All routes require `Bearer` token (Auth0)
- Route permissions enforced via `requireProjectRole` or `requireTenantOwner`
- Tools must not generate their own folder structures or role logic — only reuse what's defined here

## 📎 Related Documentation

- [Main Architecture](./architecture.md) - Comprehensive system architecture
- [User Flows](./user-flows.md) - User interaction patterns and workflows
- [Utilities](./utilities.md) - Detailed utility documentation

---
*This reference document serves as the authoritative guide for backend development and scaffolding in the MWAP platform.* 