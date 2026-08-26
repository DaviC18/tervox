// @vitest-environment node

import { ApiErrorEnvelope } from '@tervox/contracts';
import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError, registerErrorHandler } from './errors.js';

describe('AppError', () => {
  it('carries code + statusCode on static constructors', () => {
    expect(AppError.notFound('gone').statusCode).toBe(404);
    expect(AppError.badRequest('bad').statusCode).toBe(400);
    expect(AppError.internal().statusCode).toBe(500);
  });
});

describe('registerErrorHandler', () => {
  async function buildApp(): Promise<ReturnType<typeof Fastify>> {
    const app = Fastify({ logger: false });
    registerErrorHandler(app);
    return app;
  }

  it('maps AppError -> ApiErrorEnvelope at the right status', async () => {
    const app = await buildApp();
    app.get('/__not_found', () => {
      throw AppError.notFound('gone');
    });
    const res = await app.inject({ method: 'GET', url: '/__not_found' });
    expect(res.statusCode).toBe(404);
    const body = ApiErrorEnvelope.parse(JSON.parse(res.body));
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('gone');
    await app.close();
  });

  it('maps ZodError -> 400 VALIDATION with issues detail', async () => {
    const app = await buildApp();
    app.get('/__bad', () => {
      const schema = z.object({ x: z.number() });
      schema.parse({ x: 'not-a-number' });
      return 'unreachable';
    });
    const res = await app.inject({ method: 'GET', url: '/__bad' });
    expect(res.statusCode).toBe(400);
    const body = ApiErrorEnvelope.parse(JSON.parse(res.body));
    expect(body.error.code).toBe('VALIDATION');
    expect((body.error.details as { issues: unknown }).issues).toBeDefined();
    await app.close();
  });

  it('maps a stray Error -> 500 INTERNAL', async () => {
    const app = await buildApp();
    app.get('/__boom', () => {
      throw new Error('boom');
    });
    const res = await app.inject({ method: 'GET', url: '/__boom' });
    expect(res.statusCode).toBe(500);
    const body = ApiErrorEnvelope.parse(JSON.parse(res.body));
    expect(body.error.code).toBe('INTERNAL');
    expect(body.error.message).toBe('boom');
    await app.close();
  });
});
