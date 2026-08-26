import { describe, expect, it } from 'vitest';
import { HealthCheckResponse } from './health.js';

describe('HealthCheckResponse', () => {
  it('parses a valid health payload', () => {
    const parsed = HealthCheckResponse.parse({
      status: 'ok',
      service: 'tervox-api',
      uptime: 12.34,
      timestamp: new Date().toISOString(),
    });
    expect(parsed.status).toBe('ok');
    expect(parsed.service).toBe('tervox-api');
  });

  it('rejects a wrong status literal', () => {
    expect(() =>
      HealthCheckResponse.parse({
        status: 'down',
        service: 'tervox-api',
        uptime: 1,
        timestamp: new Date().toISOString(),
      }),
    ).toThrow();
  });

  it('rejects a negative uptime', () => {
    expect(() =>
      HealthCheckResponse.parse({
        status: 'ok',
        service: 'tervox-api',
        uptime: -1,
        timestamp: new Date().toISOString(),
      }),
    ).toThrow();
  });

  it('rejects a non-datetime timestamp', () => {
    expect(() =>
      HealthCheckResponse.parse({
        status: 'ok',
        service: 'tervox-api',
        uptime: 1,
        timestamp: 'not-a-date',
      }),
    ).toThrow();
  });
});
