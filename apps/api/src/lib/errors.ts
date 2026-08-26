import type { ErrorCode } from '@tervox/contracts';
import { ApiErrorEnvelope } from '@tervox/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from './logger.js';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 500,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    if (details !== undefined) {
      this.details = details;
    }
  }

  static notFound(message = 'Not found'): AppError {
    return new AppError('NOT_FOUND', message, 404);
  }

  static badRequest(message = 'Bad request', details?: Record<string, unknown>): AppError {
    return new AppError('BAD_REQUEST', message, 400, details);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError('INTERNAL', message, 500);
  }
}

// The error handler is registered against a structural subset of FastifyInstance
// so this helper stays decoupled from Fastify's deep generics (logger type,
// raw server, raw reply). `app.setErrorHandler` is the only surface it uses;
// both the real `Fastify()` instance (any logger wiring: default, pino, or
// pino-pretty) and the test's `Fastify({ logger: false })` satisfy it.
interface FastifyErrorHandlerHost {
  setErrorHandler(handler: (err: unknown, req: FastifyRequest, reply: FastifyReply) => void): void;
}

export function registerErrorHandler(app: FastifyErrorHandlerHost): void {
  app.setErrorHandler((err: unknown, _req: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof AppError) {
      const envelope = ApiErrorEnvelope.parse({
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined ? { details: err.details } : {}),
        },
      });
      reply.status(err.statusCode).send(envelope);
      return;
    }

    if (err instanceof ZodError) {
      const envelope = ApiErrorEnvelope.parse({
        error: {
          code: 'VALIDATION',
          message: 'Request failed validation',
          details: { issues: err.issues },
        },
      });
      reply.status(400).send(envelope);
      return;
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    logger.error({ err }, 'unhandled error');
    const envelope = ApiErrorEnvelope.parse({
      error: { code: 'INTERNAL', message },
    });
    reply.status(500).send(envelope);
  });
}
