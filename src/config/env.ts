import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment schema validation
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  MONGODB_URI: z.string().url(),
  AUTH0_DOMAIN: z.string(),
  AUTH0_AUDIENCE: z.string().url()
});

// Validate and export environment
export const env = envSchema.parse(process.env);