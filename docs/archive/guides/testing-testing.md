# MWAP Testing Strategy

This document defines the canonical testing strategy and philosophy for the MWAP backend system.

## 🧪 Testing Philosophy

MWAP uses **[Vitest](https://vitest.dev/)** for unit and service-level testing, aligned with these core principles:

- ✅ **Pure ESM support** (no CommonJS)
- ✅ **Centralized test organization** in `tests/` folder
- ✅ **Simple mocks** for MongoDB and Auth0 (no DB containers)
- ✅ **Focused testing** for service logic, middleware, and schema validation
- ✅ **Type-safe testing** with TypeScript throughout

## 🎯 Testing Approach

### Minimal and Meaningful Testing
- Test services, guards, and validations where business logic resides
- Avoid testing trivial getters/setters
- Focus on edge cases and error conditions
- Prioritize integration points and critical paths

### ESM-Only Architecture
- No CommonJS or Jest artifacts allowed
- Use Vitest for pure ESM compatibility
- Leverage native ES modules throughout test suite
- Maintain consistency with production ESM usage

### Thin Controller, Fat Service Pattern
- Controllers should be thin layers with minimal logic to test
- Service logic is isolated and thoroughly testable
- Business rules are concentrated in service classes
- Validation logic is centralized and unit testable

### Mocks Over Containers
- Use simple mocks for external dependencies
- No test databases or Auth0 sandboxes
- Mock at the service boundary level
- Keep test setup lightweight and fast

## 📁 Test Organization

```
tests/
├── setupTests.ts          # Global test configuration
├── utils/                 # Utility function tests
│   ├── auth.test.ts      # Authentication utilities
│   ├── validate.test.ts  # Validation utilities
│   └── errors.test.ts    # Error handling
└── features/              # Feature-specific tests
    ├── tenants/          # Tenant module tests
    ├── projects/         # Project module tests
    ├── cloud-providers/  # Cloud provider tests
    └── oauth/            # OAuth flow tests
```

## 🚀 Testing Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.ts
```

## 🎯 Coverage Targets

- **Core Utils**: 90%+ coverage
- **Service Layer**: 80%+ coverage  
- **Middleware**: 85%+ coverage
- **Overall**: 80%+ coverage

## 📋 Testing Standards

### Test Structure
- Use descriptive test names that explain expected behavior
- Follow AAA pattern: Arrange, Act, Assert
- Group related tests using `describe` blocks
- Keep tests focused on single behaviors

### Test Data
- Use factory functions for consistent test data generation
- Avoid hardcoded values where possible
- Clean up test data after tests
- Isolate tests from each other

### Async Testing
```typescript
// Proper async/await usage
it('should create tenant asynchronously', async () => {
  const result = await tenantService.create(testData);
  expect(result).toBeDefined();
});

// Testing promise rejections
it('should reject invalid tenant data', async () => {
  await expect(tenantService.create(invalidData))
    .rejects
    .toThrow('Validation failed');
});
```

### Error Testing
- Test error conditions explicitly
- Verify proper error types and messages
- Test edge cases and boundary conditions
- Ensure graceful error handling

## 🔄 Phase 8 Implementation Plan

Testing is currently in **Phase 8** (postponed until all core functionality is complete). The testing strategy includes:

1. **Complete Service Testing**
   - Implement tests for all service classes
   - Mock external dependencies appropriately
   - Achieve target coverage goals

2. **Integration Test Suite**
   - End-to-end API testing
   - Database integration tests
   - OAuth flow testing

3. **Performance Testing**
   - Load testing for critical endpoints
   - Memory leak detection
   - Response time benchmarks

4. **Security Testing**
   - Authentication bypass attempts
   - Authorization boundary testing
   - Input validation security tests

## 📚 Additional Resources

- **[Testing Guide](../06-Guides/how-to-test.md)**: Comprehensive testing setup and examples
- **[Integration Testing](./INTEGRATION_TESTING.md)**: Integration testing approach and setup
- **[Test Status](./tests-readme.md)**: Current test coverage and implementation status

---

*This document defines the core testing philosophy for MWAP. For detailed implementation examples and setup instructions, refer to the comprehensive testing guide.* 