import { HealthCheckResponse } from '@tervox/contracts';
import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () =>
    HealthCheckResponse.parse({
      status: 'ok',
      service: 'tervox-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  );
}
