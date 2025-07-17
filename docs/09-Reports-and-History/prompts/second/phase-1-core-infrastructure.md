# 🟦 Phase 1: Core Infrastructure

You are initializing the MWAP backend server. This is the infrastructure foundation required by all domains. Follow the architecture defined in `/docs/v3-architecture-reference.md` and `/docs/v3-plan.md`.

## ✅ Task

Build the complete server infrastructure to support all future APIs. Do not implement any domain logic.

## 🔍 Prerequisites

```bash
# Required Environment Variables
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://...
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.mwap.dev
```

## 🛠 Components to Build

```typescript
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
  - app.ts         # Express app setup with middleware
  - server.ts      # Start app + connect DB
```

## 📝 Schema Examples

```typescript
// env.schema.ts
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().min(1).max(65535),
  MONGODB_URI: z.string().url(),
  AUTH0_DOMAIN: z.string(),
  AUTH0_AUDIENCE: z.string().url()
});

// response.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

## ❌ Error Handling

```typescript
// Standard error codes and messages
AUTH_ERROR = 'auth/invalid-token'
PERMISSION_ERROR = 'auth/insufficient-permissions'
VALIDATION_ERROR = 'validation/invalid-input'
SERVER_ERROR = 'server/internal-error'

// Error response format
{
  "success": false,
  "error": {
    "code": "validation/invalid-input",
    "message": "Invalid input provided",
    "details": { /* validation details */ }
  }
}
```

## 🧪 Testing Requirements

1. Unit Tests (80% coverage minimum):
   - Environment validation
   - Auth middleware
   - Error handling
   - Response formatting

2. Integration Tests:
   - Database connection
   - Auth0 JWKS integration
   - Middleware chain

## 🔒 Requirements

- Use ESModules and TypeScript (`"type": "module"`)
- Validate `.env` with Zod schema
- Implement rate limiting on all routes
- Set secure headers with Helmet
- Enable CORS with proper configuration
- Log all errors with stack traces

## ✅ Definition of Done

- `npm run build` succeeds with zero errors
- All TypeScript files pass `strict` mode
- Tests pass with required coverage
- No security vulnerabilities in dependencies
- Documentation generated for utilities

## 🧠 Claude Constraints

- ❌ DO NOT add business logic or routes
- ❌ DO NOT add folders beyond specified
- ✅ STOP once infrastructure is complete
- ✅ Request review before Phase 2

## 📚 Documentation

- Update API documentation in `/docs/architecture/api.md`
- Update progress in `/status.md`
- Add utility function documentation
- Document error codes and formats
- Add environment setup guide