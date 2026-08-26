// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SAVED_ENV: Record<string, string | undefined> = { ...process.env };
const TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
// Cast lets us mutate the readonly `NODE_ENV` slot in @types/node. We
// restore the original value in `snapshot()` after each test.
const env = process.env as unknown as Record<string, string | undefined>;

function snapshot(): void {
  for (const key of Object.keys(env)) {
    delete env[key];
  }
  for (const [key, value] of Object.entries(SAVED_ENV)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
}

async function importFresh(): Promise<typeof import('./env.js')> {
  vi.resetModules();
  return import('./env.js');
}

describe('apps/api env validation', () => {
  beforeEach(() => {
    snapshot();
    delete env.API_HOST;
    delete env.API_PORT;
    delete env.API_LOG_LEVEL;
    delete env.NODE_ENV;
    delete env.DATABASE_URL;
    env.DATABASE_URL = TEST_DATABASE_URL;
  });

  afterEach(() => {
    snapshot();
  });

  it('applies defaults when nothing is set', async () => {
    const mod = await importFresh();
    expect(mod.env.NODE_ENV).toBe('development');
    expect(mod.env.API_HOST).toBe('0.0.0.0');
    expect(mod.env.API_PORT).toBe(4000);
    expect(mod.env.API_LOG_LEVEL).toBe('info');
  });

  it('coerces a string API_PORT to a number', async () => {
    env.API_PORT = '4500';
    const mod = await importFresh();
    expect(mod.env.API_PORT).toBe(4500);
  });

  it('rejects an out-of-range port', async () => {
    env.API_PORT = '70000';
    await expect(importFresh()).rejects.toThrow(/Invalid environment variables/);
  });

  it('rejects an unknown log level', async () => {
    env.API_LOG_LEVEL = 'verbose';
    await expect(importFresh()).rejects.toThrow(/Invalid environment variables/);
  });

  it('exposes DATABASE_URL when provided', async () => {
    const mod = await importFresh();
    expect(mod.env.DATABASE_URL).toBe(TEST_DATABASE_URL);
  });

  it('rejects an invalid DATABASE_URL', async () => {
    delete env.DATABASE_URL;
    env.DATABASE_URL = 'not-a-url';
    await expect(importFresh()).rejects.toThrow(/DATABASE_URL/);
  });

  it('rejects a missing DATABASE_URL', async () => {
    delete env.DATABASE_URL;
    await expect(importFresh()).rejects.toThrow(/DATABASE_URL/);
  });
});
