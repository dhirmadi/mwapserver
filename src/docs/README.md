# MWAP API Documentation

This module provides API documentation for the MWAP (Modular Web Application Platform) using Swagger UI and zod-to-openapi.

## Features

- Automatically generates OpenAPI documentation from Zod schemas
- Provides interactive API documentation via Swagger UI
- Secures documentation in production environments
- Includes authentication, request/response examples, and error handling
- **Auto-installs missing dependencies** with a user-friendly interface
- Works even when dependencies are not installed

## Installation

No manual installation is required! The module will automatically detect missing dependencies and provide an installation interface.

However, if you prefer to install the dependencies manually:

```bash
npm install swagger-ui-express @asteasolutions/zod-to-openapi
```

## Usage

To add the API documentation to your Express application, add the following line to your `app.ts` file:

```typescript
import { getDocsRouter } from './docs/index.js';

// ... other imports and setup

// Add this line before registering other routes
app.use('/docs', getDocsRouter());

// ... register other routes
```

## How It Works

The documentation system uses a two-tier approach:

1. **Simple Mode**: Always works without any external dependencies
   - Provides basic OpenAPI JSON
   - Offers dependency installation UI
   - Handles dependency checking

2. **Full Mode**: Loaded dynamically when dependencies are available
   - Complete Swagger UI experience
   - Comprehensive API documentation
   - Generated from Zod schemas

This approach ensures that the documentation is always accessible, even if the dependencies are not installed.

## API Endpoints

The documentation module provides several endpoints:

- **`/docs`**: Main documentation UI (simple or full, depending on dependencies)
- **`/docs/json`**: Raw OpenAPI JSON (always available)
- **`/docs/check`**: Check dependency status
- **`/docs/install`**: Install missing dependencies (POST endpoint)

## Security

The documentation is only available in non-production environments. In production, the `/docs` endpoint will return a 404 error.

## Architecture

The module consists of three main components:

1. **docs-simple.ts**: Core module that works without dependencies
   - Provides dependency checking and installation
   - Serves basic OpenAPI JSON
   - Dynamically loads the full documentation when possible

2. **docs-full.ts**: Full documentation with Swagger UI
   - Requires external dependencies
   - Generates comprehensive OpenAPI documentation from Zod schemas
   - Provides interactive Swagger UI

3. **index.ts**: Entry point that exports the main router

This architecture ensures that the documentation is always available, with graceful degradation when dependencies are missing.

## Benefits

- **Zero Dependencies**: The core module works without any external dependencies
- **Self-Healing**: Automatically installs missing dependencies
- **Type Safety**: Documentation is generated from the same Zod schemas used for validation
- **Developer Experience**: Provides an interactive way to explore and test the API
- **Maintainability**: Documentation is updated automatically when schemas change