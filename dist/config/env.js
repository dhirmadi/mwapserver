import { z } from 'zod';
import dotenv from 'dotenv';
// Load environment variables
const result = dotenv.config();
console.log('Loaded env vars:', process.env);
if (result.error) {
    console.error('Error loading .env file:', result.error);
}
// Environment schema validation
export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().min(1).max(65535).default(3001),
    MONGODB_URI: z.string(),
    AUTH0_DOMAIN: z.string(),
    AUTH0_AUDIENCE: z.string()
});
let validatedEnv = null;
export const env = new Proxy({}, {
    get: (target, prop) => {
        if (!validatedEnv) {
            validatedEnv = envSchema.parse(process.env);
        }
        return validatedEnv[prop];
    }
});
