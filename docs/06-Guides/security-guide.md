# Security Guide

This guide covers security best practices, common vulnerabilities, and security implementation patterns for the MWAP platform.

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

### Auth0 Security Configuration

#### Production Auth0 Setup
```javascript
// Secure Auth0 configuration
const auth0Config = {
  domain: process.env.AUTH0_DOMAIN,
  audience: process.env.AUTH0_AUDIENCE,
  algorithms: ['RS256'], // Only RS256, never HS256
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  
  // Security settings
  clockTolerance: 30, // 30 seconds clock skew tolerance
  maxAge: '1d', // Maximum token age
  
  // Rate limiting
  strictSsl: true,
  timeout: 30000,
};
```

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