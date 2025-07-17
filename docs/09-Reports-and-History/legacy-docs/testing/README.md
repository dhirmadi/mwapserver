# MWAP Testing Documentation

This directory contains comprehensive testing documentation for the MWAP backend system.

## Testing Strategy Overview

MWAP uses **[Vitest](https://vitest.dev/)** for unit and service-level testing, aligned with the following principles:

- ✅ Pure ESM support (no CommonJS)
- ✅ Centralized `tests/` folder (no co-located tests)
- ✅ Simple mocks for MongoDB and Auth0 (no DB containers or test factories)
- ✅ Focused tests for service logic, middleware, and schema validation

## Documentation Structure

- **[testing.md](./testing.md)**: Canonical testing strategy and philosophy
- **[TESTING.md](./TESTING.md)**: Current test coverage and implementation status
- **[INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md)**: Integration testing approach
- **[tests-readme.md](./tests-readme.md)**: Test directory structure and setup

## Testing Philosophy

- **Minimal and meaningful**: Test services, guards, and validations
- **ESM-only**: No CommonJS or Jest artifacts allowed
- **Thin controller, fat service**: Service logic is testable in isolation
- **Mocks over containers**: No test DBs or Auth0 sandboxes

## Current Status

> 🧼 All legacy tests and configurations have been removed to enable a clean, consistent setup.

Testing is currently in **Phase 8** (postponed until all core functionality is complete). Basic tests are maintained throughout development, but comprehensive testing and coverage improvements will be addressed in the final phase.

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Structure

```
tests/
├── setupTests.ts          # Global test configuration
├── utils/                 # Utility function tests
│   ├── auth.test.ts
│   └── validate.test.ts
└── features/              # Feature-specific tests (planned)
    ├── tenants/
    ├── projects/
    └── cloud-providers/
```

---
*Last updated: 2025-07-16*