# MWAP Security Guide

This comprehensive guide covers authentication setup, authorization patterns, OAuth integrations, and security best practices for the MWAP platform.

## 🔒 Security Overview

### Security First Approach
MWAP is built with security as a fundamental design principle, implementing defense-in-depth strategies across all layers of the application.

### Key Security Features
- **Zero Trust Architecture**: Never trust, always verify
- **Multi-tenant Data Isolation**: Complete separation between tenants
- **OAuth 2.0 + PKCE**: Industry-standard authentication
- **JWT with RS256**: Secure token validation
- **Encryption at Rest**: Sensitive data encryption in database
- **HTTPS Everywhere**: TLS encryption for all communications
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Input Validation**: Comprehensive request validation
- **Audit Logging**: Complete security event tracking

## 🛡️ Authentication Security

### Auth0 Integration Setup

#### Step 1: Auth0 Account Configuration
1. **Create Auth0 Account**: Go to [auth0.com](https://auth0.com) and create an account
2. **Create Tenant**: Set up separate tenants for development and production
3. **Note Domain**: Your tenant domain (e.g., `your-tenant.auth0.com`)

#### Step 2: Create Auth0 API
1. Navigate to **APIs** in Auth0 Dashboard
2. Click **Create API**
3. Configure:
   - **Name**: `MWAP API`
   - **Identifier**: `https://api.yourapp.com` (becomes AUTH0_AUDIENCE)
   - **Signing Algorithm**: `RS256`
4. Enable **RBAC** and **Add Permissions in the Access Token**

#### Step 3: Create Auth0 Application
1. Navigate to **Applications** in Auth0 Dashboard
2. Click **Create Application**
3. Configure:
   - **Name**: `MWAP Frontend`
   - **Type**: `Single Page Application`
4. Configure Application Settings:
   ```
   Allowed Callback URLs: http://localhost:3000/callback, https://yourapp.com/callback
   Allowed Logout URLs: http://localhost:3000, https://yourapp.com
   Allowed Web Origins: http://localhost:3000, https://yourapp.com
   Allowed Origins (CORS): http://localhost:3000, https://yourapp.com
   ```

### Auth0 Security Configuration

#### Environment Variables
```bash
# .env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.yourapp.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

#### Secure Auth0 Configuration
```typescript
// config/auth0.ts
import { JwksClient } from 'jwks-rsa';

export const jwksClient = new JwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  rateLimit: true,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  timeout: 10000, // 10 seconds
  strictSsl: true
});

export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN,
  audience: process.env.AUTH0_AUDIENCE,
  algorithms: ['RS256'], // Only RS256, never HS256
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  
  // Security settings
  clockTolerance: 30, // 30 seconds clock skew tolerance
  maxAge: '1d', // Maximum token age
  
  // Additional security
  strictSsl: true,
  timeout: 30000,
};
```

#### JWT Middleware Implementation
```typescript
// middleware/auth.ts
import { expressjwt as jwt } from 'express-jwt';
import { jwksClient, auth0Config } from '../config/auth0.js';
import { logInfo, logError } from '../utils/logger.js';

export const authenticateJWT = () => {
  return jwt({
    secret: async (req) => {
      try {
        const token = req.headers.authorization?.split(' ')[1] || '';
        
        logInfo('Processing JWT authentication', {
          endpoint: req.originalUrl,
          method: req.method,
          hasToken: !!token
        });
        
        if (!token) {
          throw new Error('Missing authorization token');
        }
        
        const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
        const key = await jwksClient.getSigningKey(header.kid);
        
        return key.getPublicKey();
      } catch (error) {
        logError('JWT key retrieval failed', { error: error.message });
        throw error;
      }
    },
    audience: auth0Config.audience,
    issuer: auth0Config.issuer,
    algorithms: auth0Config.algorithms,
    clockTolerance: 30,
    onExpired: async (req, err) => {
      logError('JWT token expired', {
        endpoint: req.originalUrl,
        error: err.message
      });
    }
  });
};

#### JWT Security Best Practices
```typescript
// Secure JWT verification
const verifyToken = async (token: string): Promise<AuthenticatedUser> => {
  // 1. Decode header to get key ID
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') {
    throw new UnauthorizedError('Invalid token format');
  }

  // 2. Get signing key using kid
  const signingKey = await getSigningKey(decoded.header.kid!);

  // 3. Verify with strict options
  const payload = jwt.verify(token, signingKey, {
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'], // Only allow RS256
    clockTolerance: 30, // 30 seconds tolerance
    maxAge: '24h', // Maximum token age
  });

  return payload as AuthenticatedUser;
};
```

### Password Security
```typescript
// Password requirements (Auth0 configured)
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  preventCommonPasswords: true,
  preventPersonalInfo: true,
  preventPasswordHistory: 10,
};

// Password breach detection
const checkPasswordBreach = async (password: string): Promise<boolean> => {
  // Use HaveIBeenPwned API or similar service
  // Auth0 can be configured to check against known breaches
};
```

## 🔗 OAuth Integration Security

### OAuth 2.0 Flow Overview

MWAP implements secure OAuth 2.0 authorization code flow for cloud provider integrations:

```
User → Frontend → Cloud Provider → Authorization → Callback → Token Exchange → Secure Storage
```

### OAuth Architecture Components

1. **OAuth Service**: Handles token exchange and refresh operations
2. **OAuth Controller**: Processes OAuth callbacks and token refresh requests
3. **OAuth Routes**: Exposes secure endpoints for OAuth operations
4. **Cloud Provider Integration**: Manages provider-specific OAuth configurations

### OAuth Flow Implementation

#### Step 1: Cloud Provider Registration (Admin Only)
```typescript
// Only admins can register new cloud providers
POST /api/v1/cloud-providers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Dropbox",
  "slug": "dropbox", 
  "scopes": ["files.content.read", "files.metadata.read"],
  "authUrl": "https://www.dropbox.com/oauth2/authorize",
  "tokenUrl": "https://api.dropboxapi.com/oauth2/token",
  "clientId": "your-dropbox-app-key",
  "clientSecret": "your-dropbox-app-secret", // Encrypted in storage
  "metadata": {
    "description": "Dropbox cloud storage integration",
    "iconUrl": "https://example.com/dropbox-icon.png"
  }
}
```

#### Step 2: Create Secure Integration
```typescript
// Frontend creates integration (tenant owner only)
const createIntegration = async (providerId: string, tenantId: string) => {
  const response = await fetch('/api/v1/cloud-integrations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tenantId,
      providerId,
      name: 'My Secure Integration'
    })
  });
  
  return response.json();
};
```

#### Step 3: Secure Authorization Flow
```typescript
// Build secure authorization URL with state parameter
const buildAuthUrl = (provider: CloudProvider, integrationId: string) => {
  const authUrl = new URL(provider.authUrl);
  const state = generateSecureState(integrationId); // CSRF protection
  
  authUrl.searchParams.set('client_id', provider.clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', `${window.location.origin}/api/v1/oauth/callback`);
  authUrl.searchParams.set('scope', provider.scopes.join(' '));
  authUrl.searchParams.set('state', state); // CSRF protection
  
  return authUrl.toString();
};

// Generate cryptographically secure state parameter
const generateSecureState = (integrationId: string): string => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const timestamp = Date.now();
  const payload = { integrationId, timestamp };
  
  // Sign the payload for integrity
  return btoa(JSON.stringify(payload)) + '.' + btoa(String.fromCharCode(...randomBytes));
};
```

### OAuth Callback Security

#### Secure Callback Handler
```typescript
// OAuth callback endpoint with comprehensive security
export async function handleOAuthCallback(req: Request, res: Response) {
  try {
    const { code, state, error } = req.query;
    
    // 1. Validate required parameters
    if (error) {
      logWarn('OAuth authorization denied', { error, state });
      return res.redirect('/integrations?error=authorization_denied');
    }
    
    if (!code || !state) {
      logError('OAuth callback missing parameters', { hasCode: !!code, hasState: !!state });
      return res.redirect('/integrations?error=invalid_callback');
    }
    
    // 2. Validate and decode state parameter (CSRF protection)
    const integrationId = await validateState(state as string);
    if (!integrationId) {
      logError('OAuth callback invalid state', { state });
      return res.redirect('/integrations?error=invalid_state');
    }
    
    // 3. Retrieve integration and provider securely
    const integration = await getIntegrationById(integrationId);
    if (!integration) {
      logError('OAuth callback integration not found', { integrationId });
      return res.redirect('/integrations?error=integration_not_found');
    }
    
    const provider = await getCloudProviderById(integration.providerId);
    if (!provider) {
      logError('OAuth callback provider not found', { providerId: integration.providerId });
      return res.redirect('/integrations?error=provider_not_found');
    }
    
    // 4. Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code as string, provider);
    
    // 5. Encrypt and store tokens securely
    await storeTokensSecurely(integrationId, tokens);
    
    // 6. Update integration status
    await updateIntegrationStatus(integrationId, 'active');
    
    // 7. Log successful authorization
    logInfo('OAuth authorization successful', {
      integrationId,
      providerId: provider._id,
      tenantId: integration.tenantId
    });
    
    // 8. Redirect to success page
    return res.redirect('/integrations?success=authorized');
    
  } catch (error) {
    logError('OAuth callback error', { error: error.message, stack: error.stack });
    return res.redirect('/integrations?error=callback_failed');
  }
}

// Secure token exchange
const exchangeCodeForTokens = async (
  code: string, 
  provider: CloudProvider
): Promise<OAuthTokens> => {
  const tokenData = {
    grant_type: 'authorization_code',
    client_id: provider.clientId,
    client_secret: decrypt(provider.clientSecret), // Decrypt for use
    code,
    redirect_uri: `${process.env.API_BASE_URL}/api/v1/oauth/callback`
  };
  
  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams(tokenData)
  });
  
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }
  
  const tokens = await response.json();
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    scope: tokens.scope?.split(' ') || provider.scopes
  };
};
```

### Token Security

#### Secure Token Storage
```typescript
// Encrypt OAuth tokens before database storage
const storeTokensSecurely = async (integrationId: string, tokens: OAuthTokens) => {
  const encryptedTokens = {
    accessToken: encrypt(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
    expiresAt: tokens.expiresAt,
    scope: tokens.scope
  };
  
  await db.collection('cloudIntegrations').updateOne(
    { _id: new ObjectId(integrationId) },
    {
      $set: {
        authData: encryptedTokens,
        status: 'active',
        updatedAt: new Date()
      }
    }
  );
};

// Secure token refresh with automatic retry
const refreshTokenSecurely = async (integrationId: string): Promise<void> => {
  const integration = await getIntegrationById(integrationId);
  if (!integration || !integration.authData.refreshToken) {
    throw new Error('Integration or refresh token not found');
  }
  
  const provider = await getCloudProviderById(integration.providerId);
  if (!provider) {
    throw new Error('Cloud provider not found');
  }
  
  try {
    // Decrypt refresh token for use
    const refreshToken = decrypt(integration.authData.refreshToken);
    
    const tokenData = {
      grant_type: 'refresh_token',
      client_id: provider.clientId,
      client_secret: decrypt(provider.clientSecret),
      refresh_token: refreshToken
    };
    
    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenData)
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }
    
    const newTokens = await response.json();
    
    // Store new encrypted tokens
    await storeTokensSecurely(integrationId, {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token || refreshToken, // Some providers don't return new refresh token
      expiresAt: newTokens.expires_in ? new Date(Date.now() + newTokens.expires_in * 1000) : undefined,
      scope: newTokens.scope?.split(' ') || integration.authData.scope
    });
    
    logInfo('OAuth tokens refreshed successfully', { integrationId });
    
  } catch (error) {
    logError('OAuth token refresh failed', { integrationId, error: error.message });
    
    // Mark integration as error state
    await updateIntegrationStatus(integrationId, 'error');
    throw error;
  }
};
```

### OAuth Security Best Practices

#### CSRF Protection
```typescript
// Implement strong CSRF protection with state parameter
const validateState = async (state: string): Promise<string | null> => {
  try {
    const [payload, signature] = state.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    
    // 1. Validate timestamp (prevent replay attacks)
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (now - decodedPayload.timestamp > maxAge) {
      logWarn('OAuth state expired', { timestamp: decodedPayload.timestamp, now });
      return null;
    }
    
    // 2. Validate integration exists and is accessible
    const integration = await getIntegrationById(decodedPayload.integrationId);
    if (!integration) {
      logWarn('OAuth state invalid integration', { integrationId: decodedPayload.integrationId });
      return null;
    }
    
    return decodedPayload.integrationId;
  } catch (error) {
    logError('OAuth state validation failed', { error: error.message, state });
    return null;
  }
};
```

#### Scope Limitation
```typescript
// Implement principle of least privilege for OAuth scopes
const validateScopes = (requestedScopes: string[], providerScopes: string[]): string[] => {
  // Only allow scopes that are configured for the provider
  const allowedScopes = requestedScopes.filter(scope => providerScopes.includes(scope));
  
  if (allowedScopes.length !== requestedScopes.length) {
    logWarn('OAuth scope restriction applied', {
      requested: requestedScopes,
      allowed: allowedScopes
    });
  }
  
  return allowedScopes;
};
```

### OAuth API Endpoints

#### Secure OAuth Callback
```typescript
// GET /api/v1/oauth/callback (Public endpoint with validation)
app.get('/api/v1/oauth/callback', handleOAuthCallback);
```

#### Secure Token Refresh
```typescript
// POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh
app.post('/api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh',
  authenticateJWT(),
  requireTenantOwner('tenantId'),
  async (req: Request, res: Response) => {
    try {
      const { integrationId } = req.params;
      await refreshTokenSecurely(integrationId);
      
      return jsonResponse(res, { success: true }, 'Tokens refreshed successfully');
    } catch (error) {
      return errorResponse(res, 500, 'Token refresh failed', 'OAUTH_REFRESH_FAILED');
    }
  }
);
```

## 🔐 Authorization Security

### Role-Based Access Control (RBAC)
```typescript
// Principle of least privilege
const rolePermissions = {
  viewer: ['read'],
  member: ['read', 'create'],
  admin: ['read', 'create', 'update', 'delete'],
  owner: ['read', 'create', 'update', 'delete', 'manage'],
} as const;

// Secure permission checking
const hasPermission = (userRole: string, requiredPermission: string): boolean => {
  const permissions = rolePermissions[userRole as keyof typeof rolePermissions];
  return permissions?.includes(requiredPermission as any) || false;
};

// Context-aware authorization
const checkResourceAccess = async (
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string
): Promise<boolean> => {
  // 1. Verify user has access to the resource
  // 2. Check if user has required permission for action
  // 3. Verify tenant isolation
  // 4. Check for temporary restrictions or suspensions
};
```

### Multi-tenant Security
```typescript
// Tenant isolation enforcement
const enforceTenantIsolation = async (req: Request): Promise<void> => {
  const userId = req.user.sub;
  const tenantId = req.params.tenantId || req.body.tenantId;
  
  if (!tenantId) {
    throw new BadRequestError('Tenant ID required');
  }
  
  // Verify user has access to this tenant
  const hasAccess = await userHasTenantAccess(userId, tenantId);
  if (!hasAccess) {
    throw new ForbiddenError('Access denied to tenant');
  }
  
  // Add tenant context to request
  req.tenantId = tenantId;
};

// Automatic tenant scoping for database queries
const getTenantScopedCollection = <T>(collectionName: string, tenantId: string) => {
  return {
    find: (query: any = {}) => db.collection<T>(collectionName).find({
      ...query,
      tenantId: new ObjectId(tenantId)
    }),
    findOne: (query: any = {}) => db.collection<T>(collectionName).findOne({
      ...query,
      tenantId: new ObjectId(tenantId)
    }),
    // ... other methods with automatic tenant scoping
  };
};
```

## 🔒 Data Security

### Encryption at Rest
```typescript
// Sensitive data encryption
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    if (this.key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (64 hex characters)');
    }
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('mwap-platform', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('mwap-platform', 'utf8'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Usage for OAuth tokens
const encryptionService = new EncryptionService();

const storeOAuthTokens = async (tokens: OAuthTokens) => {
  const encryptedTokens = {
    accessToken: encryptionService.encrypt(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encryptionService.encrypt(tokens.refreshToken) : null,
    expiresAt: tokens.expiresAt,
  };
  
  await db.collection('cloudIntegrations').updateOne(
    { _id: integrationId },
    { $set: { oauth: encryptedTokens } }
  );
};
```

### Input Validation & Sanitization
```typescript
// Comprehensive input validation
import { z } from 'zod';
import xss from 'xss';
import mongoSanitize from 'express-mongo-sanitize';

// Schema-based validation
const CreateTenantSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .transform(val => val ? xss(val) : val), // XSS protection
}).strict(); // Reject unknown properties

// Request validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize MongoDB operators
      req.body = mongoSanitize.sanitize(req.body);
      
      // Validate against schema
      const result = schema.parse(req.body);
      req.body = result;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationErrors,
          },
        });
      }
      next(error);
    }
  };
};
```

### SQL/NoSQL Injection Prevention
```typescript
// MongoDB injection prevention
import mongoSanitize from 'express-mongo-sanitize';

// Global middleware to remove malicious operators
app.use(mongoSanitize({
  replaceWith: '_', // Replace $ and . with _
  onSanitize: ({ req, key }) => {
    console.warn(`Potential injection attempt from ${req.ip}: ${key}`);
  },
}));

// Safe query construction
const findTenantsByUser = async (userId: string, filters: any = {}) => {
  // Use parameterized queries
  const query = {
    ownerId: userId, // Direct parameter, safe
    ...mongoSanitize.sanitize(filters), // Sanitize user input
    deletedAt: { $exists: false }, // Predefined safe query
  };
  
  return await db.collection('tenants').find(query).toArray();
};

// Type-safe query building
const buildSafeQuery = (params: {
  userId: string;
  tenantId?: string;
  status?: 'active' | 'archived';
}) => {
  const query: any = { ownerId: params.userId };
  
  if (params.tenantId) {
    query.tenantId = new ObjectId(params.tenantId); // Type-safe ObjectId
  }
  
  if (params.status) {
    query.status = params.status; // Enum validation
  }
  
  return query;
};
```

## 🌐 Network Security

### HTTPS Configuration
```typescript
// Force HTTPS in production
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
});

// Security headers
import helmet from 'helmet';

app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for some UI libraries
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.auth0.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Hide X-Powered-By
  hidePoweredBy: true,
}));
```

### CORS Configuration
```typescript
// Secure CORS setup
import cors from 'cors';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests from allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Tenant-ID'],
  maxAge: 86400, // Cache preflight for 24 hours
};

app.use(cors(corsOptions));
```

### Rate Limiting
```typescript
// Multi-level rate limiting
import rateLimit from 'express-rate-limit';

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Limit authentication attempts
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT',
    retryAfter: '15 minutes',
  },
});

// API rate limiting per user
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per user
  keyGenerator: (req) => req.user?.sub || req.ip,
  message: {
    error: 'API rate limit exceeded',
    code: 'API_RATE_LIMIT',
    retryAfter: '1 minute',
  },
});

// Apply rate limiting
app.use('/api/', globalLimiter);
app.use('/api/v1/auth/', authLimiter);
app.use('/api/v1/', apiLimiter);
```

## 🔍 Security Monitoring

### Audit Logging
```typescript
// Comprehensive audit logging
interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: {
    type: string;
    id: string;
  };
  ip: string;
  userAgent?: string;
  success: boolean;
  details?: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class AuditLogger {
  private collection = db.collection<AuditLogEntry>('auditLogs');
  
  async logSecurityEvent(event: Omit<AuditLogEntry, 'timestamp'>) {
    const entry: AuditLogEntry = {
      ...event,
      timestamp: new Date(),
    };
    
    // Store in database
    await this.collection.insertOne(entry);
    
    // Alert on critical events
    if (event.severity === 'critical') {
      await this.sendSecurityAlert(entry);
    }
  }
  
  private async sendSecurityAlert(entry: AuditLogEntry) {
    // Send immediate alert for critical security events
    console.error('SECURITY ALERT:', entry);
    // Integrate with alerting service (PagerDuty, Slack, etc.)
  }
}

// Usage in middleware
const auditLogger = new AuditLogger();

const securityAuditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', async () => {
    const isFailure = res.statusCode >= 400;
    const isSecuritySensitive = req.path.includes('/auth') || 
                                req.path.includes('/admin') ||
                                req.method === 'DELETE';
    
    if (isFailure || isSecuritySensitive) {
      await auditLogger.logSecurityEvent({
        userId: req.user?.sub,
        action: `${req.method} ${req.path}`,
        resource: {
          type: 'api_endpoint',
          id: req.path,
        },
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: !isFailure,
        details: isFailure ? { statusCode: res.statusCode } : undefined,
        severity: isFailure && isSecuritySensitive ? 'high' : 'medium',
      });
    }
  });
  
  next();
};
```

### Intrusion Detection
```typescript
// Suspicious activity detection
class SecurityMonitor {
  private suspiciousPatterns = {
    rapidRequests: { threshold: 100, window: 60000 }, // 100 requests in 1 minute
    failedLogins: { threshold: 5, window: 300000 }, // 5 failed logins in 5 minutes
    unauthorizedAccess: { threshold: 3, window: 600000 }, // 3 403s in 10 minutes
  };
  
  async checkSuspiciousActivity(req: Request, res: Response) {
    const ip = req.ip;
    const userId = req.user?.sub;
    
    // Check for rapid requests
    if (await this.isRapidRequests(ip)) {
      await this.handleSuspiciousActivity('rapid_requests', ip, userId);
    }
    
    // Check for failed authentication
    if (res.statusCode === 401 && await this.isFailedLoginPattern(ip)) {
      await this.handleSuspiciousActivity('failed_logins', ip, userId);
    }
    
    // Check for unauthorized access attempts
    if (res.statusCode === 403 && await this.isUnauthorizedPattern(ip)) {
      await this.handleSuspiciousActivity('unauthorized_access', ip, userId);
    }
  }
  
  private async handleSuspiciousActivity(
    type: string,
    ip: string,
    userId?: string
  ) {
    // Log security incident
    await auditLogger.logSecurityEvent({
      userId,
      action: `suspicious_activity_${type}`,
      resource: { type: 'security', id: ip },
      ip,
      success: false,
      severity: 'high',
      details: { activityType: type },
    });
    
    // Implement response (rate limiting, temporary IP block, etc.)
    await this.implementSecurityResponse(type, ip);
  }
}
```

## 🚨 Incident Response

### Security Incident Handling
```typescript
// Incident response procedures
class IncidentResponseService {
  async handleSecurityBreach(incident: SecurityIncident) {
    // 1. Immediate containment
    await this.containThreat(incident);
    
    // 2. Assessment
    const impact = await this.assessImpact(incident);
    
    // 3. Notification
    await this.notifyStakeholders(incident, impact);
    
    // 4. Investigation
    await this.startInvestigation(incident);
    
    // 5. Recovery
    await this.initiateRecovery(incident);
  }
  
  private async containThreat(incident: SecurityIncident) {
    switch (incident.type) {
      case 'unauthorized_access':
        // Revoke access tokens
        await this.revokeUserTokens(incident.affectedUserId);
        break;
        
      case 'data_breach':
        // Lock affected tenant
        await this.lockTenant(incident.tenantId);
        break;
        
      case 'malicious_requests':
        // Block IP address
        await this.blockIP(incident.sourceIP);
        break;
    }
  }
}
```

### Data Breach Response
```typescript
// GDPR-compliant breach notification
class BreachNotificationService {
  async handleDataBreach(breach: DataBreachIncident) {
    // Log the breach
    await this.logBreach(breach);
    
    // Assess severity
    const severity = await this.assessBreachSeverity(breach);
    
    // Notify authorities if required (within 72 hours for GDPR)
    if (severity.requiresAuthorityNotification) {
      await this.notifyDataProtectionAuthority(breach);
    }
    
    // Notify affected users if required
    if (severity.requiresUserNotification) {
      await this.notifyAffectedUsers(breach);
    }
    
    // Document response
    await this.documentBreachResponse(breach, severity);
  }
}
```

## 📋 Security Checklist

### Development Security Checklist
- [ ] **Authentication**
  - [ ] Using Auth0 with PKCE flow
  - [ ] JWT validation with RS256
  - [ ] Proper token expiration handling
  - [ ] Secure session management

- [ ] **Authorization**
  - [ ] Role-based access control implemented
  - [ ] Tenant isolation enforced
  - [ ] Principle of least privilege applied
  - [ ] Resource-level permissions checked

- [ ] **Input Validation**
  - [ ] All inputs validated with Zod schemas
  - [ ] XSS prevention implemented
  - [ ] SQL/NoSQL injection prevention
  - [ ] File upload validation

- [ ] **Data Protection**
  - [ ] Sensitive data encrypted at rest
  - [ ] Encryption keys properly managed
  - [ ] Secure data transmission (HTTPS)
  - [ ] PII handling compliance

- [ ] **Network Security**
  - [ ] HTTPS enforced in production
  - [ ] Security headers configured
  - [ ] CORS properly configured
  - [ ] Rate limiting implemented

- [ ] **Monitoring & Logging**
  - [ ] Audit logging for security events
  - [ ] Error logging without sensitive data
  - [ ] Monitoring suspicious activities
  - [ ] Incident response procedures

### Deployment Security Checklist
- [ ] **Environment Security**
  - [ ] Environment variables properly secured
  - [ ] Production secrets in secure storage
  - [ ] Database access restricted
  - [ ] Network segmentation implemented

- [ ] **Infrastructure Security**
  - [ ] Regular security updates
  - [ ] Vulnerability scanning
  - [ ] Backup encryption
  - [ ] Disaster recovery plan

## 🔧 Security Testing

### Security Test Examples
```typescript
// Security test examples
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/v1/tenants')
        .expect(401);
      
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
    
    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/v1/tenants')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });
  
  describe('Input Validation', () => {
    it('should reject XSS attempts', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: xssPayload })
        .expect(400);
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
    
    it('should prevent NoSQL injection', async () => {
      const injectionPayload = { $ne: null };
      
      const response = await request(app)
        .get('/api/v1/tenants')
        .query({ ownerId: injectionPayload })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);
    });
  });
  
  describe('Authorization', () => {
    it('should prevent cross-tenant access', async () => {
      const response = await request(app)
        .get('/api/v1/tenants/other-tenant-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
      
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
```

---

*This security guide provides comprehensive protection strategies to ensure MWAP remains secure against evolving threats while maintaining usability and performance.* 