# 🧪 MWAP Backend Testing Guide

This document defines the **canonical testing strategy** for the MWAP backend (Node.js + Express + MongoDB + Auth0), optimized for simplicity, maintainability, and Claude/OpenHands compatibility.

---

## ✅ Testing Philosophy

- **Minimal and meaningful**: Test services, guards, and validations. Avoid route-level or full-stack tests unless required.
- **ESM-only**: No CommonJS or Jest artifacts allowed.
- **Thin controller, fat service**: Service logic is testable in isolation; route handlers should remain minimal.
- **Mocks over containers**: No test DBs or Auth0 sandboxes. We use lightweight stubs/mocks.

---

## 🛠 Stack

| Layer         | Tool           |
|---------------|----------------|
| Test Runner   | [Vitest](https://vitest.dev) |
| Mocking       | Native `vi.fn()`, optional `mockingoose` |
| Validation    | [Zod](https://zod.dev) |
| Structure     | Centralized `/tests/` directory |
| Coverage      | `vitest run --coverage` |

---

## 🗂 Folder Structure

```ts
/tests
  setupTests.ts          # Global mocks (Auth0, DB)
  tenants/
    tenants.service.test.ts
  projects/
    projectMembers.service.test.ts
  middleware/
    roles.middleware.test.ts

/src
  features/
    tenants/
      tenants.service.ts
    projects/
      ...
  utils/
  schemas/
```

---

## 🧱 What to Test

| Target                 | Type  | Purpose                             |
|------------------------|-------|-------------------------------------|
| `*.service.ts`         | Unit  | Core business logic, access rules   |
| `roles.middleware.ts`  | Unit  | Role enforcement logic              |
| `auth.ts`              | Unit  | `getUserFromToken()` behavior       |
| `validate.ts`          | Unit  | Zod schema enforcement              |
| `files.controller.ts`  | Light | Cloud file logic (mocked access)    |

---

## ❌ What NOT to Test

- Express routes (covered indirectly via service/controller tests)
- Real DB connections (use mocks)
- Auth0 tokens or JWKS (stub `getUserFromToken`)
- E2E or browser automation (out of scope)

---

## 🔧 Global Test Setup

### `/tests/setupTests.ts`

```ts
import { vi } from 'vitest';

vi.mock('../src/utils/auth', () => ({
  getUserFromToken: () => ({
    sub: 'user-123',
    email: 'user@example.com',
    name: 'Mock User',
  }),
}));

vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    model: () => ({
      find: vi.fn(),
      create: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      findOneAndUpdate: vi.fn(),
      deleteOne: vi.fn(),
    }),
  };
});
```

## vitest.config.ts

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setupTests.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json'],
      all: true,
    },
  },
});
```
## 📌 Example Test: tenants.service.test.ts

```ts
import { describe, it, expect, vi } from 'vitest';
import * as tenantService from '../../src/features/tenants/tenants.service';

describe('Tenant Service', () => {
  it('should create a new tenant with owner', async () => {
    const mockInput = { name: 'TestCorp' };
    const userId = 'user-123';

    vi.spyOn(tenantService, 'createTenant').mockResolvedValue({
      _id: 'abc123',
      name: 'TestCorp',
      ownerId: userId,
    });

    const result = await tenantService.createTenant(mockInput, userId);
    expect(result.name).toBe('TestCorp');
    expect(result.ownerId).toBe(userId);
  });
});
```

🧠 Guidance for Claude / OpenHands
Claude-generated tasks and scaffolds must follow these rules:
- ✅ Use /tests/, not colocated files
- ✅ Use validateWithSchema, wrapAsyncHandler, and jsonResponse
- ✅ Reuse mocks defined in setupTests.ts
- ❌ Do not invent new test frameworks, folders, or factories

📌 Future Enhancements
- Optional: Integration tests using in-memory DB (e.g., mongodb-memory-server)
- Optional: Snapshot testing for schemas
- Optional: CI smoke test against deployed API

✅ Summary
This test setup is:
- Lean and maintainable
- ESM-native
- Domain-aligned
- Fully mockable
- Safe for developers and Claude to extend

🔒 All tests must respect auth, role, and schema validation rules defined in /middleware/ and /schemas/.