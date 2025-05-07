# 🏗️ MWAP Backend API Architecture Reference

## 🎯 Purpose

This document defines the **backend API server architecture** for MWAP as a general reference. It is intended to serve as the **canonical reference for OpenHands AI agents (Claude 3.5)** to understand this repository, the domain model it implements, and the coding principles it enforces.

---

## 🤖 Using with OpenHands

* This file is `repo.md` for Claude microagents
* All scaffolding tasks (routes, services, schemas) should reference this as source of truth
* Claude must not generate its own folder structures or role logic — only reuse what’s defined here

---

## 🚀 Scope

* Focus: Backend API only
* Frontend UI, deployments, and CI/CD are out of scope for this reference (but available in supporting docs)

---

## 🧱 Architectural Overview

### 1. **Domain-Driven Design**

* All modules map 1:1 to core domain entities: `Tenant`, `Project`, `ProjectType`, `CloudProvider`, etc.
* Each domain has a folder under `src/features/{domain}`

### 2. **Stack**

* **Runtime**: Node.js (v18+)
* **Web framework**: Express.js
* **Database**: MongoDB Atlas (Mongoose ODM)
* **Auth**: Auth0 JWT (RS256, JWKS)
* **Schema Validation**: Zod

---

## 📁 Folder Structure

```
/src
  /features
    /tenants              → tenant logic, routes, services
    /projects             → project logic and member APIs
    /project-types        → admin CRUD + runtime config
    /integrations         → cloud provider integrations (OAuth)
    /cloud                → file listing, metadata, and sorting
  /middleware             → auth, role, request validation
  /services               → reusable pure services across domains
  /schemas                → Zod schema definitions for all types
  /utils                  → helper methods (e.g. token tools)
  /config                 → env loading, Auth0, Mongo connection
```

---

## 📜 Coding Guidelines

### 🔹 Language & Style

* TypeScript for type safety (migrating from JS where needed)
* ES modules (no `require`, use `import`)
* Functional-first service layer (no `this`, no mutation)

### 🔸 Patterns

* **Thin Controllers**, **Fat Services**
* **Zod for all external inputs** (request body, query, Claude input)
* All Express routes must attach role middleware where applicable

### 🔐 Security

* All routes require `Bearer` token (Auth0)
* Route permissions enforced via `verifyProjectRole` or `requireRoles`

---

## 🧪 Testing

* Use `vitest` or `jest` for unit tests
* All routes must have input validation tests + role enforcement tests

---

## 🔧 MWAP Shared Utilities Overview

This docchapter describes the shared utility modules in `src/utils/`. These services provide **common functionality** needed across multiple features (e.g. tenants, projects, integrations), and must be used consistently by all controllers, services, and OpenHands-generated code.

---

### 📁 Directory Structure

```bash
src/utils/
├── auth.ts         # Auth-related helpers (roles, token parsing)
├── errors.ts       # Error types and standard exception helpers
├── logger.ts       # Application logging interface
├── response.ts     # Standardized HTTP JSON response helpers
├── validate.ts     # Zod validation and schema enforcement
```

---

### 🔐 `auth.ts`

```ts
export function getUserFromToken(req: Request): { sub: string; email: string; name: string }
export function requireTenantRole(role: 'OWNER' | 'MEMBER'): MiddlewareFn
export function requireProjectRole(role: 'OWNER' | 'DEPUTY' | 'MEMBER'): MiddlewareFn
```

---

### ⚠️ `errors.ts`

```ts
export class ApiError extends Error {
  status: number;
  constructor(message: string, status?: number)
}
export class NotFoundError extends ApiError {}
export class PermissionError extends ApiError {}
export function wrapHandler(fn: Fn): Fn  // wraps async controller
```

---

### 🪵 `logger.ts`

```ts
export function logInfo(message: string, meta?: any): void
export function logError(message: string, error?: any): void
export function logAudit(action: string, actor: string, target: string, meta?: any): void
```

---

### 📦 `response.ts`

```ts
export function jsonResponse(res: Response, data: any, status = 200): void
export function errorResponse(res: Response, err: Error): void
export function wrapAsyncHandler(fn: Fn): Fn
```

---

### ✅ `validate.ts`

```ts
export function validateWithSchema<T>(schema: ZodSchema<T>, input: unknown): T
```

---

### 🧠 OpenHands Usage

* Claude should **reuse these utilities** when generating any controller or middleware.
* No direct calls to `res.json()` or `console.error()` should occur in feature modules — they must go through `response.ts` or `logger.ts`.
* Error classes help with consistent error formatting, logging, and status codes.

---

## 🔐 MWAP Middleware Design and Structure

This document defines the organization and purpose of middleware in the MWAP backend server. All middleware functions live under `src/middleware/` and are categorized by their security, role-checking, and request pre-processing responsibilities.

---

### 📁 Folder Structure

```bash
/src/middleware
├── auth.ts          # JWT validation via Auth0 (sets req.user)
├── cors.ts          # Centralized CORS policy enforcement
├── roles.ts         # Role-based access control (project, tenant)
├── rateLimiter.ts   # Optional request throttling per IP
├── secureHeaders.ts # Helmet and header hardening (optional)
```

---

### 🔐 `auth.ts`

```ts
export function authenticateJWT(): RequestHandler // Sets req.user
```

* Validates JWT from `Authorization` header
* Verifies via Auth0 JWKS endpoint (RS256)
* Populates `req.user = { sub, email, name }`

---

### 🌐 `cors.ts`

```ts
export const corsMiddleware: RequestHandler
```

* Uses `cors` package
* Reads from allowed origins via config
* Supports credentials and custom headers

---

### 🛡️ `roles.ts`

```ts
export function requireProjectRole(...roles: Role[]): RequestHandler
export function requireTenantRole(...roles: Role[]): RequestHandler
```

* Middleware to guard routes based on user's role in current scope
* Roles: `OWNER`, `DEPUTY`, `MEMBER`
* Relies on `req.user` populated by `auth.ts`

---

### 🚦 `rateLimiter.ts` *(optional)*

```ts
export const rateLimiter: RequestHandler
```

* Uses `express-rate-limit`
* Protects login, webhook, or agent-triggered routes from abuse

---

### 🧯 `secureHeaders.ts` *(optional)*

```ts
export const applySecureHeaders: RequestHandler
```

* Uses `helmet` to apply:

  * Content-Security-Policy
  * Referrer-Policy
  * Strict-Transport-Security
  * X-Frame-Options

---

### 🧠 OpenHands Usage

* Middleware must be reused, not redefined inline in controllers
* Claude must use `authenticateJWT()` and `requireProjectRole()` rather than parsing tokens manually
* All exposed routes must apply at least one middleware from this set

---

## 🧠 MWAP Services Structure

The `src/services/` folder contains reusable, pure business logic that is shared across multiple features. These services coordinate validation, permissions, and access logic outside of specific controllers or HTTP routing.

---

### 📁 Folder Layout

```bash
/src/services/
├── auditLogger.ts      # Tracks actions performed across tenants/projects
├── projectAccess.ts    # Validates project access and member role enforcement
├── tenantContext.ts    # Loads tenant and user context from decoded token
```

---

### 🔍 File Descriptions

#### `auditLogger.ts`

```ts
export function logAudit(action: string, userId: string, target: string, meta?: any): void
```

* Captures who did what to which entity (e.g. "user X archived project Y")
* May write to a database, file log, or monitoring service

#### `projectAccess.ts`

```ts
export async function assertProjectAccess(projectId: string, userId: string, allowedRoles: Role[]): Promise<Project>
```

* Fetches project from DB
* Validates user is a member with a permitted role
* Throws `PermissionError` if check fails

#### `tenantContext.ts`

```ts
export async function resolveTenantContext(userSub: string): Promise<Tenant>
```

* Maps Auth0 `sub` → internal user and tenant
* Returns full `Tenant` object with relevant metadata

---

## ⚙️ MWAP Config Module

All runtime configuration (environment, database, Auth0 keys) is loaded via:

```bash
/src/config/
├── env.ts          # dotenv-based environment variable loader
├── db.ts           # Mongoose connection
├── auth0.ts        # JWKS client setup
```

---

### 🧠 Claude / OpenHands Notes

* Always reuse these services for access checks and tenant resolution
* Never duplicate project role validation inside controllers
* Do not access Express `req/res` inside any service file
* Services may throw `ApiError` subclasses (see `utils/errors.ts`)

---

## 📎 Roadmap References

* [Domain Map](./v3-domainmap.md)
* [API Contract](./v3-api.md)
* [OpenAPI Schema](./v3-openAPI-schema.md)
