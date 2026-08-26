// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { logger } from './logger.js';

describe('logger', () => {
  it('is a pino-like logger with the expected bindings', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.fatal).toBe('function');
    // pino exposes the level via the symbol key.
    const level = (logger as unknown as { level?: string }).level ?? 'info';
    expect(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).toContain(level);
  });
});
