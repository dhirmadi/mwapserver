## 🧪 Testing Infrastructure

You MUST add a working unit testing setup in this phase:

- Configure `vitest` or `jest` as the unit test runner
- Create `vitest.config.ts` or `jest.config.ts` in project root
- Add basic test coverage for:
  - `utils/auth.ts`
  - `utils/validate.ts`
  - `middleware/auth.ts` (mock token)

✅ Tests should run with:
```bash
npm run test
```

✅ Code coverage should generate:
```bash
npm run coverage
```

Use ts-node, esbuild, or native ESM config for running test files.

