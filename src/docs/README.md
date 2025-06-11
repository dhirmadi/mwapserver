# MWAP API Documentation

This module provides API documentation for the MWAP (Modular Web Application Platform) using Swagger UI and zod-to-openapi.

## Features

- Automatically generates OpenAPI documentation from Zod schemas
- Provides interactive API documentation via Swagger UI
- Secures documentation in production environments
- Includes authentication, request/response examples, and error handling

## Usage

To add the API documentation to your Express application, add the following line to your `app.ts` file:

```typescript
import { getDocsRouter } from './docs/docs.js';

// ... other imports and setup

// Add this line before registering other routes
app.use('/docs', getDocsRouter());

// ... register other routes
```

## Security

The documentation is only available in non-production environments. In production, the `/docs` endpoint will return a 404 error.

## Customization

You can customize the documentation by:

1. Adding more endpoints to the `docs.ts` file
2. Modifying the Swagger UI options
3. Changing the security settings

## How It Works

The documentation is generated using the following process:

1. Zod schemas are registered with the OpenAPI registry
2. API endpoints are defined with their request/response schemas
3. The OpenAPI document is generated from the registry
4. Swagger UI is used to render the documentation

## Benefits

- **Type Safety**: Documentation is generated from the same Zod schemas used for validation
- **Consistency**: Ensures API documentation matches the actual implementation
- **Developer Experience**: Provides an interactive way to explore and test the API
- **Maintainability**: Documentation is updated automatically when schemas change