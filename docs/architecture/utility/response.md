# 📤 Response Utilities

## Overview
The response utilities provide standardized response formatting and error handling for the API.

## Types

### `ApiResponse`
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

## Functions

### `jsonResponse`
```typescript
function jsonResponse<T>(res: Response, data: T, status = 200): void
```

Sends a successful JSON response with standardized format.

#### Parameters
- `res`: Express Response object
- `data`: Response data of any type
- `status`: HTTP status code (default: 200)

#### Output Format
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example"
  }
}
```

### `errorResponse`
```typescript
function errorResponse(res: Response, error: Error): void
```

Sends an error response with standardized format.

#### Parameters
- `res`: Express Response object
- `error`: Error object (preferably ApiError or subclass)

#### Output Format
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

### `wrapAsyncHandler`
```typescript
function wrapAsyncHandler(fn: Function): Function
```

Wraps an async route handler with error catching.

#### Parameters
- `fn`: Async route handler function

#### Returns
- Express middleware function with error handling

## Usage Examples

### Success Response
```typescript
app.get('/api/users/:id', (req, res) => {
  const user = { id: req.params.id, name: 'John' };
  jsonResponse(res, user);
});
```

### Error Response
```typescript
app.post('/api/users', (req, res) => {
  try {
    validateUser(req.body);
  } catch (error) {
    errorResponse(res, error);
  }
});
```

### Async Handler
```typescript
app.get('/api/projects', wrapAsyncHandler(async (req, res) => {
  const projects = await Project.find();
  jsonResponse(res, projects);
}));
```

## Status Codes

The utilities handle different status codes based on error types:

| Error Type | Status Code | Description |
|------------|-------------|-------------|
| ValidationError | 400 | Bad Request |
| AuthError | 401 | Unauthorized |
| PermissionError | 403 | Forbidden |
| NotFoundError | 404 | Not Found |
| ApiError | 500 | Server Error |

## Best Practices

1. **Success Responses**
   - Use appropriate status codes
   - Include all required data
   - Keep response structure consistent

2. **Error Responses**
   - Use specific error types
   - Include helpful error messages
   - Add validation details when available

3. **Async Handlers**
   - Always use wrapAsyncHandler
   - Handle specific errors before catch-all
   - Maintain consistent error format

4. **Security**
   - Don't expose internal errors
   - Sanitize error details
   - Use appropriate status codes

## Integration Example
```typescript
import { jsonResponse, errorResponse, wrapAsyncHandler } from '../utils/response.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const router = express.Router();

// Success response example
router.get('/users/:id', wrapAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new NotFoundError(`User ${req.params.id} not found`);
  }
  jsonResponse(res, user);
}));

// Error handling example
router.post('/users', wrapAsyncHandler(async (req, res) => {
  try {
    const validated = validateUser(req.body);
    const user = await User.create(validated);
    jsonResponse(res, user, 201);
  } catch (error) {
    if (error instanceof ValidationError) {
      errorResponse(res, error);
    } else {
      throw error; // Let global error handler deal with it
    }
  }
}));

export default router;
```