import { JwksClient } from 'jwks-rsa';
import { env } from './env.js';

export const jwksClient = new JwksClient({
  jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  rateLimit: true,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  timeout: 10000 // 10 seconds
});