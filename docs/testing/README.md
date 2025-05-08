# Testing Documentation

This directory contains documentation about testing patterns and practices used in this project.

## Contents

- [Mocking Patterns](./mocking-patterns.md) - Detailed guide on mocking patterns, including Jest/Vitest specifics
- [Response Patterns](./response-patterns.md) - Documentation about API response formats and testing
- [Auth Testing](./auth-testing.md) - Guide for testing authentication and authorization

## Quick Start

1. Run all tests:
```bash
npm test
```

2. Run tests in watch mode:
```bash
npm run test:watch
```

3. Run tests with coverage:
```bash
npm run test:coverage
```

## Key Testing Principles

1. **Isolation**
   - Tests should be independent
   - Use mocks to isolate dependencies
   - Clean up after each test

2. **Readability**
   - Tests should be self-documenting
   - Use descriptive test names
   - Follow the Arrange-Act-Assert pattern

3. **Maintainability**
   - Keep test files organized
   - Use shared test utilities
   - Document complex test setups

4. **Coverage**
   - Aim for high test coverage
   - Focus on critical paths
   - Test edge cases

## Common Patterns

1. **Test Structure**
```typescript
describe('Feature', () => {
  describe('Operation', () => {
    it('should handle success case', async () => {
      // Arrange
      const input = ...;
      
      // Act
      const result = await operation(input);
      
      // Assert
      expect(result).toBe(...);
    });
  });
});
```

2. **Mock Setup**
```typescript
vi.mock('../path/to/module', () => ({
  function: vi.fn().mockResolvedValue(mockResult)
}));
```

3. **Error Testing**
```typescript
it('should handle error case', async () => {
  // Arrange
  const error = new Error('test error');
  mockFunction.mockRejectedValue(error);
  
  // Act & Assert
  await expect(operation()).rejects.toThrow(error);
});
```

## Best Practices

1. **Test Organization**
   - Keep tests close to implementation
   - Use consistent file naming
   - Group related tests

2. **Mock Management**
   - Document mock behavior
   - Reset mocks between tests
   - Use meaningful mock data

3. **Error Handling**
   - Test both success and error paths
   - Verify error messages
   - Test edge cases

4. **Async Testing**
   - Always await async operations
   - Handle promises correctly
   - Test timeouts when relevant

## Common Issues

1. **Mock Hoisting**
   - Jest/Vitest hoists mocks
   - Import dependencies inside mock factory
   - Use correct relative paths

2. **Async Issues**
   - Missing await
   - Unhandled promises
   - Race conditions

3. **Mock Reset**
   - Mocks persisting between tests
   - Side effects not cleaned up
   - Global state interference

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Testing Library](https://testing-library.com/docs/)
- [Supertest Documentation](https://github.com/visionmedia/supertest#readme)