# ✅ Validation Utilities

## Overview
The validation utilities provide a standardized way to validate data using Zod schemas with consistent error handling.

## Functions

### `validateWithSchema`
```typescript
function validateWithSchema<T>(schema: z.Schema<T>, input: unknown): T
```

Validates input data against a Zod schema with standardized error handling.

#### Parameters
- `schema`: Zod schema for validation
- `input`: Unknown data to validate

#### Returns
- Validated and typed data matching schema

#### Throws
- `ValidationError`: When validation fails, includes Zod error details

## Usage Examples

### Basic Validation
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

### Complex Schema Validation
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

### API Request Validation
```typescript
import express from 'express';
import { z } from 'zod';
import { validateWithSchema } from '../utils/validate.js';
import { ValidationError } from '../utils/errors.js';

const router = express.Router();

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/users', (req, res, next) => {
  try {
    const validatedData = validateWithSchema(createUserSchema, req.body);
    // Process validated data
  } catch (error) {
    next(error);
  }
});
```

## Error Handling

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

## Best Practices

1. **Schema Definition**
   - Define schemas near related code
   - Use descriptive variable names
   - Add helpful error messages

2. **Validation Usage**
   - Validate early in request lifecycle
   - Handle validation errors appropriately
   - Use type inference from schemas

3. **Error Handling**
   - Catch validation errors explicitly
   - Provide helpful error messages
   - Include field-specific errors

4. **Type Safety**
   - Let TypeScript infer types from schemas
   - Use validated data with confidence
   - Don't bypass type checking

## Integration Example
```typescript
import { z } from 'zod';
import { validateWithSchema } from '../utils/validate.js';
import { ValidationError } from '../utils/errors.js';

// Define schema
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  settings: z.object({
    notifications: z.boolean(),
    theme: z.enum(['light', 'dark'])
  }).optional()
});

// Use in service
async function updateUser(userId: string, data: unknown) {
  try {
    // Validate input
    const validatedData = validateWithSchema(updateUserSchema, data);
    
    // TypeScript knows the exact shape of validatedData
    if (validatedData.settings?.theme === 'dark') {
      // Handle dark theme
    }
    
    // Update user with validated data
    return await User.findByIdAndUpdate(userId, validatedData);
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation error
      console.error('Invalid user data:', error.details);
    }
    throw error;
  }
}
```