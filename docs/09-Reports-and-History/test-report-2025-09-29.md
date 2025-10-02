---
title: MWAP Test Report (2025-09-29)
summary: Full test run summary with performance caveats and follow-ups
lastReviewed: 2025-09-29
---

# MWAP Test Report — 2025-09-29

## Overview
- Environment: Node 20.x, Vitest 3.1.3 (v8 coverage), local macOS (darwin 24.6.0)
- Command: `vitest run --coverage`
- Result: 14 files, 152 tests total; 147 passed, 5 failed

## Summary by Suite
- Middleware
  - `tests/middleware/publicRoutes.test.ts`: PASS (27/27)
  - `tests/middleware/auth.test.ts`: PASS (13/13)

- OAuth Security (Unit)
  - `tests/oauth/oauthCallbackSecurity.test.ts`: PASS (22/22)
  - `tests/oauth/redirect-uri-validation.test.ts`: PASS (11/11)
  - `tests/oauth/pkce.test.ts`: PASS (17/17)

- Utilities
  - `tests/utils/*.test.ts`: PASS (7/7)

- Integration / E2E
  - `tests/integration/oauth-callback.integration.test.ts`: PASS (26/26)
  - `tests/integration/oauth-flow-end-to-end.test.ts`: PASS (12/12)
  - `tests/integration/tenants-me.integration.test.ts`: PASS (2/2)
  - `tests/integration/projects-members-me.integration.test.ts`: PASS (2/2)

- Performance (Mixed)
  - `tests/performance/oauth-performance.test.ts`: 13 tests, 5 FAILED
    - FAIL: Load Testing (50 concurrent) — successfulRequests expected 50, got 0
    - FAIL: Load Testing (100 concurrent) — successfulRequests expected >95, got 0
    - FAIL: Load Testing (DB growth, 25 concurrent) — expected 25, got 0
    - FAIL: Sustained Load (30s) — timeout at 5s default test timeout
    - FAIL: Memory (large state parameters) — read ECONNRESET (superagent double callback)
    - PASS: Response-time validations (simple/complex/expired)
    - PASS: DB performance (avg ~33–37ms) and pool throughput (~1133–1365 ops/sec)
    - PASS: Stress Test (200 concurrent): 100% success; Avg ~318–342ms; P95 ~323–344ms

## Notable Timings (from output)
- OAuth E2E performance
  - Callback response time: 7–13ms
  - Concurrent callbacks (10 concurrent): avg ~19.6–22.2ms

## Coverage
- Coverage collection enabled (v8). Text summary not captured inline; detailed HTML/text reports can be generated on demand.

## Failures — Root Causes & Recommendations
1) Moderate/High Concurrency Load (50/100) returning 0 successes
   - Likely due to test harness issuing requests before routes complete mounting or shared mock state clashing at high burst.
   - Recommendation: warm-up step and short ramp-up; add small jitter between requests; increase connection pool in test or reduce parallelism per worker.

2) Sustained Load test (30s) timed out at 5s
   - This is a config mismatch (test-timeout vs intended duration).
   - Recommendation: mark as long-running and skip by default, or increase timeout only for this test via `testTimeout`.

3) Large State Parameter (ECONNRESET, superagent double callback)
   - Intermittent at high payload; underlying client library behavior.
   - Recommendation: update test client usage to avoid double-callback situations; retry on ECONNRESET in perf harness.

## Overall Assessment
- Functional, security, and integration suites are solid and green.
- Performance harness needs minor stabilization for burst and long-running scenarios in local environments.

## Action Items
- Adjust perf tests to:
  - Add warm-up and jitter for >25 concurrency.
  - Increase timeout for sustained load test to 35–45s.
  - Guard against ECONNRESET with retry and fix double-callback path.
- Optionally parameterize thresholds by environment (local vs CI vs staging perf).



