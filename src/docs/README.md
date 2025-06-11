# MWAP API Documentation

This module provides API documentation for the MWAP (Modular Web Application Platform) using Swagger UI and zod-to-openapi.

## Features

- Automatically generates OpenAPI documentation from Zod schemas
- Provides interactive API documentation via Swagger UI
- Secures documentation in production environments
- Includes authentication, request/response examples, and error handling
- Gracefully handles missing dependencies

## Installation

First, install the required dependencies:

```bash
npm install swagger-ui-express @asteasolutions/zod-to-openapi
```

Or add them to your package.json:

```json
"dependencies": {
  "swagger-ui-express": "^5.0.0",
  "@asteasolutions/zod-to-openapi": "^6.0.0"
}
```

## Usage

To add the API documentation to your Express application, add the following line to your `app.ts` file:

```typescript
import { getDocsRouter } from './docs/docs.js';

// ... other imports and setup

// Add this line before registering other routes
app.use('/docs', getDocsRouter());

// ... register other routes
```

### Fallback Modes

The documentation system has several fallback mechanisms:

1. **Full Swagger UI**: If `swagger-ui-express` is installed, the interactive Swagger UI will be available at `/docs`.

2. **Raw JSON**: The raw OpenAPI specification is always available at `/docs/json`, regardless of whether Swagger UI is installed.

3. **HTML Fallback**: If `swagger-ui-express` is not installed, a simple HTML page will be shown at `/docs` with instructions on how to install the package and a link to the raw JSON.

4. **Loading State**: If `swagger-ui-express` is being loaded asynchronously, a loading message will be displayed until it's ready.

These fallback mechanisms ensure that the API documentation is always accessible in some form, even if the dependencies are not fully installed.

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