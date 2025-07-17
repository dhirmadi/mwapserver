# Environment Variables

This document describes all environment variables used in the MWAP server application, based on the actual implementation in `src/config/env.ts`.

## Required Environment Variables

The following environment variables are validated by the Zod schema in `src/config/env.ts`:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | enum | `development` | Application environment: `development`, `test`, or `production` |
| `PORT` | number | `3001` | The port number the server will listen on (1-65535) |
| `MONGODB_URI` | string | - | MongoDB connection string (required) |
| `AUTH0_DOMAIN` | string | - | Auth0 tenant domain (required) |
| `AUTH0_AUDIENCE` | string | - | Auth0 API identifier (required) |

## Environment Setup

### Development Environment

Create a `.env` file in the project root with the following variables:

```bash
# Application
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap-dev

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.mwap.dev
```

### Production Environment

For production deployment, ensure all required variables are set:

```bash
# Application
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap-prod

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.mwap.dev
```

## Configuration Validation

The application uses Zod schema validation to ensure all required environment variables are present and correctly typed. The validation occurs at runtime when environment variables are first accessed.

### Schema Definition

```typescript
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  MONGODB_URI: z.string(),
  AUTH0_DOMAIN: z.string(),
  AUTH0_AUDIENCE: z.string()
});
```

### Error Handling

If required environment variables are missing or invalid, the application will throw a validation error at startup with details about which variables need to be corrected.

## Security Considerations

- **Never commit `.env` files** to version control
- **Use different databases** for development, test, and production
- **Rotate Auth0 credentials** regularly
- **Use environment-specific Auth0 tenants** for isolation

## Additional Configuration

### CORS Configuration

CORS is configured in `src/app.ts` based on the `NODE_ENV`:

- **Development**: Allows all origins (`true`)
- **Production**: Restricts to `https://app.mwap.dev`

### Rate Limiting

Rate limiting is configured with:
- **Window**: 15 minutes
- **Max requests**: 100 per window per IP

### Database Connection

MongoDB connection is configured in `src/config/db.ts` using the `MONGODB_URI` environment variable.

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   Error: Environment validation failed
   ```
   - Ensure all required variables are set in your `.env` file
   - Check variable names match exactly (case-sensitive)

2. **Invalid MongoDB URI**
   ```
   Error: MongoServerError: Authentication failed
   ```
   - Verify MongoDB connection string format
   - Check username/password credentials
   - Ensure database name is correct

3. **Auth0 Configuration Issues**
   ```
   Error: Unable to verify JWT token
   ```
   - Verify Auth0 domain format (without `https://`)
   - Check Auth0 audience matches API identifier
   - Ensure Auth0 application is configured correctly

## Best Practices

1. **Security**
   - Never commit `.env` files to version control
   - Use different values for different environments
   - Rotate Auth0 credentials regularly
   - Use environment-specific MongoDB databases

2. **Development**
   - Copy `.env.example` to `.env` for new setups
   - Keep `.env.example` updated with new variables
   - Document all changes in this file

3. **Production**
   - Use a secrets management service
   - Set `NODE_ENV=production`
   - Configure strict CORS settings
   - Use production MongoDB cluster