import { z } from 'zod';

export const ErrorCode = z.enum([
  'INTERNAL',
  'NOT_FOUND',
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'CONFLICT',
  'VALIDATION',
  'METHOD_NOT_ALLOWED',
]);

export type ErrorCode = z.infer<typeof ErrorCode>;

export const ApiErrorEnvelope = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelope>;
