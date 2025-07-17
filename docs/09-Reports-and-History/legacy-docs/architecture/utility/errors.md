# 🚨 Error Handling Utilities

## Overview
The error utilities provide a standardized error handling system with type-safe error classes and consistent error codes.

## Error Classes

### `ApiError`
Base error class for all API errors.

```typescript
class ApiError extends Error {
  status: number;      // HTTP status code
  code: string;        // Error code identifier
  name: string;        // Error class name
}
```

### `ValidationError`
For input validation failures.

```typescript
class ValidationError extends ApiError {
  details?: unknown;   // Validation error details
  status = 400;       // Bad Request
  code = 'validation/invalid-input';
}
```

### `NotFoundError`
For resource not found errors.

```typescript
class NotFoundError extends ApiError {
  status = 404;       // Not Found
  code = 'resource/not-found';
}
```

### `PermissionError`
For authorization failures.

```typescript
class PermissionError extends ApiError {
  status = 403;       // Forbidden
  code = 'auth/insufficient-permissions';
}
```

### `AuthError`
For authentication failures.

```typescript
class AuthError extends ApiError {
  status = 401;       // Unauthorized
  code = 'auth/invalid-token';
}
```

## Error Codes

```typescript
const ERROR_CODES = {
  AUTH_ERROR: 'auth/invalid-token',
  PERMISSION_ERROR: 'auth/insufficient-permissions',
  VALIDATION_ERROR: 'validation/invalid-input',
  SERVER_ERROR: 'server/internal-error',
  NOT_FOUND: 'resource/not-found'
} as const;
```

## Usage Examples

### Basic Error Handling
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

### With Error Details
```typescript
throw new ValidationError('Invalid input', {
  field: 'email',
  message: 'Must be a valid email address'
});
```

### Custom Error Response
```typescript
throw new ApiError(
  'Custom error message',
  418,           // HTTP status
  'custom/error' // Error code
);
```

## Best Practices

1. **Error Selection**
   - Use most specific error class available
   - Include meaningful error messages
   - Add details when available

2. **Status Codes**
   - 400: ValidationError
   - 401: AuthError
   - 403: PermissionError
   - 404: NotFoundError
   - 500: ApiError (default)

3. **Error Codes**
   - Use consistent format: `domain/error-type`
   - Keep codes machine-readable
   - Document all custom codes

4. **Error Details**
   - Include validation errors
   - Add context when helpful
   - Avoid sensitive information

## Integration Example
```typescript
import { ValidationError, NotFoundError } from '../utils/errors.js';

async function updateUser(id: string, data: unknown) {
  const user = await findUser(id);
  if (!user) {
    throw new NotFoundError(`User ${id} not found`);
  }

  if (!isValidUserData(data)) {
    throw new ValidationError('Invalid user data', {
      errors: validateUserData(data)
    });
  }

  return await user.update(data);
}
```