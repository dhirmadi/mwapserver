# Environment Variables Documentation

This document describes all environment variables used in the MWAP server application.

## Core Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | Yes | 3001 | The port number the server will listen on |
| NODE_ENV | Yes | development | Application environment (development/test/production) |
| API_BASE_URL | Yes | - | Base URL for the API, used for documentation and callbacks |
| CORS_ORIGIN | Yes | - | Allowed origin for CORS requests |

## Logging & Debugging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| LOG_LEVEL | No | info | Logging level (debug/info/warn/error) |
| DEBUG | No | - | Debug patterns for detailed logging |
| ENABLE_REQUEST_LOGGING | No | false | Enable detailed HTTP request logging |

## MongoDB Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| MONGO_URI | Yes | - | MongoDB connection string |
| MONGO_MAX_POOL_SIZE | No | 10 | Maximum number of connections in pool |
| MONGO_MIN_POOL_SIZE | No | 2 | Minimum number of connections in pool |
| MONGO_CONNECT_TIMEOUT_MS | No | 10000 | Connection timeout in milliseconds |
| MONGO_SOCKET_TIMEOUT_MS | No | 45000 | Socket timeout in milliseconds |

### Field-Level Encryption
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| MONGO_CLIENT_ENCRYPTION_KEY | Yes | - | Base64 encoded encryption key |
| MONGO_ENCRYPTION_KEY_NAME | Yes | - | Name of the encryption key in MongoDB |

## Auth0 Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| AUTH0_DOMAIN | Yes | - | Auth0 tenant domain |
| AUTH0_CLIENT_ID | Yes | - | Auth0 application client ID |
| AUTH0_CLIENT_SECRET | Yes | - | Auth0 application client secret |
| AUTH0_AUDIENCE | Yes | - | Auth0 API identifier |
| AUTH0_TOKEN_SIGNING_ALG | No | RS256 | JWT signing algorithm |
| AUTH0_CALLBACK_URL | No | - | OAuth callback URL |

## Security Settings

### Rate Limiting
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| RATE_LIMITING_ENABLED | No | true | Enable rate limiting |
| RATE_LIMIT_WINDOW_MS | No | 900000 | Time window in milliseconds |
| RATE_LIMIT_MAX_REQUESTS | No | 100 | Maximum requests per window |

### Security Headers
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| HELMET_ENABLED | No | true | Enable Helmet security headers |
| CSP_DIRECTIVES | No | - | Content Security Policy directives |

## Metrics & Monitoring

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| METRICS_ENABLED | No | false | Enable metrics collection |
| METRICS_INTERVAL | No | 60000 | Metrics collection interval (ms) |
| APM_ENABLED | No | false | Enable Application Performance Monitoring |
| TRACE_SAMPLING_RATE | No | 0.1 | Trace sampling rate (0-1) |

## Caching Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| CACHE_ENABLED | No | true | Enable response caching |
| CACHE_TTL | No | 300 | Cache TTL in seconds |
| CACHE_CHECK_PERIOD | No | 600 | Cache cleanup interval in seconds |

## Error Handling

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| ERROR_LOGGING_ENABLED | No | true | Enable detailed error logging |
| ERROR_NOTIFICATION_WEBHOOK | No | - | Webhook URL for error notifications |

## Best Practices

1. **Security**
   - Never commit .env files to version control
   - Use different values for different environments
   - Rotate secrets regularly
   - Use strong encryption keys

2. **Development**
   - Copy .env.example to .env for new setups
   - Keep .env.example updated with new variables
   - Document all changes in this file

3. **Production**
   - Use a secrets management service
   - Enable all security features
   - Set appropriate rate limits
   - Configure strict CORS settings

4. **Monitoring**
   - Enable metrics in production
   - Configure error notifications
   - Set appropriate logging levels
   - Monitor rate limiting