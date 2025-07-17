# 🛠 MWAP Utility Documentation

## Overview
This directory contains detailed documentation for all utility modules in the MWAP backend. Each utility is designed to provide a specific set of functionality while maintaining consistency, type safety, and proper error handling.

## Available Utilities

### [🔐 Authentication](./auth.md)
- User token extraction
- Type-safe user information
- Authentication helpers

### [🚨 Error Handling](./errors.md)
- Standardized error classes
- Error code system
- Type-safe error handling

### [📝 Logging](./logger.md)
- Structured JSON logging
- Multiple log levels
- Audit trail support

### [📤 Response Formatting](./response.md)
- Standardized API responses
- Error response handling
- Async handler wrapper

### [✅ Validation](./validate.md)
- Zod schema validation
- Type-safe validation
- Consistent error handling

## Common Patterns

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

## Best Practices

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

## Integration Example

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

## Security Considerations

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

## Testing

Each utility should be thoroughly tested:
- Unit tests for core functionality
- Integration tests for combinations
- Error case testing
- Type testing
- Security testing

## Future Enhancements

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