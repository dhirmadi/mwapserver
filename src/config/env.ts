import { z } from 'zod';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables (skip noisy error when .env is absent in build/release)
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch {
  // Intentionally ignore; process.env from platform (e.g., Heroku) is authoritative
}

// Environment schema validation
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  MONGODB_URI: z.string(),
  AUTH0_DOMAIN: z.string(),
  AUTH0_AUDIENCE: z.string()
});

// Validate and export environment
type Env = z.infer<typeof envSchema>;
let validatedEnv: Env | null = null;
export const env = new Proxy({} as Env, {
  get: (target, prop: keyof Env) => {
    if (!validatedEnv) {
      validatedEnv = envSchema.parse(process.env);
    }
    return validatedEnv[prop];
  }
});