import { Global, Module } from '@nestjs/common';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().default(4000),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(60),
  DEV_LOGIN_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Config = z.infer<typeof schema>;
export const CONFIG = Symbol('CONFIG');

let cached: Config | undefined;

/** Reads .env (if present) and validates the environment once. */
export function loadConfig(): Config {
  if (cached) return cached;
  try {
    process.loadEnvFile(); // Node 22: loads ./.env without overriding real env vars
  } catch {
    // no .env file — rely on the real environment (production)
  }
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:');
    for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    process.exit(1);
  }
  cached = parsed.data;
  return cached;
}

@Global()
@Module({
  providers: [{ provide: CONFIG, useFactory: loadConfig }],
  exports: [CONFIG],
})
export class ConfigModule {}
