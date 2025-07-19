# 🛠 MWAP Utilities Documentation

This document provides comprehensive documentation for all utility modules in the MWAP backend. Each utility is designed to provide specific functionality while maintaining consistency, type safety, and proper error handling.

## 📁 Available Utilities

### [🔐 Authentication](#authentication-utilities)
- User token extraction and validation
- Type-safe user information access
- Authentication helpers

### [🚨 Error Handling](#error-handling-utilities)
- Standardized error classes
- Error code system
- Type-safe error handling

### [📤 Response Formatting](#response-utilities)
- Standardized API responses
- Error response handling
- Async handler wrapper

### [✅ Validation](#validation-utilities)
- Zod schema validation
- Type-safe validation
- Consistent error handling

### [📝 Logging](#logging-utilities)
- Structured JSON logging
- Multiple log levels
- Audit trail support

## 🔐 Authentication Utilities

### Overview
The authentication utilities provide type-safe access to user information from JWT tokens and handle authentication-related operations.

### Types

#### `User`
```typescript
interface User {
  sub: string;    // Auth0 subject identifier
  email: string;  // User's email address
  name: string;   // User's display name
}
```

#### Express Request Extension
```typescript
declare global {
  namespace Express {
    interface Request {
      auth?: User;  // Decoded JWT payload
    }
  }
}
```

### Functions

#### `getUserFromToken`
```typescript
function getUserFromToken(req: Request): User
```

Extracts and validates user information from the JWT token in the request.

**Parameters:**
- `req`: Express Request object containing the decoded JWT token

**Returns:**
- `User`: Object containing validated user information

**Throws:**
- `AuthError`: When token is missing or invalid

**Example:**
```typescript
try {
  const user = getUserFromToken(req);
  console.log(`Request from user: ${user.name} (${user.email})`);
} catch (error) {
  // Handle authentication error
}
```

### Usage Notes

1. **Token Validation**
   - Always use within authenticated routes
   - Token is validated by the global `authenticateJWT` middleware in `app.ts`
   - Do not apply `authenticateJWT` middleware in individual route files
   - Throws if token is missing or invalid

2. **Error Handling**
   - Wrap in try/catch blocks
   - Handle AuthError appropriately
   - Log authentication failures

3. **Security Considerations**
   - Don't expose full user object in responses
   - Validate user permissions before operations
   - Use with role middleware for access control
   - Protect sensitive information like API documentation

## 🚨 Error Handling Utilities

### Overview
The error utilities provide a standardized error handling system with type-safe error classes and consistent error codes.

### Error Classes

#### `ApiError`
Base error class for all API errors.

```typescript
class ApiError extends Error {
  status: number;      // HTTP status code
  code: string;        // Error code identifier
  name: string;        // Error class name
}
```

#### `ValidationError`
For input validation failures.

```typescript
class ValidationError extends ApiError {
  details?: unknown;   // Validation error details
  status = 400;       // Bad Request
  code = 'validation/invalid-input';
}
```

#### `NotFoundError`
For resource not found errors.

```typescript
class NotFoundError extends ApiError {
  status = 404;       // Not Found
  code = 'resource/not-found';
}
```

#### `PermissionError`
For authorization failures.

```typescript
class PermissionError extends ApiError {
  status = 403;       // Forbidden
  code = 'auth/insufficient-permissions';
}
```

#### `AuthError`
For authentication failures.

```typescript
class AuthError extends ApiError {
  status = 401;       // Unauthorized
  code = 'auth/invalid-token';
}
```

### Error Codes

```typescript
const ERROR_CODES = {
  AUTH_ERROR: 'auth/invalid-token',
  PERMISSION_ERROR: 'auth/insufficient-permissions',
  VALIDATION_ERROR: 'validation/invalid-input',
  SERVER_ERROR: 'server/internal-error',
  NOT_FOUND: 'resource/not-found'
} as const;
```

### Usage Examples

**Basic Error Handling:**
```typescript
try {
  // Some operation
  throw new ValidationError('Invalid email format');
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof AuthError) {
    // Handle auth error
  } else {
    // Handle unknown error
  }
}
```

**With Error Details:**
```typescript
throw new ValidationError('Invalid input', {
  field: 'email',
  message: 'Must be a valid email address'
});
```

## 📤 Response Utilities

### Overview
The response utilities provide standardized response formatting and error handling for the API.

### Types

#### `ApiResponse`
```typescript
interface ApiResponse<T> {
  success: boolean;        // Operation success indicator
  data?: T;               // Response data (for success)
  error?: {               // Error information (for failure)
    code: string;         // Error code
    message: string;      // Error message
    details?: unknown;    // Additional error details
  };
}
```

### Functions

#### `jsonResponse`
```typescript
function jsonResponse<T>(res: Response, data: T, status = 200): void
```

Sends a successful JSON response with standardized format.

**Parameters:**
- `res`: Express Response object
- `data`: Response data of any type
- `status`: HTTP status code (default: 200)

**Output Format:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example"
  }
}
```

#### `errorResponse`
```typescript
function errorResponse(res: Response, error: Error): void
```

Sends an error response with standardized format.

**Parameters:**
- `res`: Express Response object
- `error`: Error object (preferably ApiError or subclass)

**Output Format:**
```json
{
  "success": false,
  "error": {
    "code": "validation/invalid-input",
    "message": "Invalid data provided",
    "details": {
      "field": "email",
      "issue": "Invalid format"
    }
  }
}
```

#### `wrapAsyncHandler`
```typescript
function wrapAsyncHandler(fn: Function): Function
```

Wraps an async route handler with error catching.

**Parameters:**
- `fn`: Async route handler function

**Returns:**
- Express middleware function with error handling

### Status Codes

The utilities handle different status codes based on error types:

| Error Type | Status Code | Description |
|------------|-------------|-------------|
| ValidationError | 400 | Bad Request |
| AuthError | 401 | Unauthorized |
| PermissionError | 403 | Forbidden |
| NotFoundError | 404 | Not Found |
| ApiError | 500 | Server Error |

## ✅ Validation Utilities

### Overview
The validation utilities provide a standardized way to validate data using Zod schemas with consistent error handling.

### Functions

#### `validateWithSchema`
```typescript
function validateWithSchema<T>(schema: z.Schema<T>, input: unknown): T
```

Validates input data against a Zod schema with standardized error handling.

**Parameters:**
- `schema`: Zod schema for validation
- `input`: Unknown data to validate

**Returns:**
- Validated and typed data matching schema

**Throws:**
- `ValidationError`: When validation fails, includes Zod error details

### Usage Examples

**Basic Validation:**
```typescript
import { z } from 'zod';
import { validateWithSchema } from '../utils/validate.js';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18)
});

try {
  const validatedUser = validateWithSchema(userSchema, {
    name: 'John',
    email: 'john@example.com',
    age: 25
  });
  // validatedUser is typed as { name: string; email: string; age: number }
} catch (error) {
  // Handle validation error
}
```

**Complex Schema Validation:**
```typescript
const projectSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['web', 'mobile', 'desktop']),
  settings: z.object({
    public: z.boolean(),
    maxUsers: z.number().positive(),
    features: z.array(z.string())
  }),
  metadata: z.record(z.string()).optional()
});

try {
  const validatedProject = validateWithSchema(projectSchema, projectData);
  // Use validated project data
} catch (error) {
  // Handle validation error
}
```

### Validation Error Format
```typescript
// When validation fails, ValidationError includes:
{
  success: false,
  error: {
    code: 'validation/invalid-input',
    message: 'Invalid input provided',
    details: [
      {
        path: ['email'],
        message: 'Invalid email address'
      },
      {
        path: ['age'],
        message: 'Must be at least 18'
      }
    ]
  }
}
```

## 📝 Logging Utilities

### Overview
The logging utilities provide structured JSON logging with support for different log levels, metadata, and audit trails.

### Functions

#### `logInfo`
```typescript
function logInfo(message: string, meta?: Record<string, unknown>): void
```

Logs informational messages with optional metadata.

**Parameters:**
- `message`: Main log message
- `meta`: Optional metadata object

**Output Format:**
```json
{
  "level": "info",
  "message": "Server started",
  "timestamp": "2025-05-08T07:35:30.457Z",
  "meta": {
    "port": 3001,
    "env": "development"
  }
}
```

#### `logError`
```typescript
function logError(message: string, error?: unknown): void
```

Logs error messages with stack traces and error details.

**Parameters:**
- `message`: Error description
- `error`: Error object or unknown error value

**Output Format:**
```json
{
  "level": "error",
  "message": "Database connection failed",
  "timestamp": "2025-05-08T07:35:30.457Z",
  "error": {
    "name": "MongoError",
    "message": "Connection timeout",
    "stack": "..."
  }
}
```

#### `logAudit`
```typescript
function logAudit(
  action: string,
  actor: string,
  target: string,
  meta?: Record<string, unknown>
): void
```

Logs audit events for security and compliance tracking.

**Parameters:**
- `action`: The action being performed
- `actor`: The user or system performing the action
- `target`: The resource being acted upon
- `meta`: Optional additional context

**Output Format:**
```json
{
  "level": "audit",
  "action": "user.delete",
  "actor": "admin@example.com",
  "target": "user123",
  "timestamp": "2025-05-08T07:35:30.457Z",
  "meta": {
    "reason": "Account inactive",
    "requestId": "req-123"
  }
}
```

## 🔧 Common Patterns

### Error Handling
All utilities follow a consistent error handling pattern:
- Use specific error types
- Include helpful messages
- Provide error details when available
- Maintain type safety

### Type Safety
TypeScript is used throughout:
- Strong type definitions
- Generic type support
- Type inference where possible
- No implicit any

### Response Format
All API responses follow a standard format:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Logging
Structured logging is used consistently:
- JSON format
- Timestamp included
- Level-based logging
- Context through metadata

## 🧠 Integration Example

Here's how multiple utilities work together:

```typescript
import { validateWithSchema } from '../utils/validate.js';
import { getUserFromToken } from '../utils/auth.js';
import { logInfo, logError } from '../utils/logger.js';
import { jsonResponse } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';

const projectSchema = z.object({
  name: z.string().min(3),
  type: z.enum(['web', 'mobile'])
});

router.post('/projects', authenticateJWT, async (req, res, next) => {
  try {
    // Get authenticated user
    const user = getUserFromToken(req);
    
    // Validate input
    const validatedData = validateWithSchema(projectSchema, req.body);
    
    // Log operation
    logInfo('Creating project', {
      userId: user.sub,
      projectName: validatedData.name
    });
    
    // Create project
    const project = await Project.create({
      ...validatedData,
      ownerId: user.sub
    });
    
    // Send response
    jsonResponse(res, project, 201);
  } catch (error) {
    logError('Project creation failed', error);
    next(error);
  }
});
```

## 🔒 Security Considerations

1. **Authentication**
   - Validate tokens properly
   - Check permissions
   - Handle session expiry
   - Protect sensitive routes

2. **Validation**
   - Sanitize inputs
   - Validate all external data
   - Use strict schemas
   - Handle validation errors

3. **Logging**
   - Avoid sensitive data
   - Structure logs securely
   - Maintain audit trails
   - Log security events

4. **Response**
   - Sanitize error messages
   - Use appropriate status codes
   - Handle errors securely
   - Protect sensitive data

## 📋 Best Practices

1. **Error Handling**
   - Always use appropriate error types
   - Include context in error messages
   - Log errors appropriately
   - Handle errors at the right level

2. **Type Safety**
   - Use TypeScript features effectively
   - Maintain strict type checking
   - Avoid type assertions
   - Let TypeScript infer types when possible

3. **Validation**
   - Validate early
   - Use Zod schemas
   - Include helpful error messages
   - Keep validation close to usage

4. **Logging**
   - Use appropriate log levels
   - Include relevant context
   - Structure logs consistently
   - Avoid sensitive information

## 🧪 Testing

Each utility should be thoroughly tested:
- Unit tests for core functionality
- Integration tests for combinations
- Error case testing
- Type testing
- Security testing

## 🔮 Future Enhancements

1. **Logging**
   - Add log aggregation
   - Enhance audit logging
   - Add log rotation
   - Improve performance

2. **Validation**
   - Add custom validators
   - Enhance error messages
   - Add validation caching
   - Support more formats

3. **Response**
   - Add pagination support
   - Enhance error details
   - Add response compression
   - Support more formats

4. **Authentication**
   - Add role caching
   - Enhance permission checks
   - Add session management
   - Support more providers

---
*These utilities ensure maintainable, scalable, and testable architecture for the MWAP platform.* 