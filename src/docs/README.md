# MWAP API Documentation

This module provides API documentation for the MWAP (Modular Web Application Platform) using a simple, reliable approach with Swagger UI.

## Features

- Provides comprehensive OpenAPI documentation for all API endpoints
- Delivers interactive API documentation via Swagger UI when available
- Secures documentation in production environments
- Includes authentication, request/response examples, and error handling
- **Auto-installs missing dependencies** with a user-friendly interface
- Works even when dependencies are not installed

## Installation

No manual installation is required! The module will automatically detect missing dependencies and provide an installation interface.

However, if you prefer to install the dependencies manually:

```bash
npm install swagger-ui-express
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

The documentation system uses a simple, reliable approach:

1. **Static OpenAPI Document**: A comprehensive, manually maintained OpenAPI document
   - Covers all API endpoints
   - Includes schemas, responses, and security definitions
   - No dependency on external schema generators

2. **Dynamic UI Loading**: Swagger UI is loaded only if available
   - Falls back to a simple HTML interface if Swagger UI is not installed
   - Provides a way to install Swagger UI directly from the interface
   - Always serves the raw OpenAPI JSON

This approach ensures that the documentation is always accessible, even if the dependencies are not installed.

## API Endpoints

The documentation module provides several endpoints:

- **`/docs`**: Main documentation UI (Swagger UI if available, or simple HTML)
- **`/docs/json`**: Raw OpenAPI JSON (always available)
- **`/docs/install-swagger`**: Install Swagger UI

## Security

### Authentication Requirements

The API documentation is protected by authentication to prevent unauthorized access. This is a critical security measure because:

1. **Information Disclosure**: Public API documentation exposes internal system structure
2. **Attack Surface Mapping**: Makes it easier for attackers to identify vulnerabilities
3. **Competitive Intelligence**: Reveals business logic and system capabilities

### Environment-Based Security

- **Development**: Authentication is optional but recommended
- **Production**: Authentication is strictly enforced
  - The documentation router checks for authenticated users
  - Additional security headers and rate limiting are applied
  - Access is logged for security auditing

### Security Best Practices

When deploying the API documentation:

1. Always mount the documentation router **after** authentication middleware
2. Consider implementing additional access controls (e.g., specific roles)
3. Regularly review and update the documentation to remove sensitive information
4. Monitor access logs for suspicious patterns
5. Apply rate limiting to prevent abuse

### Configuration

The security settings can be adjusted in `api-docs.ts` based on your specific requirements.

## Architecture

The module consists of two main components:

1. **api-docs.ts**: Single, comprehensive module that:
   - Provides a static OpenAPI document
   - Handles dependency checking and installation
   - Serves Swagger UI when available
   - Falls back to simple HTML/JSON when needed

2. **index.ts**: Simple entry point that exports the main router

This architecture ensures that the documentation is always available, with graceful degradation when dependencies are missing.

## Benefits

- **Simplicity**: Single file approach with no complex dependencies
- **Reliability**: Works consistently across different environments
- **Self-Healing**: Automatically installs missing dependencies
- **Developer Experience**: Provides an interactive way to explore and test the API
- **Maintainability**: Single source of truth for API documentation