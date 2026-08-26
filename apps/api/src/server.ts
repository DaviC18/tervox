import Fastify from 'fastify';
import { env } from './env.js';
import { AppError, registerErrorHandler } from './lib/errors.js';
import { logger } from './lib/logger.js';
import { healthRoutes } from './routes/health.js';

async function main(): Promise<void> {
  const app = Fastify({
    loggerInstance: logger,
    disableRequestLogging: false,
  });

  await registerErrorHandler(app);
  await app.register(healthRoutes);

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, 'shutting down');
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', (sig) => {
    void shutdown(sig);
  });
  process.on('SIGTERM', (sig) => {
    void shutdown(sig);
  });

  try {
    await app.listen({ host: env.API_HOST, port: env.API_PORT });
    logger.info({ host: env.API_HOST, port: env.API_PORT }, 'tervox-api listening');
  } catch (err) {
    logger.fatal({ err }, 'failed to start server');
    throw new AppError('INTERNAL', 'failed to start', 500);
  }
}

void main();
