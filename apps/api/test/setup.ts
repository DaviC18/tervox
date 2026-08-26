// Vitest global setup. Ensures required env vars exist before any
// production module (logger, env, server, ...) is imported. Each test
// file still owns its own per-test env mutations (env.test.ts in
// particular) — this just satisfies day-1 imports. NODE_ENV stays at
// the platform default; env.test.ts owns that override.
//
// Integration tests under `src/db/*.test.ts` (the multi-tenant
// integrity suite at the top of Stage 2 hardening, and any future
// DB-backed tests) self-gate on `RUN_INTEGRATION=1` and probe
// `DATABASE_URL`'s reachability from `beforeAll`. Plain `npm test`
// runs against this placeholder URL and skips those suites cleanly,
// so template CI without a Postgres container does not flake.

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
