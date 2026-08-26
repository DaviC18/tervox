import { describe, expect, it } from 'vitest';
import { ApiErrorEnvelope, ErrorCode } from './errors.js';

describe('ErrorCode', () => {
  it('accepts every declared code', () => {
    for (const code of [
      'INTERNAL',
      'NOT_FOUND',
      'BAD_REQUEST',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'CONFLICT',
      'VALIDATION',
      'METHOD_NOT_ALLOWED',
    ]) {
      expect(ErrorCode.parse(code)).toBe(code);
    }
  });

  it('rejects an unknown code', () => {
    expect(() => ErrorCode.parse('TEAPOT')).toThrow();
  });
});

describe('ApiErrorEnvelope', () => {
  it('parses a minimal envelope', () => {
    const env = ApiErrorEnvelope.parse({
      error: { code: 'NOT_FOUND', message: 'gone' },
    });
    expect(env.error.code).toBe('NOT_FOUND');
    expect(env.error.message).toBe('gone');
  });

  it('parses an envelope with details', () => {
    const env = ApiErrorEnvelope.parse({
      error: {
        code: 'VALIDATION',
        message: 'bad input',
        details: { field: 'email' },
      },
    });
    expect(env.error.details?.field).toBe('email');
  });

  it('rejects an envelope with an unknown code', () => {
    expect(() => ApiErrorEnvelope.parse({ error: { code: 'WAT', message: 'x' } })).toThrow();
  });
});
