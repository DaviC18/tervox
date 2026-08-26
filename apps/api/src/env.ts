import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
});

export type Env = z.infer<typeof Env>;

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  // Fail fast with a clean, greppable message — the handler reads env.ts before
  // any other module, so this is the surest place to surface a misconfiguration.
  throw new Error(`Invalid environment variables:\n${lines.join('\n')}`);
}

export const env: Env = parsed.data;
