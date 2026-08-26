// @vitest-environment node

import { HealthCheckResponse } from '@tervox/contracts';
import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { healthRoutes } from './health.js';

describe('GET /health', () => {
  it('returns a HealthCheckResponse-shape payload', async () => {
    const app = Fastify({ logger: false });
    await app.register(healthRoutes);
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const payload = HealthCheckResponse.parse(JSON.parse(res.body));
    expect(payload.status).toBe('ok');
    expect(payload.service).toBe('tervox-api');
    expect(typeof payload.uptime).toBe('number');
    expect(payload.uptime).toBeGreaterThanOrEqual(0);
    // timestamp must round-trip back through HealthCheckResponse, so it must
    // be a valid ISO datetime the second time around.
    const reparsed = HealthCheckResponse.parse(payload);
    expect(reparsed.timestamp).toBe(payload.timestamp);
    await app.close();
  });
});
