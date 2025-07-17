# 🛡️ MWAP Security Patterns

## 🎯 Overview

This document outlines security implementation patterns used throughout the MWAP platform, providing reusable security solutions for common scenarios including authentication, authorization, data protection, and threat mitigation.

## 🔒 Authentication Patterns

### **JWT Token Validation Pattern**
```typescript
// Pattern: Centralized JWT validation with caching
class JWTValidator {
  private keyCache = new Map<string, string>();
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes

  async validateToken(token: string): Promise<JWTPayload> {
    try {
      const header = this.parseTokenHeader(token);
      const publicKey = await this.getPublicKey(header.kid);
      
      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        audience: env.AUTH0_AUDIENCE,
        issuer: `https://${env.AUTH0_DOMAIN}/`
      }) as JWTPayload;

      return this.validateClaims(payload);
    } catch (error) {
      throw new AppError('Invalid token', 401, 'AUTH_INVALID_TOKEN');
    }
  }

  private async getPublicKey(kid: string): Promise<string> {
    const cacheKey = `jwks:${kid}`;
    const cached = this.keyCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.key;
    }

    const key = await jwksClient.getSigningKey(kid);
    const publicKey = key.getPublicKey();
    
    this.keyCache.set(cacheKey, {
      key: publicKey,
      timestamp: Date.now()
    });

    return publicKey;
  }
}
```

### **Multi-Factor Authentication Pattern**
```typescript
// Pattern: MFA verification with fallback options
class MFAValidator {
  async verifyMFA(userId: string, token: string, method: MFAMethod): Promise<boolean> {
    switch (method) {
      case 'totp':
        return this.verifyTOTP(userId, token);
      case 'sms':
        return this.verifySMS(userId, token);
      case 'email':
        return this.verifyEmail(userId, token);
      default:
        throw new AppError('Invalid MFA method', 400);
    }
  }

  private async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const user = await User.findOne({ auth0Id: userId });
    if (!user?.mfaSecret) {
      throw new AppError('TOTP not configured', 400);
    }

    const isValid = speakeasy.totp.verify({
      secret: this.decrypt(user.mfaSecret),
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps tolerance
    });

    if (isValid) {
      await this.logMFASuccess(userId, 'totp');
    } else {
      await this.logMFAFailure(userId, 'totp');
    }

    return isValid;
  }
}
```

## 🛡️ Authorization Patterns

### **Role-Based Access Control (RBAC) Pattern**
```typescript
// Pattern: Hierarchical role-based permissions
class RBACManager {
  private roleHierarchy = {
    'superadmin': 100,
    'tenant_owner': 50,
    'project_admin': 30,
    'project_member': 10
  };

  private permissions = {
    'superadmin': ['*'],
    'tenant_owner': ['tenant:*', 'user:*', 'project:*', 'file:*'],
    'project_admin': ['project:read', 'project:write', 'project:admin', 'file:*'],
    'project_member': ['project:read', 'file:read', 'file:write']
  };

  hasPermission(userRole: string, requiredPermission: string): boolean {
    const userPermissions = this.permissions[userRole] || [];
    
    return userPermissions.some(permission => {
      if (permission === '*') return true;
      if (permission.endsWith('*')) {
        const prefix = permission.slice(0, -1);
        return requiredPermission.startsWith(prefix);
      }
      return permission === requiredPermission;
    });
  }

  hasRole(userRole: string, requiredRole: string): boolean {
    const userLevel = this.roleHierarchy[userRole] || 0;
    const requiredLevel = this.roleHierarchy[requiredRole] || 0;
    return userLevel >= requiredLevel;
  }

  // Pattern: Context-aware authorization
  async authorizeResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    const user = await this.getUserContext(userId);
    
    // Check basic permission
    if (!this.hasPermission(user.role, `${resourceType}:${action}`)) {
      return false;
    }

    // Check resource-specific access
    switch (resourceType) {
      case 'project':
        return this.checkProjectAccess(userId, resourceId, action);
      case 'file':
        return this.checkFileAccess(userId, resourceId, action);
      default:
        return false;
    }
  }
}
```

### **Attribute-Based Access Control (ABAC) Pattern**
```typescript
// Pattern: Fine-grained attribute-based access control
interface AccessContext {
  user: UserAttributes;
  resource: ResourceAttributes;
  environment: EnvironmentAttributes;
  action: string;
}

class ABACEvaluator {
  async evaluate(context: AccessContext): Promise<boolean> {
    const policies = await this.getPoliciesForResource(context.resource.type);
    
    for (const policy of policies) {
      const result = await this.evaluatePolicy(policy, context);
      if (result === 'deny') return false;
      if (result === 'permit') return true;
    }
    
    return false; // Default deny
  }

  private async evaluatePolicy(policy: Policy, context: AccessContext): Promise<'permit' | 'deny' | 'not_applicable'> {
    // Evaluate conditions
    for (const condition of policy.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return 'not_applicable';
      }
    }

    // All conditions met, return policy effect
    return policy.effect;
  }

  private evaluateCondition(condition: Condition, context: AccessContext): boolean {
    switch (condition.type) {
      case 'user_attribute':
        return this.checkUserAttribute(condition, context.user);
      case 'resource_attribute':
        return this.checkResourceAttribute(condition, context.resource);
      case 'time_based':
        return this.checkTimeConstraint(condition, context.environment);
      case 'ip_based':
        return this.checkIPConstraint(condition, context.environment);
      default:
        return false;
    }
  }
}
```

## 🔐 Data Protection Patterns

### **Field-Level Encryption Pattern**
```typescript
// Pattern: Transparent field-level encryption
class FieldEncryption {
  private encryptedFields = [
    'cloudProviders.config.secretAccessKey',
    'cloudProviders.config.clientSecret',
    'users.mfaSecret',
    'integrations.credentials'
  ];

  encrypt(data: any, fieldPath: string): any {
    if (!this.shouldEncrypt(fieldPath)) return data;
    
    const value = this.getNestedValue(data, fieldPath);
    if (!value) return data;

    const encrypted = this.encryptValue(value);
    return this.setNestedValue(data, fieldPath, encrypted);
  }

  decrypt(data: any, fieldPath: string): any {
    if (!this.shouldEncrypt(fieldPath)) return data;
    
    const encryptedValue = this.getNestedValue(data, fieldPath);
    if (!encryptedValue) return data;

    const decrypted = this.decryptValue(encryptedValue);
    return this.setNestedValue(data, fieldPath, decrypted);
  }

  private encryptValue(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.getEncryptionKey());
    cipher.setAAD(Buffer.from('mwap-field-encryption'));
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
}
```

### **Data Masking Pattern**
```typescript
// Pattern: Sensitive data masking for logs and responses
class DataMasker {
  private sensitiveFields = [
    'password', 'token', 'secret', 'key', 'credential',
    'ssn', 'creditCard', 'bankAccount', 'apiKey'
  ];

  maskForLogging(data: any): any {
    return this.deepMask(data, (key, value) => {
      if (this.isSensitiveField(key)) {
        return this.maskValue(value);
      }
      return value;
    });
  }

  maskForResponse(data: any, userRole: string): any {
    const maskingRules = this.getMaskingRules(userRole);
    
    return this.deepMask(data, (key, value) => {
      const rule = maskingRules.find(r => r.field === key);
      if (rule) {
        return this.applyMaskingRule(value, rule);
      }
      return value;
    });
  }

  private maskValue(value: any): string {
    if (typeof value !== 'string') return '***MASKED***';
    
    if (value.length <= 4) return '***';
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
  }

  private isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.sensitiveFields.some(sensitive => 
      lowerField.includes(sensitive)
    );
  }
}
```

## 🚨 Threat Detection Patterns

### **Rate Limiting Pattern**
```typescript
// Pattern: Adaptive rate limiting with threat detection
class AdaptiveRateLimiter {
  private limits = {
    'login': { requests: 5, window: 15 * 60 * 1000, penalty: 60 * 60 * 1000 },
    'api': { requests: 100, window: 15 * 60 * 1000, penalty: 5 * 60 * 1000 },
    'upload': { requests: 10, window: 60 * 1000, penalty: 10 * 60 * 1000 }
  };

  async checkLimit(identifier: string, action: string): Promise<RateLimitResult> {
    const key = `rate_limit:${action}:${identifier}`;
    const limit = this.limits[action];
    
    if (!limit) {
      throw new AppError('Unknown action for rate limiting', 400);
    }

    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;

    // Check if currently blocked
    const blockKey = `blocked:${action}:${identifier}`;
    const blocked = await redis.get(blockKey);
    if (blocked) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + limit.penalty,
        blocked: true
      };
    }

    if (count >= limit.requests) {
      // Apply penalty
      await redis.setex(blockKey, limit.penalty / 1000, 'blocked');
      await this.logSecurityEvent('rate_limit_exceeded', {
        identifier,
        action,
        count,
        limit: limit.requests
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + limit.penalty,
        blocked: true
      };
    }

    // Increment counter
    await redis.multi()
      .incr(key)
      .expire(key, limit.window / 1000)
      .exec();

    return {
      allowed: true,
      remaining: limit.requests - count - 1,
      resetTime: Date.now() + limit.window,
      blocked: false
    };
  }
}
```

### **Anomaly Detection Pattern**
```typescript
// Pattern: Behavioral anomaly detection
class AnomalyDetector {
  async detectAnomalies(userId: string, activity: UserActivity): Promise<AnomalyResult[]> {
    const baseline = await this.getUserBaseline(userId);
    const anomalies: AnomalyResult[] = [];

    // Check location anomaly
    if (this.isLocationAnomalous(activity.location, baseline.locations)) {
      anomalies.push({
        type: 'location',
        severity: 'medium',
        description: 'Login from unusual location',
        confidence: 0.8
      });
    }

    // Check time anomaly
    if (this.isTimeAnomalous(activity.timestamp, baseline.activeTimes)) {
      anomalies.push({
        type: 'time',
        severity: 'low',
        description: 'Activity at unusual time',
        confidence: 0.6
      });
    }

    // Check device anomaly
    if (this.isDeviceAnomalous(activity.device, baseline.devices)) {
      anomalies.push({
        type: 'device',
        severity: 'high',
        description: 'Activity from new device',
        confidence: 0.9
      });
    }

    // Check behavior anomaly
    if (this.isBehaviorAnomalous(activity.actions, baseline.behavior)) {
      anomalies.push({
        type: 'behavior',
        severity: 'medium',
        description: 'Unusual activity pattern',
        confidence: 0.7
      });
    }

    return anomalies;
  }

  private async handleAnomalies(userId: string, anomalies: AnomalyResult[]): Promise<void> {
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
    
    if (highSeverityAnomalies.length > 0) {
      // Require additional authentication
      await this.requireMFA(userId);
      await this.notifySecurityTeam(userId, anomalies);
    }

    // Log all anomalies
    for (const anomaly of anomalies) {
      await this.logSecurityEvent('anomaly_detected', {
        userId,
        anomaly,
        timestamp: new Date()
      });
    }
  }
}
```

## 🔍 Input Validation Patterns

### **Comprehensive Input Sanitization Pattern**
```typescript
// Pattern: Multi-layer input validation and sanitization
class InputValidator {
  private dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];

  validate(input: any, schema: ValidationSchema): ValidationResult {
    // Type validation
    const typeResult = this.validateType(input, schema.type);
    if (!typeResult.valid) return typeResult;

    // Format validation
    if (schema.format) {
      const formatResult = this.validateFormat(input, schema.format);
      if (!formatResult.valid) return formatResult;
    }

    // Content validation
    const contentResult = this.validateContent(input, schema.rules);
    if (!contentResult.valid) return contentResult;

    // Sanitization
    const sanitized = this.sanitize(input, schema.sanitization);

    return {
      valid: true,
      sanitized,
      warnings: []
    };
  }

  private sanitize(input: string, rules: SanitizationRules): string {
    let sanitized = input;

    // Remove dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Apply specific sanitization rules
    if (rules.removeHtml) {
      sanitized = this.stripHtml(sanitized);
    }

    if (rules.escapeHtml) {
      sanitized = this.escapeHtml(sanitized);
    }

    if (rules.normalizeWhitespace) {
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
    }

    if (rules.maxLength) {
      sanitized = sanitized.substring(0, rules.maxLength);
    }

    return sanitized;
  }

  private validateSQL(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|\/\*|\*\/)/g,
      /(\b(OR|AND)\b.*=.*)/gi
    ];

    return !sqlPatterns.some(pattern => pattern.test(input));
  }
}
```

## 🔐 Session Security Patterns

### **Secure Session Management Pattern**
```typescript
// Pattern: Secure session handling with rotation
class SessionManager {
  private sessionStore = new Map<string, SessionData>();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private maxSessions = 5; // Max concurrent sessions per user

  async createSession(userId: string, deviceInfo: DeviceInfo): Promise<SessionToken> {
    // Clean up expired sessions
    await this.cleanupExpiredSessions(userId);

    // Check session limit
    const userSessions = await this.getUserSessions(userId);
    if (userSessions.length >= this.maxSessions) {
      // Remove oldest session
      await this.removeOldestSession(userId);
    }

    // Generate secure session token
    const sessionId = this.generateSecureToken();
    const sessionData: SessionData = {
      userId,
      deviceInfo,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent
    };

    // Store session
    await this.storeSession(sessionId, sessionData);

    // Log session creation
    await this.logSecurityEvent('session_created', {
      userId,
      sessionId,
      deviceInfo
    });

    return {
      sessionId,
      expiresAt: new Date(Date.now() + this.sessionTimeout)
    };
  }

  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return { valid: false, reason: 'session_not_found' };
    }

    // Check expiration
    if (Date.now() - session.lastActivity.getTime() > this.sessionTimeout) {
      await this.removeSession(sessionId);
      return { valid: false, reason: 'session_expired' };
    }

    // Update last activity
    session.lastActivity = new Date();
    await this.updateSession(sessionId, session);

    return {
      valid: true,
      session,
      shouldRotate: this.shouldRotateSession(session)
    };
  }

  private shouldRotateSession(session: SessionData): boolean {
    const rotationInterval = 15 * 60 * 1000; // 15 minutes
    return Date.now() - session.createdAt.getTime() > rotationInterval;
  }
}
```

## 🔗 Related Documentation

- **[🏛️ Security Architecture](./security-architecture.md)** - Overall security design
- **[⚙️ Security Configuration](./security-configuration.md)** - Security setup and configuration
- **[🔒 Auth Middleware](./auth-middleware.md)** - Authentication middleware implementation
- **[🏗️ Express Structure](./express-structure.md)** - Server architecture
- **[🔐 Frontend Auth Integration](../03-Frontend/auth0-integration.md)** - Client-side security

---

*These security patterns provide proven, reusable solutions for implementing robust security measures throughout the MWAP platform, ensuring consistent protection against common threats and vulnerabilities.*