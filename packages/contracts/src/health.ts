import { z } from 'zod';

export const HealthCheckResponse = z.object({
  status: z.literal('ok'),
  service: z.string().min(1),
  uptime: z.number().nonnegative(),
  timestamp: z.string().datetime(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>;
