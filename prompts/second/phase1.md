# 🟦 Phase 1: Core Infrastructure (Improved Prompt)

You are initializing the MWAP backend server. This is the infrastructure foundation required by all domains. You MUST adhere strictly to the architecture defined in `v3-architecture-reference.md` and `v3-plan.md`.

## ✅ Task

Build the complete server infrastructure to support all future APIs. Do not implement any domain logic.

## 🛠 Components to Build

```
src/config/
  - env.ts         # Load and validate .env with Zod
  - db.ts          # MongoDB connection via Mongoose
  - auth0.ts       # Auth0 JWKS client setup

src/utils/
  - auth.ts        # getUserFromToken, role helpers
  - logger.ts      # logInfo, logError, logAudit
  - response.ts    # jsonResponse, errorResponse
  - errors.ts      # ApiError, PermissionError, etc.
  - validate.ts    # validateWithSchema(Zod)

src/middleware/
  - auth.ts        # authenticateJWT() from Auth0
  - roles.ts       # requireTenantRole(), requireProjectRole()
  - errorHandler.ts# catch errors and return standard JSON

src/
  - app.ts         # Express app setup with middleware and route registration
  - server.ts      # Start app + connect DB
```

## 🔒 Requirements

- Do not generate any business logic or feature routes
- Do not add folders other than `/config`, `/utils`, `/middleware`
- Use ESModules and TypeScript
- Validate `.env` with Zod schema in `env.ts`

## ✅ Definition of Done

- `npm run build` succeeds with zero errors
- `app.ts` registers core middleware but no routers yet
- All exports follow named export style
- Use `wrapAsyncHandler()` and `jsonResponse()` in all handlers

## 🧠 Claude Constraints

- ❌ DO NOT add test scaffolds
- ❌ DO NOT include tenants, projects, or other routes
- ✅ STOP once all listed files are built and validated