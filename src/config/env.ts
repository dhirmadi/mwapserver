import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
}

// Environment schema validation
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  MONGODB_URI: z.string(),
  AUTH0_DOMAIN: z.string(),
  AUTH0_AUDIENCE: z.string(),
  // OAuth domain configuration
  BACKEND_DOMAIN: z.string().optional(),
  ALLOWED_OAUTH_DOMAINS: z.string().optional()
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

/**
 * Get backend domain based on environment
 */
export function getBackendDomain(): string {
  const envDomain = env.BACKEND_DOMAIN;
  if (envDomain) return envDomain;
  
  // Fallback based on environment
  switch (env.NODE_ENV) {
    case 'production':
      return 'https://mwapps.shibari.photo';
    case 'staging':
    case 'development':
    default:
      return 'https://mwapss.shibari.photo';
  }
}

/**
 * Get allowed OAuth domains for redirect URI validation
 */
export function getAllowedOAuthDomains(): string[] {
  const envDomains = env.ALLOWED_OAUTH_DOMAINS;
  if (envDomains) {
    return envDomains.split(',').map(d => d.trim());
  }
  
  // Fallback configuration
  const baseDomains = ['localhost', '127.0.0.1'];
  switch (env.NODE_ENV) {
    case 'production':
      return [...baseDomains, 'mwapps.shibari.photo'];
    case 'staging':
    case 'development':
    default:
      return [...baseDomains, 'mwapss.shibari.photo', 'mwapps.shibari.photo'];
  }
}