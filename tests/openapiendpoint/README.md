# OpenAPI Endpoint Tests

This directory contains comprehensive tests for the OpenAPI documentation endpoint implementation (Issue #40).

## Test Files

### Core Service Tests
- **`test-services.ts`** - Tests core OpenAPI services (RouteDiscoveryService, SchemaGenerationService, OpenAPIDocumentBuilder)

### Feature Module Tests  
- **`test-feature.ts`** - Tests the OpenAPI feature module (controller, routes, service)

### Integration Tests
- **`test-phase4-simple.ts`** - Simple integration tests without database dependency
- **`test-phase4-integration.ts`** - Full application integration tests

### Advanced Feature Tests
- **`test-phase5-advanced.ts`** - Tests advanced features (validation, performance, security services)

## Running Tests

### Run Individual Tests
```bash
# From project root
npx tsx tests/openapiendpoint/test-services.ts
npx tsx tests/openapiendpoint/test-feature.ts
npx tsx tests/openapiendpoint/test-phase4-simple.ts
npx tsx tests/openapiendpoint/test-phase4-integration.ts
npx tsx tests/openapiendpoint/test-phase5-advanced.ts
```

### Run All Tests
```bash
# From project root
npx tsx tests/openapiendpoint/run-all-tests.ts
```

## Test Coverage

### Phase 1-3: Foundation & Core Services ✅
- Route discovery and scanning
- Schema generation from Zod schemas
- OpenAPI document building
- Caching implementation

### Phase 4: Application Integration ✅
- Express router integration
- Authentication middleware
- Enhanced documentation endpoint
- Backward compatibility

### Phase 5: Advanced Features ✅
- OpenAPI validation service
- Performance optimization
- Security hardening
- CI/CD integration

## Test Environment

- **Node.js**: 20.x with ESM modules
- **TypeScript**: Strict mode compilation
- **Dependencies**: Express, Zod, OpenAPI utilities
- **Authentication**: JWT middleware integration

## Expected Results

All tests should pass with:
- ✅ Service initialization and functionality
- ✅ Route discovery (36+ routes)
- ✅ Schema generation (22+ schemas)
- ✅ Document generation (OpenAPI 3.1.0)
- ✅ Caching performance (sub-10ms)
- ✅ Security validation
- ✅ Integration with existing MWAP architecture

## Troubleshooting

### Common Issues
1. **Import Errors**: Ensure all paths use `../../src/` prefix
2. **Missing Dependencies**: Run `npm install` in project root
3. **TypeScript Errors**: Check strict mode compliance
4. **Authentication Errors**: Verify JWT middleware setup

### Debug Mode
Add `DEBUG=1` environment variable for verbose logging:
```bash
DEBUG=1 npx tsx tests/openapiendpoint/test-phase5-advanced.ts
```