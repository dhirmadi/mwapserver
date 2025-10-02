# Test Mocks

This directory contains mock implementations used for testing purposes.

## oauth.service.js

Test shim for CommonJS require path used by integration tests. Provides `vi.fn` when available so tests can spy/mutate behavior via CJS require.

**Note:** This is NOT the actual OAuth service implementation. The real implementation is at `src/features/oauth/oauth.service.ts`.

## Usage

```javascript
// In tests that need to mock OAuth service behavior
const OAuthService = require('../../tests/mocks/oauth.service.js').OAuthService;
```

