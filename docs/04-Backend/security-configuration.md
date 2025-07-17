# ⚙️ MWAP Security Configuration

## 🎯 Overview

This document provides comprehensive security configuration guidelines for the MWAP platform, covering environment setup, service configuration, monitoring, and compliance requirements.

## 🔧 Environment Security Configuration

### **Environment Variables**
```env
# Core Security Configuration
NODE_ENV=production
SECURITY_LEVEL=high

# Authentication & Authorization
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://api.mwap.local
JWT_SECRET=your-256-bit-secret-key-here
SESSION_SECRET=your-session-secret-here

# Database Security
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mwap?retryWrites=true&w=majority
DB_ENCRYPTION_KEY=your-database-encryption-key
DB_SSL_ENABLED=true
DB_AUTH_SOURCE=admin

# API Security
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
API_CORS_ORIGIN=https://app.mwap.dev,https://admin.mwap.dev
API_TRUSTED_PROXIES=127.0.0.1,::1

# Encryption & Hashing
ENCRYPTION_ALGORITHM=aes-256-gcm
HASH_ALGORITHM=argon2id
SALT_ROUNDS=12

# Security Headers
HSTS_MAX_AGE=31536000
CSP_POLICY=default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'

# Monitoring & Logging
LOG_LEVEL=info
SECURITY_LOG_LEVEL=warn
AUDIT_LOG_ENABLED=true
METRICS_ENABLED=true

# File Upload Security
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,text/plain
UPLOAD_SCAN_ENABLED=true

# Network Security
ALLOWED_IPS=0.0.0.0/0
BLOCKED_IPS=
FIREWALL_ENABLED=true
```

### **Security Headers Configuration**
```typescript
// src/config/security.ts
import helmet from 'helmet';

export const securityConfig = {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.mwap.dev"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  },

  cors: {
    origin: process.env.API_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-API-Version'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400 // 24 hours
  },

  rateLimit: {
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  }
};
```

## 🔐 Authentication Configuration

### **Auth0 Setup**
```typescript
// src/config/auth0.ts
import jwksClient from 'jwks-rsa';

export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  audience: process.env.AUTH0_AUDIENCE!,
  
  // JWKS configuration
  jwks: {
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600000, // 10 minutes
    rateLimit: true,
    jwksRequestsPerMinute: 5
  },

  // Token validation settings
  tokenValidation: {
    algorithms: ['RS256'],
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    audience: process.env.AUTH0_AUDIENCE,
    clockTolerance: 30, // 30 seconds
    maxAge: '24h'
  },

  // Security rules
  rules: {
    requireEmailVerification: true,
    enableMFA: true,
    passwordPolicy: {
      length: { min: 8, max: 128 },
      includeCharacters: {
        lower: true,
        upper: true,
        numbers: true,
        symbols: true
      },
      excludeDictionary: true,
      excludeUserInfo: true
    },
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxConcurrentSessions: 5
  }
};

export const jwksClient = jwksClient(auth0Config.jwks);
```

### **JWT Configuration**
```typescript
// src/config/jwt.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  algorithm: 'HS256' as const,
  expiresIn: '24h',
  issuer: 'mwap-api',
  audience: 'mwap-client',
  
  // Refresh token settings
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET!,
    expiresIn: '7d',
    rotateOnRefresh: true
  },

  // Security settings
  security: {
    notBefore: 0, // Token valid immediately
    clockTolerance: 30, // 30 seconds tolerance
    ignoreExpiration: false,
    ignoreNotBefore: false
  }
};
```

## 🗄️ Database Security Configuration

### **MongoDB Security Settings**
```typescript
// src/config/database.ts
export const databaseConfig = {
  uri: process.env.MONGODB_URI!,
  options: {
    // Connection security
    ssl: process.env.DB_SSL_ENABLED === 'true',
    sslValidate: true,
    authSource: process.env.DB_AUTH_SOURCE || 'admin',
    
    // Connection pooling
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    
    // Monitoring
    monitorCommands: true,
    
    // Security options
    retryWrites: true,
    w: 'majority',
    readPreference: 'primary',
    readConcern: { level: 'majority' }
  },

  // Field-level encryption
  encryption: {
    enabled: process.env.DB_ENCRYPTION_ENABLED === 'true',
    keyId: process.env.DB_ENCRYPTION_KEY_ID,
    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
    encryptedFields: [
      'users.mfaSecret',
      'cloudProviders.config.secretAccessKey',
      'cloudProviders.config.clientSecret',
      'integrations.credentials'
    ]
  },

  // Audit configuration
  audit: {
    enabled: process.env.DB_AUDIT_ENABLED === 'true',
    collection: 'audit_logs',
    events: ['insert', 'update', 'delete'],
    includeSchema: false
  }
};
```

### **Data Validation Schema**
```typescript
// src/config/validation.ts
import { z } from 'zod';

export const validationConfig = {
  // User input validation
  user: {
    email: z.string().email().max(255),
    name: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
    password: z.string().min(8).max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  },

  // File upload validation
  file: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'text/plain'
    ],
    scanForMalware: process.env.UPLOAD_SCAN_ENABLED === 'true'
  },

  // API input validation
  api: {
    maxRequestSize: '10mb',
    parameterPollution: false,
    strictMode: true,
    sanitizeInput: true
  }
};
```

## 🔒 Encryption Configuration

### **Data Encryption Setup**
```typescript
// src/config/encryption.ts
import crypto from 'crypto';

export class EncryptionConfig {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    return Buffer.from(key, 'hex');
  }

  static encrypt(text: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    cipher.setAAD(Buffer.from('mwap-encryption'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    const key = this.getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.ALGORITHM, key);
    decipher.setAAD(Buffer.from('mwap-encryption'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Password hashing configuration
  static readonly passwordConfig = {
    algorithm: 'argon2id',
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
    hashLength: 32,
    saltLength: 16
  };
}
```

## 🚨 Security Monitoring Configuration

### **Logging Configuration**
```typescript
// src/config/logging.ts
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  
  // Security-specific logging
  security: {
    level: process.env.SECURITY_LOG_LEVEL || 'warn',
    events: [
      'authentication_failure',
      'authorization_failure',
      'rate_limit_exceeded',
      'suspicious_activity',
      'data_access_violation',
      'configuration_change'
    ],
    retention: '90d',
    alertThresholds: {
      'authentication_failure': 5,
      'rate_limit_exceeded': 10,
      'suspicious_activity': 1
    }
  },

  // Audit logging
  audit: {
    enabled: process.env.AUDIT_LOG_ENABLED === 'true',
    events: [
      'user_created',
      'user_updated',
      'user_deleted',
      'role_changed',
      'permission_granted',
      'permission_revoked',
      'data_exported',
      'configuration_changed'
    ],
    retention: '7y', // 7 years for compliance
    immutable: true
  },

  // Log destinations
  transports: [
    {
      type: 'console',
      level: 'debug'
    },
    {
      type: 'file',
      filename: 'logs/app.log',
      level: 'info',
      maxSize: '10m',
      maxFiles: 5
    },
    {
      type: 'file',
      filename: 'logs/security.log',
      level: 'warn',
      maxSize: '10m',
      maxFiles: 10
    },
    {
      type: 'file',
      filename: 'logs/audit.log',
      level: 'info',
      maxSize: '50m',
      maxFiles: 50
    }
  ]
};
```

### **Monitoring and Alerting**
```typescript
// src/config/monitoring.ts
export const monitoringConfig = {
  metrics: {
    enabled: process.env.METRICS_ENABLED === 'true',
    endpoint: '/metrics',
    interval: 30000, // 30 seconds
    
    // Security metrics
    security: [
      'authentication_attempts_total',
      'authentication_failures_total',
      'authorization_failures_total',
      'rate_limit_hits_total',
      'suspicious_activities_total',
      'active_sessions_gauge',
      'failed_login_attempts_by_ip'
    ]
  },

  alerts: {
    enabled: true,
    channels: ['email', 'slack', 'webhook'],
    
    rules: [
      {
        name: 'high_authentication_failures',
        condition: 'authentication_failures_total > 10 in 5m',
        severity: 'critical',
        channels: ['email', 'slack']
      },
      {
        name: 'suspicious_activity_detected',
        condition: 'suspicious_activities_total > 0',
        severity: 'high',
        channels: ['email', 'slack', 'webhook']
      },
      {
        name: 'rate_limit_threshold',
        condition: 'rate_limit_hits_total > 100 in 1m',
        severity: 'medium',
        channels: ['slack']
      }
    ]
  },

  healthChecks: {
    enabled: true,
    endpoint: '/health',
    checks: [
      'database_connection',
      'auth0_connectivity',
      'redis_connection',
      'external_apis',
      'disk_space',
      'memory_usage'
    ]
  }
};
```

## 🛡️ Network Security Configuration

### **Firewall Rules**
```yaml
# firewall.yml - Network security configuration
firewall:
  enabled: true
  default_policy: deny
  
  rules:
    # Allow HTTP/HTTPS traffic
    - port: 80
      protocol: tcp
      action: allow
      source: any
    
    - port: 443
      protocol: tcp
      action: allow
      source: any
    
    # Allow SSH (restricted IPs)
    - port: 22
      protocol: tcp
      action: allow
      source: 
        - 10.0.0.0/8
        - 192.168.0.0/16
    
    # Database access (internal only)
    - port: 27017
      protocol: tcp
      action: allow
      source: 
        - 10.0.0.0/8
    
    # Redis access (internal only)
    - port: 6379
      protocol: tcp
      action: allow
      source:
        - 10.0.0.0/8
    
    # Block known malicious IPs
    - action: deny
      source: file:/etc/security/blocked-ips.txt

  rate_limiting:
    enabled: true
    rules:
      - port: 80
        limit: 100/minute
      - port: 443
        limit: 100/minute
      - port: 22
        limit: 5/minute
```

### **SSL/TLS Configuration**
```typescript
// src/config/ssl.ts
export const sslConfig = {
  // TLS settings
  tls: {
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    ciphers: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-RSA-AES256-SHA384'
    ].join(':'),
    honorCipherOrder: true,
    secureProtocol: 'TLSv1_2_method'
  },

  // Certificate configuration
  certificates: {
    key: process.env.SSL_PRIVATE_KEY_PATH,
    cert: process.env.SSL_CERTIFICATE_PATH,
    ca: process.env.SSL_CA_PATH,
    
    // Certificate validation
    rejectUnauthorized: true,
    checkServerIdentity: true,
    
    // OCSP stapling
    enableOCSPStapling: true
  },

  // HSTS configuration
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
};
```

## 🔍 Security Validation

### **Configuration Validation Script**
```typescript
// scripts/validate-security-config.ts
import { z } from 'zod';

const securityConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  AUTH0_DOMAIN: z.string().min(1),
  AUTH0_CLIENT_ID: z.string().min(1),
  AUTH0_CLIENT_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64),
  MONGODB_URI: z.string().startsWith('mongodb'),
  API_CORS_ORIGIN: z.string().min(1),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']),
  AUDIT_LOG_ENABLED: z.enum(['true', 'false'])
});

export function validateSecurityConfiguration(): void {
  try {
    securityConfigSchema.parse(process.env);
    console.log('✅ Security configuration validation passed');
  } catch (error) {
    console.error('❌ Security configuration validation failed:', error);
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  validateSecurityConfiguration();
}
```

## 🔗 Related Documentation

- **[🏛️ Security Architecture](./security-architecture.md)** - Overall security design
- **[🛡️ Security Patterns](./security-patterns.md)** - Security implementation patterns
- **[🔒 Auth Middleware](./auth-middleware.md)** - Authentication middleware
- **[🏗️ Express Structure](./express-structure.md)** - Server architecture
- **[⚙️ Environment Format](../07-Standards/.env-format.md)** - Environment variable standards

---

*This security configuration provides comprehensive protection for the MWAP platform through proper environment setup, service configuration, monitoring, and compliance measures.*