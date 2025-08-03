# Public Route Security Model

## Overview

The MWAP platform implements a **Zero Trust security model** where all routes require JWT authentication by default. Public routes are the exception, not the rule, and each public route represents a carefully evaluated security decision that must meet stringent criteria.

This document defines the security model, criteria, and controls for public routes in the MWAP platform.

## Zero Trust Principles

### Default Security Posture

- **Default Deny**: All routes require JWT authentication unless explicitly designated as public
- **Explicit Allow**: Public routes must be explicitly registered with security justification
- **Minimal Exposure**: Public routes must not expose sensitive user or tenant data
- **Comprehensive Auditing**: All public route access attempts are logged and monitored

### Security Philosophy

> "Public routes are security exceptions that require explicit justification, comprehensive controls, and continuous monitoring."

## Public Route Criteria

For a route to be eligible for public access, it must meet **ALL** of the following criteria:

### 1. External Integration Requirement ✅
- **Requirement**: The route must be called by external services (not authenticated users)
- **Examples**: OAuth provider callbacks, webhook endpoints, health checks
- **Anti-pattern**: Routes called by authenticated frontend applications

### 2. No Sensitive Data Exposure ✅
- **Requirement**: The route must not expose user, tenant, or system data in responses
- **Examples**: Generic status messages, redirect responses, public health information
- **Anti-pattern**: User profiles, tenant configurations, system internals

### 3. Self-Validating Security ✅
- **Requirement**: The route must contain internal validation mechanisms
- **Examples**: State parameter validation, webhook signatures, cryptographic verification
- **Anti-pattern**: Routes that rely solely on obscurity or rate limiting

### 4. Comprehensive Audit Logging ✅
- **Requirement**: All access attempts must be logged for security monitoring
- **Examples**: IP address, user agent, request parameters, security context
- **Anti-pattern**: Silent or minimal logging

## Current Public Routes

### OAuth Callback Endpoint

**Route**: `GET /api/v1/oauth/callback`

**Security Justification**:
- **External Integration**: Called by OAuth providers (Dropbox, Google, etc.)
- **No Sensitive Data**: Returns only generic redirect responses
- **Self-Validating**: Comprehensive state parameter validation with cryptographic integrity
- **Audit Logged**: All callback attempts logged with full security context

**Security Controls**:
1. **State Parameter Validation**
   - Base64 decoding with error handling
   - JSON structure validation
   - Cryptographic nonce verification
   - Timestamp-based expiration (10 minutes)

2. **Integration Ownership Verification**
   - Tenant-integration relationship validation
   - User access verification
   - Provider availability checks

3. **Redirect URI Security**
   - Scheme whitelist (http/https only)
   - Host whitelist validation
   - Exact path matching
   - Query parameter prevention

4. **Comprehensive Monitoring**
   - Real-time security metrics
   - Suspicious pattern detection
   - Automated alerting
   - Forensic audit trails

## Security Architecture

### Authentication Middleware Enhancement

The authentication middleware (`src/middleware/auth.ts`) implements selective authentication:

```typescript
export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if this is a public route
    if (isPublicRoute(req.method, req.path)) {
      logPublicRouteAccess(req);
      return next();
    }
    
    // Standard JWT authentication for protected routes
    // ... JWT validation logic
  } catch (error) {
    // ... error handling
  }
}
```

### Public Route Registry

The public route registry (`src/middleware/publicRoutes.ts`) maintains strict control:

```typescript
export const PUBLIC_ROUTES: PublicRouteConfig[] = [
  {
    path: '/api/v1/oauth/callback',
    methods: ['GET'],
    justification: 'OAuth provider callback endpoint',
    securityControls: [
      'State parameter validation',
      'Integration ownership verification',
      'Redirect URI validation',
      'Comprehensive audit logging'
    ],
    approvedDate: '2025-07-23',
    externalCallers: ['OAuth providers (Dropbox, Google, etc.)'],
    exposesData: false
  }
];
```

## Security Controls

### 1. Route Matching Security

**Exact Path Matching**:
- Public routes use exact path matching to prevent path traversal
- No wildcard or regex matching for security routes
- Case-sensitive matching to prevent bypass attempts

**Method Validation**:
- Each public route specifies allowed HTTP methods
- Unsupported methods are rejected with 405 Method Not Allowed
- OPTIONS requests handled separately for CORS

### 2. Request Validation

**Input Sanitization**:
- All public route inputs are validated and sanitized
- No direct database queries from public route parameters
- Structured logging prevents log injection

**Rate Limiting**:
- Public routes are subject to rate limiting
- IP-based and global rate limits applied
- Suspicious activity triggers enhanced monitoring

### 3. Response Security

**Generic Error Messages**:
- All errors return generic messages to prevent information disclosure
- Internal error details logged separately for debugging
- No stack traces or system information exposed

**Response Headers**:
- Security headers applied to all responses
- No sensitive information in response headers
- Proper CORS configuration for legitimate callers

### 4. Monitoring and Alerting

**Real-time Monitoring**:
- All public route access attempts monitored in real-time
- Success/failure rates tracked and analyzed
- Performance metrics collected and alerted

**Suspicious Pattern Detection**:
- High failure rate detection (>50%)
- Rapid attempt detection (>10 in 5 minutes)
- IP abuse detection (>20 attempts from single IP)
- State parameter manipulation detection

**Automated Alerting**:
- Security incidents trigger immediate alerts
- Alert severity based on threat level
- Recommended actions provided for each alert type

## Risk Assessment

### Security Risks

1. **Authentication Bypass**
   - **Risk**: Attackers might attempt to bypass authentication through public routes
   - **Mitigation**: Exact path matching, comprehensive validation, audit logging

2. **Information Disclosure**
   - **Risk**: Public routes might inadvertently expose sensitive information
   - **Mitigation**: Generic responses, no sensitive data in public routes, response auditing

3. **Denial of Service**
   - **Risk**: Public routes might be targeted for DoS attacks
   - **Mitigation**: Rate limiting, monitoring, automated blocking

4. **State Parameter Attacks**
   - **Risk**: Attackers might manipulate OAuth state parameters
   - **Mitigation**: Cryptographic validation, timestamp checks, replay prevention

### Risk Mitigation Strategies

1. **Defense in Depth**
   - Multiple layers of security controls
   - No single point of failure
   - Comprehensive monitoring at all layers

2. **Principle of Least Privilege**
   - Minimal public route exposure
   - Strict access controls
   - Regular security reviews

3. **Continuous Monitoring**
   - Real-time threat detection
   - Automated response capabilities
   - Forensic audit capabilities

## Compliance and Governance

### Security Review Process

1. **Initial Assessment**
   - Business justification for public access
   - Security risk assessment
   - Alternative solution evaluation

2. **Security Controls Design**
   - Input validation mechanisms
   - Output sanitization controls
   - Monitoring and alerting setup

3. **Implementation Review**
   - Code security review
   - Penetration testing
   - Security control validation

4. **Ongoing Monitoring**
   - Regular security assessments
   - Threat landscape monitoring
   - Control effectiveness reviews

### Documentation Requirements

Each public route must have:
- **Business Justification**: Why the route needs to be public
- **Security Controls**: What controls are implemented
- **Risk Assessment**: What risks are accepted and mitigated
- **Monitoring Plan**: How the route is monitored and alerted

### Approval Process

1. **Security Team Review**: All public routes require security team approval
2. **Architecture Review**: Public routes must align with system architecture
3. **Compliance Review**: Public routes must meet regulatory requirements
4. **Ongoing Validation**: Regular reviews to ensure continued necessity

## Implementation Guidelines

### Adding New Public Routes

1. **Evaluate Necessity**
   ```
   - Is this route truly required to be public?
   - Can authentication be implemented instead?
   - What are the security implications?
   ```

2. **Design Security Controls**
   ```
   - Input validation mechanisms
   - Output sanitization
   - Internal validation logic
   - Monitoring and alerting
   ```

3. **Implement Controls**
   ```typescript
   // Add to public route registry
   {
     path: '/api/v1/new/public/route',
     methods: ['POST'],
     justification: 'Business justification',
     securityControls: ['Control 1', 'Control 2'],
     approvedDate: '2025-07-23',
     externalCallers: ['External Service'],
     exposesData: false
   }
   ```

4. **Test Security Controls**
   ```
   - Validate input sanitization
   - Test error handling
   - Verify monitoring functionality
   - Conduct security testing
   ```

### Removing Public Routes

1. **Impact Assessment**
   - Identify all callers of the public route
   - Assess impact of making route protected
   - Plan migration strategy

2. **Migration Planning**
   - Implement authentication for callers
   - Provide migration timeline
   - Communicate changes to stakeholders

3. **Gradual Migration**
   - Implement dual support (public + protected)
   - Monitor usage patterns
   - Gradually deprecate public access

## Monitoring and Metrics

### Key Performance Indicators

1. **Security Metrics**
   - Public route access attempts
   - Success/failure rates
   - Security incident count
   - Mean time to detection

2. **Performance Metrics**
   - Response times
   - Throughput
   - Error rates
   - Availability

### Alerting Thresholds

1. **High Priority Alerts**
   - Security incidents (immediate)
   - High failure rates (>50% in 5 minutes)
   - Suspicious patterns (immediate)

2. **Medium Priority Alerts**
   - Performance degradation
   - Unusual traffic patterns
   - Configuration changes

3. **Low Priority Alerts**
   - Trend analysis
   - Capacity planning
   - Routine maintenance

## Best Practices

### Development

1. **Security by Design**
   - Consider security implications from the start
   - Implement defense in depth
   - Use secure coding practices

2. **Testing**
   - Comprehensive security testing
   - Penetration testing
   - Automated security scans

3. **Documentation**
   - Maintain up-to-date security documentation
   - Document all security controls
   - Keep risk assessments current

### Operations

1. **Monitoring**
   - Implement comprehensive monitoring
   - Set up appropriate alerting
   - Maintain incident response procedures

2. **Maintenance**
   - Regular security reviews
   - Keep security controls updated
   - Monitor threat landscape changes

3. **Compliance**
   - Maintain compliance documentation
   - Conduct regular audits
   - Keep certifications current

## Conclusion

The public route security model provides a framework for safely exposing necessary endpoints while maintaining the overall security posture of the MWAP platform. By following Zero Trust principles, implementing comprehensive controls, and maintaining continuous monitoring, we can minimize security risks while enabling necessary integrations.

Remember: **Every public route is a security decision that requires careful consideration, robust controls, and ongoing vigilance.**

---

**Last Updated**: 2025-07-23  
**Version**: 1.0  
**Classification**: Internal Security Documentation  
**Maintainer**: MWAP Security Team